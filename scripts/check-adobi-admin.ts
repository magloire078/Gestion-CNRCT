import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Initialize Firebase
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function checkAdobi() {
    console.log("Recherche de l'agent ADOBI...");
    const snap = await db.collection('employees').where('lastName', '==', 'ADOBI').get();
    
    snap.forEach(doc => {
        const data = doc.data();
        console.log("\n====== ADOBI ====================");
        console.log(`Nom: ${data.lastName} ${data.firstName}`);
        console.log(`Region: ${data.Region}`);
        console.log(`Statut: ${data.status}`);
        console.log(`Poste: ${data.poste}`);
        console.log(`DepartementID: ${data.departmentId}`);
        console.log(`Matricule: ${data.matricule}`);
    });

    console.log("Recherche de l'agent DIOMANDE Gouamou...");
    const snapDiomande = await db.collection('employees').where('lastName', '==', 'DIOMANDE').get();
    
    snapDiomande.forEach(doc => {
        const data = doc.data();
        if (data.firstName && data.firstName.includes('Gouamou')) {
            console.log("\n====== DIOMANDE ==================");
            console.log(`Nom: ${data.lastName} ${data.firstName}`);
            console.log(`Region: ${data.Region}`);
            console.log(`Statut: ${data.status}`);
            console.log(`Poste: ${data.poste}`);
            console.log(`DepartementID: ${data.departmentId}`);
            console.log(`Matricule: ${data.matricule}`);
        }
    });

    // Cherchons aussi "Ake Placide" au cas où le lastName n'est pas "ADOBI"
    console.log("\nRecherche de 'Ake Placide'...");
    const snap2 = await db.collection('employees').get();
    snap2.forEach(doc => {
        const data = doc.data();
        if ((data.name && data.name.includes('ADOBI')) || (data.firstName && data.firstName.includes('Placide'))) {
            console.log("\nFound:", data.name, data.lastName, data.firstName, "=> Poste:", data.poste, "Region:", data.Region, "Status:", data.status);
        }
    });

    console.log("Terminé.");
    process.exit(0);
}

checkAdobi().catch(console.error);
