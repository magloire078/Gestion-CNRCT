
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, deleteDoc, doc, updateDoc, getDoc, writeBatch, where, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Chief } from '@/lib/data';
import { db, storage } from '@/lib/firebase';
import { FirestorePermissionError } from '@/lib/errors';

const chiefsCollection = collection(db, 'chiefs');

const defaultChiefs: Omit<Chief, 'id'>[] = [
  { name: "IKPE DEDJE ADOLPHE", lastName: "IKPE", firstName: "DEDJE ADOLPHE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BABIAHAN", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 32/R.A-T/P.AGBO/SG1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "AMAHOUE KEBE", lastName: "AMAHOUE", firstName: "KEBE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GUESSIGUIE 1", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 007/R.A/P.AGBO/SG/D1/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONIEN KONIEN ROGER", lastName: "KONIEN", firstName: "KONIEN ROGER", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "DINGBE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 14/R.A-T/P.AGBO/SG1/T", photoUrl: "https://placehold.co/100x100.png" },
  { name: "NGUESSAN ASSA", lastName: "NGUESSAN", firstName: "ASSA", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "YADIO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 22/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "GNAMIEN GBAKOU JEAN", lastName: "GNAMIEN", firstName: "GBAKOU JEAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "LOOGUIE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 55/R.A-T/P.AGBO/SG 2", photoUrl: "https://placehold.co/100x100.png" },
  { name: "AHYBIE DIAGBA OFFORI REMI GUSTAVE", lastName: "AHYBIE", firstName: "DIAGBA OFFORI REMI GUSTAVE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ABOUDE-KOUASSIKRO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 12/R.A/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "DEDOU BROU GERMAIN", lastName: "DEDOU", firstName: "BROU GERMAIN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KAMABROU", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 32/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "EDI TCHIMOU", lastName: "EDI", firstName: "TCHIMOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GRAND-YAPO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 60/R.A-T/P.AGBO/SG1/T", photoUrl: "https://placehold.co/100x100.png" },
  { name: "EDI EKISSI ADOLPHE", lastName: "EDI", firstName: "EKISSI ADOLPHE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BANGUIE 1", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 10/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOFFI KOKOLA RAPHAEL", lastName: "KOFFI", firstName: "KOKOLA RAPHAEL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GOUABO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 47/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "DJAMA OKON BROU BERTRAND", lastName: "DJAMA", firstName: "OKON BROU BERTRAND", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KASSIGUIE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 55 /R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GOU N'GBESSO MARC", lastName: "N'GOU", firstName: "N'GBESSO MARC", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ELEVI", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 146/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "DIBY GNAHOUA JOSEPH", lastName: "DIBY", firstName: "GNAHOUA JOSEPH", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "SAHUYE", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "SIKENSI", contact: "", bio: "ARRETE N° 004/RA-T/P.SIK/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "ODIACHO GOGO", lastName: "ODIACHO", firstName: "GOGO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AZAGUIE-MAKOUGUIE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 65/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "ESSEHI M'BO MICHEL", lastName: "ESSEHI", firstName: "M'BO MICHEL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "YAOBOU", region: "AGNEBY-TIASSA", department: "DABOU", subPrefecture: "DABOU", contact: "", bio: "ARRETE N°042/PRL/PD/CAB", photoUrl: "https://placehold.co/100x100.png" },
];

export async function initializeDefaultChiefs() {
    const snapshot = await getDocs(query(chiefsCollection, limit(1)));
    if (snapshot.empty) {
        console.log("No chiefs found, initializing default chief data...");
        await batchAddChiefs(defaultChiefs);
        console.log("Default chiefs initialized.");
    }
}


const sortChiefs = (chiefs: Chief[]): Chief[] => {
    return chiefs.sort((a, b) => {
        const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
        if (lastNameCompare !== 0) {
            return lastNameCompare;
        }
        return (a.firstName || '').localeCompare(b.firstName || '');
    });
};


export function subscribeToChiefs(
    callback: (chiefs: Chief[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(chiefsCollection, orderBy("lastName", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const chiefs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Chief));
            callback(sortChiefs(chiefs));
        },
        (error) => {
            console.error("Error subscribing to chiefs:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getChiefs(): Promise<Chief[]> {
    await initializeDefaultChiefs();
    const snapshot = await getDocs(query(chiefsCollection, orderBy("lastName", "asc")));
    const chiefs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Chief));
    return sortChiefs(chiefs);
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

export async function addChief(chiefData: Omit<Chief, "id">, photoFile: File | null): Promise<Chief> {
    let photoUrl = 'https://placehold.co/100x100.png';
    const docRef = doc(collection(db, "chiefs"));

    if (photoFile) {
        const photoRef = ref(storage, `chief_photos/${docRef.id}/${photoFile.name}`);
        const snapshot = await uploadBytes(photoRef, photoFile);
        photoUrl = await getDownloadURL(snapshot.ref);
    }

    const finalChiefData = { ...chiefData, photoUrl };
    try {
        await setDoc(docRef, finalChiefData);
        return { id: docRef.id, ...finalChiefData };
    } catch (error: any) {
         if (error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission d'ajouter un nouveau chef.", { operation: 'add', path: 'chiefs' });
        }
        throw error;
    }
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
        try {
            await batch.commit();
        } catch (error: any) {
             if (error.code === 'permission-denied') {
                throw new FirestorePermissionError("Vous n'avez pas la permission d'importer des chefs en masse.", { operation: 'batch-add', path: 'chiefs' });
            }
            throw error;
        }
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

    // Remove any keys with undefined values before sending to Firestore
    Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
            delete updateData[key as keyof typeof updateData];
        }
    });
    
    try {
        await updateDoc(chiefDocRef, updateData);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError(`Vous n'avez pas la permission de modifier le chef ${chiefData.name}.`, { operation: 'update', path: `chiefs/${id}` });
        }
        throw error;
    }
}

export async function deleteChief(id: string): Promise<void> {
    const chiefDocRef = doc(db, 'chiefs', id);
     try {
        await deleteDoc(chiefDocRef);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError(`Vous n'avez pas la permission de supprimer ce chef.`, { operation: 'delete', path: `chiefs/${id}` });
        }
        throw error;
    }
}
