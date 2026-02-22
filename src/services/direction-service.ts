
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot, Unsubscribe, query, orderBy } from '@/lib/firebase';
import type { QuerySnapshot, DocumentData, QueryDocumentSnapshot, FirestoreError } from '@/lib/firebase';
import type { Direction } from '@/lib/data';
import { db } from '@/lib/firebase';
import { FirestorePermissionError } from '@/lib/errors';

const directionsCollection = collection(db, 'directions');

export function subscribeToDirections(
    callback: (directions: Direction[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(directionsCollection, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot: QuerySnapshot<DocumentData>) => {
            const directions = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data()
            } as Direction));
            callback(directions);
        },
        (error: FirestoreError) => {
            console.error("Error subscribing to directions:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getDirections(): Promise<Direction[]> {
    try {
        const q = query(directionsCollection, orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data()
        } as Direction));
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission de consulter les directions.", { operation: 'read-all', path: 'directions' });
        }
        throw error;
    }
}

export async function addDirection(directionData: Omit<Direction, 'id'>): Promise<Direction> {
    const docRef = await addDoc(directionsCollection, directionData);
    return { id: docRef.id, ...directionData };
}

export async function updateDirection(directionId: string, directionData: Partial<Direction>): Promise<void> {
    const directionDocRef = doc(db, 'directions', directionId);
    await updateDoc(directionDocRef, directionData);
}

export async function deleteDirection(directionId: string): Promise<void> {
    const directionDocRef = doc(db, 'directions', directionId);
    await deleteDoc(directionDocRef);
}

