
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, Unsubscribe, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import type { Notification } from '@/lib/data';

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
    let allNotifications: Notification[] = [];
    const notificationMap = new Map<string, Notification>();

    const qUser = query(
        notificationsCollection, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    
    const qAll = query(
        notificationsCollection,
        where('userId', '==', 'all'),
        orderBy('createdAt', 'desc')
    );

    const updateUserNotifications = (newNotifs: Notification[]) => {
        newNotifs.forEach(n => notificationMap.set(n.id, n));
        allNotifications = Array.from(notificationMap.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        callback(allNotifications);
    };

    const unsubUser = onSnapshot(qUser, (snapshot) => {
        const userNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        updateUserNotifications(userNotifications);
    }, onError);

    const unsubAll = onSnapshot(qAll, (snapshot) => {
         const allUserNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
         updateUserNotifications(allUserNotifications);
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
