import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, getDoc, deleteDoc } from '@/lib/firebase';
import type { Mail, MailComment, MailStatus } from '@/lib/data';
import { db } from '@/lib/firebase';

const mailsCollection = collection(db, 'mails');

export function subscribeToMails(
    callback: (mails: Mail[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(mailsCollection, orderBy("entryDate", "desc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const mails = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            } as Mail));
            callback(mails);
        },
        (error) => {
            console.error("Error subscribing to mails:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getMails(): Promise<Mail[]> {
    try {
        const snapshot = await getDocs(query(mailsCollection, orderBy("entryDate", "desc")));
        const data = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        } as Mail));

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('cnrct_cached_mails', JSON.stringify(data));
            } catch (e) {
                console.warn('[MailService] Failed to save mails to localStorage:', e);
            }
        }
        return data;
    } catch (error) {
        console.error('[MailService] getMails failed:', error);
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('cnrct_cached_mails');
            if (cached) {
                console.warn('[MailService] Returning cached mails from localStorage due to query failure');
                return JSON.parse(cached);
            }
        }
        throw error;
    }
}

export async function getMail(id: string): Promise<Mail | null> {
    if (!id) return null;
    const mailDocRef = doc(db, 'mails', id);
    const docSnap = await getDoc(mailDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Mail;
    }
    return null;
}

function cleanUndefined(obj: any): any {
    const cleaned = { ...obj };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === undefined) {
            delete cleaned[key];
        }
    });
    return cleaned;
}

export async function addMail(mailDataToAdd: Omit<Mail, 'id' | 'trackingId'>): Promise<Mail> {
    // Generate unique tracking ID: PREFIX-YYYY-[Random 4 digits]
    const prefix = mailDataToAdd.type === 'Arrivant' ? 'ARR' : mailDataToAdd.type === 'Départ' ? 'DEP' : 'INT';
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const trackingId = `${prefix}-${year}-${random}`;
    
    const now = new Date().toISOString();
    const cleanedData = cleanUndefined(mailDataToAdd);
    const docRef = await addDoc(mailsCollection, {
        ...cleanedData,
        trackingId,
        createdAt: now,
        updatedAt: now
    });
    return { id: docRef.id, ...mailDataToAdd, trackingId, createdAt: now, updatedAt: now };
}

export async function updateMail(id: string, dataToUpdate: Partial<Omit<Mail, 'id'>>): Promise<void> {
    const mailDocRef = doc(db, 'mails', id);
    const now = new Date().toISOString();
    const cleanedData = cleanUndefined(dataToUpdate);
    await updateDoc(mailDocRef, {
        ...cleanedData,
        updatedAt: now
    });
}

export async function deleteMail(id: string): Promise<void> {
    const mailDocRef = doc(db, 'mails', id);
    await deleteDoc(mailDocRef);
}

export async function addMailComment(mailId: string, comment: Omit<MailComment, 'id'>): Promise<void> {
    const { arrayUnion } = await import('@/lib/firebase');
    const mailDocRef = doc(db, 'mails', mailId);
    const newComment = {
        id: Math.random().toString(36).substring(2, 9),
        ...comment,
        date: comment.date || new Date().toISOString()
    };
    await updateDoc(mailDocRef, {
        comments: arrayUnion(newComment),
        updatedAt: new Date().toISOString()
    });
}

/**
 * Updates the status of a mail and adds a system comment.
 */
export async function updateMailStatus(id: string, status: MailStatus, author: string, reason?: string): Promise<void> {
    const { arrayUnion } = await import('@/lib/firebase');
    const mailDocRef = doc(db, 'mails', id);
    
    const updateData: any = { status };
    const now = new Date().toISOString();

    const systemComment: MailComment = {
        id: Math.random().toString(36).substring(2, 9),
        date: now,
        author: "Système",
        content: `Statut modifié en : ${status}. ${author ? `Par : ${author}` : ''}${reason ? ` (Motif : ${reason})` : ''}`,
        type: 'Statut'
    };

    await updateDoc(mailDocRef, {
        ...updateData,
        updatedAt: now,
        comments: arrayUnion(systemComment)
    });
}
