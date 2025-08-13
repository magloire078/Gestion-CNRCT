

export type Employe = {
  id: string; // Firestore document ID
  matricule: string;
  name: string; // Combined name
  firstName?: string;
  lastName?: string;
  poste: string;
  department: string;
  direction?: string;
  service?: string;
  status: 'Actif' | 'En congé' | 'Licencié' | 'Retraité' | 'Décédé';
  photoUrl: string;

  // Personal Info
  email?: string;
  mobile?: string;
  Date_Naissance?: string;
  Lieu_Naissance?: string;
  situationMatrimoniale?: string; // 'Célibataire', 'Marié(e)', etc.
  enfants?: number;
  sexe?: 'Homme' | 'Femme' | 'Autre';
  
  // Professional Info
  dateEmbauche?: string; // YYYY-MM-DD
  Date_Depart?: string; // YYYY-MM-DD
  Date_Immatriculation?: string;
  Num_Decision?: string;
  
  // Payroll Info
  baseSalary?: number;
  payFrequency?: 'Mensuel' | 'Bi-hebdomadaire';
  nextPayDate?: string; // YYYY-MM-DD
  
  // Earnings
  primeAnciennete?: number;
  indemniteTransportImposable?: number;
  indemniteResponsabilite?: number;
  indemniteLogement?: number;
  indemniteSujetion?: number;
  indemniteCommunication?: number;
  indemniteRepresentation?: number;
  
  // Non-taxable earnings
  transportNonImposable?: number;

  // Bank Info
  banque?: string;
  numeroCompte?: string; // Core account number
  CB?: string; // Code Banque
  CG?: string; // Code Guichet
  Cle_RIB?: string; // RIB Key

  // Payslip specific details (can be calculated or stored)
  cnpsEmployeur?: string;
  cnpsEmploye?: string;
  dateConge?: string;
  anciennete?: string; // e.g., "5 ans 3 mois"
  categorie?: string;
  emploi?: string; // can be same as 'poste'
  parts?: number; // for tax calculation
  paymentLocation?: string;
  paymentDate?: string; // "Mercredi 30 Avril 2025"
  
  // Other potential fields from CSV
  skills?: string[];
  civilite?: string;
  groupe_1?: string;
  groupe_2?: string;
  Region?: string;
  Departement?: string;
  Commune?: string;
  Village?: string;
  CNPS?: boolean;
  Photo?: string;
  solde_conges?: number;
  Droit?: number;
  bActif?: boolean;
  Salaire_Brut?: number; // Can be calculated or stored
  Salaire_Net?: number; // Can be calculated or stored
  calculatedRetirementDate?: Date; // For UI display only
};

export type Leave = {
  id: string; // Firestore document ID
  employee: string; // Employee name
  type: "Congé Annuel" | "Congé Maladie" | "Congé Personnel" | "Congé Maternité" | "Congé sans solde";
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Approuvé' | 'En attente' | 'Rejeté';
};

export type Asset = {
  tag: string; // Numéro d'inventaire, used as Firestore document ID
  type: "Ordinateur" | "Moniteur" | "Clavier" | "Souris" | "Logiciel" | "Autre";
  typeOrdinateur?: "Portable" | "De Bureau" | "Serveur";
  fabricant?: string;
  modele: string;
  numeroDeSerie?: string;
  assignedTo: string;
  status: 'En utilisation' | 'En stock' | 'En réparation' | 'Retiré';
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
    photoUrl?: string; // URL to the profile picture in Firebase Storage
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
  status: 'Planifiée' | 'En cours' | 'Terminée' | 'Annulée';
};

export type Conflict = {
    id: string; // Firestore document ID
    village: string;
    description: string;
    reportedDate: string; // YYYY-MM-DD
    status: 'En cours' | 'Résolu' | 'En médiation';
}

export type Supply = {
  id: string; // Firestore document ID
  name: string;
  category: "Papeterie" | "Cartouches d'encre" | "Matériel de nettoyage" | "Autre";
  quantity: number;
  reorderLevel: number;
  lastRestockDate: string; // YYYY-MM-DD
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

export type ChiefRole = "Chef de Village" | "Chef de Canton" | "Roi";

export type Chief = {
  id: string; // Firestore document ID
  name: string;
  title: string; // e.g., "Roi des N'zima", "Chef de Canton"
  role: ChiefRole;
  sexe?: 'Homme' | 'Femme' | 'Autre';
  region: string;
  department: string;
  subPrefecture: string;
  village: string;
  contact: string;
  bio: string;
  photoUrl: string;
  latitude?: number;
  longitude?: number;
  parentChiefId?: string | null;
  dateOfBirth?: string;
  regencyStartDate?: string;
  regencyEndDate?: string;
};

export type Evaluation = {
  id: string;
  employeeId: string;
  employeeName: string; // Denormalized for easy display
  managerId: string;
  managerName: string; // Denormalized for easy display
  reviewPeriod: string; // e.g., "Annuel 2024", "Q3 2024"
  status: 'Draft' | 'Pending Manager Review' | 'Pending Employee Sign-off' | 'Completed';
  scores: Record<string, number>; // e.g., { "communication": 4, "leadership": 3 }
  strengths: string;
  areasForImprovement: string;
  managerComments: string;
  employeeComments?: string;
  goals: {
    title: string;
    description: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
  }[];
  evaluationDate: string; // YYYY-MM-DD
};

export type Department = {
  id: string;
  name: string;
};

export type Direction = {
  id: string;
  name: string;
  departmentId: string;
};

export type Service = {
  id: string;
  name: string;
  directionId?: string; // A service can belong to a direction
  departmentId?: string; // OR directly to a department
};

export type OrganizationSettings = {
    organizationName: string;
    mainLogoUrl: string;
    secondaryLogoUrl: string;
    faviconUrl: string;
};
