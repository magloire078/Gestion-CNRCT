export const supplyCategories = ["Papeterie", "Cartouches d'encre", "Matériel de nettoyage", "Autre"] as const;

export type SupplyCategory = typeof supplyCategories[number];
