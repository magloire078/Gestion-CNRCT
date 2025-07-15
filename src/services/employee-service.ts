
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import type { Employee } from '@/lib/data';

const employeesCollection = collection(db, 'employees');

export async function getEmployees(): Promise<Employee[]> {
  const employeeSnapshot = await getDocs(employeesCollection);
  const employeeList = employeeSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Employee));
  return employeeList;
}

export async function addEmployee(employeeData: Omit<Employee, 'id'>): Promise<Employee> {
    const docRef = doc(employeesCollection);
    const newEmployee: Employee = {
        id: docRef.id,
        ...employeeData
    };
    await setDoc(docRef, employeeData);
    return newEmployee;
}
