

import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, getDoc } from '@/lib/firebase';
import type { Conflict } from '@/lib/data';
import { db } from '@/lib/firebase';

const conflictsCollection = collection(db, 'conflicts');

export function subscribeToConflicts(
    callback: (conflicts: Conflict[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(conflictsCollection, orderBy("reportedDate", "desc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const conflicts = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            } as Conflict));
            callback(conflicts);
        },
        (error) => {
            console.error("Error subscribing to conflicts:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getConflicts(): Promise<Conflict[]> {
    const snapshot = await getDocs(query(conflictsCollection, orderBy("reportedDate", "desc")));
    return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
    } as Conflict));
}

export async function getConflict(id: string): Promise<Conflict | null> {
    if (!id) return null;
    const conflictDocRef = doc(db, 'conflicts', id);
    const docSnap = await getDoc(conflictDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Conflict;
    }
    return null;
}


export async function addConflict(conflictDataToAdd: Omit<Conflict, 'id'>): Promise<Conflict> {
    const docRef = await addDoc(conflictsCollection, conflictDataToAdd);
    return { id: docRef.id, ...conflictDataToAdd };
}

export async function updateConflict(id: string, dataToUpdate: Partial<Omit<Conflict, 'id'>>): Promise<void> {
    const conflictDocRef = doc(db, 'conflicts', id);
    await updateDoc(conflictDocRef, dataToUpdate);
}
