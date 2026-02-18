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
    Salaire_Brut?: number;

    // Non-taxable earnings
    transportNonImposable?: number;
    Salaire_Net?: number;

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
    Image_Region?: string;
    Departement?: string;
    department?: string; // Legacy / Fallback
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

export type EmployeeEvent = {
    id: string;
    employeeId: string;
    eventType: 'Promotion' | 'Augmentation au Mérite' | 'Ajustement de Marché' | 'Revalorisation Salariale' | 'Changement de poste' | 'Départ' | 'Autre';
    effectiveDate: string; // YYYY-MM-DD
    description: string;
    details?: Record<string, any>; // e.g., { previousPoste: 'Junior', newPoste: 'Senior', previousSalary: 500, newSalary: 600 }
};
