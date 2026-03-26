

import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, getDoc, deleteDoc } from '@/lib/firebase';
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

export async function getConflictByTrackingId(trackingId: string): Promise<Conflict | null> {
    if (!trackingId) return null;
    const { where } = await import('@/lib/firebase');
    const q = query(conflictsCollection, where("trackingId", "==", trackingId.toUpperCase()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Conflict;
    }
    return null;
}


export async function addConflict(conflictDataToAdd: Omit<Conflict, 'id'>): Promise<Conflict> {
    // Generate unique tracking ID: CNRCT-YYYY-[Random 4 digits]
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const trackingId = `CNRCT-${year}-${random}`;
    
    const docRef = await addDoc(conflictsCollection, {
        ...conflictDataToAdd,
        trackingId,
        createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...conflictDataToAdd, trackingId };
}

export async function updateConflict(id: string, dataToUpdate: Partial<Omit<Conflict, 'id'>>): Promise<void> {
    const conflictDocRef = doc(db, 'conflicts', id);
    await updateDoc(conflictDocRef, dataToUpdate);
}

export async function deleteConflict(id: string): Promise<void> {
    const conflictDocRef = doc(db, 'conflicts', id);
    await deleteDoc(conflictDocRef);
}

export async function batchAddConflicts(conflicts: Omit<Conflict, 'id'>[]): Promise<number> {
    const { writeBatch, doc } = await import('@/lib/firebase');
    const batch = writeBatch(db);
    
    conflicts.forEach(conflict => {
        const newDocRef = doc(collection(db, 'conflicts'));
        batch.set(newDocRef, {
            ...conflict,
            createdAt: new Date().toISOString()
        });
    });
    
    await batch.commit();
    return conflicts.length;
}
