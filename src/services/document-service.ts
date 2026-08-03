import { db } from '@/lib/firebase';
import { doc, getDoc, runTransaction } from '@/lib/firebase';

function normalizeType(documentType: string): string {
    return 'doc_' + documentType
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

/**
 * Gets the current document number (last used + 1) without incrementing it in the database.
 */
export async function getCurrentDocumentNumber(documentType: string): Promise<number> {
    const counterId = normalizeType(documentType);
    const counterRef = doc(db, 'counters', counterId);
    
    try {
        const docSnap = await getDoc(counterRef);
        if (docSnap.exists()) {
            return docSnap.data().lastNumber + 1;
        }
        return 1;
    } catch (error) {
        console.error(`[DocumentService] Error getting current number for ${documentType}:`, error);
        return 1;
    }
}

/**
 * Gets the next document number and increments it in the database via transaction.
 */
export async function getNextDocumentNumber(documentType: string): Promise<number> {
    const counterId = normalizeType(documentType);
    const counterRef = doc(db, 'counters', counterId);

    try {
        const newNumber = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists()) {
                const startNumber = 1;
                transaction.set(counterRef, { lastNumber: startNumber });
                return startNumber;
            }
            const newLastNumber = counterDoc.data().lastNumber + 1;
            transaction.update(counterRef, { lastNumber: newLastNumber });
            return newLastNumber;
        });
        return newNumber;
    } catch (error) {
        console.error(`[DocumentService] Error incrementing number for ${documentType}:`, error);
        throw error;
    }
}
