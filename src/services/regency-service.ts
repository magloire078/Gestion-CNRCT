import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, deleteDoc, doc, updateDoc, getDoc, where, setDoc } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import type { RegencyHistory } from '@/lib/data';
import { FirestorePermissionError } from '@/lib/errors';

const regencyCollection = collection(db, 'regency_history');

export async function getRegencyHistory(villageId: string): Promise<RegencyHistory[]> {
    if (!villageId) return [];
    const q = query(regencyCollection, where('villageId', '==', villageId), orderBy("startDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegencyHistory));
}

export async function getRegencyHistoryByVillage(villageName: string): Promise<RegencyHistory[]> {
    if (!villageName) return [];
    const q = query(regencyCollection, where('villageName', '==', villageName), orderBy("startDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegencyHistory));
}

export async function addRegencyHistory(data: Omit<RegencyHistory, 'id'>): Promise<RegencyHistory> {
    const docRef = await addDoc(regencyCollection, data);
    return { id: docRef.id, ...data } as RegencyHistory;
}

export async function updateRegencyHistory(id: string, data: Partial<Omit<RegencyHistory, 'id'>>): Promise<void> {
    const docRef = doc(db, 'regency_history', id);
    try {
        await updateDoc(docRef, data);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission de modifier l'historique de régence.", { operation: 'update', path: `regency_history/${id}` });
        }
        throw error;
    }
}

export async function deleteRegencyHistory(id: string): Promise<void> {
    const docRef = doc(db, 'regency_history', id);
    try {
        await deleteDoc(docRef);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission de supprimer cet historique.", { operation: 'delete', path: `regency_history/${id}` });
        }
        throw error;
    }
}

export function subscribeToRegencyHistory(villageId: string, callback: (history: RegencyHistory[]) => void): Unsubscribe {
    const q = query(regencyCollection, where('villageId', '==', villageId), orderBy("startDate", "desc"));
    return onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as RegencyHistory));
        callback(history);
    });
}
