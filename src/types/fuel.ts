
export interface FuelProvider {
    id: string;
    name: string;
    contactPerson?: string;
    phoneNumber?: string;
    email?: string;
    contractNumber?: string;
    status: 'active' | 'inactive';
    createdAt: string;
}

export interface FuelCard {
    id: string;
    cardNumber: string;
    label?: string; // e.g. "CARTE MISSION 2"
    providerId: string;
    assignmentType: 'vehicle' | 'employee' | 'generic' | 'unassigned';
    assignmentId?: string; // vehicle plate or employee id
    currentBalance: number;
    status: 'active' | 'blocked' | 'expired';
    expiryDate?: string;
}

export interface FuelTransaction {
    id: string;
    cardId: string;
    type: 'recharge' | 'expense';
    amount: number;
    liters?: number; // Only for expenses
    date: string;
    odometer?: number; // For expenses
    vehiclePlate?: string; // Captured even if generic card
    driverName?: string; // Captured even if generic card
    receiptNumber?: string;
    missionNumber?: string;
    missionRoute?: string;
    missionDuration?: string;
    missionHead?: string;
    unitPrice?: number;
    service?: string;
    notes?: string;
    performedBy: string; // User ID
}

export interface FuelSummary {
    totalBudget: number; // Sum of recharges
    totalSpent: number; // Sum of expenses
    currentBalance: number; // Sum of card balances
}
