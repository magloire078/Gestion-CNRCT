import { db } from './src/lib/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

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
