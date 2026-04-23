

import { collection, getDocs, addDoc, query, where, orderBy, doc, updateDoc, deleteDoc, getDoc, writeBatch } from '@/lib/firebase';
import type { EmployeeEvent, Employe } from '@/lib/data';
import { db } from '@/lib/firebase';
import { getEmployee } from './employee-service';
import { getPayslipDetails } from './payslip-details-service';
import { parseISO, isValid, isBefore, isEqual } from 'date-fns';

const salaryEventTypes: EmployeeEvent['eventType'][] = ['Promotion', 'Augmentation au Mérite', 'Ajustement de Marché', 'Revalorisation Salariale', 'Changement de poste', 'Autre'];

/** The salary fields that are tracked in the chain */
const SALARY_FIELDS = [
    'baseSalary', 'indemniteTransportImposable', 'indemniteResponsabilite',
    'indemniteLogement', 'indemniteSujetion', 'indemniteCommunication',
    'indemniteRepresentation', 'transportNonImposable'
] as const;

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
 * Recalculates the entire salary chain for an employee.
 * This ensures all `previous_*` values are consistent and the employee document
 * reflects the state from the chronologically latest salary event.
 *
 * The chain works as follows:
 * - The FIRST chronological salary event's `previous_*` values represent the "origin" salary
 *   (the salary before any event). These are kept as-is.
 * - Each subsequent event's `previous_*` values are set to the NEW salary values
 *   from the event immediately before it in chronological order.
 * - The employee document's salary fields are updated to reflect the LATEST event's values.
 *
 * @param employeeId The ID of the employee whose chain needs recalculation.
 */
export async function recalculateSalaryChain(employeeId: string): Promise<void> {
    const allHistory = await getEmployeeHistory(employeeId);

    // Filter to salary events only and sort by effectiveDate ASCENDING (oldest first)
    const salaryEvents = allHistory
        .filter(event =>
            salaryEventTypes.includes(event.eventType as any) &&
            event.details &&
            isValid(parseISO(event.effectiveDate))
        )
        .sort((a, b) => parseISO(a.effectiveDate).getTime() - parseISO(b.effectiveDate).getTime());

    if (salaryEvents.length === 0) {
        return; // No salary events, nothing to recalculate
    }

    const batch = writeBatch(db);
    let hasChanges = false;

    for (let i = 0; i < salaryEvents.length; i++) {
        const event = salaryEvents[i];
        const eventRef = doc(db, `employees/${employeeId}/history`, event.id);

        if (i === 0) {
            // First event: its previous_* values are the "origin" salary.
            // We keep them as-is — they were set correctly when the first event was created
            // with no prior events existing (or they represent the manually set origin).
            continue;
        }

        // For events after the first: previous_* = the NEW salary values from the preceding event
        const precedingEvent = salaryEvents[i - 1];
        const updatedPreviousValues: Record<string, any> = {};
        let needsUpdate = false;

        for (const field of SALARY_FIELDS) {
            const correctPreviousValue = Number(precedingEvent.details![field] || 0);
            const currentPreviousValue = Number(event.details![`previous_${field}`] || 0);

            updatedPreviousValues[`details.previous_${field}`] = correctPreviousValue;

            if (correctPreviousValue !== currentPreviousValue) {
                needsUpdate = true;
            }
        }

        // Also carry forward employeeHireDate and cnpsEnabled from the first event
        const firstEvent = salaryEvents[0];
        if (firstEvent.details?.employeeHireDate) {
            updatedPreviousValues['details.employeeHireDate'] = firstEvent.details.employeeHireDate;
        }
        if (firstEvent.details?.cnpsEnabled !== undefined) {
            updatedPreviousValues['details.cnpsEnabled'] = firstEvent.details.cnpsEnabled;
        }

        if (needsUpdate) {
            batch.update(eventRef, updatedPreviousValues);
            hasChanges = true;
        }
    }

    // Update the employee document with the values from the LAST (most recent) salary event
    const latestEvent = salaryEvents[salaryEvents.length - 1];
    if (latestEvent.details) {
        const employeeDocRef = doc(db, 'employees', employeeId);
        const employeeUpdates: Partial<Employe> = {};

        for (const field of SALARY_FIELDS) {
            if (latestEvent.details[field] !== undefined) {
                (employeeUpdates as any)[field] = Number(latestEvent.details[field]);
            }
        }

        // Update primeAnciennete if explicitly set
        if (latestEvent.details.primeAnciennete !== undefined) {
            employeeUpdates.primeAnciennete = Number(latestEvent.details.primeAnciennete);
        }

        // Update poste if the latest event is a Promotion with newPoste
        if (latestEvent.eventType === 'Promotion' && latestEvent.details.newPoste) {
            employeeUpdates.poste = latestEvent.details.newPoste;
        }

        // Recalculate grossSalary and netSalary on the employee
        const employee = await getEmployee(employeeId);
        if (employee) {
            const baseSalary = Number(employeeUpdates.baseSalary ?? employee.baseSalary ?? 0);
            const hireDate = employee.dateEmbauche;
            const now = new Date().toISOString().split('T')[0];

            let primeAnciennete = 0;
            if (hireDate && isValid(parseISO(hireDate))) {
                const yearsOfService = Math.floor(
                    (parseISO(now).getTime() - parseISO(hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
                );
                if (yearsOfService >= 2) {
                    const bonusRate = Math.min(25, yearsOfService);
                    primeAnciennete = baseSalary * (bonusRate / 100);
                }
            }

            const otherIndemnities = [
                'indemniteTransportImposable', 'indemniteSujetion', 'indemniteCommunication',
                'indemniteRepresentation', 'indemniteResponsabilite', 'indemniteLogement'
            ].reduce((sum, key) => sum + Number((employeeUpdates as any)[key] ?? (employee as any)[key] ?? 0), 0);

            const brutImposable = baseSalary + primeAnciennete + otherIndemnities;
            const transportNonImposable = Number((employeeUpdates as any).transportNonImposable ?? employee.transportNonImposable ?? 0);
            const cnps = employee.CNPS ? brutImposable * 0.063 : 0;
            const netSalary = brutImposable + transportNonImposable - cnps;

            (employeeUpdates as any).grossSalary = Math.round(brutImposable);
            (employeeUpdates as any).netSalary = Math.round(netSalary);
        }

        if (Object.keys(employeeUpdates).length > 0) {
            batch.update(employeeDocRef, employeeUpdates);
            hasChanges = true;
        }
    }

    if (hasChanges) {
        await batch.commit();
    }
}

/**
 * Adds a new event to an employee's professional history.
 * After adding, the entire salary chain is recalculated to ensure consistency.
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
        // Get existing salary events sorted chronologically
        const history = await getEmployeeHistory(employee.id);
        const salaryEvents = history
            .filter(event =>
                salaryEventTypes.includes(event.eventType as any) &&
                event.details &&
                isValid(parseISO(event.effectiveDate))
            )
            .sort((a, b) => parseISO(a.effectiveDate).getTime() - parseISO(b.effectiveDate).getTime());

        // Find the event that would be immediately BEFORE this new event chronologically
        const precedingEvent = salaryEvents
            .filter(event => isBefore(parseISO(event.effectiveDate), parseISO(eventData.effectiveDate)))
            .sort((a, b) => parseISO(b.effectiveDate).getTime() - parseISO(a.effectiveDate).getTime())[0];

        // Determine the base values for previous_* fields:
        // If there's a preceding event, use its NEW salary values
        // Otherwise, use the employee's current fields (which represent the origin salary if no events exist)
        let baseValues: Record<string, any>;

        if (precedingEvent?.details) {
            // Use the salary values from the preceding event
            baseValues = {};
            for (const field of SALARY_FIELDS) {
                baseValues[field] = Number(precedingEvent.details[field] || 0);
            }
        } else {
            // No preceding event — this is the new first event.
            // Use the employee's raw salary fields as the "origin" salary.
            baseValues = {
                baseSalary: employee.baseSalary || 0,
                indemniteTransportImposable: employee.indemniteTransportImposable || 0,
                indemniteResponsabilite: employee.indemniteResponsabilite || 0,
                indemniteLogement: employee.indemniteLogement || 0,
                indemniteSujetion: employee.indemniteSujetion || 0,
                indemniteCommunication: employee.indemniteCommunication || 0,
                indemniteRepresentation: employee.indemniteRepresentation || 0,
                transportNonImposable: employee.transportNonImposable || 0,
                primeAnciennete: employee.primeAnciennete || 0,
            };
        }

        const previousValues: Record<string, any> = {};
        for (const field of SALARY_FIELDS) {
            previousValues[`previous_${field}`] = baseValues[field] || 0;
        }
        previousValues['previous_primeAnciennete'] = baseValues.primeAnciennete || 0;
        previousValues['employeeHireDate'] = employee.dateEmbauche;
        previousValues['cnpsEnabled'] = employee.CNPS;

        finalDetails = {
            ...finalDetails,
            ...previousValues,
        };
    }

    const finalEventData = { ...eventData, details: finalDetails };

    const docRef = await addDoc(historyCollection, finalEventData);

    // Recalculate the entire chain to ensure consistency
    // This will fix previous_* for events that come AFTER this new event
    // and update the employee document with the latest event's values
    if (isSalaryEvent) {
        await recalculateSalaryChain(employeeId);
    }

    return {
        id: docRef.id,
        employeeId,
        ...finalEventData
    };
}


/**
 * Updates an existing event in an employee's professional history.
 * After updating, the entire salary chain is recalculated.
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

    // Recalculate the entire chain after any salary event update
    if (isSalaryEvent) {
        await recalculateSalaryChain(employeeId);
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
 * After deletion, the entire salary chain is recalculated.
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

    // Delete the event first
    await deleteDoc(eventDocRef);

    if (!isSalaryEvent) {
        return; // Nothing more to do if it wasn't a salary event
    }

    // Check if there are remaining salary events
    const remainingHistory = await getEmployeeHistory(employeeId);
    const remainingSalaryEvents = remainingHistory
        .filter(e => salaryEventTypes.includes(e.eventType as any));

    if (remainingSalaryEvents.length > 0) {
        // Recalculate the chain with the remaining events
        await recalculateSalaryChain(employeeId);
    } else {
        // No salary events left — revert to the "origin" salary stored in the deleted event
        if (eventToDelete.details) {
            const employeeDocRef = doc(db, 'employees', employeeId);
            const salaryUpdates: Partial<Employe> = {};

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

            if (Object.keys(salaryUpdates).length > 0) {
                await updateDoc(employeeDocRef, salaryUpdates);
            }
        }
    }
}
