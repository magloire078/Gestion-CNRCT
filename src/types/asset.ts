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
