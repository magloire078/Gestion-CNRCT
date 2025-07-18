
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Conflict } from '@/lib/data';

export function subscribeToConflicts(
    callback: (conflicts: Conflict[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const conflictsCollection = collection(db, 'conflicts');
    const q = query(conflictsCollection, orderBy("reportedDate", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const conflictList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conflict));
        callback(conflictList);
    }, (error) => {
        console.error("Error subscribing to conflicts:", error);
        onError(error);
    });

    return unsubscribe;
}

export async function getConflicts(): Promise<Conflict[]> {
  const conflictsCollection = collection(db, 'conflicts');
  const conflictSnapshot = await getDocs(conflictsCollection);
  const conflictList = conflictSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conflict));
  return conflictList.sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime());
}

export async function addConflict(conflictDataToAdd: Omit<Conflict, 'id'>): Promise<Conflict> {
    const conflictsCollection = collection(db, 'conflicts');
    const docRef = await addDoc(conflictsCollection, conflictDataToAdd);
    const newConflict: Conflict = { 
        id: docRef.id, 
        ...conflictDataToAdd 
    };
    return newConflict;
}
