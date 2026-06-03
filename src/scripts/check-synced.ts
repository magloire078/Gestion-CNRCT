import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^'|^"|'$|"$/g, '');
    }
  });
}

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const certObj = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(certObj),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

async function main() {
  const snapshot = await db.collection('chiefs').where('cnrctAffiliation', '==', 'Directoire').get();
  
  const titles = new Set();
  snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.title) titles.add(data.title);
  });
  
  console.log("Titles in Directoire affiliation:");
  console.log(Array.from(titles));
  
  process.exit(0);
}

main().catch(console.error);
