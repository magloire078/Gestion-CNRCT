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

export type Month = 'Janvier' | 'Février' | 'Mars' | 'Avril' | 'Mai' | 'Juin' | 'Juillet' | 'Août' | 'Septembre' | 'Octobre' | 'Novembre' | 'Décembre';

export interface NewsItem {
    id: string;
    title: string;
    content: string; // Rich text / Markdown or HTML
    summary: string;
    imageUrl?: string;
    authorId: string;
    authorName: string;
    createdAt: string; // ISO String
    updatedAt: string;
    published: boolean;
    category: 'Général' | 'Événement' | 'RH' | 'Directoire';
    tags?: string[];
    viewCount: number;
}

