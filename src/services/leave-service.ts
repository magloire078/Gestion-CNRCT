
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { Leave } from '@/lib/data';

export async function getLeaves(): Promise<Leave[]> {
  if (!db) {
    console.error("Firestore is not initialized. Check your Firebase configuration.");
    return [];
  }
  const leavesCollection = collection(db, 'leaves');
  const q = query(leavesCollection, orderBy("startDate", "desc"));
  const leaveSnapshot = await getDocs(q);
  const leaveList = leaveSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Leave));
  return leaveList;
}

export async function addLeave(leaveData: Omit<Leave, 'id' | 'status'>): Promise<Leave> {
    if (!db) {
        throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    }
    const leavesCollection = collection(db, 'leaves');
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

export async function updateLeaveStatus(id: string, status: 'Approved' | 'Rejected'): Promise<void> {
    if (!db) {
        throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    }
    const leaveDoc = doc(db, 'leaves', id);
    await updateDoc(leaveDoc, { status });
}
