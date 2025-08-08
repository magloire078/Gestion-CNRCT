
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import type { Evaluation } from '@/lib/data';

// --- Mock Data ---
const mockEvaluations: Evaluation[] = [
    { id: 'eval1', employeeId: '1', employeeName: 'Koffi Jean-Luc', managerId: '2', managerName: 'Amoin Thérèse', reviewPeriod: 'Annuel 2023', evaluationDate: '2024-01-15', status: 'Completed', scores: { communication: 5, leadership: 4 }, strengths: 'Excellent problem solver', areasForImprovement: 'Time management', managerComments: 'Great year', employeeComments: 'Agree', goals: [] },
    { id: 'eval2', employeeId: '4', employeeName: 'Brou Adjoua', managerId: '2', managerName: 'Amoin Thérèse', reviewPeriod: 'Q2 2024', evaluationDate: '2024-07-05', status: 'Pending Employee Sign-off', scores: { communication: 4, leadership: 3 }, strengths: 'Very organized', areasForImprovement: 'Proactivity', managerComments: 'Good quarter', employeeComments: '', goals: [] },
    { id: 'eval3', employeeId: '3', employeeName: 'N\'Guessan Paul', managerId: '2', managerName: 'Amoin Thérèse', reviewPeriod: 'H1 2024', evaluationDate: '2024-07-20', status: 'Draft', scores: {}, strengths: '', areasForImprovement: '', managerComments: '', employeeComments: '', goals: [] },
];
// --- End Mock Data ---

export function subscribeToEvaluations(
    callback: (evaluations: Evaluation[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const interval = setInterval(() => callback([...mockEvaluations]), 3000);
    return () => clearInterval(interval);
}

export async function getEvaluations(): Promise<Evaluation[]> {
    return Promise.resolve([...mockEvaluations]);
}

export async function addEvaluation(evaluationDataToAdd: Omit<Evaluation, 'id'>): Promise<Evaluation> {
    const newEvaluation: Evaluation = { 
        id: `eval-${Date.now()}`, 
        ...evaluationDataToAdd 
    };
    mockEvaluations.push(newEvaluation);
    return Promise.resolve(newEvaluation);
}

export async function updateEvaluation(evaluationId: string, dataToUpdate: Partial<Evaluation>): Promise<void> {
    const index = mockEvaluations.findIndex(e => e.id === evaluationId);
    if (index > -1) {
        mockEvaluations[index] = { ...mockEvaluations[index], ...dataToUpdate };
    }
    return Promise.resolve();
}
