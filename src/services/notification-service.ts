
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
