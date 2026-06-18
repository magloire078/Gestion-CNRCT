import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseConfig } from './src/lib/firebase/config.ts';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    console.log("Searching for ADOBI...");
    const q = query(collection(db, 'employees'), where('lastName', '==', 'ADOBI'));
    const snap = await getDocs(q);
    snap.forEach(doc => console.log(doc.id, doc.data()));
    console.log("Done.");
}

run().catch(console.error);
