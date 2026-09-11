import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function cleanVillageName(name: string): string {
    if (!name) return name;
    let n = name.trim();
    // Remove leading slash
    n = n.replace(/^\/\s*/, '');
    // Remove 'Chef du village d\'' / 'Chef du village de ' / 'Chef de Canton/' / 'Chef de canton de ' / etc.
    n = n.replace(/^Chef\s+du\s+[Vv]illage\s+(?:et\s+)?(?:d['’]|de\s+)?/i, '');
    n = n.replace(/^Chef\s+de\s+[Cc]anton\s*(?:\/|\s+de\s+|\s+d['’]|\s+)?/i, '');
    n = n.replace(/^Chef\s+du\s+[Cc]anton\s*(?:\/|\s+de\s+|\s+d['’]|\s+)?/i, '');
    n = n.replace(/^Chef\s+de\s+[Tt]ribu\s*(?:\/|\s+de\s+|\s+d['’]|\s+)?/i, '');
    n = n.replace(/^Chef\s+de\s+la\s+tribu\s+/i, '');
    n = n.replace(/^Chef\s+de\s+Province\s*/i, '');
    n = n.replace(/^Chef\s+de\s+canton\s*/i, '');
    
    // Remove trailing / Chef ... or / Caton ... or / Tribu ...
    n = n.replace(/\s*\/\s*Chef\s+.*$/i, '');
    n = n.replace(/\s*\/\s*Caton\s+.*$/i, '');
    n = n.replace(/\s*\/\s*Tribu\s+.*$/i, '');
    n = n.replace(/\s+s\/p\s+.*$/i, '');
    n = n.replace(/\s+S\/P\s+.*$/i, '');

    // Trim again
    return n.trim();
}

function normalizeKey(str: string): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

export async function POST() {
    try {
        console.log('[CleanVillages API] Starting cleanup & deduplication...');
        const villageSnap = await adminDb.collection('villages').get();
        const villages = villageSnap.docs.map(d => ({ id: d.id, ...d.data() as any, ref: d.ref }));

        let cleanedNamesCount = 0;
        let deletedDuplicatesCount = 0;
        let chiefsUpdatedCount = 0;

        // 1. Clean village names
        for (const v of villages) {
            const originalName = v.name || v.village || '';
            const cleaned = cleanVillageName(originalName);
            if (cleaned && cleaned !== originalName) {
                await v.ref.update({
                    name: cleaned,
                    originalRawName: originalName,
                    updatedAt: new Date().toISOString()
                });
                v.name = cleaned;
                cleanedNamesCount++;
            }
        }

        // 2. Group by normalized signature (name + department or region)
        const groups = new Map<string, any[]>();
        for (const v of villages) {
            const nameNorm = normalizeKey(v.name);
            if (!nameNorm) continue;
            const deptNorm = normalizeKey(v.department || v.departement || '');
            const regNorm = normalizeKey(v.region || '');
            const spNorm = normalizeKey(v.subPrefecture || v.sousPrefecture || v.commune || '');

            // Distinct key per locality
            const key = `${nameNorm}_${deptNorm || regNorm}_${spNorm}`;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(v);
        }

        // 3. Deduplicate groups with > 1 doc
        for (const [key, group] of groups.entries()) {
            if (group.length <= 1) continue;

            // Score docs to keep the best one
            group.sort((a, b) => {
                let scoreA = 0;
                let scoreB = 0;
                if (a.chiefId || a.chiefName) scoreA += 5;
                if (b.chiefId || b.chiefName) scoreB += 5;
                if (a.latitude && a.longitude) scoreA += 3;
                if (b.latitude && b.longitude) scoreB += 3;
                if (a.hasElectricity || a.hasWater || a.hasSchool) scoreA += 2;
                if (b.hasElectricity || b.hasWater || b.hasSchool) scoreB += 2;
                if (a.population) scoreA += 1;
                if (b.population) scoreB += 1;
                return scoreB - scoreA;
            });

            const primary = group[0];
            const toDelete = group.slice(1);

            console.log(`Merging ${toDelete.length} duplicates into primary village ${primary.name} (${primary.id})`);

            for (const dup of toDelete) {
                // Point any chiefs linked to this duplicate villageId to the primary villageId
                const chiefSnap = await adminDb.collection('chiefs').where('villageId', '==', dup.id).get();
                for (const cDoc of chiefSnap.docs) {
                    await cDoc.ref.update({
                        villageId: primary.id,
                        village: primary.name,
                        updatedAt: new Date().toISOString()
                    });
                    chiefsUpdatedCount++;
                }

                // Delete the duplicate village document
                await dup.ref.delete();
                deletedDuplicatesCount++;
            }
        }

        // 4. Also clean village field in chiefs collection
        const chiefsSnap = await adminDb.collection('chiefs').get();
        for (const cDoc of chiefsSnap.docs) {
            const cData = cDoc.data();
            if (cData.village) {
                const cleanedV = cleanVillageName(cData.village);
                if (cleanedV !== cData.village) {
                    await cDoc.ref.update({
                        village: cleanedV,
                        updatedAt: new Date().toISOString()
                    });
                    chiefsUpdatedCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Nettoyage et déduplication des villages terminés avec succès.',
            cleanedNamesCount,
            deletedDuplicatesCount,
            chiefsUpdatedCount,
            totalProcessed: villages.length
        });

    } catch (error: any) {
        console.error('[CleanVillages API Error]:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
