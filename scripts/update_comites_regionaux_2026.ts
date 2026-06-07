import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';

// Initialize Admin SDK
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized with serviceAccountKey.json");
} else {
    console.error("serviceAccountKey.json not found!");
    process.exit(1);
}

const db = admin.firestore();

function normalizeName(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

async function updateComitesRegionaux() {
    try {
        // 1. Read TSV
        const tsvPath = path.join(process.cwd(), 'data', 'comites_regionaux_2026.tsv');
        const tsvData = fs.readFileSync(tsvPath, 'utf8').split('\n').filter(l => l.trim().length > 0);
        
        // Skip header
        tsvData.shift();
        
        const targetChiefs = tsvData.map(line => {
            const parts = line.split('\t');
            if (parts.length < 7) return null;
            return {
                numero: parts[0].trim(),
                region: parts[1].trim(),
                department: parts[2].trim(),
                lastName: parts[3].trim(),
                firstName: parts[4].trim(),
                fullName: `${parts[3].trim()} ${parts[4].trim()}`.trim(),
                village: parts[5].trim(),
                contacts: parts[6].trim()
            };
        }).filter(Boolean) as Array<any>;

        const departmentsToProcess = [...new Set(targetChiefs.map(c => c.department.toLowerCase()))];

        // 2. Fetch all existing chiefs
        const chiefsSnap = await db.collection('chiefs').get();
        const allChiefs = chiefsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const activeMembers = allChiefs.filter((c: any) => c.cnrctAffiliation === 'Comité Régional');

        console.log(`Found ${activeMembers.length} active Comité Régional members in DB.`);
        console.log(`Processing ${targetChiefs.length} targets from TSV across ${departmentsToProcess.length} departments.`);

        let createdCount = 0;
        let renewedCount = 0;
        let newDesignationCount = 0;
        let replacedCount = 0;

        for (const dept of departmentsToProcess) {
            const targetsForDept = targetChiefs.filter(c => c.department.toLowerCase() === dept);
            const existingMembersForDept = activeMembers.filter((c: any) => (c.department || '').toLowerCase() === dept);

            const matchedExistingIds = new Set<string>();

            // Find reconductions
            for (const target of targetsForDept) {
                const targetNormName = normalizeName(target.fullName);
                const targetNormLastFirst = normalizeName(`${target.lastName} ${target.firstName}`);
                
                // See if they are already in the committee
                let matchedChief = existingMembersForDept.find((c: any) => 
                    normalizeName(c.name || '') === targetNormName || 
                    normalizeName(`${c.lastName || ''} ${c.firstName || ''}`) === targetNormLastFirst
                );

                if (matchedChief) {
                    // Reconduction
                    matchedExistingIds.add(matchedChief.id);
                    renewedCount++;
                    await db.collection('chiefs').doc(matchedChief.id).update({
                        estRenouvele: true,
                        mandatDebut: '2026-06-01',
                        cnrctAffiliation: 'Comité Régional'
                    });
                    console.log(`[RECONDUCTION] ${target.fullName} (${target.department})`);
                } else {
                    // Not in the current committee, but maybe they exist in the DB?
                    matchedChief = allChiefs.find((c: any) => 
                        (c.department || '').toLowerCase() === dept &&
                        (normalizeName(c.name || '') === targetNormName || 
                         normalizeName(`${c.lastName || ''} ${c.firstName || ''}`) === targetNormLastFirst)
                    );

                    if (matchedChief) {
                        // Nouvelle designation of an existing chief
                        newDesignationCount++;
                        matchedExistingIds.add(matchedChief.id); // Track it so we don't replace it below
                        await db.collection('chiefs').doc(matchedChief.id).update({
                            estRenouvele: false,
                            mandatDebut: '2026-06-01',
                            cnrctAffiliation: 'Comité Régional'
                        });
                        console.log(`[NOUVELLE DESIGNATION - EXISTANT] ${target.fullName} (${target.department})`);
                    } else {
                        // Create new chief
                        createdCount++;
                        newDesignationCount++;
                        await db.collection('chiefs').add({
                            name: target.fullName,
                            lastName: target.lastName,
                            firstName: target.firstName,
                            title: target.village,
                            role: 'Chef de Village',
                            region: target.region,
                            department: target.department,
                            village: target.village.replace(/Chef du village de |Chef de village de |Chef de Canton\/ |Chef Canton |Chef du canton de |Chef de village \/|Chef de tribu |Chef de village/gi, '').trim(),
                            contact: target.contacts,
                            photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(target.fullName)}&background=006039&color=fff&size=100`,
                            source: 'Import Comité Régional 2026',
                            statut: 'Vivant',
                            cnrctAffiliation: 'Comité Régional',
                            estRenouvele: false,
                            mandatDebut: '2026-06-01'
                        });
                        console.log(`[NOUVELLE DESIGNATION - CREATION] ${target.fullName} (${target.department})`);
                    }
                }
            }

            // Find replacements (existing members not in targetsForDept)
            for (const existing of existingMembersForDept) {
                if (!matchedExistingIds.has(existing.id)) {
                    // Replaced
                    replacedCount++;
                    const historique = existing.historiqueNominations || [];
                    historique.push({
                        periode: `${existing.mandatDebut || 'Inconnu'} - 2026-05-31`,
                        poste: 'Membre du Comité Régional',
                        region: existing.region || ''
                    });

                    await db.collection('chiefs').doc(existing.id).update({
                        cnrctAffiliation: 'Aucune',
                        estRenouvele: false, // They are not renewed
                        historiqueNominations: historique
                    });
                    console.log(`[REMPLACEMENT] ${existing.name || existing.lastName} (${existing.department})`);
                }
            }
        }

        console.log(`\n=== BILAN ===`);
        console.log(`Réconductions: ${renewedCount}`);
        console.log(`Nouvelles Désignations: ${newDesignationCount} (dont ${createdCount} nouveaux profils créés)`);
        console.log(`Anciens Membres Remplacés: ${replacedCount}`);

    } catch (err: any) {
        console.error("Script failed:", err.message);
    }
    process.exit(0);
}

updateComitesRegionaux();
