

export type Employee = {
  id: string; // Firestore document ID
  matricule: string;
  name: string; // Combined name
  firstName?: string; // Optional for backward compatibility
  lastName?: string;  // Optional for backward compatibility
  email?: string;
  department: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  photoUrl: string; // Can be a data URL or a gs:// URL

  // Merged payroll fields
  baseSalary?: number;
  payFrequency?: 'Mensuel' | 'Bi-hebdomadaire';
  nextPayDate?: string;
  primeAnciennete?: number;
  indemniteTransportImposable?: number;
  indemniteResponsabilite?: number;
  indemniteLogement?: number;
  transportNonImposable?: number;
  cnpsEmployeur?: string;
  cnpsEmploye?: string;
  situationMatrimoniale?: string;
  banque?: string;
  numeroCompte?: string;
  service?: string;
  dateConge?: string;
  anciennete?: string;
  categorie?: string;
  enfants?: number;
  emploi?: string;
  parts?: number;
  dateEmbauche?: string; // YYYY-MM-DD
  paymentLocation?: string;
  paymentDate?: string; // "Mercredi 30 Avril 2025"
};

export type Leave = {
  id: string; // Firestore document ID
  employee: string; // Employee name
  type: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Approved' | 'Pending' | 'Rejected';
};

export type Asset = {
  tag: string; // Firestore document ID
  type: string;
  model: string;
  assignedTo: string;
  status: 'In Use' | 'In Stock' | 'In Repair' | 'Retired' | 'Active';
}

export type Fleet = {
  plate: string; // Firestore document ID
  makeModel: string;
  assignedTo: string;
  maintenanceDue: string; // YYYY-MM-DD
};

export type User = {
    id: string; // Firestore document ID from auth
    name: string; 
    email: string;
    roleId: string; // Reference to a role document in the 'roles' collection
    role: Role | null; // The resolved role object
    permissions: string[]; // The resolved permissions for the user's role
}

export type Role = {
    id: string; // Firestore document ID
    name: string;
    permissions: string[];
}

export type Mission = {
  id: string; // Firestore document ID
  title: string;
  description: string;
  assignedTo: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
};

export type Conflict = {
    id: string; // Firestore document ID
    village: string;
    description: string;
    reportedDate: string; // YYYY-MM-DD
    status: 'Ongoing' | 'Resolved' | 'Mediating';
}


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
    employeeInfo: Employee;
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

    
