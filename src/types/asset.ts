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


export type AssetColumnKeys = keyof Asset;

export type Fleet = {
    plate: string; // Firestore document ID
    makeModel: string;
    assignedTo: string;
    maintenanceDue: string; // YYYY-MM-DD
    status: 'Disponible' | 'En mission' | 'En maintenance' | 'Hors service';
};
