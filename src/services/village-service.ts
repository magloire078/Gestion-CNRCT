import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, deleteDoc, doc, updateDoc, getDoc, where, setDoc } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import type { Village } from '@/lib/data';
import { FirestorePermissionError } from '@/lib/errors';

const villagesCollection = collection(db, 'villages');

export async function getVillages(): Promise<Village[]> {
    const snapshot = await getDocs(query(villagesCollection, orderBy("name", "asc")));
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Village));
}

export async function getVillage(id: string): Promise<Village | null> {
    if (!id) return null;
    const docRef = doc(db, 'villages', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Village;
    }
    return null;
}

export async function getVillageByLocation(region: string, department: string, subPrefecture: string, villageName: string): Promise<Village | null> {
    const q = query(villagesCollection,
        where('region', '==', region),
        where('department', '==', department),
        where('subPrefecture', '==', subPrefecture),
        where('name', '==', villageName)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Village;
    }
    return null;
}

export async function addVillage(villageData: Omit<Village, 'id'>): Promise<Village> {
    const docRef = await addDoc(villagesCollection, villageData);
    return { id: docRef.id, ...villageData } as Village;
}

export async function updateVillage(id: string, villageData: Partial<Omit<Village, 'id'>>): Promise<void> {
    const docRef = doc(db, 'villages', id);
    try {
        await updateDoc(docRef, villageData);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission de modifier ce village.", { operation: 'update', path: `villages/${id}` });
        }
        throw error;
    }
}

export function subscribeToVillages(callback: (villages: Village[]) => void): Unsubscribe {
    const q = query(villagesCollection, orderBy("name", "asc"));
    return onSnapshot(q, (snapshot) => {
        const villages = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Village));
        callback(villages);
    });
}
