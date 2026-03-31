export const supplyCategories = ["Papeterie", "Cartouches d'encre", "Matériel de nettoyage", "Fournitures de bureau", "Consommables Informatiques", "Archives", "Outils", "Autre"] as const;

export type SupplyCategory = typeof supplyCategories[number];
