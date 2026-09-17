import 'server-only';
import * as admin from 'firebase-admin';

// Support pour Vercel / Local : On essaye de charger la clé depuis une variable d'environnement
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
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credential = admin.credential.applicationDefault();
  }
} catch (e) {
  console.warn("[FirebaseAdmin] Could not parse FIREBASE_SERVICE_ACCOUNT_KEY");
}

if (!admin.apps.length && credential) {
  try {
    admin.initializeApp({
      credential: credential,
    });
    console.log("[FirebaseAdmin] Initialized successfully.");
  } catch (error: any) {
    console.warn("[FirebaseAdmin] Initialization warning:", error.message);
  }
}

export const adminDb: FirebaseFirestore.Firestore | null = admin.apps.length ? admin.firestore() : null;
export const adminAuth: admin.auth.Auth | null = admin.apps.length ? admin.auth() : null;
export const adminStorage: admin.storage.Storage | null = admin.apps.length ? admin.storage() : null;
