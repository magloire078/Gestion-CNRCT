export type MailType = 'Arrivant' | 'Départ' | 'Interne';
export type MailPriority = 'Basse' | 'Moyenne' | 'Haute' | 'Urgente';
export type MailStatus = 'Nouveau' | 'En cours' | 'Traité' | 'Classé';
export type MailCategory = 'Administratif' | 'Financier' | 'Juridique' | 'Technique' | 'RH' | 'Autre';

export type MailComment = {
    id: string;
    date: string;
    author: string;
    content: string;
    type?: 'Note' | 'Statut' | 'Assignation' | 'Autre';
};

export type Mail = {
    id: string; // Document ID in Firestore
    trackingId?: string; // Unique format: e.g., ARR-2026-0001
    type: MailType;
    title: string;
    description?: string;
    sender: string; // External sender or internal service/person
    recipient: string; // External recipient or internal service/person
    category: MailCategory;
    priority: MailPriority;
    status: MailStatus;
    entryDate: string; // YYYY-MM-DD
    dueDate?: string; // YYYY-MM-DD (Optional limit date)
    assignedEmployeeId?: string; // Linked employee ID
    assignedEmployeeName?: string; // Denormalized name for direct display
    attachmentUrl?: string; // PDF/scan file path on Cloudinary or other storage
    attachmentName?: string; // original file name
    comments?: MailComment[]; // History logs & notes
    createdAt?: string; // ISO date string
    updatedAt?: string; // ISO date string
};
