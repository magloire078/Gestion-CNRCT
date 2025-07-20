
export type PayrollEntry = {
    id: string; // Firestore document ID
    employeeId: string;
    employeeName: string;
    role: string;
    baseSalary: number; // Mensuel
    payFrequency: 'Mensuel' | 'Bi-hebdomadaire';
    nextPayDate: string;
    // Payslip Generation Fields
    primeAnciennete: number;
    indemniteTransportImposable: number;
    indemniteResponsabilite: number;
    indemniteLogement: number;
    transportNonImposable: number;
    // Fields from image
    cnpsEmployeur: string;
    cnpsEmploye: string;
    situationMatrimoniale: string;
    banque: string;
    numeroCompte: string;
    service: string;
    dateConge: string;
    anciennete: string;
    categorie: string;
    enfants: number;
    emploi: string;
    parts: number;
    dateEmbauche: string; // YYYY-MM-DD
    paymentLocation: string;
    paymentDate: string; // "Mercredi 30 Avril 2025"
};

export type PayslipEarning = {
    label: string;
    amount: number;
    deduction: number; // to align retenues column
};

export type PayslipDeduction = {
    label: string;
    amount: number;
};

export type PayslipEmployerContribution = {
    label: string;
    base: number;
    rate: string;
    amount: number;
};

// Type for the full payslip details
export type PayslipDetails = {
    employeeInfo: Omit<PayrollEntry, 'id'> & { matricule: string }; // Add matricule here
    earnings: PayslipEarning[];
    deductions: PayslipDeduction[];
    totals: {
        brutImposable: number;
        transportNonImposable: { label: string; amount: number };
        netAPayer: number;
        netAPayerInWords: string;
    };
    employerContributions: PayslipEmployerContribution[];
};
