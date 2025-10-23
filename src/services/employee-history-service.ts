

import { collection, getDocs, addDoc, query, where, orderBy, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import type { EmployeeEvent, Employe } from '@/lib/data';
import { db } from '@/lib/firebase';
import { getEmployee } from './employee-service';
import { getPayslipDetails } from './payslip-details-service';
import { parseISO, isValid, isBefore } from 'date-fns';

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
        
        const history = await getEmployeeHistory(employee.id);
        const previousEvent = history
            .filter(event => 
                event.eventType === 'Augmentation' && 
                event.details &&
                isValid(parseISO(event.effectiveDate)) && 
                isBefore(parseISO(event.effectiveDate), parseISO(eventData.effectiveDate))
            )
            .sort((a, b) => parseISO(b.effectiveDate).getTime() - parseISO(a.effectiveDate).getTime())[0];

        // Use the details from the most recent previous event, or the employee's base data if none exists
        const baseValues = previousEvent?.details || employee;

        const previousValues: Record<string, any> = {
            previous_baseSalary: baseValues.baseSalary || 0,
            previous_indemniteTransportImposable: baseValues.indemniteTransportImposable || 0,
            previous_indemniteResponsabilite: baseValues.indemniteResponsabilite || 0,
            previous_indemniteLogement: baseValues.indemniteLogement || 0,
            previous_indemniteSujetion: baseValues.indemniteSujetion || 0,
            previous_indemniteCommunication: baseValues.indemniteCommunication || 0,
            previous_indemniteRepresentation: baseValues.indemniteRepresentation || 0,
            previous_transportNonImposable: baseValues.transportNonImposable || 0,
            previous_primeAnciennete: baseValues.primeAnciennete || 0,
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
    
    // Create a clean object to prevent sending undefined values to Firestore
    const cleanEventData = JSON.parse(JSON.stringify(eventData));
    
    await updateDoc(eventDocRef, cleanEventData);
    
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
 * If the event is a salary increase, it reverts the employee's salary to the previous state.
 * @param employeeId The ID of the employee.
 * @param eventId The ID of the event to delete.
 */
export async function deleteEmployeeHistoryEvent(employeeId: string, eventId: string): Promise<void> {
    const eventDocRef = doc(db, `employees/${employeeId}/history`, eventId);
    const eventSnap = await getDoc(eventDocRef);

    if (!eventSnap.exists()) {
        throw new Error("Événement non trouvé.");
    }

    const eventToDelete = eventSnap.data() as EmployeeEvent;

    // First, delete the event
    await deleteDoc(eventDocRef);

    // If it was the most recent salary increase, revert the employee's main document
    const remainingHistory = await getEmployeeHistory(employeeId);
    const latestAugmentation = remainingHistory.find(e => e.eventType === 'Augmentation');

    const employeeDocRef = doc(db, 'employees', employeeId);

    if (latestAugmentation && latestAugmentation.details) {
        // Revert to the latest remaining augmentation
        const salaryUpdates: Partial<Employe> = {};
        const fieldsToUpdate = [
            'baseSalary', 'indemniteTransportImposable', 'indemniteSujetion', 
            'indemniteCommunication', 'indemniteRepresentation', 'indemniteResponsabilite', 
            'indemniteLogement', 'transportNonImposable', 'primeAnciennete'
        ];
        fieldsToUpdate.forEach(field => {
            if (latestAugmentation.details![field] !== undefined) {
                (salaryUpdates as any)[field] = Number(latestAugmentation.details![field]);
            }
        });
        if (Object.keys(salaryUpdates).length > 0) {
            await updateDoc(employeeDocRef, salaryUpdates);
            console.log(`Reverted salary for employee ${employeeId} to state from event ${latestAugmentation.id}.`);
        }
    } else {
        // No augmentations left, revert to original employee data if possible
        // This part is complex as we don't store the "original" state separate from the employee doc
        // The most robust way is to revert to what was the "previous" state of the deleted event.
        if (eventToDelete.eventType === 'Augmentation' && eventToDelete.details) {
             const salaryRevertData: Partial<Employe> = {};
             const fieldsToRevert: Record<keyof Employe, string> = {
                baseSalary: 'previous_baseSalary',
                indemniteTransportImposable: 'previous_indemniteTransportImposable',
                indemniteSujetion: 'previous_indemniteSujetion',
                indemniteCommunication: 'previous_indemniteCommunication',
                indemniteRepresentation: 'previous_indemniteRepresentation',
                indemniteResponsabilite: 'previous_indemniteResponsabilite',
                indemniteLogement: 'previous_indemniteLogement',
                transportNonImposable: 'previous_transportNonImposable',
                primeAnciennete: 'previous_primeAnciennete',
            };
            
            for (const [key, prevKey] of Object.entries(fieldsToRevert)) {
                if (eventToDelete.details[prevKey] !== undefined) {
                    (salaryRevertData as any)[key] = eventToDelete.details[prevKey];
                }
            }

            if (Object.keys(salaryRevertData).length > 0) {
                 await updateDoc(employeeDocRef, salaryRevertData);
                 console.log(`Reverted salary for employee ${employeeId} to previous state stored in deleted event.`);
            }
        }
    }
}
