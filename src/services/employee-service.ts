

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot, Unsubscribe, query, orderBy, where, writeBatch, getDoc } from 'firebase/firestore';
import type { Employee } from '@/lib/data';

export function subscribeToEmployees(
    callback: (employees: Employee[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const employeesCollection = collection(db, 'employees');
    const q = query(employeesCollection, orderBy("name", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const employeeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        callback(employeeList);
    }, (error) => {
        console.error("Error subscribing to employees:", error);
        onError(error);
    });

    return unsubscribe;
}


export async function getEmployees(): Promise<Employee[]> {
  const employeesCollection = collection(db, 'employees');
  const employeeSnapshot = await getDocs(employeesCollection);
  const employeeList = employeeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
  return employeeList.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEmployee(id: string): Promise<Employee | null> {
    const employeeRef = doc(db, 'employees', id);
    const employeeSnap = await getDoc(employeeRef);
    if(employeeSnap.exists()){
        return { id: employeeSnap.id, ...employeeSnap.data() } as Employee;
    }
    return null;
}

export async function addEmployee(employeeDataToAdd: Omit<Employee, 'id'>): Promise<Employee> {
    const employeesCollection = collection(db, 'employees');
    
    // Check for existing matricule
    const q = query(employeesCollection, where("matricule", "==", employeeDataToAdd.matricule));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error("Un employé avec ce matricule existe déjà.");
    }

    const docRef = await addDoc(employeesCollection, employeeDataToAdd);
    const newEmployee: Employee = { 
        id: docRef.id, 
        ...employeeDataToAdd
    };
    return newEmployee;
}

export async function batchAddEmployees(employees: Omit<Employee, 'id'>[]): Promise<number> {
    const employeesCollection = collection(db, 'employees');
    const q = query(employeesCollection);
    const querySnapshot = await getDocs(q);
    const existingMatricules = new Set(querySnapshot.docs.map(doc => doc.data().matricule));

    const batch = writeBatch(db);
    let addedCount = 0;

    employees.forEach(employee => {
        if (!existingMatricules.has(employee.matricule)) {
            const docRef = doc(collection(db, "employees"));
            batch.set(docRef, employee);
            existingMatricules.add(employee.matricule); // Avoid duplicates within the same batch
            addedCount++;
        }
    });

    if (addedCount > 0) {
        await batch.commit();
    }
    
    return addedCount;
}


export async function updateEmployee(employeeId: string, employeeDataToUpdate: Partial<Employee>): Promise<void> {
    const employeeRef = doc(db, 'employees', employeeId);
    await updateDoc(employeeRef, employeeDataToUpdate);
}

export async function deleteEmployee(employeeId: string): Promise<void> {
    const employeeRef = doc(db, 'employees', employeeId);
    await deleteDoc(employeeRef);
}

export async function searchEmployees(query: string): Promise<Employee[]> {
    const lowerCaseQuery = query.toLowerCase();
    const allEmployees = await getEmployees();
    return allEmployees.filter(employee => 
        employee.name.toLowerCase().includes(lowerCaseQuery) || 
        employee.matricule.toLowerCase().includes(lowerCaseQuery)
    );
}
