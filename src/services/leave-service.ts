

import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, Unsubscribe, query, orderBy, getDoc, where } from '@/lib/firebase';
import type { Leave, User, Employe } from '@/lib/data';
import { db } from '@/lib/firebase';
import { leaveSchema } from '@/lib/schemas/leave-schema';
import { createNotification } from './notification-service';
import { parseISO, eachDayOfInterval, getDay } from 'date-fns';
import { getEmployee } from './employee-service';
import { FirestorePermissionError } from '@/lib/errors';


const leavesCollection = collection(db, 'leaves');
const usersCollection = collection(db, 'users');


/**
 * Finds a user ID based on the employee's ID.
 * @param employeeId The ID of the employee.
 * @returns The user ID string or null if not found.
 */
async function findUserIdByEmployeeId(employeeId: string): Promise<string | null> {
    if (!employeeId) return null;
    try {
        const userQuery = query(usersCollection, where("employeeId", "==", employeeId));
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id;
        }

        // Fallback: try to find by name if no direct link
        const employee = await getEmployee(employeeId);
        if (employee?.name) {
            const nameQuery = query(usersCollection, where("name", "==", employee.name));
            const nameSnapshot = await getDocs(nameQuery);
            if (!nameSnapshot.empty) {
                return nameSnapshot.docs[0].id;
            }
        }
        return null;
    } catch (error) {
        console.error("Error finding user by employee ID:", error);
        return null;
    }
}


export function subscribeToLeaves(
    callback: (leaves: Leave[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(leavesCollection, orderBy("startDate", "desc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const leaves = snapshot.docs.map(doc => {
                const data = { id: doc.id, ...doc.data() };
                const result = leaveSchema.safeParse(data);
                if (!result.success) {
                    console.error(`[LeaveService] validation error for ${doc.id}:`, result.error.format());
                    return data as unknown as Leave;
                }
                return result.data as unknown as Leave;
            });
            callback(leaves);
        },
        (error) => {
            console.error("Error subscribing to leaves:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getLeaves(): Promise<Leave[]> {
    try {
        const q = query(leavesCollection, orderBy("startDate", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() };
            const result = leaveSchema.safeParse(data);
            if (!result.success) {
                console.error(`[LeaveService] validation error for ${doc.id}:`, result.error.format());
                return data as unknown as Leave;
            }
            return result.data as unknown as Leave;
        });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission de consulter les congés.", { operation: 'read-all', path: 'leaves' });
        }
        throw error;
    }
}

export async function addLeave(leaveDataToAdd: Omit<Leave, 'id' | 'status'>): Promise<Leave> {
    const newLeaveData = {
        ...leaveDataToAdd,
        status: 'En attente' as const
    };

    try {
        const docRef = await addDoc(leavesCollection, newLeaveData);
        // Create a notification for the relevant manager or HR role
        await createNotification({
            userId: 'manager', // Special keyword to target managers or HR
            title: 'Nouvelle demande de congé',
            description: `${leaveDataToAdd.employee} a demandé un ${leaveDataToAdd.type}.`,
            href: `/leave`, // Direct link to the leave management page
        });

        return { id: docRef.id, ...newLeaveData };
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission de soumettre une demande de congé.", { operation: 'add', path: 'leaves' });
        }
        throw error;
    }
}

export async function updateLeave(id: string, dataToUpdate: Partial<Omit<Leave, 'id' | 'status'>>): Promise<void> {
    const leaveDocRef = doc(db, 'leaves', id);
    const cleanData = JSON.parse(JSON.stringify(dataToUpdate));
    try {
        await updateDoc(leaveDocRef, cleanData as any);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError(`Vous n'avez pas la permission de modifier cette demande de congé.`, { operation: 'update', path: `leaves/${id}` });
        }
        throw error;
    }
}


export async function updateLeaveStatus(id: string, status: 'Approuvé' | 'Rejeté'): Promise<void> {
    const leaveDocRef = doc(db, 'leaves', id);
    const leaveDoc = await getDoc(leaveDocRef);
    if (!leaveDoc.exists()) return;

    const data = { id: leaveDoc.id, ...leaveDoc.data() };
    const result = leaveSchema.safeParse(data);
    if (!result.success) {
        console.error(`[LeaveService] validation error for ${id}:`, result.error.format());
        return;
    }
    const leaveData = result.data as unknown as Leave;

    try {
        await updateDoc(leaveDocRef, { status });

        // Find the employee's user ID to send them a notification
        const employee = (await getDocs(query(collection(db, 'employees'), where("name", "==", leaveData.employee)))).docs[0];
        const employeeUserId = await findUserIdByEmployeeId(employee?.id);


        if (employeeUserId) {
            await createNotification({
                userId: employeeUserId,
                title: `Demande de congé ${status === 'Approuvé' ? 'approuvée' : 'rejetée'}`,
                description: `Votre demande de ${leaveData.type} du ${leaveData.startDate} a été ${status === 'Approuvé' ? 'approuvée' : 'rejetée'}.`,
                href: '/my-space' // Link to their personal space
            });
        } else {
            console.warn(`Could not find user for employee ${leaveData.employee} to send notification.`);
        }
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError(`Vous n'avez pas la permission de changer le statut de cette demande.`, { operation: 'update-status', path: `leaves/${id}` });
        }
        throw error;
    }
}

/**
 * Calculates the remaining leave balance for an employee for the current year.
 * @param employeeLeaves All leave requests for the employee.
 * @returns The number of remaining leave days.
 */
export async function calculateLeaveBalance(employeeLeaves: Leave[]): Promise<number> {
    const ANNUAL_LEAVE_ENTITLEMENT = 26; // Standard leave days per year in many contracts.
    const currentYear = new Date().getFullYear();

    const annualLeavesThisYear = employeeLeaves.filter(l =>
        l.type === "Congé Annuel" &&
        l.status === "Approuvé" &&
        new Date(l.startDate).getFullYear() === currentYear
    );

    const workingDaysTaken = annualLeavesThisYear.reduce((total, leave) => {
        try {
            const start = parseISO(leave.startDate);
            const end = parseISO(leave.endDate);
            const days = eachDayOfInterval({ start, end });
            // Exclude Sundays (0)
            const workDays = days.filter(day => getDay(day) !== 0).length;
            return total + workDays;
        } catch {
            return total;
        }
    }, 0);

    return ANNUAL_LEAVE_ENTITLEMENT - workingDaysTaken;
}
