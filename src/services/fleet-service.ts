
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import type { Fleet } from '@/lib/data';


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
