export const allAssetColumns = {
    tag: "N° Inventaire",
    type: "Type",
    fabricant: "Fabricant",
    modele: "Modèle",
    numeroDeSerie: "N° Série",
    ipAddress: "Adresse IP",
    assignedTo: "Assigné à",
    status: "Statut",
} as const;

export type AssetColumnKeys = keyof typeof allAssetColumns;
