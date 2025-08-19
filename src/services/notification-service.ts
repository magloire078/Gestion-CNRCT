
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
    const q = query(
        notificationsCollection, 
        where('userId', 'in', ['all', userId]),
        orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Notification));
        callback(notifications);
    }, onError);

    return unsubscribe;
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
