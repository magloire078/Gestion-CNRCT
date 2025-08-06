
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import type { Evaluation } from '@/lib/data';

export function subscribeToEvaluations(
    callback: (evaluations: Evaluation[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const evaluationsCollection = collection(db, 'evaluations');
    const q = query(evaluationsCollection, orderBy("evaluationDate", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const evaluationList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Evaluation));
        callback(evaluationList);
    }, (error) => {
        console.error("Error subscribing to evaluations:", error);
        onError(error);
    });

    return unsubscribe;
}

export async function getEvaluations(): Promise<Evaluation[]> {
  const evaluationsCollection = collection(db, 'evaluations');
  const evaluationSnapshot = await getDocs(query(evaluationsCollection, orderBy("evaluationDate", "desc")));
  const evaluationList = evaluationSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Evaluation));
  return evaluationList;
}

export async function addEvaluation(evaluationDataToAdd: Omit<Evaluation, 'id'>): Promise<Evaluation> {
    const evaluationsCollection = collection(db, 'evaluations');
    const docRef = await addDoc(evaluationsCollection, evaluationDataToAdd);
    const newEvaluation: Evaluation = { 
        id: docRef.id, 
        ...evaluationDataToAdd 
    };
    return newEvaluation;
}

export async function updateEvaluation(evaluationId: string, dataToUpdate: Partial<Evaluation>): Promise<void> {
    const evaluationRef = doc(db, 'evaluations', evaluationId);
    await updateDoc(evaluationRef, dataToUpdate);
}
