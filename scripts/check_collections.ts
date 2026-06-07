import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';

// Initialize Admin SDK
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} else {
    process.exit(1);
}

const db = admin.firestore();

async function checkCollections() {
    const chiefSnap = await db.collection('chiefs').limit(1).get();
    const empSnap = await db.collection('employees').limit(1).get();
    
    console.log("Chiefs count sample:", chiefSnap.size);
    console.log("Employees count sample:", empSnap.size);
    
    if (empSnap.size > 0) {
        console.log("Sample employee:", empSnap.docs[0].data());
    }
}

checkCollections();
