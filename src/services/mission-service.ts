
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, getDoc, updateDoc, deleteDoc, limit } from 'firebase/firestore';
import type { Mission } from '@/lib/data';
import { db } from '@/lib/firebase';

const missionsCollection = collection(db, 'missions');

export function subscribeToMissions(
    callback: (missions: Mission[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(missionsCollection, orderBy("startDate", "desc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const missions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Mission));
            callback(missions);
        },
        (error) => {
            console.error("Error subscribing to missions:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getMissions(): Promise<Mission[]> {
    const snapshot = await getDocs(query(missionsCollection, orderBy("startDate", "desc")));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Mission));
}

export async function getMission(id: string): Promise<Mission | null> {
    const docRef = doc(db, 'missions', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Mission;
    }
    return null;
}

export async function addMission(missionDataToAdd: Omit<Mission, 'id'>): Promise<Mission> {
    const docRef = await addDoc(missionsCollection, missionDataToAdd);
    return { id: docRef.id, ...missionDataToAdd };
}

export async function updateMission(id: string, dataToUpdate: Partial<Mission>): Promise<void> {
    const docRef = doc(db, 'missions', id);
    await updateDoc(docRef, dataToUpdate);
}

export async function deleteMission(id: string): Promise<void> {
    const docRef = doc(db, 'missions', id);
    await deleteDoc(docRef);
}

export async function getLatestMissionNumber(): Promise<number> {
    const q = query(missionsCollection, orderBy("numeroMission", "desc"), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return 1;
    }
    const latestMission = snapshot.docs[0].data() as Mission;
    const latestNumber = parseInt(latestMission.numeroMission, 10);
    return isNaN(latestNumber) ? 1 : latestNumber + 1;
}
