
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    query, 
    orderBy,
    getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ConflictTypeData } from "@/types/common";

const COLLECTION_NAME = "conflict-types";

export const subscribeToConflictTypes = (
    onUpdate: (types: ConflictTypeData[]) => void,
    onError?: (error: any) => void
) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("name", "asc"));
    return onSnapshot(q, (snapshot) => {
        const types = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ConflictTypeData[];
        onUpdate(types);
    }, onError);
};

export const getConflictTypes = async (): Promise<ConflictTypeData[]> => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as ConflictTypeData[];
};

export const addConflictType = async (name: string) => {
    return await addDoc(collection(db, COLLECTION_NAME), { name });
};

export const updateConflictType = async (id: string, name: string) => {
    const typeRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(typeRef, { name });
};

export const deleteConflictType = async (id: string) => {
    const typeRef = doc(db, COLLECTION_NAME, id);
    return await deleteDoc(typeRef);
};
