import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, updateDoc, deleteDoc, type QueryDocumentSnapshot, type DocumentData, getDocs, where, writeBatch } from '@/lib/firebase';
import type { BudgetLine } from '@/lib/data';

const budgetLinesCollection = collection(db, 'budgetLines');

export function subscribeToBudgetLines(
    callback: (lines: BudgetLine[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(budgetLinesCollection, orderBy("year", "desc"), orderBy("code", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const lines = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || "Sans nom",
                    type: data.type || "emploi",
                    paragraphe: data.paragraphe || "",
                    code: data.code || "",
                    allocatedAmount: Number(data.allocatedAmount) || 0,
                    previousAmount: Number(data.previousAmount) || 0,
                    year: Number(data.year) || new Date().getFullYear()
                } as BudgetLine;
            });
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

export async function syncBudgetLinesWithPreviousYear(year: number): Promise<{ updatedCount: number }> {
    const previousYear = year - 1;
    
    // 1. Fetch previous year lines
    const qPrev = query(budgetLinesCollection, where("year", "==", previousYear));
    const snapshotPrev = await getDocs(qPrev);
    const prevLinesMap = new Map<string, number>(); // code_type -> allocatedAmount
    
    snapshotPrev.docs.forEach(doc => {
        const data = doc.data();
        if (data.code && data.type && data.allocatedAmount) {
            prevLinesMap.set(`${data.code}_${data.type}`, Number(data.allocatedAmount));
        }
    });
    
    // 2. Fetch current year lines
    const qCurr = query(budgetLinesCollection, where("year", "==", year));
    const snapshotCurr = await getDocs(qCurr);
    
    const batch = writeBatch(db);
    let updatedCount = 0;
    
    snapshotCurr.docs.forEach(docSnap => {
        const data = docSnap.data();
        const key = `${data.code}_${data.type}`;
        const prevAmount = prevLinesMap.get(key);
        
        if (prevAmount !== undefined && Number(data.previousAmount) !== prevAmount) {
            batch.update(docSnap.ref, { previousAmount: prevAmount });
            updatedCount++;
        }
    });
    
    if (updatedCount > 0) {
        await batch.commit();
    }
    
    return { updatedCount };
}
