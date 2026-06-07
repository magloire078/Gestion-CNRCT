export const allColumns = {
    index: "N°",
    matricule: "N° MAT",
    name: "NOM ET PRENOMS",
    poste: "POSTE",
    department: "SERVICE",
    sexe: "Sexe",
    Date_Naissance: "Date Nais.",
    Lieu_Naissance: "Lieu de Naissance",
    email: "CONTACT",
    status: "Statut",
    CNPS: "CNPS",
    dateEmbauche: "Prise de Service",
    Date_Depart: "Date Dep.",
    age: "Âge",
    Region: "Région",
    Departement: "Département",
    subPrefecture: "Sous-Préfecture",
    Village: "Village / Localité",
} as const;

export const chiefColumns = {
    index: "N°",
    matricule: "N° MAT",
    name: "NOM ET PRENOMS",
    poste: "TITRE / FONCTION",
    Region: "REGION",
    Departement: "DEPARTEMENT",
    subPrefecture: "SOUS-PREFECTURE",
    Village: "VILLAGE",
    Num_Decision: "REFERENCE",
    photoUrl: "PHOTO",
} as const;

export type ColumnKeys = keyof typeof allColumns | keyof typeof chiefColumns;
