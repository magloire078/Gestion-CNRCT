export const supplyCategories = [
  "Petits matériels, fourniture de bureau et documentation",
  "Fourniture et consommables pour le materiel informatique",
  "Cartouches d'encre",
  "Matériel et fournitures d'entretien",
  "Archives",
  "Outils",
  "Autre"
] as const;

export type SupplyCategory = typeof supplyCategories[number];
