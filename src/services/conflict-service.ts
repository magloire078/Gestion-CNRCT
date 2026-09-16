

import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, getDoc, deleteDoc } from '@/lib/firebase';
import type { Conflict, ConflictComment, ConflictStatus } from '@/lib/data';
import { db } from '@/lib/firebase';
import { createNotification } from './notification-service';

const conflictsCollection = collection(db, 'conflicts');

export function subscribeToConflicts(
    callback: (conflicts: Conflict[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(conflictsCollection, orderBy("reportedDate", "desc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const conflicts = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            } as Conflict));
            callback(conflicts);
        },
        (error) => {
            console.error("Error subscribing to conflicts:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getConflicts(): Promise<Conflict[]> {
    try {
        const snapshot = await getDocs(query(conflictsCollection, orderBy("reportedDate", "desc")));
        const data = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        } as Conflict));

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('cnrct_cached_conflicts', JSON.stringify(data));
            } catch (e) {
                console.warn('[ConflictService] Failed to save conflicts to localStorage:', e);
            }
        }
        return data;
    } catch (error) {
        console.error('[ConflictService] getConflicts failed:', error);
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('cnrct_cached_conflicts');
            if (cached) {
                console.warn('[ConflictService] Returning cached conflicts from localStorage due to query failure');
                return JSON.parse(cached);
            }
        }
        throw error;
    }
}

export async function getConflict(id: string): Promise<Conflict | null> {
    if (!id) return null;
    const conflictDocRef = doc(db, 'conflicts', id);
    const docSnap = await getDoc(conflictDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Conflict;
    }
    return null;
}

/**
 * Réservé aux agents authentifiés : les règles Firestore refusent la lecture
 * de /conflicts aux visiteurs anonymes. Pour le suivi citoyen public, passer
 * par trackConflictPublicly().
 */
export async function getConflictByTrackingId(trackingId: string): Promise<Conflict | null> {
    if (!trackingId) return null;
    const { where } = await import('@/lib/firebase');
    const q = query(conflictsCollection, where("trackingId", "==", trackingId.toUpperCase()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Conflict;
    }
    return null;
}

/** Sous-ensemble non identifiant renvoyé au citoyen sur le suivi public. */
export type PublicConflictStatus = {
    trackingId: string;
    status: ConflictStatus;
    type: string;
    reportedDate: string;
    resolutionDate: string | null;
};

export async function trackConflictPublicly(trackingId: string): Promise<PublicConflictStatus | null> {
    if (!trackingId) return null;

    const headers: Record<string, string> = {};
    try {
        const { getToken } = await import('firebase/app-check');
        const { appCheck } = await import('@/lib/firebase');
        if (appCheck) {
            const appCheckToken = await getToken(appCheck, false);
            headers['X-Firebase-AppCheck'] = appCheckToken.token;
        }
    } catch {
        console.warn('[ConflictService] AppCheck indisponible pour le suivi public');
    }

    const response = await fetch(
        `/api/mgp/track?trackingId=${encodeURIComponent(trackingId.trim().toUpperCase())}`,
        { headers }
    );

    if (response.status === 429) {
        throw new Error('Trop de tentatives. Veuillez réessayer dans une minute.');
    }
    if (!response.ok) {
        throw new Error('La recherche a échoué. Veuillez réessayer.');
    }

    const data = await response.json();
    return data.found ? (data as PublicConflictStatus) : null;
}


// 32 caractères = 5 bits chacun, donc un masque sur 0x1F tire uniformément
// sans biais de modulo. I et O sont exclus pour éviter la confusion à la
// lecture d'un récépissé papier (1 et 0 ne font pas partie de l'alphabet).
const TRACKING_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const TRACKING_CODE_LENGTH = 6;

function generateTrackingCode(): string {
    const bytes = new Uint8Array(TRACKING_CODE_LENGTH);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => TRACKING_ALPHABET[b & 0x1f]).join('');
}

/**
 * Le numéro figure sur le récépissé remis au citoyen et sert de clé de
 * consultation publique : une collision afficherait le dossier d'autrui.
 * L'ancien format à 4 chiffres n'offrait que 9000 valeurs par an, soit une
 * collision quasi certaine passé une centaine de dossiers.
 */
async function generateUniqueTrackingId(): Promise<string> {
    const year = new Date().getFullYear();
    const { where } = await import('@/lib/firebase');

    for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = `CNRCT-${year}-${generateTrackingCode()}`;
        const existing = await getDocs(
            query(conflictsCollection, where('trackingId', '==', candidate))
        );
        if (existing.empty) return candidate;
    }
    throw new Error("Impossible de générer un numéro de suivi unique. Veuillez réessayer.");
}

export async function addConflict(conflictDataToAdd: Omit<Conflict, 'id'>): Promise<Conflict> {
    const trackingId = await generateUniqueTrackingId();

    const docRef = await addDoc(conflictsCollection, {
        ...conflictDataToAdd,
        trackingId,
        createdAt: new Date().toISOString()
    });

    createNotification({
        userId: 'manager',
        title: 'Nouveau conflit déclaré',
        description: `Conflit ${trackingId} : ${conflictDataToAdd.type} à ${conflictDataToAdd.village}`,
        href: `/conflicts/${docRef.id}`
    }).catch(e => console.warn('Failed to notify about new conflict', e));

    return { id: docRef.id, ...conflictDataToAdd, trackingId };
}

export async function updateConflict(id: string, dataToUpdate: Partial<Omit<Conflict, 'id'>>): Promise<void> {
    const conflictDocRef = doc(db, 'conflicts', id);
    await updateDoc(conflictDocRef, dataToUpdate);
}

export async function deleteConflict(id: string): Promise<void> {
    const conflictDocRef = doc(db, 'conflicts', id);
    await deleteDoc(conflictDocRef);
}

export async function addConflictComment(conflictId: string, comment: Omit<ConflictComment, 'id'>): Promise<void> {
    const { arrayUnion } = await import('@/lib/firebase');
    const conflictDocRef = doc(db, 'conflicts', conflictId);
    const newComment = {
        id: Math.random().toString(36).substring(2, 9),
        ...comment,
        date: comment.date || new Date().toISOString()
    };
    await updateDoc(conflictDocRef, {
        comments: arrayUnion(newComment)
    });
}

export async function batchAddConflicts(conflicts: Omit<Conflict, 'id'>[]): Promise<number> {
    const { writeBatch, doc } = await import('@/lib/firebase');
    const batch = writeBatch(db);
    
    conflicts.forEach(conflict => {
        const newDocRef = doc(collection(db, 'conflicts'));
        batch.set(newDocRef, {
            ...conflict,
            createdAt: new Date().toISOString()
        });
    });
    
    await batch.commit();
    return conflicts.length;
}

/**
 * Updates the status of a conflict and adds a system comment.
 */
export async function updateConflictStatus(id: string, status: ConflictStatus, author: string, resolutionDetails?: string): Promise<void> {
    const { arrayUnion } = await import('@/lib/firebase');
    const conflictDocRef = doc(db, 'conflicts', id);
    
    const updateData: any = { status };
    if (resolutionDetails) {
        updateData.resolutionDetails = resolutionDetails;
        updateData.resolutionDate = new Date().toISOString();
    }

    const systemComment: ConflictComment = {
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString(),
        author: "Système",
        content: `Statut modifié en : ${status}. ${author ? `Par : ${author}` : ''}`,
        type: 'Résolution'
    };

    await updateDoc(conflictDocRef, {
        ...updateData,
        comments: arrayUnion(systemComment)
    });

    createNotification({
        userId: 'manager',
        title: 'Statut de conflit modifié',
        description: `Le conflit a été passé en statut : ${status} par ${author}`,
        href: `/conflicts/${id}`
    }).catch(e => console.warn('Failed to notify about conflict status', e));
}
