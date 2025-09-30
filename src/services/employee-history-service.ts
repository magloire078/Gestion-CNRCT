

import { collection, getDocs, addDoc, query, where, orderBy, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import type { EmployeeEvent, Employe } from '@/lib/data';
import { db } from '@/lib/firebase';
import { getEmployee } from './employee-service';

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
        const previousValues: Record<string, any> = {};
        const indemnityFields = [
            'baseSalary', 'primeAnciennete', 'indemniteTransportImposable', 'indemniteSujetion', 
            'indemniteCommunication', 'indemniteRepresentation', 'indemniteResponsabilite', 
            'indemniteLogement', 'transportNonImposable'
        ];
        
        indemnityFields.forEach(field => {
            previousValues[`previous_${field}`] = employee[field as keyof Employe] || 0;
        });
        
        // Add employee's hire date to details for consistent seniority calculation
        previousValues['employeeHireDate'] = employee.dateEmbauche;
        previousValues['cnpsEnabled'] = employee.CNPS;


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
