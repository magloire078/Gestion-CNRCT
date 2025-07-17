
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Leave } from '@/lib/data';

export function subscribeToLeaves(
    callback: (leaves: Leave[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const leavesCollection = collection(db, 'leaves');
    const q = query(leavesCollection, orderBy("startDate", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const leaveList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Leave));
        callback(leaveList);
    }, (error) => {
        console.error("Error subscribing to leaves:", error);
        onError(error);
    });

    return unsubscribe;
}

export async function getLeaves(): Promise<Leave[]> {
  const leavesCollection = collection(db, 'leaves');
  const leaveSnapshot = await getDocs(leavesCollection);
  const leaveList = leaveSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Leave));
  return leaveList.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function addLeave(leaveDataToAdd: Omit<Leave, 'id' | 'status'>): Promise<Leave> {
    const newLeaveData = {
        ...leaveDataToAdd,
        status: 'Pending'
    };
    const leavesCollection = collection(db, 'leaves');
    const docRef = await addDoc(leavesCollection, newLeaveData);
    
    const newLeave: Leave = { 
        id: docRef.id, 
        ...newLeaveData
    };
    return newLeave;
}

export async function updateLeaveStatus(id: string, status: 'Approved' | 'Rejected'): Promise<void> {
    const leaveRef = doc(db, 'leaves', id);
    await updateDoc(leaveRef, { status });
}
