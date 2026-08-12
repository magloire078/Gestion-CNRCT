import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, getDoc, deleteDoc, writeBatch } from '@/lib/firebase';
import type { PressConflict } from '@/types/press-conflict';
import { INITIAL_PRESS_CONFLICTS } from '@/types/press-conflict';
import { db } from '@/lib/firebase';

const pressConflictsCollection = collection(db, 'press-conflicts');

export function subscribeToPressConflicts(
    callback: (conflicts: PressConflict[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const q = query(pressConflictsCollection);
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const conflicts = snapshot.docs.map((docSnap: any) => ({
                id: docSnap.id,
                ...docSnap.data()
            } as PressConflict));
            
            // Sort by orderNumber asc (if exists) or createdAt desc
            conflicts.sort((a: PressConflict, b: PressConflict) => {
                if (a.orderNumber !== undefined && b.orderNumber !== undefined) {
                    return a.orderNumber - b.orderNumber;
                }
                return (b.createdAt || '').localeCompare(a.createdAt || '');
            });

            callback(conflicts);
        },
        (error) => {
            console.error("Error subscribing to press conflicts:", error);
            if (onError) onError(error);
        }
    );
    return unsubscribe;
}

export async function getPressConflicts(): Promise<PressConflict[]> {
    try {
        const snapshot = await getDocs(query(pressConflictsCollection));
        const data = snapshot.docs.map((docSnap: any) => ({
            id: docSnap.id,
            ...docSnap.data()
        } as PressConflict));

        data.sort((a: PressConflict, b: PressConflict) => {
            if (a.orderNumber !== undefined && b.orderNumber !== undefined) {
                return a.orderNumber - b.orderNumber;
            }
            return (b.createdAt || '').localeCompare(a.createdAt || '');
        });

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('cnrct_cached_press_conflicts', JSON.stringify(data));
            } catch (e) {
                console.warn('[PressConflictService] Failed to cache press conflicts:', e);
            }
        }
        return data;
    } catch (error) {
        console.error('[PressConflictService] getPressConflicts failed:', error);
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('cnrct_cached_press_conflicts');
            if (cached) {
                return JSON.parse(cached);
            }
        }
        throw error;
    }
}

export async function getPressConflict(id: string): Promise<PressConflict | null> {
    if (!id) return null;
    const docRef = doc(db, 'press-conflicts', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as PressConflict;
    }
    return null;
}

export async function addPressConflict(data: Omit<PressConflict, 'id'>): Promise<PressConflict> {
    const existing = await getPressConflicts();
    const maxOrder = existing.reduce((max, c) => Math.max(max, c.orderNumber || 0), 0);
    const orderNumber = data.orderNumber || (maxOrder + 1);
    
    const year = new Date().getFullYear();
    const formattedOrder = String(orderNumber).padStart(3, '0');
    const trackingId = data.trackingId || `VEILLE-${year}-${formattedOrder}`;

    const now = new Date().toISOString();
    const docData = {
        ...data,
        orderNumber,
        trackingId,
        createdAt: data.createdAt || now,
        updatedAt: now,
    };

    const docRef = await addDoc(pressConflictsCollection, docData);
    return { id: docRef.id, ...docData };
}

export async function updatePressConflict(id: string, dataToUpdate: Partial<Omit<PressConflict, 'id'>>): Promise<void> {
    const docRef = doc(db, 'press-conflicts', id);
    await updateDoc(docRef, {
        ...dataToUpdate,
        updatedAt: new Date().toISOString()
    });
}

export async function deletePressConflict(id: string): Promise<void> {
    const docRef = doc(db, 'press-conflicts', id);
    await deleteDoc(docRef);
}

/**
 * Seed initial press conflicts if collection is empty or upon user request
 */
export async function seedInitialPressConflicts(force: boolean = false): Promise<number> {
    const snapshot = await getDocs(pressConflictsCollection);
    if (!force && !snapshot.empty) {
        return 0; // Already has data
    }

    // Use batches (limit 500 per batch)
    const batch = writeBatch(db);
    
    // If force is true, delete existing docs first
    if (force && !snapshot.empty) {
        snapshot.docs.forEach((docSnap) => {
            batch.delete(docSnap.ref);
        });
    }

    const now = new Date().toISOString();
    INITIAL_PRESS_CONFLICTS.forEach((item, index) => {
        const newDocRef = doc(pressConflictsCollection);
        batch.set(newDocRef, {
            ...item,
            orderNumber: item.orderNumber || (index + 1),
            createdAt: now,
            updatedAt: now
        });
    });

    await batch.commit();
    return INITIAL_PRESS_CONFLICTS.length;
}
