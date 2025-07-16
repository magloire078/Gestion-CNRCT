
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import type { Conflict } from '@/lib/data';


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
