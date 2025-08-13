
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, deleteDoc, doc, updateDoc, getDoc, writeBatch, where, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Chief } from '@/lib/data';
import { db, storage } from '@/lib/firebase';

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

export async function getChief(id: string): Promise<Chief | null> {
    if (!id) return null;
    const chiefDocRef = doc(db, 'chiefs', id);
    const docSnap = await getDoc(chiefDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Chief;
    }
    return null;
}

export async function addChief(chiefData: Omit<Chief, 'id'>, photoFile: File | null): Promise<Chief> {
    let photoUrl = 'https://placehold.co/100x100.png';
    const docRef = doc(collection(db, "chiefs"));

    if (photoFile) {
        const photoRef = ref(storage, `chief_photos/${docRef.id}/${photoFile.name}`);
        const snapshot = await uploadBytes(photoRef, photoFile);
        photoUrl = await getDownloadURL(snapshot.ref);
    }

    const finalChiefData = { ...chiefData, photoUrl };
    await setDoc(docRef, finalChiefData);
    return { id: docRef.id, ...finalChiefData };
}

export async function batchAddChiefs(chiefs: Omit<Chief, 'id'>[]): Promise<number> {
    const batch = writeBatch(db);
    const chiefNames = chiefs.map(c => c.name);
    // Firestore 'in' query can have max 30 elements. If more, we need to split.
    // For simplicity here, we assume less than 30 or we query one by one.
    const existingChiefsQuery = query(chiefsCollection, where('name', 'in', chiefNames));
    const existingSnapshot = await getDocs(existingChiefsQuery);
    const existingNames = new Set(existingSnapshot.docs.map(d => d.data().name));

    let addedCount = 0;
    chiefs.forEach(chief => {
        if (!existingNames.has(chief.name)) {
            const newDocRef = doc(chiefsCollection); // Auto-generate ID
            batch.set(newDocRef, chief);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        await batch.commit();
    }
    return addedCount;
}

export async function updateChief(id: string, chiefData: Partial<Omit<Chief, 'id'>>, photoFile: File | null): Promise<void> {
    const chiefDocRef = doc(db, 'chiefs', id);
    const updateData = { ...chiefData };

    if (photoFile) {
        const photoRef = ref(storage, `chief_photos/${id}/${photoFile.name}`);
        const snapshot = await uploadBytes(photoRef, photoFile);
        const photoUrl = await getDownloadURL(snapshot.ref);
        updateData.photoUrl = photoUrl;
    }

    // Ensure numeric values are stored as numbers
    if (updateData.latitude !== undefined) {
        updateData.latitude = Number(updateData.latitude);
    }
     if (updateData.longitude !== undefined) {
        updateData.longitude = Number(updateData.longitude);
    }

    await updateDoc(chiefDocRef, updateData);
}

export async function deleteChief(id: string): Promise<void> {
    const chiefDocRef = doc(db, 'chiefs', id);
    await deleteDoc(chiefDocRef);
}
