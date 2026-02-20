
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, Unsubscribe, query, orderBy } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Document } from '@/lib/data';

const documentsCollection = collection(db, 'repository');

/**
 * Uploads a document to Firebase Storage and creates a corresponding entry in Firestore.
 * @param file The file to upload.
 * @param uploaderId The ID of the user uploading the file.
 * @returns A promise that resolves with the new Document object.
 */
export async function uploadDocument(file: File, uploaderId: string): Promise<Document> {
    const storageRef = ref(storage, `repository/${new Date().getTime()}_${file.name}`);
    
    // Upload file to storage
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Create document metadata in Firestore
    const docData: Omit<Document, 'id'> = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        storageUrl: downloadURL,
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
