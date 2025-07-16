
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import type { Mission } from '@/lib/data';

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
