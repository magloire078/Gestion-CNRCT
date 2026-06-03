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
  console.log("Searching for KAREKE...");
  const chiefsRef = collection(db, 'chiefs');
  const snapshot = await getDocs(chiefsRef);
  
  const karekes = snapshot.docs.filter(doc => {
    const data = doc.data();
    return data.name?.toLowerCase().includes('kareke') || 
           data.lastName?.toLowerCase().includes('kareke') || 
           data.firstName?.toLowerCase().includes('kareke');
  });

  console.log(`Found ${karekes.length} matches:`);
  karekes.forEach((doc, idx) => {
    console.log(`\n--- Match ${idx + 1} ---`);
    console.log(`ID: ${doc.id}`);
    console.log(`Name: ${doc.data().name}`);
    console.log(`LastName: ${doc.data().lastName}`);
    console.log(`FirstName: ${doc.data().firstName}`);
    console.log(`Village: ${doc.data().village}`);
    console.log(`Region: ${doc.data().region}`);
    console.log(`Department: ${doc.data().department}`);
    console.log(`Title: ${doc.data().title}`);
    console.log(`Status: ${doc.data().status}`);
  });
  
  process.exit(0);
}

main().catch(console.error);
