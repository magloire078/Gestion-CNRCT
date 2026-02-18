export const allColumns = {
    index: "N°",
    matricule: "N° MAT",
    name: "NOM ET PRENOMS",
    poste: "POSTE",
    department: "SERVICE",
    sexe: "Sexe",
    Date_Naissance: "Date de Naissance",
    Lieu_Naissance: "Lieu de Naissance",
    email: "CONTACT",
    status: "Statut",
    CNPS: "CNPS",
} as const;

export type ColumnKeys = keyof typeof allColumns;
