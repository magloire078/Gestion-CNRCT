
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, setDoc, doc, query, where } from 'firebase/firestore';
import type { Fleet } from '@/lib/data';

const fleetCollection = collection(db, 'fleet');

// Get all vehicles
export async function getVehicles(): Promise<Fleet[]> {
  const vehicleSnapshot = await getDocs(fleetCollection);
  const vehicleList = vehicleSnapshot.docs.map(doc => {
    // The vehicle plate is the document ID in Firestore.
    return {
      plate: doc.id,
      ...doc.data()
    } as Fleet;
  });
  return vehicleList;
}

// Add a new vehicle
export async function addVehicle(vehicleData: Omit<Fleet, "id">): Promise<Fleet> {
    const { plate, ...dataToStore } = vehicleData;
    const vehicleDocRef = doc(db, 'fleet', plate);

    const q = query(fleetCollection, where("plate", "==", plate));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error(`Un véhicule avec la plaque ${plate} existe déjà.`);
    }

    await setDoc(vehicleDocRef, dataToStore);
    
    // The new vehicle object includes the plate as its 'id' field
    const newVehicle: Fleet = {
        ...vehicleData
    };
    return newVehicle;
}
