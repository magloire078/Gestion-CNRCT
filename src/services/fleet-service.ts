

import { collection, getDocs, addDoc, doc, setDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Fleet } from '@/lib/data';
import { db } from '@/lib/firebase';

const fleetCollection = collection(db, 'fleet');

export function subscribeToVehicles(
    callback: (vehicles: Fleet[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(fleetCollection, orderBy("makeModel", "asc"));
    const unsubscribe = onSnapshot(q, 
        (snapshot) => {
            const vehicles = snapshot.docs.map(doc => ({
                plate: doc.id,
                ...doc.data()
            } as Fleet));
            callback(vehicles);
        },
        (error) => {
            console.error("Error subscribing to fleet:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getVehicles(): Promise<Fleet[]> {
  const snapshot = await getDocs(query(fleetCollection, orderBy("makeModel", "asc")));
  return snapshot.docs.map(doc => ({
    plate: doc.id,
    ...doc.data()
  } as Fleet));
}

export async function addVehicle(vehicleDataToAdd: Omit<Fleet, 'id'> & { plate: string }): Promise<Fleet> {
    const vehicleRef = doc(db, 'fleet', vehicleDataToAdd.plate);
    await setDoc(vehicleRef, vehicleDataToAdd);
    return { ...vehicleDataToAdd };
}

export async function searchVehicles(queryText: string): Promise<Fleet[]> {
    const lowerCaseQuery = queryText.toLowerCase();
    const allVehicles = await getVehicles();
    return allVehicles.filter(vehicle => 
        (vehicle.plate?.toLowerCase() || '').includes(lowerCaseQuery) || 
        (vehicle.makeModel?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (vehicle.assignedTo?.toLowerCase() || '').includes(lowerCaseQuery)
    );
}
