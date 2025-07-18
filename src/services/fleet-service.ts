
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Fleet } from '@/lib/data';

export function subscribeToVehicles(
    callback: (vehicles: Fleet[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const fleetCollection = collection(db, 'fleet');
    const q = query(fleetCollection, orderBy("makeModel", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const vehicleList = snapshot.docs.map(doc => ({ plate: doc.id, ...doc.data() } as Fleet));
        callback(vehicleList);
    }, (error) => {
        console.error("Error subscribing to vehicles:", error);
        onError(error);
    });

    return unsubscribe;
}


export async function getVehicles(): Promise<Fleet[]> {
  const fleetCollection = collection(db, 'fleet');
  const vehicleSnapshot = await getDocs(fleetCollection);
  const vehicleList = vehicleSnapshot.docs.map(doc => ({ plate: doc.id, ...doc.data() } as Fleet));
  return vehicleList;
}

export async function addVehicle(vehicleDataToAdd: Omit<Fleet, 'id'> & { plate: string }): Promise<Fleet> {
    const { plate, ...data } = vehicleDataToAdd;
    const vehicleRef = doc(db, 'fleet', plate);
    await setDoc(vehicleRef, data);
    return { plate, ...data };
}
