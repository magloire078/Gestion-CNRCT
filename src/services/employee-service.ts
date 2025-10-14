

import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot, Unsubscribe, query, orderBy, where, writeBatch, getDoc, setDoc, limit } from 'firebase/firestore';
import type { Employe, Chief } from '@/lib/data';
import { db, storage } from '@/lib/firebase';
import { getOrganizationSettings } from './organization-service';
import { getDepartments } from './department-service';
import { getDirections } from './direction-service';
import { getServices } from './service-service';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirestorePermissionError } from '@/lib/errors';


const employeesCollection = collection(db, 'employees');
const chiefsCollection = collection(db, 'chiefs');

// Department IDs for special groups
const GROUPE_DIRECTOIRE_ID = 'DVeCoGfRfL3p43eQeYwz'; 
const GROUPE_GARDE_ID = 'YOUR_GARDE_ID'; // Replace with actual ID
const GROUPE_GENDARME_ID = 'YOUR_GENDARME_ID'; // Replace with actual ID

export type EmployeeGroup = 'directoire' | 'regional' | 'personnel-siege' | 'personnel-non-siege' | 'garde-republicaine' | 'gendarme' | 'all';

/**
 * Determines the group an employee belongs to based on their properties.
 * @param employee The employee object.
 * @returns The group name as a string.
 */
export function getEmployeeGroup(employee: Employe): EmployeeGroup {
  if (employee.departmentId === GROUPE_DIRECTOIRE_ID || employee.matricule?.startsWith('D 0')) {
    return 'directoire';
  }
  if (employee.matricule?.startsWith('R 0') && employee.CNPS === true) {
      return 'personnel-non-siege';
  }
  if (employee.departmentId === GROUPE_GARDE_ID) {
    return 'garde-republicaine';
  }
  if (employee.departmentId === GROUPE_GENDARME_ID) {
    return 'gendarme';
  }
  
  if (employee.CNPS === true) {
      return 'personnel-siege';
  }
  
  // Default fallback for employees not declared to CNPS or without specific matricules
  return 'personnel-siege';
}


async function createOrUpdateChiefFromEmployee(employee: Employe) {
    if (employee.departmentId === 'DVeCoGfRfL3p43eQeYwz' || (employee.Region && employee.Village)) {
        const chiefsQuery = query(chiefsCollection, where('name', '==', employee.name));
        const snapshot = await getDocs(chiefsQuery);
        
        const chiefData: Partial<Chief> = {
            name: `${employee.lastName || ''} ${employee.firstName || ''}`.trim(),
            firstName: employee.firstName,
            lastName: employee.lastName,
            title: employee.poste,
            role: (employee.Region && employee.Village) ? 'Chef de Village' : 'Chef de Canton',
            sexe: employee.sexe,
            region: employee.Region,
            department: employee.Departement,
            village: employee.Village,
            photoUrl: employee.photoUrl
        };
        
        if (snapshot.empty) {
            const newChiefRef = doc(chiefsCollection);
            await setDoc(newChiefRef, chiefData);
            console.log(`Created new chief entry for employee: ${employee.name}`);
        } else {
            const chiefDocRef = snapshot.docs[0].ref;
            await updateDoc(chiefDocRef, chiefData);
            console.log(`Updated chief entry for employee: ${employee.name}`);
        }
    }
}


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
            onError(new FirestorePermissionError("Impossible de charger les employés.", { query: "allEmployees" }));
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

    // 1. Try to get by document ID first
    const employeeDocRef = doc(db, 'employees', id);
    const docSnap = await getDoc(employeeDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Employe;
    }

    // 2. If not found, try to find by userId field
    const q = query(employeesCollection, where("userId", "==", id));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Employe;
    }

    return null;
}

export async function addEmployee(employeeData: Omit<Employe, 'id'>, photoFile: File | null): Promise<Employe> {
    try {
        let photoUrl = 'https://placehold.co/100x100.png';
        const docRef = doc(collection(db, "employees"));

        if (photoFile) {
            const photoRef = ref(storage, `employee_photos/${docRef.id}/${photoFile.name}`);
            const snapshot = await uploadBytes(photoRef, photoFile);
            photoUrl = await getDownloadURL(snapshot.ref);
        }
        
        const finalEmployeeData: { [key: string]: any } = { ...employeeData, photoUrl };
        
        Object.keys(finalEmployeeData).forEach(key => {
            if (finalEmployeeData[key] === undefined) {
                delete finalEmployeeData[key];
            }
        });

        await setDoc(docRef, finalEmployeeData);
        
        const newEmployee = { id: docRef.id, ...finalEmployeeData } as Employe;
        await createOrUpdateChiefFromEmployee(newEmployee);
        
        return newEmployee;
    } catch(error: any) {
        if(error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission d'ajouter un nouvel employé.", { operation: 'add', path: 'employees' });
        }
        throw error;
    }
}


export async function batchAddEmployees(employees: Omit<Employe, 'id'>[]): Promise<number> {
    const batch = writeBatch(db);
    const matricules = employees.map(e => e.matricule).filter(Boolean);
    if (matricules.length === 0) return 0;
    
    const existingMatriculesQuery = query(employeesCollection, where('matricule', 'in', matricules));
    const existingSnapshot = await getDocs(existingMatriculesQuery);
    const existingMatricules = new Set(existingSnapshot.docs.map(d => d.data().matricule));

    let addedCount = 0;
    const employeesToSyncToChiefs: Employe[] = [];

    employees.forEach(employee => {
        if (employee.matricule && !existingMatricules.has(employee.matricule)) {
            const newDocRef = doc(employeesCollection); // Auto-generate ID
            batch.set(newDocRef, employee);
            employeesToSyncToChiefs.push({ id: newDocRef.id, ...employee });
            addedCount++;
        }
    });

    if (addedCount > 0) {
        try {
            await batch.commit();
            // Sync to chiefs after commit
            for (const emp of employeesToSyncToChiefs) {
                await createOrUpdateChiefFromEmployee(emp);
            }
        } catch(error: any) {
             if(error.code === 'permission-denied') {
                throw new FirestorePermissionError("Vous n'avez pas la permission d'importer des employés en masse.", { operation: 'batch-add', path: 'employees' });
            }
            throw error;
        }
    }
    return addedCount;
}

export async function updateEmployee(employeeId: string, employeeDataToUpdate: Partial<Employe>, photoFile: File | null = null): Promise<void> {
    try {
        const employeeDocRef = doc(db, 'employees', employeeId);
        
        const updateData: { [key: string]: any } = { ...employeeDataToUpdate };

        if (photoFile) {
            const photoRef = ref(storage, `employee_photos/${employeeId}/${photoFile.name}`);
            const snapshot = await uploadBytes(photoRef, photoFile);
            updateData.photoUrl = await getDownloadURL(snapshot.ref);
        }
        
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        if ('id' in updateData) {
            delete (updateData as any).id;
        }

        await updateDoc(employeeDocRef, updateData);
        
        const updatedEmployee = await getEmployee(employeeId);
        if (updatedEmployee) {
            await createOrUpdateChiefFromEmployee(updatedEmployee);
        }
    } catch(error: any) {
         if(error.code === 'permission-denied') {
            throw new FirestorePermissionError(`Vous n'avez pas la permission de modifier l'employé ${employeeDataToUpdate.name}.`, { operation: 'update', path: `employees/${employeeId}` });
        }
        throw error;
    }
}

export async function searchEmployees(queryText: string): Promise<Employe[]> {
    if (!queryText) {
        return getEmployees();
    }
    const lowerCaseQuery = queryText.toLowerCase();
    const allEmployees = await getEmployees();
    
    return allEmployees.filter(employee => 
        (employee.name?.toLowerCase() || '').includes(lowerCaseQuery) || 
        (employee.firstName?.toLowerCase() || '').includes(lowerCaseQuery) || 
        (employee.lastName?.toLowerCase() || '').includes(lowerCaseQuery) || 
        (employee.matricule?.toLowerCase() || '').includes(lowerCaseQuery)
    );
}

export async function deleteEmployee(employeeId: string): Promise<void> {
    try {
        const employeeDocRef = doc(db, 'employees', employeeId);
        await deleteDoc(employeeDocRef);
    } catch(error: any) {
         if(error.code === 'permission-denied') {
            throw new FirestorePermissionError(`Vous n'avez pas la permission de supprimer cet employé.`, { operation: 'delete', path: `employees/${employeeId}` });
        }
        throw error;
    }
}

export async function getLatestMatricule(): Promise<string> {
    const q = query(employeesCollection, orderBy("matricule", "desc"), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return "C 0001"; // Default starting matricule
    }

    const lastMatricule = snapshot.docs[0].data().matricule as string;
    
    // Attempt to extract and increment the numeric part
    const numericPartMatch = lastMatricule.match(/\d+/);
    if (numericPartMatch) {
        const lastNumber = parseInt(numericPartMatch[0], 10);
        const nextNumber = lastNumber + 1;
        const prefix = lastMatricule.split(numericPartMatch[0])[0] || 'C ';
        const padding = numericPartMatch[0].length;
        return `${prefix}${String(nextNumber).padStart(padding, '0')}`;
    }

    // Fallback if no number is found, append '1'
    return `${lastMatricule}1`;
}

export async function getOrganizationalUnits() {
    try {
        const [departments, directions, services] = await Promise.all([
            getDepartments(),
            getDirections(),
            getServices(),
        ]);
        return { departments, directions, services };
    } catch(error: any) {
        if(error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission de charger la structure organisationnelle.", { operation: 'read-organization' });
        }
        throw error;
    }
}



