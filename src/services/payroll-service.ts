
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc, query, where, getDoc } from 'firebase/firestore';
import type { PayrollEntry } from '@/lib/payroll-data';

const payrollCollection = collection(db, 'payroll');

// Get all payroll entries
export async function getPayroll(): Promise<PayrollEntry[]> {
  const snapshot = await getDocs(payrollCollection);
  const payrollList = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as PayrollEntry));
  return payrollList;
}

// Add a new payroll entry
export async function addPayroll(payrollData: Omit<PayrollEntry, 'id'>): Promise<PayrollEntry> {
    const q = query(payrollCollection, where("employeeId", "==", payrollData.employeeId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error(`Une entrée de paie pour cet employé existe déjà.`);
    }

    const docRef = await addDoc(payrollCollection, payrollData);

    const newEntry: PayrollEntry = {
        id: docRef.id,
        ...payrollData
    };
    return newEntry;
}

// Get a single payroll entry by employeeId
export async function getPayrollByEmployeeId(employeeId: string): Promise<PayrollEntry | null> {
    const q = query(payrollCollection, where("employeeId", "==", employeeId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as PayrollEntry;
}
