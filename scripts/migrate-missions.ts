import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';

const required = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateMissions() {
    console.log("Starting migration...");
    const missionsCollection = collection(db, 'missions');
    const snapshot = await getDocs(missionsCollection);
    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.participantIds && data.participants) {
            const participantIds = data.participants
                .filter((p: any) => p.employeeId)
                .map((p: any) => p.employeeId);

            if (participantIds.length > 0) {
                batch.update(docSnap.ref, { participantIds });
                count++;
            }
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`Migrated ${count} missions.`);
    } else {
        console.log("No missions to migrate.");
    }
}

migrateMissions().catch(console.error);
