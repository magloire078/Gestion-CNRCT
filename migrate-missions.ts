import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBuMgqk-I_mngDw4SYuNhOOLcF6JNchXhw",
  authDomain: "gestion-cnrct.firebaseapp.com",
  projectId: "gestion-cnrct",
  storageBucket: "gestion-cnrct.appspot.com",
  messagingSenderId: "126727792063",
  appId: "1:126727792063:web:55513c7e21531a87286d0a",
  measurementId: "G-TDXM581DZ5"
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
