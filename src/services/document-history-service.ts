import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, query, orderBy } from '@/lib/firebase';
import type { GeneratedDocument } from '@/lib/data';

const documentsCollection = collection(db, 'generated_documents');

export async function saveGeneratedDocument(documentData: Omit<GeneratedDocument, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(documentsCollection, documentData);
        return docRef.id;
    } catch (error) {
        console.error("[DocumentHistoryService] Error saving generated document:", error);
        throw error;
    }
}

export async function getGeneratedDocuments(): Promise<GeneratedDocument[]> {
    try {
        const q = query(documentsCollection, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as GeneratedDocument[];
    } catch (error) {
        console.error("[DocumentHistoryService] Error getting generated documents:", error);
        return [];
    }
}

export async function deleteGeneratedDocument(id: string): Promise<void> {
    try {
        const docRef = doc(db, 'generated_documents', id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("[DocumentHistoryService] Error deleting generated document:", error);
        throw error;
    }
}
