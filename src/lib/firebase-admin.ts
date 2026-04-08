
import * as admin from 'firebase-admin';

// Support pour Vercel : On essaye de charger la clé depuis une variable d'environnement
// sinon on retombe sur applicationDefault()
let credential;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    credential = admin.credential.cert(serviceAccount);
  } else {
    credential = admin.credential.applicationDefault();
  }
} catch (e) {
  console.warn("Could not parse FIREBASE_SERVICE_ACCOUNT_KEY, falling back to applicationDefault()");
  credential = admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: credential,
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error. Ensure credentials are set.", error.message);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
