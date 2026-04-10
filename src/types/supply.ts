export type Supply = {
    id: string; // Firestore document ID
    name: string;
    code?: string; // Standardized code (e.g. XX-YY-NNN)
    supplierReference?: string; // Legacy/Supplier code
    category: "Petits matériels, fourniture de bureau et documentation" | "Fourniture et consommables pour le materiel informatique" | "Cartouches d'encre" | "Matériel et fournitures d'entretien" | "Archives" | "Outils" | "Autre";
    inkType?: string; // e.g., 'HP 651', 'Toner 12A'
    quantity: number;
    reorderLevel: number;
    lastRestockDate: string; // YYYY-MM-DD
    linkedAssetTag?: string; // Link to an Asset (e.g., a printer)
    photoUrl?: string;
};

export type SupplyTransaction = {
    id?: string;
    supplyId: string;
    supplyName: string;
    recipientId?: string; // Employee ID
    recipientName: string; // Employee name or manual entry
    quantity: number;
    date: string; // YYYY-MM-DD
    timestamp?: string; // ISO String
    type: 'distribution' | 'restock';
    performedBy: string; // User ID
};

export type SupplyRequestItem = {
    supplyId: string;
    supplyName: string;
    quantity: number;
    photoUrl?: string;
};

export type SupplyRequestStatus = 'Draft' | 'Pending_Supervisor' | 'Pending_Stock' | 'Served' | 'Rejected';

export type SupplyRequest = {
    id: string;
    employeeId: string;
    employeeName: string;
    departmentId?: string;
    items: SupplyRequestItem[];
    status: SupplyRequestStatus;
    
    // Supervisor Validation
    supervisorId?: string;
    supervisorName?: string;
    supervisorComment?: string;
    validatedBySupervisorAt?: string;
    
    // Stock Fulfillment
    stockManagerId?: string;
    stockManagerName?: string;
    servedAt?: string;
    
    // Rejection
    rejectionReason?: string;
    rejectedAt?: string;
    rejectedBy?: string;

    createdAt: string;
    updatedAt: string;
};
