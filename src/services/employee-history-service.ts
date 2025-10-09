

import { collection, getDocs, addDoc, query, where, orderBy, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import type { EmployeeEvent, Employe } from '@/lib/data';
import { db } from '@/lib/firebase';
import { getEmployee } from './employee-service';
import { getPayslipDetails } from './payslip-details-service';
import { parseISO } from 'date-fns';

/**
 * Retrieves the professional history for a specific employee.
 * @param employeeId The ID of the employee.
 * @returns A promise that resolves to an array of employee events.
 */
export async function getEmployeeHistory(employeeId: string): Promise<EmployeeEvent[]> {
  const historyCollection = collection(db, `employees/${employeeId}/history`);
  const q = query(historyCollection, orderBy("effectiveDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as EmployeeEvent));
}

/**
 * Adds a new event to an employee's professional history.
 * This also updates the main employee document if the event is a salary increase.
 * @param employeeId The ID of the employee.
 * @param eventData The event data to add.
 * @returns A promise that resolves to the newly created EmployeeEvent.
 */
export async function addEmployeeHistoryEvent(employeeId: string, eventData: Omit<EmployeeEvent, 'id' | 'employeeId'>): Promise<EmployeeEvent> {
    const historyCollection = collection(db, `employees/${employeeId}/history`);
    const employee = await getEmployee(employeeId);
    let finalDetails = { ...eventData.details };

    if (eventData.eventType === 'Augmentation' && employee) {
        // Use the payslip service to get the true state before the effective date
        const dayBefore = parseISO(eventData.effectiveDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const previousState = await getPayslipDetails(employee, dayBefore.toISOString().split('T')[0]);

        const previousValues: Record<string, any> = {
            previous_baseSalary: previousState.earnings.find(e => e.label === 'SALAIRE DE BASE')?.amount || 0,
            previous_primeAnciennete: previousState.earnings.find(e => e.label === 'PRIME D\'ANCIENNETE')?.amount || 0,
            previous_indemniteTransportImposable: previousState.earnings.find(e => e.label === 'INDEMNITE DE TRANSPORT IMPOSABLE')?.amount || 0,
            previous_indemniteResponsabilite: previousState.earnings.find(e => e.label === 'INDEMNITE DE RESPONSABILITE')?.amount || 0,
            previous_indemniteLogement: previousState.earnings.find(e => e.label === 'INDEMNITE DE LOGEMENT')?.amount || 0,
            previous_indemniteSujetion: previousState.earnings.find(e => e.label === 'INDEMNITE DE SUJETION')?.amount || 0,
            previous_indemniteCommunication: previousState.earnings.find(e => e.label === 'INDEMNITE DE COMMUNICATION')?.amount || 0,
            previous_indemniteRepresentation: previousState.earnings.find(e => e.label === 'INDEMNITE DE REPRESENTATION')?.amount || 0,
            previous_transportNonImposable: previousState.totals.transportNonImposable.amount || 0,
            employeeHireDate: employee.dateEmbauche,
            cnpsEnabled: employee.CNPS,
        };

        finalDetails = { 
            ...finalDetails, 
            ...previousValues,
        };
    }
    
    const finalEventData = { ...eventData, details: finalDetails };

    const docRef = await addDoc(historyCollection, finalEventData);
    
    // If the event is a salary increase, also update the main employee document
    if (eventData.eventType === 'Augmentation' && eventData.details) {
        const employeeDocRef = doc(db, 'employees', employeeId);
        const salaryUpdates: Partial<Employe> = {};
        const fieldsToUpdate = [
            'baseSalary', 'indemniteTransportImposable', 'indemniteSujetion', 
            'indemniteCommunication', 'indemniteRepresentation', 'indemniteResponsabilite', 
            'indemniteLogement', 'transportNonImposable'
        ];
        
        fieldsToUpdate.forEach(field => {
            if (eventData.details![field] !== undefined) {
                (salaryUpdates as any)[field] = Number(eventData.details![field]);
            }
        });

        // Also update primeAnciennete if it was manually set
        if (eventData.details.primeAnciennete !== undefined) {
            salaryUpdates.primeAnciennete = Number(eventData.details.primeAnciennete);
        }

        if (Object.keys(salaryUpdates).length > 0) {
            await updateDoc(employeeDocRef, salaryUpdates);
        }
    }


    return { 
        id: docRef.id,
        employeeId,
        ...finalEventData
    };
}


/**
 * Updates an existing event in an employee's professional history.
 * @param employeeId The ID of the employee.
 * @param eventId The ID of the event to update.
 * @param eventData The partial data to update.
 * @returns A promise that resolves to the updated EmployeeEvent object.
 */
export async function updateEmployeeHistoryEvent(employeeId: string, eventId: string, eventData: Partial<EmployeeEvent>): Promise<EmployeeEvent> {
    const eventDocRef = doc(db, `employees/${employeeId}/history`, eventId);
    await updateDoc(eventDocRef, eventData);
    
    // If it's an Augmentation, re-apply changes to the main employee doc
    if (eventData.eventType === 'Augmentation' && eventData.details) {
        const employeeDocRef = doc(db, 'employees', employeeId);
        const salaryUpdates: Partial<Employe> = {};
        const fieldsToUpdate = [
            'baseSalary', 'indemniteTransportImposable', 'indemniteSujetion', 
            'indemniteCommunication', 'indemniteRepresentation', 'indemniteResponsabilite', 
            'indemniteLogement', 'transportNonImposable'
        ];
        fieldsToUpdate.forEach(field => {
            if (eventData.details![field] !== undefined) {
                (salaryUpdates as any)[field] = Number(eventData.details![field]);
            }
        });
        if (Object.keys(salaryUpdates).length > 0) {
            await updateDoc(employeeDocRef, salaryUpdates);
        }
    }

    // Fetch the updated document to return the full object
    const updatedDoc = await getDoc(doc(db, `employees/${employeeId}/history`, eventId));
    if (!updatedDoc.exists()) {
        throw new Error("Failed to retrieve updated event.");
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as EmployeeEvent;
}

/**
 * Deletes an event from an employee's professional history.
 * @param employeeId The ID of the employee.
 * @param eventId The ID of the event to delete.
 */
export async function deleteEmployeeHistoryEvent(employeeId: string, eventId: string): Promise<void> {
    const eventDocRef = doc(db, `employees/${employeeId}/history`, eventId);
    await deleteDoc(eventDocRef);
}
