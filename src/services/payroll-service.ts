
import type { PayrollEntry } from '@/lib/payroll-data';
// Mock data for payroll is not in data.ts, so we create an empty array.
const payrollData: PayrollEntry[] = [];

export async function getPayroll(): Promise<PayrollEntry[]> {
  // Returning mock data to bypass Firestore permission issues.
  return Promise.resolve(payrollData);
}

export async function addPayroll(payrollDataToAdd: Omit<PayrollEntry, 'id'>): Promise<PayrollEntry> {
    const newEntry: PayrollEntry = { 
        id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`, 
        ...payrollDataToAdd 
    };
    payrollData.push(newEntry);
    return Promise.resolve(newEntry);
}

export async function getPayrollByEmployeeId(employeeId: string): Promise<PayrollEntry | null> {
    const entry = payrollData.find(p => p.employeeId === employeeId);
    return Promise.resolve(entry || null);
}
