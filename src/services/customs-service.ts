
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot, Unsubscribe, query, orderBy, getDoc } from '@/lib/firebase';
import type { Custom } from '@/lib/data';
import { db } from '@/lib/firebase';

const customsCollection = collection(db, 'customs');

export function subscribeToCustoms(
    callback: (customs: Custom[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(customsCollection, orderBy("ethnicGroup", "asc"));
    const unsubscribe = onSnapshot(q, 
        (snapshot) => {
            const customs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Custom));
            callback(customs);
        },
        (error) => {
            console.error("Error subscribing to customs:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getCustom(id: string): Promise<Custom | null> {
    const docRef = doc(db, 'customs', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Custom;
    }
    return null;
}

export async function addCustom(customData: Omit<Custom, 'id'>): Promise<Custom> {
    const docRef = await addDoc(customsCollection, customData);
    return { id: docRef.id, ...customData };
}

export async function updateCustom(customId: string, customData: Partial<Custom>): Promise<void> {
    const customDocRef = doc(db, 'customs', customId);
    await updateDoc(customDocRef, customData);
}

export async function deleteCustom(customId: string): Promise<void> {
    const customDocRef = doc(db, 'customs', customId);
    await deleteDoc(customDocRef);
}
