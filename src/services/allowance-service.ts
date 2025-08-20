// src/services/allowance-service.ts

// Pour l'instant, les barèmes sont définis ici.
// Dans une application réelle, ils pourraient provenir d'une collection Firestore pour être modifiables.
const allowanceRates: Record<string, number> = {
    'A1': 75000,
    'A2': 75000,
    'A3': 60000,
    'B1': 60000,
    'B2': 50000,
    'B3': 50000,
    'C1': 40000,
    'C2': 40000,
    'C3': 30000,
    'D1': 30000,
    'D2': 25000,
    'E1': 25000,
    'E2': 20000,
    'Par défaut': 20000, // Taux par défaut si la catégorie n'est pas trouvée
};

/**
 * Récupère le taux d'indemnité de mission journalier pour une catégorie d'employé donnée.
 * @param category La catégorie de l'employé (ex: "A1", "B2").
 * @returns Le taux d'indemnité journalier en FCFA.
 */
export function getAllowanceRate(category?: string): number {
    if (category && allowanceRates[category]) {
        return allowanceRates[category];
    }
    return allowanceRates['Par défaut'];
}
