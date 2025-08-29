

import { collection, getDocs, addDoc, doc, setDoc, onSnapshot, Unsubscribe, query, orderBy, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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


export async function getVehicle(plate: string): Promise<Fleet | null> {
    if (!plate) return null;
    const vehicleDocRef = doc(db, 'fleet', plate);
    const docSnap = await getDoc(vehicleDocRef);
    if (docSnap.exists()) {
        return { plate: docSnap.id, ...docSnap.data() } as Fleet;
    }
    return null;
}

export async function addVehicle(vehicleDataToAdd: Omit<Fleet, 'id'> & { plate: string }): Promise<Fleet> {
    const vehicleRef = doc(db, 'fleet', vehicleDataToAdd.plate);
    await setDoc(vehicleRef, vehicleDataToAdd);
    return { ...vehicleDataToAdd };
}

export async function updateVehicle(plate: string, vehicleData: Partial<Fleet>): Promise<void> {
    const vehicleDocRef = doc(db, 'fleet', plate);
    await updateDoc(vehicleDocRef, vehicleData);
}

export async function deleteVehicle(plate: string): Promise<void> {
    const vehicleDocRef = doc(db, 'fleet', plate);
    await deleteDoc(vehicleDocRef);
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
