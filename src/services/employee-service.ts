
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot, Unsubscribe, query, orderBy, where, writeBatch, getDoc } from 'firebase/firestore';
import type { Employe } from '@/lib/data';
// import { db } from '@/lib/firebase'; // Temporarily disabled
import { getOrganizationSettings } from './organization-service';

// --- Mock Data ---
const mockEmployees: Employe[] = [
    { id: '1', matricule: 'M001', name: 'Koffi Jean-Luc', firstName: 'Jean-Luc', lastName: 'Koffi', poste: 'Développeur Senior', department: 'Informatique', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png', email: 'koffi.jl@example.com', dateEmbauche: '2020-01-15', baseSalary: 1200000, CNPS: true, sexe: 'Homme' },
    { id: '2', matricule: 'M002', name: 'Amoin Thérèse', firstName: 'Thérèse', lastName: 'Amoin', poste: 'Chef de projet', department: 'Directoire', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png', email: 'amoin.t@example.com', dateEmbauche: '2018-05-20', baseSalary: 1800000, CNPS: true, sexe: 'Femme' },
    { id: '3', matricule: 'M003', name: 'N\'Guessan Paul', firstName: 'Paul', lastName: 'N\'Guessan', poste: 'Comptable', department: 'Direction des Affaires financières et du patrimoine', status: 'En congé', photoUrl: 'https://placehold.co/100x100.png', email: 'nguessan.p@example.com', dateEmbauche: '2022-11-01', baseSalary: 800000, CNPS: false, sexe: 'Homme' },
    { id: '4', matricule: 'M004', name: 'Brou Adjoua', firstName: 'Adjoua', lastName: 'Brou', poste: 'Assistante de direction', department: 'Secretariat Général', status: 'Actif', photoUrl: 'https://placehold.co/100x100.png', email: 'brou.a@example.com', dateEmbauche: '2021-02-10', baseSalary: 750000, CNPS: true, sexe: 'Femme' },
    { id: '5', matricule: 'M005', name: 'Traoré Moussa', firstName: 'Moussa', lastName: 'Traoré', poste: 'Chargé de communication', department: 'Communication', status: 'Retraité', photoUrl: 'https://placehold.co/100x100.png', email: 'traore.m@example.com', dateEmbauche: '2015-08-30', baseSalary: 950000, CNPS: true, sexe: 'Homme', Date_Depart: '2024-06-30' },
];
// --- End Mock Data ---

export function subscribeToEmployees(
    callback: (employees: Employe[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const interval = setInterval(() => callback([...mockEmployees]), 2000);
    return () => clearInterval(interval);
}

export async function getEmployees(): Promise<Employe[]> {
  return Promise.resolve([...mockEmployees]);
}

export async function getEmployee(id: string): Promise<Employe | null> {
    if (!id) return null;
    const employee = mockEmployees.find(e => e.id === id);
    return Promise.resolve(employee || null);
}

export async function addEmployee(employeeDataToAdd: Omit<Employe, 'id'>): Promise<Employe> {
    const newEmployee: Employe = { 
        id: `emp-${Date.now()}`,
        ...employeeDataToAdd
    };
    mockEmployees.push(newEmployee);
    return Promise.resolve(newEmployee);
}

export async function batchAddEmployees(employees: Omit<Employe, 'id'>[]): Promise<number> {
    const existingMatricules = new Set(mockEmployees.map(e => e.matricule));
    let addedCount = 0;
    employees.forEach(employee => {
        if (!existingMatricules.has(employee.matricule)) {
            mockEmployees.push({ id: `emp-batch-${Date.now()}-${addedCount}`, ...employee });
            addedCount++;
        }
    });
    return Promise.resolve(addedCount);
}

export async function updateEmployee(employeeId: string, employeeDataToUpdate: Partial<Employe>): Promise<void> {
    const index = mockEmployees.findIndex(e => e.id === employeeId);
    if (index > -1) {
        mockEmployees[index] = { ...mockEmployees[index], ...employeeDataToUpdate };
    } else {
        throw new Error("Employé non trouvé.");
    }
    return Promise.resolve();
}

export async function deleteEmployee(employeeId: string): Promise<void> {
    const index = mockEmployees.findIndex(e => e.id === employeeId);
    if (index > -1) {
        mockEmployees.splice(index, 1);
    }
    return Promise.resolve();
}

export async function searchEmployees(query: string): Promise<Employe[]> {
    const lowerCaseQuery = query.toLowerCase();
    return Promise.resolve(
        mockEmployees.filter(employee => 
            employee.name.toLowerCase().includes(lowerCaseQuery) || 
            employee.matricule.toLowerCase().includes(lowerCaseQuery)
        )
    );
}

export { getOrganizationSettings };
