

import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, getDoc, updateDoc, deleteDoc, limit, runTransaction, where } from '@/lib/firebase';
import type { Mission } from '@/lib/data';
import { db } from '@/lib/firebase';
import { missionSchema } from '@/lib/schemas/mission-schema';
import { createNotification } from './notification-service';
import { FirestorePermissionError } from '@/lib/errors';

const missionsCollection = collection(db, 'missions');
const usersCollection = collection(db, 'users');

async function notifyParticipants(mission: Omit<Mission, 'id'> | Mission) {
    const employeeIds = mission.participants.map(p => p.employeeId);
    if (employeeIds.length === 0) return;

    // Firestore 'in' query supports up to 30 items. Chunk if necessary.
    for (let i = 0; i < employeeIds.length; i += 30) {
        const idChunk = employeeIds.slice(i, i + 30);
        if (idChunk.length === 0) continue;

        const usersQuery = query(usersCollection, where("employeeId", "in", idChunk));
        const usersSnapshot = await getDocs(usersQuery);

        for (const userDoc of usersSnapshot.docs) {
            await createNotification({
                userId: userDoc.id,
                title: 'Nouvelle Mission Assignée',
                description: `Vous avez été assigné(e) à la mission : "${mission.title}"`,
                href: `/missions` // Link to their mission list (filtered to them)
            });
        }
    }
}


const syncParticipantIds = (mission: Omit<Mission, 'id'> | Partial<Mission>): string[] => {
    if (!mission.participants) return [];
    return mission.participants
        .map(p => p.employeeId)
        .filter((id): id is string => !!id);
};

export function subscribeToMissions(
    callback: (missions: Mission[]) => void,
    onError: (error: Error) => void,
    userId?: string,
    employeeId?: string,
    isAdmin: boolean = false
): Unsubscribe {
    let q = query(missionsCollection, orderBy("startDate", "desc"));
    
    // If not admin and we have an employeeId, only show their missions
    if (!isAdmin && employeeId) {
        q = query(missionsCollection, 
            where("participantIds", "array-contains", employeeId),
            orderBy("startDate", "desc")
        );
    }

    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const missions = snapshot.docs.map((doc: any) => {
                const data = { id: doc.id, ...doc.data() };
                const result = missionSchema.safeParse(data);
                if (!result.success) {
                    console.error(`[MissionService] validation error for ${doc.id}:`, result.error.format());
                    return data as Mission;
                }
                return result.data as Mission;
            });
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
    try {
        const snapshot = await getDocs(missionsCollection);
        return snapshot.docs.map((doc: any) => {
            const data = { 
                id: doc.id, 
                participants: [], // Default to empty array
                ...doc.data() 
            };
            const result = missionSchema.safeParse(data);
            if (!result.success) {
                console.error(`[MissionService] validation error for ${doc.id}:`, result.error.format());
                return data as Mission;
            }
            return result.data as Mission;
        });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission de consulter les missions.", { operation: 'read-all', path: 'missions' });
        }
        throw error;
    }
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
    const participantIds = syncParticipantIds(missionDataToAdd);
    const finalData = { ...missionDataToAdd, participantIds };
    const docRef = await addDoc(missionsCollection, finalData);
    const newMission = { id: docRef.id, ...finalData };
    await notifyParticipants(newMission);
    return newMission;
}

export async function updateMission(id: string, dataToUpdate: Partial<Mission>): Promise<void> {
    const docRef = doc(db, 'missions', id);
    const originalMission = await getMission(id);

    // Sync participantIds if participants is provided
    if (dataToUpdate.participants) {
        (dataToUpdate as any).participantIds = syncParticipantIds(dataToUpdate);
    }

    await updateDoc(docRef, dataToUpdate);

    // Notify only new participants
    if (dataToUpdate.participants && originalMission) {
        const originalParticipantIds = new Set(originalMission.participants.map(p => p.employeeId));
        const newParticipants = dataToUpdate.participants.filter(p => !originalParticipantIds.has(p.employeeId));
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
