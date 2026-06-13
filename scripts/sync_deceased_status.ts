import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';

// Initialize Admin SDK
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

function normalizeName(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

async function syncDeceasedStatus() {
    console.log("Recherche des employés décédés...");
    
    // Get all deceased employees
    const empSnap = await db.collection('employees').where('status', '==', 'Décédé').get();
    
    if (empSnap.empty) {
        console.log("Aucun employé décédé trouvé.");
        process.exit(0);
    }

    const deceasedEmps = empSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    console.log(`${deceasedEmps.length} employés décédés trouvés. Vérification des profils de chef correspondants...`);

    let updatedCount = 0;

    for (const emp of deceasedEmps) {
        // Try to find the chief by ID first
        let chiefRef = null;
        if (emp.chiefId) {
            const docSnap = await db.collection('chiefs').doc(emp.chiefId).get();
            if (docSnap.exists) {
                chiefRef = docSnap.ref;
            }
        }

        // Fallback: search by exact name if no chiefId or doc doesn't exist
        if (!chiefRef && emp.name) {
            const chiefsQuerySnap = await db.collection('chiefs').where('name', '==', emp.name).get();
            if (!chiefsQuerySnap.empty) {
                chiefRef = chiefsQuerySnap.docs[0].ref;
            }
        }

        // If a chief profile was found, update its status
        if (chiefRef) {
            const chiefData = (await chiefRef.get()).data() as any;
            if (chiefData.status !== 'décédé') {
                console.log(`Mise à jour du statut pour le chef: ${chiefData.name} (Ancien statut: ${chiefData.status})`);
                await chiefRef.update({ status: 'décédé' });
                updatedCount++;
            } else {
                console.log(`Le chef ${chiefData.name} est déjà marqué comme décédé.`);
            }
        } else {
            console.log(`Aucun profil de chef trouvé pour l'employé: ${emp.name}`);
        }
    }

    console.log(`\nBilan: ${updatedCount} chefs ont été mis à jour avec le statut 'décédé'.`);
    process.exit(0);
}

syncDeceasedStatus();
