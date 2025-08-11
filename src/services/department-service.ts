import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot, Unsubscribe, query, orderBy } from 'firebase/firestore';
import type { Department } from '@/lib/data';
import { db } from '@/lib/firebase';

const departmentsCollection = collection(db, 'departments');

export function subscribeToDepartments(
    callback: (departments: Department[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(departmentsCollection, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, 
        (snapshot) => {
            const departments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Department));
            callback(departments);
        },
        (error) => {
            console.error("Error subscribing to departments:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getDepartments(): Promise<Department[]> {
  const q = query(departmentsCollection, orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Department));
}

export async function addDepartment(departmentData: Omit<Department, 'id'>): Promise<Department> {
    const docRef = await addDoc(departmentsCollection, departmentData);
    return { id: docRef.id, ...departmentData };
}

export async function updateDepartment(departmentId: string, departmentData: Partial<Department>): Promise<void> {
    const departmentDocRef = doc(db, 'departments', departmentId);
    await updateDoc(departmentDocRef, departmentData);
}

export async function deleteDepartment(departmentId: string): Promise<void> {
    const departmentDocRef = doc(db, 'departments', departmentId);
    await deleteDoc(departmentDocRef);
}
