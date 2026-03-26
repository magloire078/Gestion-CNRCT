
import * as fs from 'fs';
import * as path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const envPath = path.resolve(process.cwd(), '.env.local');
const env: any = {};
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1');
      env[key.trim()] = value;
    }
  });
}

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const querySnapshot = await getDocs(collection(db, 'conflicts'));
  const stats: any = {
    Succession: 0,
    Foncier: 0,
    'Affaires civiles': 0,
    Autre: 0,
    Intercommunautaire: 0,
    Total: 0
  };
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const type = data.type || 'Inconnu';
    if (type === 'Succession') stats.Succession++;
    else if (type === 'Foncier') stats.Foncier++;
    else if (type === 'Affaires civiles' || type === 'Autre' || type === 'Intercommunautaire') {
        // Many of these might fall under "Affaires civiles" in the manual report
        if (type === 'Affaires civiles') stats['Affaires civiles']++;
        else if (type === 'Autre') stats.Autre++;
        else if (type === 'Intercommunautaire') stats.Intercommunautaire++;
    }
    stats.Total++;
  });
  
  console.log("Statistiques actuelles en base de données :");
  console.log(JSON.stringify(stats, null, 2));
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
