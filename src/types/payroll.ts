import { Employe } from "./employee";

export type PayslipEarning = {
    label: string;
    amount: number;
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
    employeeInfo: Employe & { numeroCompteComplet?: string };
    earnings: PayslipEarning[];
    deductions: PayslipDeduction[];
    totals: {
        brutImposable: number;
        transportNonImposable: { label: string; amount: number };
        netAPayer: number;
        netAPayerInWords: string;
    };
    employerContributions: PayslipEmployerContribution[];
    organizationLogos: {
        mainLogoUrl: string;
        secondaryLogoUrl: string;
    }
};

export type BudgetLine = {
    id: string; // Firestore document ID
    type: 'emploi' | 'ressource';
    code: string; // Ligne dans l'image
    paragraphe?: string;
    name: string; // Libellé
    allocatedAmount: number; // Dotation/Prévision Année N
    previousAmount?: number; // Dotation/Prévision Année N-1
    year: number; // Année de référence (ex: 2026)
};

export type PrintLog = {
    id?: string;
    userId: string;
    userName: string;
    actionType: 'print' | 'pdf';
    period: string; // MM-YYYY
    count: number;
    employeeIds: string[];
    timestamp: any; // Firestore Timestamp
};
