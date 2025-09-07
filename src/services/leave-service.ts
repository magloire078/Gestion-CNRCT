

import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, Unsubscribe, query, orderBy, getDoc, where } from 'firebase/firestore';
import type { Leave, User } from '@/lib/data';
import { db } from '@/lib/firebase';
import { createNotification } from './notification-service';
import { parseISO, eachDayOfInterval, getDay } from 'date-fns';


const leavesCollection = collection(db, 'leaves');
const usersCollection = collection(db, 'users');


/**
 * Finds a user ID based on the employee name.
 * This is not a very robust method and should be used with caution.
 * It's better to store userId directly on the leave request if possible.
 * @param employeeName The name of the employee.
 * @returns The user ID string or null if not found.
 */
async function findUserIdByName(employeeName: string): Promise<string | null> {
    try {
        const userQuery = query(usersCollection, where("name", "==", employeeName));
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id;
        }
        return null;
    } catch (error) {
        console.error("Error finding user by name:", error);
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
            const leaves = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Leave));
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
  const q = query(leavesCollection, orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Leave));
}

export async function addLeave(leaveDataToAdd: Omit<Leave, 'id' | 'status'>): Promise<Leave> {
    const newLeaveData = {
        ...leaveDataToAdd,
        status: 'En attente'
    };
    const docRef = await addDoc(leavesCollection, newLeaveData);
    
    // Create a notification for admins/managers
    await createNotification({
        userId: 'all', // Or target specific manager/admin roles
        title: 'Nouvelle demande de congé',
        description: `${leaveDataToAdd.employee} a demandé un ${leaveDataToAdd.type}.`,
        href: `/leave`,
    });
    
    return { id: docRef.id, ...newLeaveData };
}

export async function updateLeave(id: string, dataToUpdate: Partial<Omit<Leave, 'id' | 'status'>>): Promise<void> {
    const leaveDocRef = doc(db, 'leaves', id);
    const cleanData = JSON.parse(JSON.stringify(dataToUpdate));
    await updateDoc(leaveDocRef, cleanData);
}


export async function updateLeaveStatus(id: string, status: 'Approuvé' | 'Rejeté'): Promise<void> {
    const leaveDocRef = doc(db, 'leaves', id);
    const leaveDoc = await getDoc(leaveDocRef);
    if (!leaveDoc.exists()) return;

    const leaveData = leaveDoc.data() as Leave;

    await updateDoc(leaveDocRef, { status });
    
    // Find the employee's user ID to send them a notification
    const employeeUserId = await findUserIdByName(leaveData.employee);

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
