

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
    
    // Auto-increment the counter inside a transaction during actual document creation
    const counterId = 'missions';
    const counterRef = doc(db, 'counters', counterId);
    let assignedNumber = 1;

    try {
        assignedNumber = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists()) {
                transaction.set(counterRef, { lastNumber: 1 });
                return 1;
            }
            const newLastNumber = counterDoc.data().lastNumber + 1;
            transaction.update(counterRef, { lastNumber: newLastNumber });
            return newLastNumber;
        });
    } catch (err) {
        console.error("Failed to increment mission number transaction, using fallback:", err);
        const fallback = parseInt(missionDataToAdd.numeroMission, 10);
        assignedNumber = isNaN(fallback) ? Math.floor(Math.random() * 100) + 1 : fallback;
    }

    const finalNumeroMission = assignedNumber.toString().padStart(3, '0');
    const finalData = { 
        ...missionDataToAdd, 
        numeroMission: finalNumeroMission,
        participantIds 
    };

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
        const counterDoc = await getDoc(counterRef);
        if (!counterDoc.exists()) {
            return isDossier ? 1 : 1000;
        }
        return counterDoc.data().lastNumber + 1;
    } catch (error) {
        console.error(`Error peeking latest number for ${counterId}:`, error);
        return 1;
    }
}

/**
 * Recovers the latest non-empty numeroOrdre used across previous missions.
 */
export async function getLatestNumeroOrdre(): Promise<string | null> {
    try {
        const q = query(missionsCollection, orderBy("startDate", "desc"), limit(20));
        const snapshot = await getDocs(q);
        for (const docSnap of snapshot.docs) {
            const mission = docSnap.data();
            if (mission.participants && Array.isArray(mission.participants)) {
                // Check from the last participant of the latest mission backwards
                for (let i = mission.participants.length - 1; i >= 0; i--) {
                    const p = mission.participants[i];
                    if (p.numeroOrdre && p.numeroOrdre.trim() !== "") {
                        return p.numeroOrdre;
                    }
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Error fetching latest numeroOrdre:", error);
        return null;
    }
}

/**
 * Increments the first sequence of digits found in the base string.
 * e.g., "088/CNRCT" -> "089/CNRCT"
 */
export function incrementOrderNumberString(base: string | undefined | null, incrementValue: number = 1): string {
    if (!base) return "";
    const match = base.match(/(\d+)/);
    if (!match) {
        return base;
    }
    const numStr = match[1];
    const num = parseInt(numStr, 10);
    const nextNum = num + incrementValue;
    const nextNumStr = nextNum.toString().padStart(numStr.length, '0');
    return base.replace(numStr, nextNumStr);
}

