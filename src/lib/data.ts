

export type Employe = {
  id: string; // Firestore document ID
  matricule: string;
  name: string; // Combined name
  lastName?: string;
  firstName?: string;
  poste: string;
  departmentId?: string; // Foreign key to 'departments' collection
  directionId?: string; // Foreign key to 'directions' collection
  serviceId?: string; // Foreign key to 'services' collection
  status: 'Actif' | 'En congé' | 'Licencié' | 'Retraité' | 'Décédé';
  photoUrl: string;
  userId?: string; // ID de l'utilisateur authentifié lié

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
  
  // Calculated fields for UI display
  calculatedRetirementDate?: Date;
  age?: number;
  retirementNotificationSent?: boolean;
};

export type Leave = {
  id: string; // Firestore document ID
  employee: string; // Employee name
  type: "Congé Annuel" | "Congé Maladie" | "Congé Personnel" | "Congé Maternité" | "Congé sans solde";
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Approuvé' | 'En attente' | 'Rejeté';
  num_decision?: string;
  reason?: string;
};

export type Asset = {
  tag: string; // Numéro d'inventaire, used as Firestore document ID
  type: "Ordinateur" | "Moniteur" | "Imprimante" | "Clavier" | "Souris" | "Logiciel" | "Équipement Réseau" | "Autre";
  typeOrdinateur?: "Portable" | "De Bureau" | "Serveur";
  fabricant?: string;
  modele: string;
  numeroDeSerie?: string;
  ipAddress?: string;
  password?: string;
  assignedTo: string;
  status: 'En utilisation' | 'En stock' | 'En réparation' | 'Retiré';
}

export type Fleet = {
  plate: string; // Firestore document ID
  makeModel: string;
  assignedTo: string;
  maintenanceDue: string; // YYYY-MM-DD
  status: 'Disponible' | 'En mission' | 'En maintenance' | 'Hors service';
};

export type User = {
    id: string; // Firestore document ID from auth
    name: string; 
    email: string;
    photoUrl?: string; // URL to the profile picture in Firebase Storage
    roleId: string; // Reference to a role document in the 'roles' collection
    role: Role | null; // The resolved role object
    permissions: string[]; // The resolved permissions for the user's role
    employeeId?: string; // ID de l'employé lié
}

export type Role = {
    id: string; // Firestore document ID
    name: string;
    permissions: string[];
}

export type MissionParticipant = {
  employeeName: string;
  moyenTransport?: 'Véhicule personnel' | 'Véhicule CNRCT';
  immatriculation?: string;
  numeroOrdre?: string;
  coutTransport?: number;
  coutHebergement?: number;
  totalIndemnites?: number;
};

export type Mission = {
  id: string; // Firestore document ID
  numeroMission: string;
  title: string;
  description: string;
  participants: MissionParticipant[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Planifiée' | 'En cours' | 'Terminée' | 'Annulée';
  lieuMission?: string;
};

export const conflictTypes = ["Foncier", "Succession", "Intercommunautaire", "Politique", "Autre"] as const;
export type ConflictType = typeof conflictTypes[number];

export const conflictStatuses = ["En cours", "Résolu", "En médiation"] as const;
export type ConflictStatus = typeof conflictStatuses[number];

export const conflictTypeVariantMap: Record<ConflictType, "default" | "secondary" | "outline" | "destructive"> = {
    "Foncier": "default",
    "Succession": "secondary",
    "Intercommunautaire": "destructive",
    "Politique": "outline",
    "Autre": "outline",
};

export type Conflict = {
    id: string; // Firestore document ID
    village: string;
    type: ConflictType;
    description: string;
    reportedDate: string; // YYYY-MM-DD
    status: ConflictStatus;
    latitude?: number;
    longitude?: number;
    mediatorName?: string;
};

export type Supply = {
  id: string; // Firestore document ID
  name: string;
  category: "Papeterie" | "Cartouches d'encre" | "Matériel de nettoyage" | "Autre";
  inkType?: string; // e.g., 'HP 651', 'Toner 12A'
  quantity: number;
  reorderLevel: number;
  lastRestockDate: string; // YYYY-MM-DD
  linkedAssetTag?: string; // Link to an Asset (e.g., a printer)
};

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

export type ChiefRole = "Roi" | "Chef de province" | "Chef de canton" | "Chef de tribu" | "Chef de Village";
export type DesignationMode = "Héritage" | "Élection" | "Nomination coutumière" | "Autre";


export type Chief = {
  id: string;
  name: string;
  lastName?: string;
  firstName?: string;
  title: string;
  role: ChiefRole;
  designationDate?: string;
  designationMode?: DesignationMode;
  region: string;
  department: string;
  subPrefecture: string;
  village: string;
  ethnicGroup?: string;
  customs?: string;
  languages?: string[];
  contact: string;
  email?: string;
  address?: string;
  cnrctRegistrationNumber?: string;
  officialDocuments?: string;
  bio: string;
  photoUrl: string;
  territoryMapUrl?: string;
  latitude?: number;
  longitude?: number;
  parentChiefId?: string | null;
  sexe?: 'Homme' | 'Femme' | 'Autre';
  dateOfBirth?: string;
  regencyStartDate?: string;
  regencyEndDate?: string;
};

export type Custom = {
    id: string;
    ethnicGroup: string;
    regions: string; // Comma-separated
    languages: string; // Comma-separated
    historicalOrigin: string; // Text
    socialStructure: string; // Text
    politicalStructure: string; // Text
    successionSystem: string; // Text
    traditionalMarriage: string; // Text
    funerals: string; // Text
    initiations: string; // Text
    celebrations: string; // Text
    beliefs: string; // Text
    religiousPractices: string; // Text
    sacredPlaces: string; // Text
    culturalSymbols: string; // Text
    normsAndValues: string; // Text
    conflictResolutionSystem: string; // Text
    modernityImpact: string;
    preservationInitiatives: string;
    intergenerationalTransmission: string;
};


export type Goal = {
    id: string;
    title: string;
    description: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
}

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
  goals: Goal[];
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
  departmentId?: string; // OR directly to a department if it doesn't fall under a specific direction
};

export type OrganizationSettings = {
    organizationName: string;
    mainLogoUrl: string;
    secondaryLogoUrl: string;
    faviconUrl: string;
};

export type Notification = {
  id: string; // Firestore document ID
  userId: string; // 'all' or a specific user ID
  title: string;
  description: string;
  href: string; // Link to the relevant page
  isRead: boolean;
  createdAt: string; // ISO string e.g. new Date().toISOString()
};

export type EmployeeEvent = {
  id: string;
  employeeId: string;
  eventType: 'Promotion' | 'Augmentation' | 'Changement de poste' | 'Départ' | 'Autre';
  effectiveDate: string; // YYYY-MM-DD
  description: string;
  details?: Record<string, any>; // e.g., { previousPoste: 'Junior', newPoste: 'Senior', previousSalary: 500, newSalary: 600 }
};

export type Document = {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  storageUrl: string;
  relatedEmployeeId?: string;
  category?: string;
}

export type BudgetLine = {
    id: string; // Firestore document ID
    code: string;
    name: string;
    allocatedAmount: number;
    year: number;
};

// Helpdesk Types
export type TicketStatus = 'Ouvert' | 'En cours' | 'Fermé';
export type TicketPriority = 'Basse' | 'Moyenne' | 'Haute';
export type TicketCategory = 'Technique' | 'Facturation' | 'Général';

export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdBy: string; // userId
  createdByName: string; // denormalized name
  createdAt: string; // ISO Date string
  assignedTo?: string; // agent userId
  assignedToName?: string; // denormalized agent name
  updatedAt: string; // ISO Date string
  messages: TicketMessage[];
};

export type TicketMessage = {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string; // ISO Date string
};
