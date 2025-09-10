
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { BudgetLine } from '@/lib/data';

const budgetLinesCollection = collection(db, 'budgetLines');

export function subscribeToBudgetLines(
    callback: (lines: BudgetLine[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(budgetLinesCollection, orderBy("year", "desc"), orderBy("code", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const lines = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as BudgetLine));
            callback(lines);
        },
        (error) => {
            console.error("Error subscribing to budget lines:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function addBudgetLine(data: Omit<BudgetLine, 'id'>): Promise<BudgetLine> {
    const docRef = await addDoc(budgetLinesCollection, data);
    return { id: docRef.id, ...data };
}

export async function updateBudgetLine(id: string, data: Partial<Omit<BudgetLine, 'id'>>): Promise<void> {
    const docRef = doc(db, 'budgetLines', id);
    await updateDoc(docRef, data);
}

export async function deleteBudgetLine(id: string): Promise<void> {
    const docRef = doc(db, 'budgetLines', id);
    await deleteDoc(docRef);
}
