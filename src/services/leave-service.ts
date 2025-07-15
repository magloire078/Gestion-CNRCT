
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { Leave } from '@/lib/data';

const leavesCollection = collection(db, 'leaves');

// Get all leave requests
export async function getLeaves(): Promise<Leave[]> {
  const q = query(leavesCollection, orderBy("startDate", "desc"));
  const leaveSnapshot = await getDocs(q);
  const leaveList = leaveSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Leave));
  return leaveList;
}

// Add a new leave request
export async function addLeave(leaveData: Omit<Leave, 'id' | 'status'>): Promise<Leave> {
    const dataToStore = {
        ...leaveData,
        status: 'Pending',
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(leavesCollection, dataToStore);
    
    const newLeave: Leave = {
        id: docRef.id,
        ...leaveData,
        status: 'Pending'
    };
    return newLeave;
}

// Update the status of a leave request
export async function updateLeaveStatus(id: string, status: 'Approved' | 'Rejected'): Promise<void> {
    const leaveDoc = doc(db, 'leaves', id);
    await updateDoc(leaveDoc, { status });
}
