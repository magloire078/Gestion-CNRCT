import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    runTransaction,
    getDoc,
    QueryDocumentSnapshot,
    DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FuelProvider, FuelCard, FuelTransaction } from '@/types/fuel';

const providersCollection = collection(db, 'fuel_providers');
const cardsCollection = collection(db, 'fuel_cards');
const transactionsCollection = collection(db, 'fuel_transactions');

// --- Providers ---

export function subscribeToFuelProviders(
    callback: (providers: FuelProvider[]) => void,
    onError: (error: Error) => void
) {
    const q = query(providersCollection, orderBy("name", "asc"));
    return onSnapshot(q, (snapshot) => {
        const providers = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as FuelProvider));
        callback(providers);
    }, onError);
}

export async function addFuelProvider(data: Omit<FuelProvider, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(providersCollection, {
        ...data,
        createdAt: new Date().toISOString()
    });
    return docRef.id;
}

export async function updateFuelProvider(id: string, data: Partial<FuelProvider>): Promise<void> {
    const docRef = doc(db, 'fuel_providers', id);
    await updateDoc(docRef, data);
}

export async function deleteFuelProvider(id: string): Promise<void> {
    const docRef = doc(db, 'fuel_providers', id);
    await deleteDoc(docRef);
}

// --- Cards ---

export function subscribeToFuelCards(
    callback: (cards: FuelCard[]) => void,
    onError: (error: Error) => void
) {
    const q = query(cardsCollection, orderBy("cardNumber", "asc"));
    return onSnapshot(q, (snapshot) => {
        const cards = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as FuelCard));
        callback(cards);
    }, onError);
}

export async function addFuelCard(data: Omit<FuelCard, 'id'>): Promise<string> {
    const docRef = await addDoc(cardsCollection, {
        ...data,
        createdAt: new Date().toISOString()
    });
    return docRef.id;
}

export async function updateFuelCard(id: string, data: Partial<FuelCard>): Promise<void> {
    const docRef = doc(db, 'fuel_cards', id);
    await updateDoc(docRef, data);
}

export async function deleteFuelCard(id: string): Promise<void> {
    const docRef = doc(db, 'fuel_cards', id);
    await deleteDoc(docRef);
}

// --- Transactions ---

export function subscribeToFuelTransactions(
    callback: (transactions: FuelTransaction[]) => void,
    onError: (error: Error) => void
) {
    const q = query(transactionsCollection, orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as FuelTransaction));
        callback(transactions);
    }, onError);
}

/**
 * Adds a transaction (recharge or expense) and updates the card balance atomically.
 */
export async function addFuelTransaction(data: Omit<FuelTransaction, 'id'>): Promise<string> {
    const resultId = await runTransaction(db, async (transaction) => {
        const cardRef = doc(db, 'fuel_cards', data.cardId);
        const cardSnap = await transaction.get(cardRef);

        if (!cardSnap.exists()) {
            throw new Error("La carte spécifiée n'existe pas.");
        }

        const cardData = cardSnap.data() as FuelCard;
        let newBalance = cardData.currentBalance || 0;

        if (data.type === 'recharge') {
            newBalance += data.amount;
        } else {
            if (newBalance < data.amount) {
                throw new Error("Solde insuffisant sur la carte.");
            }
            newBalance -= data.amount;
        }

        // Create transaction doc
        const transRef = doc(transactionsCollection);
        transaction.set(transRef, {
            ...data,
            createdAt: new Date().toISOString()
        });

        // Update card balance
        transaction.update(cardRef, { currentBalance: newBalance });

        return transRef.id;
    });

    return resultId;
}

export async function deleteFuelTransaction(id: string): Promise<void> {
    const transSnap = await getDoc(doc(db, 'fuel_transactions', id));

    if (transSnap.exists()) {
        const transData = transSnap.data() as FuelTransaction;
        await runTransaction(db, async (transaction) => {
            const cardRef = doc(db, 'fuel_cards', transData.cardId);
            const cardSnap = await transaction.get(cardRef);

            if (cardSnap.exists()) {
                const cardData = cardSnap.data() as FuelCard;
                const balanceChange = transData.type === 'recharge' ? -transData.amount : transData.amount;
                transaction.update(cardRef, { currentBalance: (cardData.currentBalance || 0) + balanceChange });
            }
            transaction.delete(doc(db, 'fuel_transactions', id));
        });
    }
}
