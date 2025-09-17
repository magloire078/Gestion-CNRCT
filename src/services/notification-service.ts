

import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, Unsubscribe, query, where, orderBy, writeBatch, doc, getDocs, updateDoc } from 'firebase/firestore';
import type { Notification, Employe } from '@/lib/data';
import { getEmployees } from './employee-service';
import { parseISO, differenceInMonths } from 'date-fns';

const notificationsCollection = collection(db, 'notifications');

export async function createNotification(data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) {
    const notificationData = {
        ...data,
        isRead: false,
        createdAt: new Date().toISOString()
    };
    await addDoc(notificationsCollection, notificationData);
}

export function subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const notificationMap = new Map<string, Notification>();

    const qUser = query(
        notificationsCollection, 
        where('userId', '==', userId)
    );
    
    const qAll = query(
        notificationsCollection,
        where('userId', '==', 'all')
    );

    const updateCombinedAndSort = () => {
        const allNotifications = Array.from(notificationMap.values());
        allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(allNotifications);
    };

    const unsubUser = onSnapshot(qUser, (snapshot) => {
        snapshot.docs.forEach(doc => {
            notificationMap.set(doc.id, { id: doc.id, ...doc.data() } as Notification);
        });
        updateCombinedAndSort();
    }, onError);

    const unsubAll = onSnapshot(qAll, (snapshot) => {
         snapshot.docs.forEach(doc => {
            notificationMap.set(doc.id, { id: doc.id, ...doc.data() } as Notification);
        });
         updateCombinedAndSort();
    }, onError);

    return () => {
        unsubUser();
        unsubAll();
    };
}


export async function markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;

    const batch = writeBatch(db);
    notificationIds.forEach(id => {
        const docRef = doc(db, 'notifications', id);
        batch.update(docRef, { isRead: true });
    });
    await batch.commit();
}


/**
 * Checks for employees nearing retirement and sends notifications.
 * This function is designed to be called periodically (e.g., daily by a cron job or on app load).
 */
export async function checkAndNotifyForUpcomingRetirements() {
    console.log("Checking for upcoming retirements...");
    const employees = await getEmployees();
    const today = new Date();
    
    // Find all Admin and HR Manager users to notify them
    // This is a placeholder. In a real app, you would query users by role.
    const adminUserId = 'all'; // Notify all admins/managers

    const batch = writeBatch(db);

    for (const employee of employees) {
        if (employee.status !== 'Actif' || !employee.Date_Naissance || employee.retirementNotificationSent) {
            continue;
        }

        try {
            const birthDate = parseISO(employee.Date_Naissance);
            const retirementDate = new Date(birthDate.getFullYear() + 60, birthDate.getMonth(), birthDate.getDate());
            
            const monthsUntilRetirement = differenceInMonths(retirementDate, today);

            if (monthsUntilRetirement <= 6 && monthsUntilRetirement >= 0) {
                console.log(`Employee ${employee.name} is retiring soon. Sending notification.`);
                
                // Create the notification data
                const notificationData = {
                    userId: adminUserId,
                    title: 'Départ à la retraite imminent',
                    description: `L'employé ${employee.name} prendra sa retraite le ${retirementDate.toLocaleDateString('fr-FR')}.`,
                    href: `/employees/${employee.id}`,
                    isRead: false,
                    createdAt: new Date().toISOString()
                };
                
                const newNotifRef = doc(collection(db, 'notifications'));
                batch.set(newNotifRef, notificationData);

                // Mark the employee as notified to avoid duplicate notifications
                const employeeDocRef = doc(db, 'employees', employee.id);
                batch.update(employeeDocRef, { retirementNotificationSent: true });
            }
        } catch (error) {
            console.error(`Could not process retirement for employee ${employee.name} (ID: ${employee.id}):`, error);
        }
    }

    try {
        await batch.commit();
        console.log("Retirement notification check complete.");
    } catch (error) {
        console.error("Failed to commit retirement notifications batch:", error);
    }
}

    