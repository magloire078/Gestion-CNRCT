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
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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
  console.log("Searching for NIAMKE Gilles Olivier in employees...");
  const employeesRef = collection(db, 'employees');
  const snapshot = await getDocs(employeesRef);
  
  const niamke = snapshot.docs.find(doc => {
    const data = doc.data();
    return data.matricule === 'C 0035';
  });

  if (niamke) {
    console.log("Found NIAMKE Gilles Olivier:", JSON.stringify(niamke.data(), null, 2));
  } else {
    console.log("NIAMKE Gilles Olivier NOT found!");
  }
  
  process.exit(0);
}

main().catch(console.error);
