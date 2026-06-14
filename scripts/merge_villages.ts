import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';

const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

// Helper to remove accents and lower case
function normalizeName(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

// Check if A has more accents/proper casing than B
function hasBetterFormatting(a: string, b: string): boolean {
    const accentsA = (a.match(/[\u00C0-\u017F]/g) || []).length;
    const accentsB = (b.match(/[\u00C0-\u017F]/g) || []).length;
    
    if (accentsA !== accentsB) {
        return accentsA > accentsB;
    }
    
    // Check capitalization (Agboville vs agboville)
    const upperA = (a.match(/[A-Z]/g) || []).length;
    const upperB = (b.match(/[A-Z]/g) || []).length;
    
    return upperA > upperB;
}

async function mergeDuplicateVillages() {
    console.log("Fetching villages...");
    const snap = await db.collection('villages').get();
    const allVillages = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    
    console.log(`Found ${allVillages.length} total villages in db.`);

    const groups = new Map<string, any[]>();
    for (const v of allVillages) {
        if (!v.name) continue;
        const norm = normalizeName(v.name);
        // Also group by subPrefecture or department to avoid merging villages with the same name in different regions
        // If they don't have subPrefecture, just use norm name. But wait, many villages share the same name in different departments!
        const key = `${norm}_${normalizeName(v.subPrefecture || '')}_${normalizeName(v.department || '')}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(v);
    }

    const duplicates = Array.from(groups.values()).filter(g => g.length > 1);
    console.log(`Found ${duplicates.length} groups of duplicate villages.`);

    let mergedCount = 0;
    let deletedCount = 0;

    for (const group of duplicates) {
        // Sort to find the "best" name
        group.sort((a, b) => {
            if (hasBetterFormatting(a.name, b.name)) return -1;
            if (hasBetterFormatting(b.name, a.name)) return 1;
            return b.name.length - a.name.length; // fallback: longer is usually better?
        });

        const primary = group[0];
        const toDelete = group.slice(1);

        console.log(`Group: ${group.map(g => g.name).join(' | ')} -> Keeping: ${primary.name}`);

        for (const dup of toDelete) {
            // Delete the duplicate village
            await db.collection('villages').doc(dup.id).delete();
            deletedCount++;
            
            // Wait! We also need to update any chief that was pointing to this duplicate village
            // Although Chiefs use the STRING name of the village, not the ID.
            // Let's check chiefs.
            const chiefSnap = await db.collection('chiefs').where('village', '==', dup.name).get();
            for (const doc of chiefSnap.docs) {
                console.log(`  Updating chief ${doc.data().name} village from ${dup.name} to ${primary.name}`);
                await doc.ref.update({ village: primary.name });
                mergedCount++;
            }
        }
    }
    
    console.log(`\nDeleted ${deletedCount} duplicate villages.`);
    console.log(`Updated ${mergedCount} chief profiles to use the correctly accented village names.`);
    process.exit(0);
}

mergeDuplicateVillages();
