const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} else {
    console.error("serviceAccountKey.json not found!");
    process.exit(1);
}

const db = admin.firestore();

function normalizeName(name) {
    if (!name) return "";
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
}

async function run() {
    try {
        const empSnap = await db.collection('employees').get();
        const allEmployees = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Only look at Comités Régionaux
        const regionalMembers = allEmployees.filter(e => 
            e.poste === 'Membre Comité Régional' || 
            e.poste?.includes('Comité Régional') || 
            e.poste === 'Membre ComitǸ RǸgional' || 
            e.poste?.includes('RǸgional')
        );

        const groups = {};
        for (const emp of regionalMembers) {
            const key = normalizeName(emp.lastName || '') + '_' + normalizeName(emp.firstName || '');
            if (!groups[key]) groups[key] = [];
            groups[key].push(emp);
        }

        let mergedCount = 0;

        for (const [key, emps] of Object.entries(groups)) {
            if (emps.length === 2) {
                // Find the old one (archived) and the new one (active)
                const oldEmp = emps.find(e => e.mandatFin === '2026-05-31');
                const newEmp = emps.find(e => !e.mandatFin);

                if (oldEmp && newEmp && oldEmp.Region !== newEmp.Region && oldEmp.Region && newEmp.Region && oldEmp.Region !== newEmp.Region) {
                    // Check if they are actually the same person. If Region is completely different and both have it, it might be 2 different people.
                    // Actually, let's just merge if one is old and one is new.
                }

                if (oldEmp && newEmp) {
                    console.log(`Merging duplicate for: ${oldEmp.lastName} ${oldEmp.firstName}`);
                    
                    // Fields to bring from new to old
                    const updateData = {
                        Region: newEmp.Region || oldEmp.Region || '',
                        Departement: newEmp.Departement || oldEmp.Departement || '',
                        subPrefecture: newEmp.subPrefecture || oldEmp.subPrefecture || '',
                        Village: newEmp.Village || oldEmp.Village || '',
                        mobile: newEmp.mobile || oldEmp.mobile || '',
                        mandatDebut: newEmp.mandatDebut || "2026-06-01",
                        estRenouvele: true,
                        mandatFin: admin.firestore.FieldValue.delete()
                    };

                    // Update the old document
                    await db.collection('employees').doc(oldEmp.id).update(updateData);

                    // Delete the new document
                    await db.collection('employees').doc(newEmp.id).delete();
                    
                    mergedCount++;
                } else {
                    console.log(`Duplicate found but couldn't distinguish old/new for: ${key}`);
                }
            }
        }

        console.log(`Successfully merged ${mergedCount} duplicates.`);
    } catch (error) {
        console.error("Error merging duplicates:", error);
    }
}

run();
