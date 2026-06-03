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

async function findDuplicates() {
  console.log("Fetching all chiefs...");
  const chiefsRef = collection(db, 'chiefs');
  const snapshot = await getDocs(chiefsRef);
  
  const allChiefs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Group by normalized name (firstName + lastName or name)
  const grouped: Record<string, any[]> = {};
  
  allChiefs.forEach(c => {
    const fn = (c.firstName || '').trim().toLowerCase();
    const ln = (c.lastName || '').trim().toLowerCase();
    const fullName = (c.name || '').trim().toLowerCase();
    
    // Create a key based on available data
    let key = '';
    if (fn && ln) {
      key = `${ln} ${fn}`;
    } else if (fullName) {
      key = fullName;
    } else {
      key = `unknown-${c.id}`;
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(c);
  });
  
  const duplicates = Object.entries(grouped).filter(([key, group]) => group.length > 1 && !key.startsWith('unknown-'));
  
  console.log(`\nFound ${duplicates.length} duplicate groups:\n`);
  
  duplicates.forEach(([key, group]) => {
    console.log(`=== Group: ${key.toUpperCase()} ===`);
    group.forEach(c => {
      console.log(` - ID: ${c.id} | Name: ${c.name} | Village: ${c.village} | Title: ${c.title} | Affiliation: ${c.cnrctAffiliation} | Role: ${c.role}`);
    });
    console.log('');
  });
  
  process.exit(0);
}

findDuplicates().catch(console.error);
