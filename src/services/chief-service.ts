
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { Chief } from '@/lib/data';

export function subscribeToChiefs(
    callback: (chiefs: Chief[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const chiefsCollection = collection(db, 'chiefs');
    const q = query(chiefsCollection, orderBy("name", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chief));
        callback(list);
    }, (error) => {
        console.error("Error subscribing to chiefs:", error);
        onError(error);
    });

    return unsubscribe;
}

export async function addChief(chiefData: Omit<Chief, 'id'>): Promise<Chief> {
    const chiefsCollection = collection(db, 'chiefs');
    const docRef = await addDoc(chiefsCollection, chiefData);
    return { 
        id: docRef.id, 
        ...chiefData
    };
}

export async function deleteChief(id: string): Promise<void> {
    const chiefRef = doc(db, 'chiefs', id);
    await deleteDoc(chiefRef);
}
