


export type Employe = {
  id: string; // Firestore document ID
  civilite?: string;
  nom?: string;
  prenom?: string;
  matricule: string;
  sexe?: string;
  poste: string;
  service?: string;
  mobile?: string;
  email?: string;
  groupe_1?: string;
  groupe_2?: string;
  Region?: string;
  Image_Region?: string;
  Departement?: string;
  Commune?: string;
  Village?: string;
  salaire_Base?: number;
  prime_ancien?: number;
  indemnite_Transport?: number;
  indemnite_Responsabilite?: number;
  indemnite_Logement?: number;
  indemnite_Sujetion?: number;
  indemnite_Communication?: number;
  indemnite_Representation?: number;
  Salaire_Brut?: number;
  indemnite_transport_non_imposable?: number;
  Salaire_Net?: number;
  Banque?: string;
  CB?: string;
  CG?: string;
  Num_Compte?: string;
  Cle_RIB?: string;
  CNPS?: boolean;
  Num_CNPS?: string;
  Num_Decision?: string;
  Date_Naissance?: string;
  Date_Embauche?: string;
  Date_Immatriculation?: string;
  Date_Depart?: string;
  situation_famille?: string;
  nombre_enfants?: number;
  Lieu_Naissance?: string;
  Photo?: string;
  Statut?: 'Actif' | 'En congé' | 'Licencié';
  solde_conges?: number;
  Droit?: number;
  bActif?: boolean;

  // Maintained fields from previous version for compatibility
  name: string; // Combined name
  firstName?: string;
  lastName?: string;
  department: string;
  status: 'Actif' | 'En congé' | 'Licencié';
  photoUrl: string;
  baseSalary?: number;
  payFrequency?: 'Mensuel' | 'Bi-hebdomadaire';
  nextPayDate?: string;
  primeAnciennete?: number;
  indemniteTransportImposable?: number;
  transportNonImposable?: number;
  cnpsEmployeur?: string;
  cnpsEmploye?: string;
  situationMatrimoniale?: string;
  banque?: string;
  numeroCompte?: string;
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
  type: "Congé Annuel" | "Congé Maladie" | "Congé Personnel" | "Congé Maternité" | "Congé sans solde";
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Approuvé' | 'En attente' | 'Rejeté';
};

export type Asset = {
  tag: string; // Firestore document ID
  type: "Ordinateur portable" | "Moniteur" | "Clavier" | "Souris" | "Logiciel" | "Autre";
  model: string;
  assignedTo: string;
  status: 'En Utilisation' | 'En Stock' | 'En Réparation' | 'Retiré';
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
    employeeInfo: Employe;
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
