
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot, Unsubscribe, query, where, orderBy, getDoc } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import type { HeritageItem, HeritageCategory } from '@/types/heritage';

const heritageCollection = collection(db, 'heritage');

export function subscribeToHeritage(
    category: HeritageCategory,
    callback: (items: HeritageItem[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(heritageCollection, where("category", "==", category), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const items = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            } as HeritageItem));
            callback(items);
        },
        (error) => {
            console.error(`Error subscribing to heritage (${category}):`, error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getHeritageItem(id: string): Promise<HeritageItem | null> {
    const docRef = doc(db, 'heritage', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as HeritageItem;
    }
    return null;
}

export async function addHeritageItem(itemData: Omit<HeritageItem, 'id'>): Promise<HeritageItem> {
    const now = new Date().toISOString();
    const data = {
        ...itemData,
        createdAt: now,
        updatedAt: now
    };
    const docRef = await addDoc(heritageCollection, data);
    return { id: docRef.id, ...data } as HeritageItem;
}

export async function updateHeritageItem(id: string, itemData: Partial<HeritageItem>): Promise<void> {
    const docRef = doc(db, 'heritage', id);
    await updateDoc(docRef, {
        ...itemData,
        updatedAt: new Date().toISOString()
    });
}

export async function deleteHeritageItem(id: string): Promise<void> {
    const docRef = doc(db, 'heritage', id);
    await deleteDoc(docRef);
}

export async function getAllHeritageItems(): Promise<HeritageItem[]> {
    const snapshot = await getDocs(heritageCollection);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as HeritageItem));
}
