import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = require('../serviceAccountKey.json');

if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();

async function mergeHire() {
    try {
        const idToKeep = 'VWaRTUzZ6xEuBqYDcX31';
        const idToDelete = 'a4wdzecvZuWlin6u4oEm';

        console.log(`Merging ${idToDelete} into ${idToKeep}`);

        // Update any chiefs that reference the deleted village
        const chiefsRef = db.collection('chiefs');
        const snapshot = await chiefsRef.where('villageId', '==', idToDelete).get();
        
        if (!snapshot.empty) {
            console.log(`Found ${snapshot.docs.length} chiefs pointing to the old village. Updating...`);
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { villageId: idToKeep });
            });
            await batch.commit();
            console.log('Chiefs updated successfully.');
        } else {
            console.log('No chiefs needed updating.');
        }

        // Delete the duplicate village
        console.log(`Deleting duplicate village ${idToDelete}...`);
        await db.collection('villages').doc(idToDelete).delete();
        console.log('Duplicate village deleted.');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

mergeHire();
