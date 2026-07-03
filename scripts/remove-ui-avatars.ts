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

async function removeUiAvatars() {
    console.log('Fetching employees...');
    const snapshot = await db.collection('employees').get();
    
    let updatedCount = 0;
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.photoUrl && data.photoUrl.includes('ui-avatars.com')) {
            console.log(`Removing ui-avatars URL for ${data.name || data.firstName || 'Employee'} (${doc.id})`);
            const docRef = db.collection('employees').doc(doc.id);
            batch.update(docRef, { photoUrl: '' });
            updatedCount++;
        }
    });

    if (updatedCount > 0) {
        console.log(`Committing ${updatedCount} updates...`);
        await batch.commit();
        console.log('Successfully updated employees.');
    } else {
        console.log('No employees found with ui-avatars.com URLs.');
    }
}

removeUiAvatars().then(() => {
    console.log('Done.');
    process.exit(0);
}).catch(console.error);
