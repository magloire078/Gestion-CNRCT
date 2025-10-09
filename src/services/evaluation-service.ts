

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import type { Evaluation, Goal } from '@/lib/data';
import { createNotification } from './notification-service';

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
        const data = docSnap.data();
        return { 
            id: docSnap.id,
            ...data,
            scores: data.scores || {}, // Ensure scores is always an object
            goals: data.goals || [], // Ensure goals is always an array
            employeeComments: data.employeeComments || '', // Ensure comments exist
        } as Evaluation;
    }
    return null;
}

export async function addEvaluation(evaluationDataToAdd: Omit<Evaluation, 'id'>): Promise<Evaluation> {
    const docRef = await addDoc(evaluationsCollection, evaluationDataToAdd);

    await createNotification({
        userId: evaluationDataToAdd.managerId,
        title: 'Nouvelle Évaluation Créée',
        description: `Une nouvelle évaluation pour ${evaluationDataToAdd.employeeName} est prête à être remplie.`,
        href: `/evaluations/${docRef.id}`
    });

    return { id: docRef.id, ...evaluationDataToAdd };
}

export async function updateEvaluation(evaluationId: string, dataToUpdate: Partial<Evaluation>): Promise<void> {
    const evalDocRef = doc(db, 'evaluations', evaluationId);
    
    // Create a clean object with only the fields to update
    const updatePayload: Partial<Evaluation> = {};
    if (dataToUpdate.strengths !== undefined) updatePayload.strengths = dataToUpdate.strengths;
    if (dataToUpdate.areasForImprovement !== undefined) updatePayload.areasForImprovement = dataToUpdate.areasForImprovement;
    if (dataToUpdate.managerComments !== undefined) updatePayload.managerComments = dataToUpdate.managerComments;
    if (dataToUpdate.employeeComments !== undefined) updatePayload.employeeComments = dataToUpdate.employeeComments;
    if (dataToUpdate.scores !== undefined) updatePayload.scores = dataToUpdate.scores;
    if (dataToUpdate.goals !== undefined) updatePayload.goals = dataToUpdate.goals;
    if (dataToUpdate.status !== undefined) updatePayload.status = dataToUpdate.status;

    await updateDoc(evalDocRef, updatePayload);
    
    // Send notifications based on status change
    if (dataToUpdate.status) {
        const currentEval = await getEvaluation(evaluationId);
        if(!currentEval) return;

        if (dataToUpdate.status === 'Pending Employee Sign-off') {
             await createNotification({
                userId: currentEval.employeeId,
                title: 'Évaluation Prête',
                description: `Votre évaluation de performance pour la période ${currentEval.reviewPeriod} est prête pour vos commentaires.`,
                href: `/evaluations/${evaluationId}`
            });
        } else if (dataToUpdate.status === 'Completed') {
             await createNotification({
                userId: currentEval.employeeId,
                title: 'Évaluation Finalisée',
                description: `Votre évaluation de performance pour la période ${currentEval.reviewPeriod} a été finalisée.`,
                href: `/evaluations/${evaluationId}`
            });
             await createNotification({
                userId: currentEval.managerId,
                title: 'Évaluation Finalisée',
                description: `L'évaluation de ${currentEval.employeeName} pour ${currentEval.reviewPeriod} a été finalisée.`,
                href: `/evaluations/${evaluationId}`
            });
        }
    }
}
