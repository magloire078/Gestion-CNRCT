
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Employee } from '@/lib/data';

export async function getEmployees(): Promise<Employee[]> {
  const employeesCollection = collection(db, 'employees');
  const employeeSnapshot = await getDocs(employeesCollection);
  const employeeList = employeeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
  return employeeList.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addEmployee(employeeDataToAdd: Omit<Employee, 'id'>): Promise<Employee> {
    const employeesCollection = collection(db, 'employees');
    const docRef = await addDoc(employeesCollection, employeeDataToAdd);
    const newEmployee: Employee = { 
        id: docRef.id, 
        ...employeeDataToAdd
    };
    return newEmployee;
}

export async function updateEmployee(employeeId: string, employeeDataToUpdate: Omit<Employee, 'id'>): Promise<Employee> {
    const employeeRef = doc(db, 'employees', employeeId);
    await updateDoc(employeeRef, employeeDataToUpdate);
    const updatedEmployee = { id: employeeId, ...employeeDataToUpdate };
    return updatedEmployee;
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
