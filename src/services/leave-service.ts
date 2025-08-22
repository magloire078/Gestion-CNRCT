

import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, Unsubscribe, query, orderBy, getDoc } from 'firebase/firestore';
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
    const leaveDoc = await getDoc(leaveDocRef);
    if (!leaveDoc.exists()) return;

    const leaveData = leaveDoc.data() as Leave;

    await updateDoc(leaveDocRef, { status });

    // Find the employee's user ID to send them a notification
    // Note: This is a simplified approach. A real app might query the users collection
    // to find the user ID based on the employee name.
    // For now, we assume the employee name can be used to find the user, which is not robust.
    // A better approach would be to store the userId on the leave request.
    
    // Since we can't reliably get the userId from the employee name,
    // we'll send to 'all' as a fallback for now.
    // A proper implementation would require a lookup service.
    await createNotification({
      userId: 'all', // In a real app: findUserIdByName(leaveData.employee),
      title: `Demande de congé ${status === 'Approuvé' ? 'approuvée' : 'rejetée'}`,
      description: `Votre demande de ${leaveData.type} du ${leaveData.startDate} a été ${status === 'Approuvé' ? 'approuvée' : 'rejetée'}.`,
      href: '/my-space' // Link to their personal space
    })
}
