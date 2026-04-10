
export interface SyscohadaItem {
    code: string;
    name: string;
    category: "Petits matériels, fourniture de bureau et documentation" | "Fourniture et consommables pour le materiel informatique" | "Cartouches d'encre" | "Matériel et fournitures d'entretien" | "Archives" | "Outils" | "Autre";
}

export const SYSCOHADA_SUPPLIES_CATALOG: SyscohadaItem[] = [
    // CHAPITRE 60 : ACHATS DE BIENS
    // ARTICLE 602 : FOURNITURES CONSOMMABLES (Papeterie, Bureau)
    { code: "602101", name: "Rames de papier A4 (80g)", category: "Petits matériels, fourniture de bureau et documentation" },
    { code: "602102", name: "Stylos à bille (Bleu / Noir / Rouge)", category: "Petits matériels, fourniture de bureau et documentation" },
    { code: "602103", name: "Enveloppes (A4 / A5 / DL)", category: "Petits matériels, fourniture de bureau et documentation" },
    { code: "602104", name: "Cahiers et Blocs-notes", category: "Petits matériels, fourniture de bureau et documentation" },
    { code: "602105", name: "Classeurs et Chemises", category: "Petits matériels, fourniture de bureau et documentation" },
    { code: "602106", name: "Agrafeuses et Agrafes", category: "Petits matériels, fourniture de bureau et documentation" },
    { code: "602107", name: "Trombones et Punaises", category: "Petits matériels, fourniture de bureau et documentation" },
    { code: "602108", name: "Marqueurs et Surligneurs", category: "Petits matériels, fourniture de bureau et documentation" },

    // ARTICLE 606 : ACHATS DE MATIÈRES ET FOURNITURES (Informatique, Entretien)
    { code: "606101", name: "Cartouches d'encre Noir", category: "Cartouches d'encre" },
    { code: "606102", name: "Cartouches d'encre Couleur (CMY)", category: "Cartouches d'encre" },
    { code: "606103", name: "Toners pour imprimante Laser", category: "Cartouches d'encre" },
    { code: "606201", name: "Clés USB (16GB / 32GB / 64GB)", category: "Autre" },
    { code: "606202", name: "Disques durs externes", category: "Autre" },
    { code: "606203", name: "Souris et Claviers de rechange", category: "Autre" },

    // ARTICLE 606 (Suite) : Entretien et Nettoyage
    { code: "606301", name: "Papier hygiénique", category: "Matériel et fournitures d'entretien" },
    { code: "606302", name: "Savon liquide et Gel hydroalcoolique", category: "Matériel et fournitures d'entretien" },
    { code: "606303", name: "Désinfectants et Détergents", category: "Matériel et fournitures d'entretien" },
    { code: "606304", name: "Sacs poubelle", category: "Matériel et fournitures d'entretien" },
    { code: "606305", name: "Essuie-tout et Mouchoirs", category: "Matériel et fournitures d'entretien" },

    // ARTICLE 606 (Divers)
    { code: "606901", name: "Piles (AA / AAA)", category: "Autre" },
    { code: "606902", name: "Ampoules et Tubes néons", category: "Autre" },
    { code: "606903", name: "Petit outillage de bureau", category: "Autre" },

    // ARTICLE 6211 : FOURNITURES DE BUREAU, MATÉRIEL INFORMATIQUE ET DOCUMENTATION
    { code: "621101", name: "Papeterie et fournitures de bureau", category: "Petits matériels, fourniture de bureau et documentation" },
    { code: "621102", name: "Livres, revues et documentation technique", category: "Petits matériels, fourniture de bureau et documentation" },
    { code: "621103", name: "Fournitures informatiques non stockables", category: "Petits matériels, fourniture de bureau et documentation" },
];

/**
 * Searches for SYSCOHADA items by code or name
 */
export async function searchSyscohadaCatalog(query: string): Promise<SyscohadaItem[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    return SYSCOHADA_SUPPLIES_CATALOG.filter(item => 
        item.code.includes(q) || 
        item.name.toLowerCase().includes(q)
    );
}

/**
 * Returns a SYSCOHADA item by its exact code
 */
export function getSyscohadaItemByCode(code: string): SyscohadaItem | undefined {
    return SYSCOHADA_SUPPLIES_CATALOG.find(item => item.code === code);
}
