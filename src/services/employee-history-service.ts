

import { collection, getDocs, addDoc, query, where, orderBy, doc, updateDoc, deleteDoc, getDoc } from '@/lib/firebase';
import type { EmployeeEvent, Employe } from '@/lib/data';
import { db } from '@/lib/firebase';
import { getEmployee } from './employee-service';
import { getPayslipDetails } from './payslip-details-service';
import { parseISO, isValid, isBefore, isEqual } from 'date-fns';

const salaryEventTypes: EmployeeEvent['eventType'][] = ['Promotion', 'Augmentation au Mérite', 'Ajustement de Marché', 'Revalorisation Salariale'];

/**
 * Retrieves the professional history for a specific employee.
 * @param employeeId The ID of the employee.
 * @returns A promise that resolves to an array of employee events.
 */
export async function getEmployeeHistory(employeeId: string): Promise<EmployeeEvent[]> {
    const historyCollection = collection(db, `employees/${employeeId}/history`);
    const q = query(historyCollection, orderBy("effectiveDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: any) => ({
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

    const isSalaryEvent = salaryEventTypes.includes(eventData.eventType as any);

    if (isSalaryEvent && employee) {

        const history = await getEmployeeHistory(employee.id);
        const previousEvent = history
            .filter(event =>
                salaryEventTypes.includes(event.eventType as any) &&
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

    // If the event is a salary event, also update the main employee document
    if (isSalaryEvent && eventData.details) {
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

        if (eventData.eventType === 'Promotion' && eventData.details.newPoste) {
            salaryUpdates.poste = eventData.details.newPoste;
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

    const isSalaryEvent = eventData.eventType ? salaryEventTypes.includes(eventData.eventType as any) : false;

    // If it's a salary event, re-apply changes to the main employee doc
    if (isSalaryEvent && eventData.details) {
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
    const isSalaryEvent = salaryEventTypes.includes(eventToDelete.eventType as any);

    // First, delete the event
    await deleteDoc(eventDocRef);

    if (!isSalaryEvent) {
        return; // Nothing more to do if it wasn't a salary event
    }

    // After deletion, find the new latest salary event from the remaining history
    const remainingHistory = await getEmployeeHistory(employeeId);
    const latestSalaryEvent = remainingHistory
        .filter(e => salaryEventTypes.includes(e.eventType as any))
        .sort((a, b) => parseISO(b.effectiveDate).getTime() - parseISO(a.effectiveDate).getTime())[0];

    const employeeDocRef = doc(db, 'employees', employeeId);
    let salaryUpdates: Partial<Employe> = {};

    if (latestSalaryEvent && latestSalaryEvent.details) {
        // Revert to the state defined in the new latest event
        const fieldsToUpdate = [
            'baseSalary', 'indemniteTransportImposable', 'indemniteSujetion',
            'indemniteCommunication', 'indemniteRepresentation', 'indemniteResponsabilite',
            'indemniteLogement', 'transportNonImposable', 'primeAnciennete'
        ];
        fieldsToUpdate.forEach(field => {
            if (latestSalaryEvent.details![field] !== undefined) {
                (salaryUpdates as any)[field] = Number(latestSalaryEvent.details![field]);
            }
        });

    } else {
        // No salary events left, revert to the "previous" state stored in the deleted event
        if (eventToDelete.details) {
            const fieldsToRevert: Partial<Record<keyof Employe, string>> = {
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

            (Object.keys(fieldsToRevert) as (keyof Employe)[]).forEach((key) => {
                const prevKey = fieldsToRevert[key];
                if (prevKey && eventToDelete.details![prevKey] !== undefined) {
                    (salaryUpdates as any)[key] = eventToDelete.details![prevKey];
                }
            });

        }
    }

    if (Object.keys(salaryUpdates).length > 0) {
        await updateDoc(employeeDocRef, salaryUpdates);
    }
}
