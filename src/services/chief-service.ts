
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { Chief } from '@/lib/data';
import { db } from '@/lib/firebase';

const chiefsCollection = collection(db, 'chiefs');

export function subscribeToChiefs(
    callback: (chiefs: Chief[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(chiefsCollection, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const chiefs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Chief));
            callback(chiefs);
        },
        (error) => {
            console.error("Error subscribing to chiefs:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getChiefs(): Promise<Chief[]> {
    const snapshot = await getDocs(query(chiefsCollection, orderBy("name", "asc")));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Chief));
}

export async function addChief(chiefData: Omit<Chief, 'id'>): Promise<Chief> {
    const docRef = await addDoc(chiefsCollection, chiefData);
    return { id: docRef.id, ...chiefData };
}

export async function deleteChief(id: string): Promise<void> {
    const chiefDocRef = doc(db, 'chiefs', id);
    await deleteDoc(chiefDocRef);
}
