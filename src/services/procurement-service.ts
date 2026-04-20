import { db } from '@/lib/firebase';
import { 
    collection, addDoc, onSnapshot, Unsubscribe, query, orderBy, doc, 
    updateDoc, deleteDoc, type QueryDocumentSnapshot, type DocumentData, 
    getDocs, where, writeBatch 
} from '@/lib/firebase';
import type { Provider, Contract, Invoice } from '@/lib/data';

// Collections
const providersCollection = collection(db, 'providers');
const contractsCollection = collection(db, 'contracts');
const invoicesCollection = collection(db, 'invoices');

// --- PROVIDERS ---

export function subscribeToProviders(
    callback: (providers: Provider[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(providersCollection, orderBy("name", "asc"));
    return onSnapshot(q,
        (snapshot) => {
            const providers = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data()
            } as Provider));
            callback(providers);
        },
        onError
    );
}

export async function addProvider(data: Omit<Provider, 'id' | 'createdAt'>): Promise<Provider> {
    const docRef = await addDoc(providersCollection, {
        ...data,
        createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...data } as Provider;
}

export async function updateProvider(id: string, data: Partial<Omit<Provider, 'id'>>): Promise<void> {
    const docRef = doc(db, 'providers', id);
    await updateDoc(docRef, data);
}

export async function deleteProvider(id: string): Promise<void> {
    await deleteDoc(doc(db, 'providers', id));
}

// --- CONTRACTS (MARCHÉS) ---

export function subscribeToContracts(
    callback: (contracts: Contract[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(contractsCollection, orderBy("engagementDate", "desc"));
    return onSnapshot(q,
        (snapshot) => {
            const contracts = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data()
            } as Contract));
            callback(contracts);
        },
        onError
    );
}

export async function addContract(data: Omit<Contract, 'id' | 'createdAt' | 'amountPaid'>): Promise<Contract> {
    const docRef = await addDoc(contractsCollection, {
        ...data,
        amountPaid: 0,
        createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...data, amountPaid: 0 } as Contract;
}

export async function updateContract(id: string, data: Partial<Omit<Contract, 'id'>>): Promise<void> {
    const docRef = doc(db, 'contracts', id);
    await updateDoc(docRef, data);
}

export async function deleteContract(id: string): Promise<void> {
    await deleteDoc(doc(db, 'contracts', id));
}

// --- INVOICES (FACTURES) ---

export function subscribeToInvoices(
    contractId: string | null,
    callback: (invoices: Invoice[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    let q = query(invoicesCollection, orderBy("date", "desc"));
    if (contractId) {
        q = query(invoicesCollection, where("contractId", "==", contractId), orderBy("date", "desc"));
    }
    
    return onSnapshot(q,
        (snapshot) => {
            const invoices = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data()
            } as Invoice));
            callback(invoices);
        },
        onError
    );
}

export async function addInvoice(data: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    const batch = writeBatch(db);
    
    // 1. Add the invoice
    const invoiceRef = doc(collection(db, 'invoices'));
    batch.set(invoiceRef, {
        ...data,
        createdAt: new Date().toISOString()
    });
    
    // 2. Update contract amountPaid if invoice is marked as Paid (Wait, maybe logic should be different)
    // For now, let's just add it. We can add a function to re-calculate contract totals.
    
    await batch.commit();
    return { id: invoiceRef.id, ...data } as Invoice;
}

export async function updateInvoice(id: string, data: Partial<Omit<Invoice, 'id'>>): Promise<void> {
    const docRef = doc(db, 'invoices', id);
    await updateDoc(docRef, data);
}

export async function deleteInvoice(id: string): Promise<void> {
    await deleteDoc(doc(db, 'invoices', id));
}

// --- ANALYTICS ---

export async function syncContractPayments(contractId: string): Promise<number> {
    const q = query(invoicesCollection, where("contractId", "==", contractId), where("status", "==", "Payée"));
    const snapshot = await getDocs(q);
    const totalPaid = snapshot.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
    
    await updateDoc(doc(db, 'contracts', contractId), { amountPaid: totalPaid });
    return totalPaid;
}
