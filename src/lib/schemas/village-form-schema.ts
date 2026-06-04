import { z } from "zod";

/**
 * Schéma Zod spécifique aux formulaires sheet (add/edit Village).
 *
 * Diffère de villageInputSchema (lib/schemas/village-schema.ts) car les
 * inputs HTML rendent tout en string :
 * - Les champs numériques arrivent en string et sont normalisés via preprocessNumber
 * - Les arrays (langues, ethnies, activités, cultures) arrivent comme une
 *   chaîne CSV à splitter au submit
 *
 * Source de vérité commune pour add-village-sheet et edit-village-sheet
 * (avant cette extraction, les deux fichiers re-déclaraient le même schéma
 * avec des risques de divergence silencieuse).
 */

export const preprocessNumber = (val: unknown): number | undefined => {
    if (val === "" || val === undefined || val === null) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
};

export const villageFormSchema = z.object({
    // Identité administrative
    name: z.string().min(2, "Le nom du village doit avoir au moins 2 caractères"),
    region: z.string().min(1, "La région est requise"),
    department: z.string().min(1, "Le département est requis"),
    subPrefecture: z.string().min(1, "La sous-préfecture est requise"),
    commune: z.string().optional(),
    codeINS: z.string().optional(),

    // Position SIG & Géo
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    altitude: z.preprocess(preprocessNumber, z.number().optional()),
    distanceFromCapital: z.preprocess(preprocessNumber, z.number().optional()),
    distanceFromChefLieu: z.preprocess(preprocessNumber, z.number().optional()),
    accessRoads: z.string().optional(),

    // Démographie
    population: z.preprocess(preprocessNumber, z.number().optional()),
    populationYear: z.preprocess(preprocessNumber, z.number().optional()),
    numberOfHouseholds: z.preprocess(preprocessNumber, z.number().optional()),
    mainEthnicGroups: z.string().optional(),
    languages: z.string().optional(),

    // Histoire & Culture
    history: z.string().optional(),
    customs: z.string().optional(),
    traditionalPractices: z.string().optional(),
    annualEvents: z.string().optional(),

    // Économie
    mainActivities: z.string().optional(),
    naturalResources: z.string().optional(),
    mainCrops: z.string().optional(),

    // Infrastructures
    hasSchool: z.boolean().default(false),
    hasHealthCenter: z.boolean().default(false),
    hasElectricity: z.boolean().default(false),
    hasWater: z.boolean().default(false),
    hasMosque: z.boolean().default(false),
    hasChurch: z.boolean().default(false),
    hasMarket: z.boolean().default(false),
    infrastructureNotes: z.string().optional(),

    // Chefferie
    chiefTitle: z.string().optional(),
    chieftaincyType: z.string().optional(),
    successionMode: z.string().optional(),
});

export type VillageFormValues = z.infer<typeof villageFormSchema>;

/**
 * Convertit le CSV saisi dans le formulaire en tableau de strings nettoyé.
 * Retourne un tableau vide si la valeur est absente ou vide.
 */
export const csvToArray = (value?: string | string[]): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.split(',').map((s) => s.trim()).filter(Boolean);
};
