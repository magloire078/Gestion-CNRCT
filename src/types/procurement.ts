export type ProviderCategory = "Travaux" | "Fournitures" | "Services" | "Prestations Intellectuelles";

export type EnterpriseType = 
    | "Entreprise Individuelle" 
    | "SARL / SARL U" 
    | "SA" 
    | "SAS / SAS U" 
    | "ONG / Association" 
    | "Autre";

export type Provider = {
    id: string;
    name: string; // Raison sociale
    category: ProviderCategory;
    enterpriseType: EnterpriseType;
    rccm: string;
    idu: string; // Identifiant Unique (remplace IFU)
    address: string;
    email: string;
    phone: string;
    contactPerson: string;
    status: 'Actif' | 'Inactif';
    createdAt: string;
};

export type ContractStatus = 'Passation' | 'En cours' | 'Avenant' | 'Terminé' | 'Résilié';
export type ContractType = 'Appel d\'offres' | 'Gré à gré' | 'Consultation' | 'Marché de gré à gré';

export type Contract = {
    id: string;
    title: string;
    reference: string;
    providerId: string;
    providerName: string; // Denormalized for display
    budgetLineId: string;
    budgetLineName: string; // Denormalized
    budgetLineCode: string; // Denormalized
    budgetYear: number;
    totalAmount: number;
    amountPaid: number;
    engagementDate: string;
    startDate: string;
    endDate: string;
    status: ContractStatus;
    type: ContractType;
    description?: string;
    createdAt: string;
};

export type InvoiceStatus = 'En attente' | 'Validée' | 'Payée' | 'Annulée';

export type Invoice = {
    id: string;
    contractId: string;
    contractRef: string; // Denormalized
    reference: string;
    amount: number;
    date: string;
    dueDate?: string;
    status: InvoiceStatus;
    observations?: string;
    createdAt: string;
};
