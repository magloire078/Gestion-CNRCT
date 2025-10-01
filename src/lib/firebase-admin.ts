
import * as admin from 'firebase-admin';

// Assurez-vous que votre variable d'environnement pointe vers votre fichier de clé JSON
// Par exemple: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn("La variable d'environnement GOOGLE_APPLICATION_CREDENTIALS n'est pas définie. L'initialisation du SDK Admin pourrait échouer.");
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: "https://gestion-cnrct-default-rtdb.europe-west1.firebasedatabase.app"
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
