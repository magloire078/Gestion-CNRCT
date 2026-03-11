

import {
    collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot,
    Unsubscribe, query, orderBy, where, writeBatch, getDoc, setDoc, limit,
    type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot
} from '@/lib/firebase';
import type { Employe, Chief, Department } from '@/lib/data';
import { db, storage } from '@/lib/firebase';
import { employeeSchema } from '@/lib/schemas/employee-schema';
import { getOrganizationSettings } from './organization-service';
import { getDepartments } from './department-service';
import { getDirections } from './direction-service';
import { getServices } from './service-service';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { FirestorePermissionError } from '@/lib/errors';
import { parseISO, addYears, format, isValid } from 'date-fns';
import { divisions } from '@/lib/ivory-coast-divisions';


const employeesCollection = collection(db, 'employees');
const chiefsCollection = collection(db, 'chiefs');

// Department IDs for special groups
const GROUPE_DIRECTOIRE_ID = 'DVeCoGfRfL3p43eQeYwz';

export type EmployeeGroup = 'directoire' | 'regional' | 'personnel-siege' | 'chauffeur-directoire' | 'garde-republicaine' | 'gendarme' | 'all';

export type RegionalCommittee = {
    region: string;
    president: Employe | null;
    members: Employe[];
};

/**
 * Determines the group an employee belongs to based on their properties.
 * @param employee The employee object.
 * @param departments A list of all available departments.
 * @returns The group name as a string.
 */
export function getEmployeeGroup(employee: Employe, departments: Department[]): EmployeeGroup {
    const departmentName = departments.find(d => d.id === employee.departmentId)?.name;

    if (departmentName === 'Garde Républicaine') {
        return 'garde-republicaine';
    }
    if (departmentName === 'Gendarmerie') {
        return 'gendarme';
    }
    if (employee.departmentId === GROUPE_DIRECTOIRE_ID || employee.matricule?.startsWith('D 0')) {
        return 'directoire';
    }
    if (employee.poste === 'Membre Comité Régional') {
        return 'regional';
    }
    if (employee.matricule?.startsWith('R 0')) {
        return 'chauffeur-directoire';
    }

    // All other employees, including regular chauffeurs, are considered personnel-siege if they are on CNPS
    if (employee.CNPS === true) {
        return 'personnel-siege';
    }

    // Default fallback
    return 'personnel-siege';
}


async function createOrUpdateChiefFromEmployee(employee: Employe): Promise<void> {
    // Only sync if the employee is a chief/regional member (has Region and Village fields)
    const isChief = employee.Region || employee.Village || employee.groupe_2 === 'Rois & Chefs';
    if (!isChief) return;

    const chiefData: Partial<Chief> = {
        name: `${employee.lastName || ''} ${employee.firstName || ''}`.trim() || employee.name,
        firstName: employee.firstName,
        lastName: employee.lastName,
        title: employee.poste,
        role: (employee.Region && employee.Village) ? 'Chef de Village' : 'Chef de canton',
        sexe: employee.sexe,
        region: employee.Region,
        department: employee.Departement,
        subPrefecture: employee.subPrefecture,
        village: employee.Village,
        contact: employee.mobile,
        photoUrl: employee.photoUrl
    };

    // Remove undefined fields to avoid overwriting existing data
    Object.keys(chiefData).forEach(k => (chiefData as any)[k] === undefined && delete (chiefData as any)[k]);

    // Step 1: If the employee already has a chiefId, update the existing document directly
    if (employee.chiefId) {
        try {
            const existingChiefRef = doc(chiefsCollection, employee.chiefId);
            const existingChiefSnap = await getDoc(existingChiefRef);
            if (existingChiefSnap.exists()) {
                await updateDoc(existingChiefRef, chiefData);
                return; // Done — no duplication possible
            }
        } catch (e) {
            console.warn(`[EmployeeService] Could not update chief by chiefId ${employee.chiefId}, falling through to name search.`, e);
        }
    }

    // Step 2: Fallback — search by name to handle legacy records not yet linked by ID
    const fullName = chiefData.name || '';
    if (!fullName) return;

    const chiefsQuery = query(chiefsCollection, where('name', '==', fullName));
    const snapshot = await getDocs(chiefsQuery);

    if (!snapshot.empty) {
        // Found existing chief by name — update and store the id back on the employee
        const chiefDocRef = snapshot.docs[0].ref;
        await updateDoc(chiefDocRef, chiefData);

        // Link the employee to this chief to prevent future fallback searches
        if (!employee.chiefId && employee.id) {
            await updateDoc(doc(db, 'employees', employee.id), { chiefId: snapshot.docs[0].id });
        }
    } else {
        // No existing chief found — create one
        const newChiefRef = doc(chiefsCollection);
        await setDoc(newChiefRef, chiefData);

        // Store chiefId back on the employee document to prevent future duplicates
        if (employee.id) {
            await updateDoc(doc(db, 'employees', employee.id), { chiefId: newChiefRef.id });
        }
    }
}



export function subscribeToEmployees(
    callback: (employees: Employe[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(employeesCollection, orderBy("lastName", "asc"), orderBy("firstName", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot: QuerySnapshot<DocumentData>) => {
            const employees = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
                const data = { id: doc.id, ...doc.data() };
                const result = employeeSchema.safeParse(data);
                if (!result.success) {
                    console.warn(`[EmployeeService] validation error for ${doc.id}:`, result.error.errors);
                    return data as Employe; // Fallback to raw cast to avoid breaking everything
                }
                return result.data as Employe;
            });
            callback(employees);
        },
        (error: Error) => {
            onError(new FirestorePermissionError("Impossible de charger les employés.", { query: "allEmployees" }));
        }
    );
    return unsubscribe;
}

export async function getEmployees(): Promise<Employe[]> {
    const q = query(employeesCollection, orderBy("lastName", "asc"), orderBy("firstName", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = { id: doc.id, ...doc.data() };
        const result = employeeSchema.safeParse(data);
        if (!result.success) {
            // Log validation errors with details for debugging
            console.warn(`[EmployeeService] validation error for ${doc.id}:`, result.error.errors);
            // Return data anyway to avoid blocking the UI
            return data as Employe;
        }
        return result.data as Employe;
    });
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

const processEmployeeData = (employeeData: Partial<Employe>): Partial<Employe> => {
    const data = { ...employeeData };

    // Si l'employé est actif, n'a pas de date de départ, mais a une date de naissance
    if (data.status === 'Actif' && !data.Date_Depart && data.Date_Naissance) {
        try {
            const birthDate = parseISO(data.Date_Naissance);
            if (isValid(birthDate)) {
                const retirementDate = addYears(birthDate, 60);
                data.Date_Depart = format(retirementDate, 'yyyy-MM-dd');
            }
        } catch (e) {
            console.error(`Could not calculate retirement date for employee with birthdate ${data.Date_Naissance}`, e);
        }
    }

    // Ensure numeric fields are numbers
    const numericFields: (keyof Employe)[] = [
        'baseSalary', 'primeAnciennete', 'indemniteTransportImposable', 'indemniteResponsabilite',
        'indemniteLogement', 'indemniteSujetion', 'indemniteCommunication', 'indemniteRepresentation',
        'Salaire_Brut', 'transportNonImposable', 'Salaire_Net', 'enfants'
    ];
    numericFields.forEach(field => {
        if (data[field] !== undefined && typeof data[field] !== 'number') {
            const num = parseFloat(String(data[field]));
            (data as any)[field] = isNaN(num) ? 0 : num;
        }
    });

    Object.keys(data).forEach(key => {
        if ((data as any)[key] === undefined) {
            delete (data as any)[key];
        }
    });

    return data;
}


export async function addEmployee(employeeData: Omit<Employe, 'id'>, photoFile: File | null): Promise<Employe> {
    try {
        let photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.name || 'E')}&background=006039&color=fff&size=100`;
        const docRef = doc(collection(db, "employees"));

        if (photoFile) {
            photoUrl = await uploadToCloudinary(photoFile);
        }

        const processedData = processEmployeeData({ ...employeeData, photoUrl });

        await setDoc(docRef, processedData);

        const newEmployee = { id: docRef.id, ...processedData } as Employe;
        await createOrUpdateChiefFromEmployee(newEmployee);

        return newEmployee;
    } catch (error: any) {
        if (error.code === 'permission-denied') {
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
    const existingMatricules = new Set(existingSnapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data().matricule));

    let addedCount = 0;
    const employeesToSyncToChiefs: Employe[] = [];

    employees.forEach(employee => {
        if (employee.matricule && !existingMatricules.has(employee.matricule)) {
            const newDocRef = doc(employeesCollection); // Auto-generate ID
            const processedData = processEmployeeData(employee);
            batch.set(newDocRef, processedData);
            employeesToSyncToChiefs.push({ id: newDocRef.id, ...processedData } as Employe);
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
        } catch (error: any) {
            if (error.code === 'permission-denied') {
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

        let updateData: Partial<Employe> = { ...employeeDataToUpdate };

        if (photoFile) {
            updateData.photoUrl = await uploadToCloudinary(photoFile);
        }

        updateData = processEmployeeData(updateData);

        if ('id' in updateData) {
            delete (updateData as any).id;
        }

        await updateDoc(employeeDocRef, updateData);

        const updatedEmployee = await getEmployee(employeeId);
        if (updatedEmployee) {
            await createOrUpdateChiefFromEmployee(updatedEmployee);
        }
    } catch (error: any) {
        if (error.code === 'permission-denied') {
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
    } catch (error: any) {
        if (error.code === 'permission-denied') {
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
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission de charger la structure organisationnelle.", { operation: 'read-organization' });
        }
        throw error;
    }
}

export async function getDirectoireMembers(): Promise<Employe[]> {
    try {
        const q = query(employeesCollection, where('status', '==', 'Actif'));
        const snapshot = await getDocs(q);
        const allEmployees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employe));

        // Directoire department ID identified in Firestore
        const DIRECTOIRE_DEPT_ID = '9ywKFDgVMS86rZLPYhpm';

        // Includes: members of Directoire department, employees with D 0xxx matricule, and Secretary General
        const directoireMembers = allEmployees.filter(emp =>
            emp.departmentId === DIRECTOIRE_DEPT_ID ||
            emp.matricule?.startsWith('D 0') ||
            emp.poste?.toLowerCase().includes('secrétaire général')
        );

        // Sorting priority based on official hierarchy
        const getRank = (poste: string = '') => {
            const p = poste.toLowerCase();
            if (p.includes('president') && !p.includes('vice')) return 1;
            if (p.includes('1er vice-president') || p.includes('premier vice-president')) return 2;
            if (p.includes('2eme vice-president') || p.includes('deuxième vice-president') || p.includes('2emevice-president')) return 3;
            if (p.includes('3eme vice-president') || p.includes('troisième vice-president')) return 4;
            if (p.includes('4eme vice-president') || p.includes('quatrième vice-president')) return 5;
            if (p.includes('5eme vice-president') || p.includes('cinquième vice-president')) return 6;
            if (p.includes('secrétaire général')) return 7;
            if (p.includes('membre du bureau')) return 8;
            if (p.includes('membre du directoire')) return 9;
            return 99;
        };

        return directoireMembers.sort((a, b) => getRank(a.poste) - getRank(b.poste));
    } catch (error) {
        console.error('[employee-service] Error fetching directoire members:', error);
        return [];
    }
}

export async function getRegionalCommittees(): Promise<RegionalCommittee[]> {
    try {
        const q = query(employeesCollection, where('status', '==', 'Actif'));
        const snapshot = await getDocs(q);
        const allEmployees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employe));

        const regions = Object.keys(divisions);
        const regionalCommittees: RegionalCommittee[] = regions.map(region => {
            // All employees in this region belonging to regional structures
            const regionalStaff = allEmployees.filter(emp =>
                emp.Region === region &&
                (
                    emp.poste?.toLowerCase().includes('comité régional') ||
                    emp.poste?.toLowerCase().includes('membre du bureau') ||
                    emp.poste?.toLowerCase().includes('chef') ||
                    emp.poste?.toLowerCase().includes('roi')
                )
            );

            // 1. Find the Bureau head (Membre du Bureau)
            const bureauHead = regionalStaff.find(m =>
                m.poste?.toLowerCase().includes('membre du bureau') ||
                m.poste?.toLowerCase().includes('président') ||
                m.poste?.toLowerCase().includes('president')
            ) || null;

            // 2. Get departments for this region
            const regionDepts = Object.keys(divisions[region] || {});

            // 3. Collect 2 chefs per department
            const membersByDept: Employe[] = [];

            // Prepend bureauHead if they exist
            if (bureauHead) {
                membersByDept.push(bureauHead);
            }

            regionDepts.forEach(deptName => {
                const deptStaff = regionalStaff.filter(emp =>
                    emp.Departement === deptName &&
                    emp.id !== bureauHead?.id
                );
                // Take up to 2 chefs per department
                membersByDept.push(...deptStaff.slice(0, 2));
            });

            return {
                region,
                president: bureauHead,
                members: membersByDept
            };
        });

        return regionalCommittees;
    } catch (error) {
        console.error('[employee-service] Error fetching regional committees:', error);
        return [];
    }
}
