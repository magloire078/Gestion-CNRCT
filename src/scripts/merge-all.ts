import fs from 'fs';
import path from 'path';

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

const merges = [
  {
    name: "KPAGNE ABOURE EMMANUEL",
    keep: "A60bzArflmaZ85tzalj9",
    updateFields: { cnrctAffiliation: "Comité Régional" },
    remove: "0oX5F1IWEThAa6fq1lhC"
  },
  {
    name: "KAREKE CHRISTOPHE",
    keep: "2sHFynzHIV7KoGOONrAX",
    updateFields: { cnrctAffiliation: "Comité Régional", role: "Chef de Village", title: "Chef de Village" },
    remove: "sisHkQdjjmVcmOWXfS22"
  },
  {
    name: "DIOMANDE VASSEDOU",
    keep: "52OLPVk0W2ncZhgdQRo3",
    updateFields: {},
    remove: "fAozpfBY2KW1u0BZ9M7c"
  },
  {
    name: "DAGO KOFFI ZACHARIE",
    keep: "kM8SBs6AEy2sMW4gk33y",
    updateFields: {},
    remove: "LiEavlPy20XBCDeWyFSw"
  }
];

async function executeMerges() {
  console.log("Démarrage de la fusion des doublons...");
  for (const merge of merges) {
    console.log(`\nTraitement de ${merge.name}...`);
    try {
      if (Object.keys(merge.updateFields).length > 0) {
        console.log(` - Mise à jour du document conservé (${merge.keep})`);
        await updateDoc(doc(db, 'chiefs', merge.keep), merge.updateFields);
      }
      console.log(` - Suppression du document en double (${merge.remove})`);
      await deleteDoc(doc(db, 'chiefs', merge.remove));
      console.log(`   -> Succès !`);
    } catch (err: any) {
      console.error(`   -> Erreur pour ${merge.name}:`, err.message);
    }
  }
  console.log("\nOpération terminée.");
  process.exit(0);
}

executeMerges();
