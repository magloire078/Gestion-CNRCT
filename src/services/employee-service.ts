

import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot, Unsubscribe, query, orderBy, where, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import type { Employe, Chief } from '@/lib/data';
import { db, storage } from '@/lib/firebase';
import { getOrganizationSettings } from './organization-service';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const employeesCollection = collection(db, 'employees');
const chiefsCollection = collection(db, 'chiefs');

async function createOrUpdateChiefFromEmployee(employee: Employe) {
    if (employee.department === 'Directoire' || (employee.Region && employee.Village)) {
        const chiefsQuery = query(chiefsCollection, where('name', '==', employee.name));
        const snapshot = await getDocs(chiefsQuery);
        
        const chiefData: Partial<Chief> = {
            name: `${employee.lastName || ''} ${employee.firstName || ''}`.trim(),
            firstName: employee.firstName,
            lastName: employee.lastName,
            title: employee.poste, // Use 'poste' as 'title'
            role: 'Chef de Canton', // Default role, can be changed later
            sexe: employee.sexe,
            region: employee.Region,
            department: employee.Departement,
            village: employee.Village,
            photoUrl: employee.photoUrl
        };
        
        if (snapshot.empty) {
            // Create new chief
            const newChiefRef = doc(chiefsCollection);
            await setDoc(newChiefRef, chiefData);
            console.log(`Created new chief entry for employee: ${employee.name}`);
        } else {
            // Update existing chief
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
    let photoUrl = 'https://placehold.co/100x100.png';
    const docRef = doc(collection(db, "employees"));

    if (photoFile) {
        const photoRef = ref(storage, `employee_photos/${docRef.id}/${photoFile.name}`);
        const snapshot = await uploadBytes(photoRef, photoFile);
        photoUrl = await getDownloadURL(snapshot.ref);
    }
    
    const finalEmployeeData = { ...employeeData, photoUrl };
    await setDoc(docRef, finalEmployeeData);
    
    const newEmployee = { id: docRef.id, ...finalEmployeeData };
    await createOrUpdateChiefFromEmployee(newEmployee);
    
    return newEmployee;
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
        await batch.commit();
        // Sync to chiefs after commit
        for (const emp of employeesToSyncToChiefs) {
            await createOrUpdateChiefFromEmployee(emp);
        }
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
    
    const updatedEmployee = await getEmployee(employeeId);
    if (updatedEmployee) {
        await createOrUpdateChiefFromEmployee(updatedEmployee);
    }
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
