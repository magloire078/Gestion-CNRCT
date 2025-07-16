
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, setDoc, doc, query, where, writeBatch, getDoc } from 'firebase/firestore';
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
    const q = query(employeesCollection, where("matricule", "==", employeeData.matricule));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error(`Un employé avec le matricule ${employeeData.matricule} existe déjà.`);
    }

    const docRef = doc(employeesCollection);
    
    // Explicitly create the object to be stored, excluding the 'id' field
    const dataToStore: Omit<Employee, 'id'> = {
        matricule: employeeData.matricule,
        name: employeeData.name,
        email: employeeData.email,
        department: employeeData.department,
        role: employeeData.role,
        status: employeeData.status,
        photoUrl: employeeData.photoUrl,
    };
    
    await setDoc(docRef, dataToStore);

    const newEmployee: Employee = {
        id: docRef.id,
        ...employeeData
    };
    return newEmployee;
}


// This function is for the migration script and is not intended for general use in the app.
export async function batchAddEmployees(employees: Omit<Employee, 'id'>[]) {
    const batch = writeBatch(db);
    let count = 0;

    for (const employee of employees) {
        const q = query(employeesCollection, where("matricule", "==", employee.matricule));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            const docRef = doc(employeesCollection); // Auto-generate new ID
            batch.set(docRef, employee);
            count++;
            console.log(`Scheduling add for ${employee.name} (${employee.matricule})`);
        } else {
            console.log(`Skipping duplicate: ${employee.name} (${employee.matricule})`);
        }
    }

    if (count > 0) {
        await batch.commit();
        console.log(`Successfully added ${count} new employees.`);
    } else {
        console.log("No new employees to add.");
    }
}
