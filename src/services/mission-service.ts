

import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, getDoc, updateDoc, deleteDoc, limit, runTransaction } from 'firebase/firestore';
import type { Mission } from '@/lib/data';
import { db } from '@/lib/firebase';

const missionsCollection = collection(db, 'missions');

export function subscribeToMissions(
    callback: (missions: Mission[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(missionsCollection, orderBy("startDate", "desc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const missions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Mission));
            callback(missions);
        },
        (error) => {
            console.error("Error subscribing to missions:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getMissions(): Promise<Mission[]> {
    const snapshot = await getDocs(query(missionsCollection, orderBy("startDate", "desc")));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Mission));
}

export async function getMission(id: string): Promise<Mission | null> {
    const docRef = doc(db, 'missions', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Mission;
    }
    return null;
}

export async function addMission(missionDataToAdd: Omit<Mission, 'id'>): Promise<Mission> {
    const docRef = await addDoc(missionsCollection, missionDataToAdd);
    return { id: docRef.id, ...missionDataToAdd };
}

export async function updateMission(id: string, dataToUpdate: Partial<Mission>): Promise<void> {
    const docRef = doc(db, 'missions', id);
    await updateDoc(docRef, dataToUpdate);
}

export async function deleteMission(id: string): Promise<void> {
    const docRef = doc(db, 'missions', id);
    await deleteDoc(docRef);
}

export async function getLatestMissionNumber(isDossier: boolean = true): Promise<number> {
    const counterId = isDossier ? 'missions' : 'missionOrders';
    const counterRef = doc(db, 'counters', counterId);
    
    try {
        const newNumber = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists()) {
                const startNumber = isDossier ? 1 : 1000; // Start mission orders at a higher number
                transaction.set(counterRef, { lastNumber: startNumber });
                return startNumber;
            }
            const newLastNumber = counterDoc.data().lastNumber + 1;
            transaction.update(counterRef, { lastNumber: newLastNumber });
            return newLastNumber;
        });
        return newNumber;
    } catch (error) {
        console.error(`Error getting latest number for ${counterId}:`, error);
        throw error;
    }
}
