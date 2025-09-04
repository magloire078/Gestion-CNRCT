

import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, getDoc, updateDoc, deleteDoc, limit, runTransaction, where } from 'firebase/firestore';
import type { Mission } from '@/lib/data';
import { db } from '@/lib/firebase';
import { createNotification } from './notification-service';

const missionsCollection = collection(db, 'missions');
const usersCollection = collection(db, 'users');

async function notifyParticipants(mission: Omit<Mission, 'id'> | Mission) {
    if (!mission.participants || mission.participants.length === 0) return;

    const employeeNames = mission.participants.map(p => p.employeeName);
    
    // Firestore 'in' query supports up to 30 items. Chunk if necessary.
    for (let i = 0; i < employeeNames.length; i += 30) {
        const nameChunk = employeeNames.slice(i, i + 30);
        if (nameChunk.length === 0) continue;

        const usersQuery = query(usersCollection, where("name", "in", nameChunk));
        const usersSnapshot = await getDocs(usersQuery);

        for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data();
            await createNotification({
                userId: userDoc.id,
                title: 'Nouvelle Mission Assignée',
                description: `Vous avez été assigné(e) à la mission : "${mission.title}"`,
                href: `/missions/${(mission as Mission).id}`
            });
        }
    }
}


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
    const newMission = { id: docRef.id, ...missionDataToAdd };
    await notifyParticipants(newMission);
    return newMission;
}

export async function updateMission(id: string, dataToUpdate: Partial<Mission>): Promise<void> {
    const docRef = doc(db, 'missions', id);
    const originalMission = await getMission(id);

    await updateDoc(docRef, dataToUpdate);

    // Notify only new participants
    if (dataToUpdate.participants && originalMission) {
        const originalParticipants = new Set(originalMission.participants.map(p => p.employeeName));
        const newParticipants = dataToUpdate.participants.filter(p => !originalParticipants.has(p.employeeName));
        if (newParticipants.length > 0) {
            const missionWithNewParticipants = { ...originalMission, id, participants: newParticipants };
            await notifyParticipants(missionWithNewParticipants);
        }
    }
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
