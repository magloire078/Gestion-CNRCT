const admin = require('firebase-admin');

// Ensure you have FIREBASE_SERVICE_ACCOUNT_KEY set in your env, or applicationDefault works
try {
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    if (key.startsWith('"') && key.endsWith('"')) {
      key = key.substring(1, key.length - 1);
    }
    const serviceAccount = JSON.parse(key);
    credential = admin.credential.cert(serviceAccount);
  } else {
    credential = admin.credential.applicationDefault();
  }

  if (!admin.apps.length) {
    admin.initializeApp({ credential });
  }
} catch (e) {
  console.log("Error initializing:", e);
}

const db = admin.firestore();

async function dedupeChiefs() {
  console.log("Fetching chiefs...");
  const snapshot = await db.collection('chiefs').get();
  
  const chiefs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`Found ${chiefs.length} total chiefs.`);

  const seen = new Map();
  const duplicates = [];

  for (const chief of chiefs) {
    const name = chief.name?.trim().toLowerCase() || '';
    const village = chief.village?.trim().toLowerCase() || '';
    const key = `${name}_${village}`;

    if (!key || key === '_') {
        continue;
    }

    if (seen.has(key)) {
      duplicates.push(chief.id);
    } else {
      seen.set(key, chief.id);
    }
  }

  console.log(`Found ${duplicates.length} duplicate chiefs.`);

  if (duplicates.length > 0) {
    console.log("Deleting duplicates...");
    const batch = db.batch();
    for (const id of duplicates) {
      batch.delete(db.collection('chiefs').doc(id));
    }
    await batch.commit();
    console.log("Successfully deleted duplicates.");
  } else {
    console.log("No duplicates to delete.");
  }
}

dedupeChiefs().catch(console.error);
