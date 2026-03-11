export type RegencyHistory = {
    id: string;
    villageId?: string; // Optional – linked via Firestore village doc ID
    villageName?: string; // Village name for querying without a villageId
    chiefId?: string; // Optional – linked to a chief doc
    chiefName: string;
    chiefTitle?: string;
    startDate: string; // YYYY-MM-DD or just YYYY
    endDate?: string;
    isCurrent?: boolean;
    achievements?: string;
    notes?: string;
    photoUrl?: string;
};

