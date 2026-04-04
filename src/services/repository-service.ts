
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, Unsubscribe, query, orderBy } from '@/lib/firebase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import type { Document } from '@/lib/data';

const documentsCollection = collection(db, 'repository');

/**
 * Uploads a document to Firebase Storage and creates a corresponding entry in Firestore.
 * @param file The file to upload.
 * @param uploaderId The ID of the user uploading the file.
 * @param metadata Optional metadata for categorization and localization.
 * @returns A promise that resolves with the new Document object.
 */
export async function uploadDocument(
    file: File, 
    uploaderId: string, 
    metadata?: { category?: Document['category'], region?: string }
): Promise<Document> {
    // Upload file to Cloudinary
    const downloadURL = await uploadToCloudinary(file);

    // Create document metadata in Firestore
    const docData: Omit<Document, 'id'> = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        storageUrl: downloadURL,
        category: metadata?.category,
        region: metadata?.region,
    };

    const docRef = await addDoc(documentsCollection, docData);

    return { id: docRef.id, ...docData };
}


/**
 * Subscribes to document changes in the repository.
 * @param callback Function to call with the new list of documents.
 * @param onError Function to call on error.
 * @returns An Unsubscribe function to stop listening to changes.
 */
export function subscribeToDocuments(
    callback: (documents: Document[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(documentsCollection, orderBy("uploadDate", "desc"));

    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const documents = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            } as Document));
            callback(documents);
        },
        (error) => {
            console.error("Error subscribing to repository documents:", error);
            onError(error);
        }
    );

    return unsubscribe;
}

/**
 * Deletes a document from the repository.
 * @param id The ID of the document to delete.
 */
export async function deleteDocument(id: string): Promise<void> {
    const { doc, deleteDoc } = await import('@/lib/firebase');
    const docRef = doc(db, 'repository', id);
    await deleteDoc(docRef);
}

/**
 * Updates a document's metadata in the repository.
 * @param id The ID of the document to update.
 * @param data The partial document data to update.
 */
export async function updateDocument(id: string, data: Partial<Document>): Promise<void> {
    const { doc, updateDoc } = await import('@/lib/firebase');
    const docRef = doc(db, 'repository', id);
    await updateDoc(docRef, data);
}
