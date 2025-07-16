
export type PayrollEntry = {
    id: string; // Firestore document ID
    employeeId: string;
    employeeName: string;
    role: string;
    baseSalary: number; // Annuel
    payFrequency: 'Mensuel' | 'Bi-hebdomadaire';
    nextPayDate: string;
};
