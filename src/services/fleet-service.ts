
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, setDoc, doc, query, where } from 'firebase/firestore';
import type { Fleet } from '@/lib/data';

export async function getVehicles(): Promise<Fleet[]> {
  if (!db) {
    console.error("Firestore is not initialized. Check your Firebase configuration.");
    return [];
  }
  const fleetCollection = collection(db, 'fleet');
  const vehicleSnapshot = await getDocs(fleetCollection);
  const vehicleList = vehicleSnapshot.docs.map(doc => {
    return {
      plate: doc.id,
      ...doc.data()
    } as Fleet;
  });
  return vehicleList;
}

export async function addVehicle(vehicleData: Omit<Fleet, "id">): Promise<Fleet> {
    if (!db) {
        throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    }
    const fleetCollection = collection(db, 'fleet');
    const { plate, ...dataToStore } = vehicleData;
    const vehicleDocRef = doc(db, 'fleet', plate);

    const q = query(fleetCollection, where("plate", "==", plate));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error(`Un véhicule avec la plaque ${plate} existe déjà.`);
    }

    await setDoc(vehicleDocRef, dataToStore);
    
    const newVehicle: Fleet = {
        ...vehicleData
    };
    return newVehicle;
}
