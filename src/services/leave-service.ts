

import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Leave } from '@/lib/data';
import { db } from '@/lib/firebase';
import { createNotification } from './notification-service';

const leavesCollection = collection(db, 'leaves');

export function subscribeToLeaves(
    callback: (leaves: Leave[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(leavesCollection, orderBy("startDate", "desc"));
    const unsubscribe = onSnapshot(q, 
        (snapshot) => {
            const leaves = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Leave));
            callback(leaves);
        },
        (error) => {
            console.error("Error subscribing to leaves:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getLeaves(): Promise<Leave[]> {
  const q = query(leavesCollection, orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Leave));
}

export async function addLeave(leaveDataToAdd: Omit<Leave, 'id' | 'status'>): Promise<Leave> {
    const newLeaveData = {
        ...leaveDataToAdd,
        status: 'En attente'
    };
    const docRef = await addDoc(leavesCollection, newLeaveData);
    
    // Create a notification for admins/managers
    await createNotification({
        userId: 'all', // Or target specific manager/admin roles
        title: 'Nouvelle demande de congé',
        description: `${leaveDataToAdd.employee} a demandé un ${leaveDataToAdd.type}.`,
        href: `/leave`,
    });
    
    return { id: docRef.id, ...newLeaveData };
}

export async function updateLeave(id: string, dataToUpdate: Partial<Omit<Leave, 'id' | 'status'>>): Promise<void> {
    const leaveDocRef = doc(db, 'leaves', id);
    const cleanData = JSON.parse(JSON.stringify(dataToUpdate));
    await updateDoc(leaveDocRef, cleanData);
}


export async function updateLeaveStatus(id: string, status: 'Approuvé' | 'Rejeté'): Promise<void> {
    const leaveDocRef = doc(db, 'leaves', id);
    await updateDoc(leaveDocRef, { status });
}
