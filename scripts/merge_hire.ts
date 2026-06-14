import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = require('../serviceAccountKey.json');

if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();

async function findHire() {
    try {
        console.log("Searching for Hiré villages...");
        const villagesRef = db.collection('villages');
        
        // We'll search by exact name "Hiré"
        const snapshot = await villagesRef.where('name', '==', 'Hiré').get();
        
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        console.log(`Found ${docs.length} matches:`);
        
        docs.forEach(d => {
            console.log(`ID: ${d.id}, Region: ${d.region}, Dept: ${d.department}, Chief: ${d.currentChiefId}`);
        });

        // Let's also check for "Hire" without accent
        const snapshotNoAccent = await villagesRef.where('name', '==', 'Hire').get();
        if (!snapshotNoAccent.empty) {
            console.log(`Found ${snapshotNoAccent.docs.length} without accent`);
            snapshotNoAccent.docs.forEach(doc => {
                const d = { id: doc.id, ...(doc.data() as any) };
                console.log(`ID: ${d.id}, Region: ${d.region}, Dept: ${d.department}, Chief: ${d.currentChiefId}`);
            });
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
    }
}

findHire();
