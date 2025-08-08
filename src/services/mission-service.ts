
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
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

export async function addMission(missionDataToAdd: Omit<Mission, 'id'>): Promise<Mission> {
    const docRef = await addDoc(missionsCollection, missionDataToAdd);
    return { id: docRef.id, ...missionDataToAdd };
}
