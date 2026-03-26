

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, deleteDoc, writeBatch, increment, getDoc } from '@/lib/firebase';
import type { Supply, SupplyTransaction } from '@/lib/data';
import { createNotification } from './notification-service';
import { uploadToCloudinary } from '@/lib/cloudinary';

const suppliesCollection = collection(db, 'supplies');
const transactionsCollection = collection(db, 'supply_transactions');

/**
 * Removes undefined fields from an object to prevent Firestore errors.
 */
function sanitizeData(data: any) {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === undefined) {
            delete sanitized[key];
        }
    });
    return sanitized;
}

export function subscribeToSupplies(
    callback: (supplies: Supply[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(suppliesCollection, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const supplies = snapshot.docs.map((doc: any) => ({
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
    return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
    } as Supply));
}

export async function addSupply(supplyDataToAdd: Omit<Supply, "id">, userId?: string, photoFile: File | null = null): Promise<Supply> {
    let photoUrl = supplyDataToAdd.photoUrl;
    if (photoFile) {
        photoUrl = await uploadToCloudinary(photoFile);
    }
    
    const sanitizedData = sanitizeData({ ...supplyDataToAdd, photoUrl });
    const docRef = await addDoc(suppliesCollection, sanitizedData);
    
    // Log initial restock transaction if quantity > 0
    if (supplyDataToAdd.quantity > 0) {
        await logSupplyTransaction({
            supplyId: docRef.id,
            supplyName: supplyDataToAdd.name,
            recipientName: 'Stock Initial',
            quantity: supplyDataToAdd.quantity,
            date: new Date().toISOString().split('T')[0],
            type: 'restock',
            performedBy: userId || 'system'
        }, false); // Pass false to avoid double increment
    }
    
    // Check if stock is low and create notification
    if (supplyDataToAdd.quantity <= supplyDataToAdd.reorderLevel) {
        await createNotification({
            userId: 'manager', // Target a specific 'inventory_manager' role or admin/managers
            title: 'Stock de Fournitures Bas',
            description: `Le stock pour "${supplyDataToAdd.name}" est bas (${supplyDataToAdd.quantity}).`,
            href: '/supplies'
        });
    }
    
    return { id: docRef.id, ...supplyDataToAdd };
}

export async function updateSupply(id: string, dataToUpdate: Partial<Omit<Supply, 'id'>>, userId?: string, photoFile: File | null = null): Promise<void> {
    const supplyDocRef = doc(db, 'supplies', id);
    
    // Fetch old data to check quantity change
    const oldDoc = await getDoc(supplyDocRef);
    const oldData = oldDoc.data() as Supply;

    const updatePayload: Partial<Supply> = { ...dataToUpdate };
    
    if (photoFile) {
        updatePayload.photoUrl = await uploadToCloudinary(photoFile);
    }
    
    if (updatePayload.category !== 'Cartouches d\'encre' && updatePayload.category !== undefined) {
        updatePayload.inkType = undefined;
        updatePayload.linkedAssetTag = undefined;
    }

    const sanitizedPayload = sanitizeData(updatePayload);
    await updateDoc(supplyDocRef, sanitizedPayload);

    // Log transaction if quantity changed
    if (dataToUpdate.quantity !== undefined && oldData && dataToUpdate.quantity !== oldData.quantity) {
        const diff = dataToUpdate.quantity - oldData.quantity;
        await logSupplyTransaction({
            supplyId: id,
            supplyName: dataToUpdate.name || oldData.name,
            recipientName: diff > 0 ? 'Réapprovisionnement Manuel' : 'Ajustement de Stock',
            quantity: Math.abs(diff),
            date: new Date().toISOString().split('T')[0],
            type: diff > 0 ? 'restock' : 'distribution',
            performedBy: userId || 'system'
        }, false); // Pass false to avoid double increment
    }

    // Check stock level after update
     if (dataToUpdate.quantity !== undefined && dataToUpdate.reorderLevel !== undefined && dataToUpdate.quantity <= dataToUpdate.reorderLevel) {
        await createNotification({
            userId: 'manager',
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

export async function logSupplyTransaction(transaction: Omit<SupplyTransaction, 'id'>, updateQuantity: boolean = true): Promise<void> {
    const batch = writeBatch(db);
    const transactionsCollection = collection(db, 'supply_transactions');
    const supplyDocRef = doc(db, 'supplies', transaction.supplyId);
    
    // 1. Add transaction log
    const newTransRef = doc(transactionsCollection);
    batch.set(newTransRef, {
        ...sanitizeData(transaction),
        timestamp: new Date().toISOString()
    });
    
    // 2. Update supply quantity using increment (only if requested)
    if (updateQuantity) {
        const qtyChange = transaction.type === 'distribution' ? -transaction.quantity : transaction.quantity;
        batch.update(supplyDocRef, {
            quantity: increment(qtyChange)
        });
    }
    
    await batch.commit();

    // 3. Check for low stock notification after commit
    const updatedDoc = await getDoc(supplyDocRef);
    const updatedData = updatedDoc.data() as Supply;
    
    if (updatedData && updatedData.quantity <= updatedData.reorderLevel) {
        await createNotification({
            userId: 'manager',
            title: 'Stock Bas après Mouvement',
            description: `Le stock pour "${updatedData.name}" est maintenant de ${updatedData.quantity}.`,
            href: '/supplies'
        });
    }
}

export function subscribeToSupplyTransactions(
    callback: (transactions: SupplyTransaction[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(transactionsCollection, orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const transactions = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            } as SupplyTransaction));
            callback(transactions);
        },
        (error) => {
            console.error("Error subscribing to supply transactions:", error);
            onError(error);
        }
    );
    return unsubscribe;
}
