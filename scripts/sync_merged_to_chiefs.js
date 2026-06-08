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
}

const db = admin.firestore();

async function run() {
    try {
        const empSnap = await db.collection('employees').get();
        const emps = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Filter those who are in the regional committee
        const regional = emps.filter(e => {
            const p = (e.poste || '').toLowerCase();
            return p.includes('comité régional') || p.includes('comit') || e.Region;
        });

        let updated = 0;
        let notFoundChiefs = 0;
        let missingChiefId = 0;

        for (const emp of regional) {
            // If they have geographic info and a chiefId
            if (emp.Region || emp.Departement || emp.Village || emp.subPrefecture) {
                if (emp.chiefId) {
                    try {
                        const chiefRef = db.collection('chiefs').doc(emp.chiefId);
                        const chiefSnap = await chiefRef.get();
                        if (chiefSnap.exists) {
                            const updateData = {};
                            if (emp.Region) updateData.region = emp.Region;
                            if (emp.Departement) updateData.department = emp.Departement;
                            if (emp.subPrefecture) updateData.subPrefecture = emp.subPrefecture;
                            if (emp.Village) updateData.village = emp.Village;
                            if (emp.mobile) updateData.contact = emp.mobile;
                            
                            await chiefRef.update(updateData);
                            updated++;
                        } else {
                            notFoundChiefs++;
                        }
                    } catch (e) {
                        console.error("Error updating chief", emp.chiefId, e.message);
                    }
                } else {
                    missingChiefId++;
                }
            }
        }

        console.log(`Successfully synced geo data for ${updated} chiefs.`);
        console.log(`Employees missing chiefId: ${missingChiefId}`);
        console.log(`Chief docs not found: ${notFoundChiefs}`);
    } catch (e) {
        console.error(e);
    }
}

run();
