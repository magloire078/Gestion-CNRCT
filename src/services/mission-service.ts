
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Mission } from '@/lib/data';

export function subscribeToMissions(
    callback: (missions: Mission[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const missionsCollection = collection(db, 'missions');
    const q = query(missionsCollection, orderBy("startDate", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const missionList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
        callback(missionList);
    }, (error) => {
        console.error("Error subscribing to missions:", error);
        onError(error);
    });

    return unsubscribe;
}

export async function getMissions(): Promise<Mission[]> {
  const missionsCollection = collection(db, 'missions');
  const missionSnapshot = await getDocs(missionsCollection);
  const missionList = missionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
  return missionList.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function addMission(missionDataToAdd: Omit<Mission, 'id'>): Promise<Mission> {
    const missionsCollection = collection(db, 'missions');
    const docRef = await addDoc(missionsCollection, missionDataToAdd);
    const newMission: Mission = { 
        id: docRef.id, 
        ...missionDataToAdd 
    };
    return newMission;
}
