import fs from 'fs';
import path from 'path';

// Load .env.local variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
}

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const keepId = '2sHFynzHIV7KoGOONrAX'; // Match 1 (Chef de Village, Oress-krobou)
  const deleteId = 'sisHkQdjjmVcmOWXfS22'; // Match 2 (Membre Comité Régional)

  const keepDocRef = doc(db, 'chiefs', keepId);
  const deleteDocRef = doc(db, 'chiefs', deleteId);

  console.log("Mise à jour du document principal (ID: " + keepId + ") ...");
  await updateDoc(keepDocRef, {
    cnrctAffiliation: 'Comité Régional',
    title: 'Chef de Village', // Just to ensure it's correct
    role: 'Chef de Village',
    // We keep village: "Oress-krobou" and the rest as is.
  });

  console.log("Suppression du document doublon (ID: " + deleteId + ") ...");
  await deleteDoc(deleteDocRef);

  console.log("Fusion terminée avec succès !");
  process.exit(0);
}

main().catch(console.error);
