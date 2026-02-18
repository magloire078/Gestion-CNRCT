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
