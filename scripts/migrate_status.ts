import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = require('../serviceAccountKey.json');

if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();

async function migrateStatus() {
    try {
        console.log("Migrating 'Licencié' to 'Remplacé'...");
        const employeesRef = db.collection('employees');
        const snapshot = await employeesRef.where('status', '==', 'Licencié').get();
        
        console.log(`Found ${snapshot.docs.length} employees with status 'Licencié'`);
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { status: 'Remplacé' });
        });
        
        await batch.commit();
        console.log("Migration complete.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrateStatus();
