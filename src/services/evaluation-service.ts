
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import type { Evaluation } from '@/lib/data';

const evaluationsCollection = collection(db, 'evaluations');

export function subscribeToEvaluations(
    callback: (evaluations: Evaluation[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(evaluationsCollection, orderBy("evaluationDate", "desc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const evaluations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Evaluation));
            callback(evaluations);
        },
        (error) => {
            console.error("Error subscribing to evaluations:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getEvaluations(): Promise<Evaluation[]> {
    const snapshot = await getDocs(query(evaluationsCollection, orderBy("evaluationDate", "desc")));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Evaluation));
}

export async function getEvaluation(id: string): Promise<Evaluation | null> {
    if (!id) return null;
    const evalDocRef = doc(db, 'evaluations', id);
    const docSnap = await getDoc(evalDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Evaluation;
    }
    return null;
}

export async function addEvaluation(evaluationDataToAdd: Omit<Evaluation, 'id'>): Promise<Evaluation> {
    const docRef = await addDoc(evaluationsCollection, evaluationDataToAdd);
    return { id: docRef.id, ...evaluationDataToAdd };
}

export async function updateEvaluation(evaluationId: string, dataToUpdate: Partial<Evaluation>): Promise<void> {
    const evalDocRef = doc(db, 'evaluations', evaluationId);
    await updateDoc(evalDocRef, dataToUpdate);
}
