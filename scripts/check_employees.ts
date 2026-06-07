import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function checkEmployees() {
    const empSnap = await db.collection('employees').get();
    const members = empSnap.docs.map(d => d.data()).filter(e => e.poste === 'Membre Comité Régional' || (e.poste && e.poste.includes('Comité Régional')));
    console.log(`Found ${members.length} members in employees.`);
    if (members.length > 0) {
        console.log("Sample:", {name: members[0].name, poste: members[0].poste, Region: members[0].Region, Departement: members[0].Departement});
    }
}
checkEmployees();
