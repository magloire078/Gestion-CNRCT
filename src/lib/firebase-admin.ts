
import * as admin from 'firebase-admin';

// Le SDK Admin utilisera automatiquement les GOOGLE_APPLICATION_CREDENTIALS
// si cette variable d'environnement est définie dans votre environnement de production/déploiement.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error. Ensure GOOGLE_APPLICATION_CREDENTIALS is set in your environment.", error.message);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
