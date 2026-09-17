import 'server-only';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Support pour Vercel / Local : On essaye de charger la clé depuis une variable d'environnement ou fichier local
let credential: admin.credential.Credential | undefined;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    // Remove wrapping quotes if they exist
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.substring(1, key.length - 1).trim();
    }
    // Extract exact JSON object boundary if trailing characters were appended
    const firstBrace = key.indexOf('{');
    const lastBrace = key.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      key = key.substring(firstBrace, lastBrace + 1);
    }
    const serviceAccount = JSON.parse(key);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    credential = admin.credential.cert(serviceAccount);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credential = admin.credential.applicationDefault();
  } else {
    // Local fallback to serviceAccountKey.json if present
    const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(localKeyPath)) {
      const saContent = fs.readFileSync(localKeyPath, 'utf-8');
      const serviceAccount = JSON.parse(saContent);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      credential = admin.credential.cert(serviceAccount);
    }
  }
} catch (e) {
  console.warn("[FirebaseAdmin] Could not parse service account credential:", e);
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

