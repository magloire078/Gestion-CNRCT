import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    increment,
    type Unsubscribe,
    type QuerySnapshot,
    type DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { NewsItem } from '@/types/common';
import { FirestorePermissionError } from '@/lib/errors';

export const newsCollection = collection(db, 'news');

/**
 * Subscribes to published news ordered by creation date (newest first)
 * Used for the intranet homepage feed.
 */
export function subscribeToPublishedNews(
    callback: (news: NewsItem[]) => void,
    onError: (error: Error) => void,
    itemLimit: number = 10
): Unsubscribe {
    const q = query(
        newsCollection,
        where('published', '==', true),
        orderBy('createdAt', 'desc'),
        limit(itemLimit)
    );

    const unsubscribe = onSnapshot(q,
        (snapshot: QuerySnapshot<DocumentData>) => {
            const news: NewsItem[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as NewsItem));
            callback(news);
        },
        (error: any) => {
            console.error("Firestore error in subscribeToPublishedNews:", error);
            if (error.code === 'permission-denied') {
                onError(new FirestorePermissionError("Accès refusé aux actualités.", { query: "publishedNews" }));
            } else {
                onError(error);
            }
        }
    );

    return unsubscribe;
}

/**
 * Subscribes to ALL news (including drafts) for admin management
 */
export function subscribeToAllNewsAdmin(
    callback: (news: NewsItem[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(newsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q,
        (snapshot: QuerySnapshot<DocumentData>) => {
            const news: NewsItem[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as NewsItem));
            callback(news);
        },
        (error: any) => {
            console.error("Firestore error in subscribeToAllNewsAdmin:", error);
            if (error.code === 'permission-denied') {
                onError(new FirestorePermissionError("Accès refusé à la gestion des actualités.", { query: "adminNews" }));
            } else {
                onError(error);
            }
        }
    );

    return unsubscribe;
}

export async function getNewsItem(id: string): Promise<NewsItem | null> {
    const docRef = doc(db, 'news', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as NewsItem;
    }
    return null;
}

export async function createNews(newsData: Omit<NewsItem, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>): Promise<NewsItem> {
    const now = new Date().toISOString();
    const dataToSave = {
        ...newsData,
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
    };

    const docRef = await addDoc(newsCollection, dataToSave);
    return { id: docRef.id, ...dataToSave } as NewsItem;
}

export async function updateNews(id: string, newsData: Partial<NewsItem>): Promise<void> {
    const docRef = doc(db, 'news', id);
    const updateData = {
        ...newsData,
        updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, updateData);
}

export async function deleteNews(id: string): Promise<void> {
    const docRef = doc(db, 'news', id);
    await deleteDoc(docRef);
}

export async function incrementNewsView(id: string): Promise<void> {
    const docRef = doc(db, 'news', id);
    // Small delay and catch block to prevent UI blocking for non-critical update
    try {
        await updateDoc(docRef, {
            viewCount: increment(1)
        });
    } catch (e) {
        console.warn("Failed to increment news view count", e);
    }
}
