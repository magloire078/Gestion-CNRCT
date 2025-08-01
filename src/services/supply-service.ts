import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Supply } from '@/lib/data';

export function subscribeToSupplies(
    callback: (supplies: Supply[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const suppliesCollection = collection(db, 'supplies');
    const q = query(suppliesCollection, orderBy("name", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const supplyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supply));
        callback(supplyList);
    }, (error) => {
        console.error("Error subscribing to supplies:", error);
        onError(error);
    });

    return unsubscribe;
}

export async function getSupplies(): Promise<Supply[]> {
  const suppliesCollection = collection(db, 'supplies');
  const supplySnapshot = await getDocs(suppliesCollection);
  const supplyList = supplySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supply));
  return supplyList.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addSupply(supplyDataToAdd: Omit<Supply, 'id'>): Promise<Supply> {
    const suppliesCollection = collection(db, 'supplies');
    const docRef = await addDoc(suppliesCollection, supplyDataToAdd);
    const newSupply: Supply = { 
        id: docRef.id, 
        ...supplyDataToAdd 
    };
    return newSupply;
}
