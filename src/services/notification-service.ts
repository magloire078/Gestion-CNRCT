

import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, Unsubscribe, query, where, orderBy, writeBatch, doc, getDocs, updateDoc, type QueryDocumentSnapshot, type DocumentData } from '@/lib/firebase';
import type { Notification, Employe } from '@/lib/data';
import { getEmployees } from './employee-service';
import { parseISO, differenceInMonths } from 'date-fns';

const notificationsCollection = collection(db, 'notifications');
const usersCollection = collection(db, 'users');

async function createNotification(data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) {

    // If userId is a special keyword like 'manager', find all users with that role
    if (data.userId === 'manager') {
        const managerQuery = query(usersCollection, where('roleId', 'in', ['manager-rh', 'administrateur', 'super-admin']));
        const managerSnapshot = await getDocs(managerQuery);

        const batch = writeBatch(db);
        managerSnapshot.forEach(managerDoc => {
            const notificationData = {
                ...data,
                userId: managerDoc.id, // Target specific manager user ID
                isRead: false,
                createdAt: new Date().toISOString()
            };
            const newNotifRef = doc(collection(db, 'notifications'));
            batch.set(newNotifRef, notificationData);
        });
        await batch.commit();

    } else {
        const notificationData = {
            ...data,
            isRead: false,
            createdAt: new Date().toISOString()
        };
        await addDoc(notificationsCollection, notificationData);
    }
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
        if (snapshot.empty && notificationMap.size === 0) {
            callback([]);
            return;
        }
        snapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            notificationMap.set(doc.id, { id: doc.id, ...doc.data() } as Notification);
        });
        updateCombinedAndSort();
    }, (error) => {
        console.error(`[NotificationService] Error subscripting to user notifications for ${userId}:`, error);
        onError(error);
    });

    const unsubAll = onSnapshot(qAll, (snapshot) => {
        if (snapshot.empty && notificationMap.size === 0) {
            // Only trigger if map is empty to avoid clearing user notifications
            if (notificationMap.size === 0) callback([]);
            return;
        }
        snapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            notificationMap.set(doc.id, { id: doc.id, ...doc.data() } as Notification);
        });
        updateCombinedAndSort();
    }, (error) => {
        console.error(`[NotificationService] Error subscripting to global notifications:`, error);
        // Don't necessarily break the whole subscription if global alerts fail
        // but still notify the UI via onError
        onError(error);
    });

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

    } catch (error) {
        console.error("Failed to commit retirement notifications batch:", error);
    }
}
export { createNotification };
