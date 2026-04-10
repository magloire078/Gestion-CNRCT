// Helpdesk Types
export type TicketStatus = 'Ouvert' | 'En cours' | 'Résolu' | 'Fermé';
export type TicketPriority = 'Basse' | 'Moyenne' | 'Haute';
export type TicketUrgency = 'Basse' | 'Moyenne' | 'Haute';
export type TicketImpact = 'Bas' | 'Moyen' | 'Élevé';
export type TicketCategory = 'Matériel' | 'Logiciel' | 'Réseau' | 'Accès/Comptes' | 'Foncier' | 'Autre';

export type Ticket = {
    id: string;
    title: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    urgency: TicketUrgency;
    impact: TicketImpact;
    category: TicketCategory;
    createdBy: string; // userId
    createdByName: string; // denormalized name
    createdAt: string; // ISO Date string
    assignedTo?: string; // agent userId
    assignedToName?: string; // denormalized agent name
    updatedAt: string; // ISO Date string
    solution?: string; // The final resolution
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
