import fs from 'fs';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'serviceAccountKey.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function test() {
  try {
    const snap = await db.collection('chiefs').limit(2).get();
    console.log('Firestore is responsive! Count:', snap.size);
    process.exit(0);
  } catch (e: any) {
    console.log('Error:', e.message);
    process.exit(1);
  }
}
test();
