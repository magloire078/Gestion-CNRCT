import * as admin from 'firebase-admin';

let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
if (key && key.startsWith('"') && key.endsWith('"')) {
  key = key.substring(1, key.length - 1);
}
const credential = key ? admin.credential.cert(JSON.parse(key)) : admin.credential.applicationDefault();

if (!admin.apps.length) {
  admin.initializeApp({ credential });
}

const adminDb = admin.firestore();

async function main() {
  try {
    const snapshot = await adminDb.collection('roles').get();
    console.log(`Found ${snapshot.size} roles`);
    snapshot.docs.forEach(doc => {
      console.log(`- ${doc.id}: ${doc.data().name}`);
    });
  } catch (err) {
    console.error(err);
  }
}

main();
