

import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot, Unsubscribe, query, orderBy, where, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import type { Employe } from '@/lib/data';
import { db, storage } from '@/lib/firebase';
import { getOrganizationSettings } from './organization-service';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const employeesCollection = collection(db, 'employees');

export function subscribeToEmployees(
    callback: (employees: Employe[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(employeesCollection, orderBy("lastName", "asc"), orderBy("firstName", "asc"));
    const unsubscribe = onSnapshot(q, 
        (snapshot) => {
            const employees = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Employe));
            callback(employees);
        },
        (error) => {
            console.error("Error subscribing to employees:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getEmployees(): Promise<Employe[]> {
  const q = query(employeesCollection, orderBy("lastName", "asc"), orderBy("firstName", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Employe));
}

export async function getEmployee(id: string): Promise<Employe | null> {
    if (!id) return null;
    const employeeDocRef = doc(db, 'employees', id);
    const docSnap = await getDoc(employeeDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Employe;
    }
    return null;
}

export async function addEmployee(employeeData: Omit<Employe, 'id'>, photoFile: File | null): Promise<Employe> {
    let finalPhotoUrl = 'https://placehold.co/100x100.png';
    const docRef = doc(collection(db, "employees"));

    if (photoFile) {
        const photoRef = ref(storage, `employee_photos/${docRef.id}/${photoFile.name}`);
        const snapshot = await uploadBytes(photoRef, photoFile);
        finalPhotoUrl = await getDownloadURL(snapshot.ref);
    }
    
    const finalEmployeeData = { ...employeeData, photoUrl: finalPhotoUrl };
    await setDoc(docRef, finalEmployeeData);
    
    return { id: docRef.id, ...finalEmployeeData };
}


export async function batchAddEmployees(employees: Omit<Employe, 'id'>[]): Promise<number> {
    const batch = writeBatch(db);
    const existingMatriculesQuery = query(employeesCollection, where('matricule', 'in', employees.map(e => e.matricule)));
    const existingSnapshot = await getDocs(existingMatriculesQuery);
    const existingMatricules = new Set(existingSnapshot.docs.map(d => d.data().matricule));

    let addedCount = 0;
    employees.forEach(employee => {
        if (!existingMatricules.has(employee.matricule)) {
            const newDocRef = doc(employeesCollection); // Auto-generate ID
            batch.set(newDocRef, employee);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        await batch.commit();
    }
    return addedCount;
}

export async function updateEmployee(employeeId: string, employeeDataToUpdate: Partial<Employe>, photoFile: File | null = null): Promise<void> {
    const employeeDocRef = doc(db, 'employees', employeeId);
    
    const updateData = { ...employeeDataToUpdate };

    if (photoFile) {
        const photoRef = ref(storage, `employee_photos/${employeeId}/${photoFile.name}`);
        const snapshot = await uploadBytes(photoRef, photoFile);
        updateData.photoUrl = await getDownloadURL(snapshot.ref);
    }

    await updateDoc(employeeDocRef, updateData);
}

export async function searchEmployees(query: string): Promise<Employe[]> {
    const lowerCaseQuery = query.toLowerCase();
    const allEmployees = await getEmployees();
    return allEmployees.filter(employee => 
        (employee.name?.toLowerCase() || '').includes(lowerCaseQuery) || 
        (employee.matricule?.toLowerCase() || '').includes(lowerCaseQuery)
    );
}

export async function deleteEmployee(employeeId: string): Promise<void> {
    const employeeDocRef = doc(db, 'employees', employeeId);
    await deleteDoc(employeeDocRef);
}

export { getOrganizationSettings };
