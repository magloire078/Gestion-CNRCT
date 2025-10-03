

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Supply } from '@/lib/data';
import { createNotification } from './notification-service';

const suppliesCollection = collection(db, 'supplies');

export function subscribeToSupplies(
    callback: (supplies: Supply[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(suppliesCollection, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const supplies = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Supply));
            callback(supplies);
        },
        (error) => {
            console.error("Error subscribing to supplies:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getSupplies(): Promise<Supply[]> {
    const snapshot = await getDocs(query(suppliesCollection, orderBy("name", "asc")));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Supply));
}

export async function addSupply(supplyDataToAdd: Omit<Supply, "id">): Promise<Supply> {
    const docRef = await addDoc(suppliesCollection, supplyDataToAdd);
    
    // Check if stock is low and create notification
    if (supplyDataToAdd.quantity <= supplyDataToAdd.reorderLevel) {
        await createNotification({
            userId: 'all', // Or target a specific 'inventory_manager' role
            title: 'Stock de Fournitures Bas',
            description: `Le stock pour "${supplyDataToAdd.name}" est bas (${supplyDataToAdd.quantity}).`,
            href: '/supplies'
        });
    }
    
    return { id: docRef.id, ...supplyDataToAdd };
}

export async function updateSupply(id: string, dataToUpdate: Partial<Omit<Supply, 'id'>>): Promise<void> {
    const supplyDocRef = doc(db, 'supplies', id);
    
    const updatePayload: Partial<Supply> = { ...dataToUpdate };
    if (updatePayload.category !== 'Cartouches d\'encre') {
        updatePayload.inkType = undefined;
        updatePayload.linkedAssetTag = undefined;
    }

    await updateDoc(supplyDocRef, updatePayload);

    // Check stock level after update
     if (dataToUpdate.quantity !== undefined && dataToUpdate.reorderLevel !== undefined && dataToUpdate.quantity <= dataToUpdate.reorderLevel) {
        await createNotification({
            userId: 'all',
            title: 'Stock Bas',
            description: `Le stock pour "${dataToUpdate.name || 'un article'}" est bas.`,
            href: '/supplies'
        });
    }
}

export async function deleteSupply(id: string): Promise<void> {
    const supplyDocRef = doc(db, 'supplies', id);
    await deleteDoc(supplyDocRef);
}
