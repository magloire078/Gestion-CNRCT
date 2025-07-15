
import { employeeData } from "./data";

export type PayrollEntry = {
    employeeId: string;
    employeeName: string;
    role: string;
    baseSalary: number; // Annuel
    payFrequency: 'Mensuel' | 'Bi-hebdomadaire';
    nextPayDate: string;
};

// Generate dummy payroll data from employee data
export const payrollData: PayrollEntry[] = employeeData
    .filter(emp => emp.status === 'Active' || emp.status === 'On Leave')
    .map((emp) => {
        let baseSalary;
        if (emp.role.toLowerCase().includes('manager')) {
            baseSalary = 1200000;
        } else if (emp.role.toLowerCase().includes('senior')) {
            baseSalary = 960000;
        } else {
            baseSalary = 720000;
        }

        // Dummy date for next payment
        const nextPayDate = new Date();
        nextPayDate.setMonth(nextPayDate.getMonth() + 1);
        nextPayDate.setDate(1);

        return {
            employeeId: emp.id,
            employeeName: emp.name,
            role: emp.role,
            baseSalary: baseSalary,
            payFrequency: 'Mensuel',
            nextPayDate: nextPayDate.toLocaleDateString('fr-CA'), // YYYY-MM-DD
        };
});
