import 'server-only';
import * as admin from 'firebase-admin';

// Support pour Vercel : On essaye de charger la clé depuis une variable d'environnement
// sinon on retombe sur applicationDefault()
let credential;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    // Remove wrapping quotes if they exist
    if (key.startsWith('"') && key.endsWith('"')) {
      key = key.substring(1, key.length - 1);
    }
    const serviceAccount = JSON.parse(key);
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
    console.log("[FirebaseAdmin] Initialized successfully.");
  } catch (error: any) {
    console.error("[FirebaseAdmin] Initialization CRITICAL error:", error.message);
    if (error.stack) console.error(error.stack);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
