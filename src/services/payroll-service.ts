
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, query, where, limit } from 'firebase/firestore';
import type { PayrollEntry } from '@/lib/payroll-data';

export async function getPayroll(): Promise<PayrollEntry[]> {
  const payrollCollection = collection(db, 'payroll');
  const payrollSnapshot = await getDocs(payrollCollection);
  const payrollList = payrollSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayrollEntry));
  return payrollList.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

export async function addPayroll(payrollDataToAdd: Omit<PayrollEntry, 'id'>): Promise<PayrollEntry> {
    const payrollCollection = collection(db, 'payroll');
    const docRef = await addDoc(payrollCollection, payrollDataToAdd);
    const newEntry: PayrollEntry = { 
        id: docRef.id, 
        ...payrollDataToAdd 
    };
    return newEntry;
}

export async function getPayrollByEmployeeId(employeeId: string): Promise<PayrollEntry | null> {
    const payrollCollection = collection(db, 'payroll');
    const q = query(payrollCollection, where("employeeId", "==", employeeId), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as PayrollEntry;
}
