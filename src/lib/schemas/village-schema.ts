import { z } from "zod";

/**
 * Schéma Zod canonique pour la collection `villages`.
 * À utiliser dans les formulaires (add/edit) et pour valider les imports.
 *
 * `villageBaseSchema` = champs partagés création/édition (sans id, sans audit).
 * `villageSchema`     = villageBaseSchema + id + audit. Pour parser une lecture Firestore.
 * `villageInputSchema`= villageBaseSchema, pour les inputs de formulaire.
 */

export const villageBaseSchema = z.object({
    // Identité administrative
    name: z.string().min(1, "Le nom de la localité est obligatoire."),
    region: z.string().min(1, "La région est obligatoire."),
    department: z.string().min(1, "Le département est obligatoire."),
    subPrefecture: z.string().min(1, "La sous-préfecture est obligatoire."),
    commune: z.string().optional(),
    codeINS: z.string().optional(),

    // Situation géographique
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    altitude: z.number().min(0).optional(),
    distanceFromCapital: z.number().min(0).optional(),
    distanceFromChefLieu: z.number().min(0).optional(),
    accessRoads: z.string().optional(),

    // Démographie
    population: z.number().int().min(0).optional(),
    populationYear: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    numberOfHouseholds: z.number().int().min(0).optional(),
    mainEthnicGroups: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),

    // Histoire et culture
    history: z.string().optional(),
    customs: z.string().optional(),
    traditionalPractices: z.string().optional(),
    annualEvents: z.string().optional(),

    // Ressources et économie
    mainActivities: z.array(z.string()).optional(),
    naturalResources: z.string().optional(),
    mainCrops: z.array(z.string()).optional(),

    // Infrastructure
    hasSchool: z.boolean().optional(),
    hasHealthCenter: z.boolean().optional(),
    hasElectricity: z.boolean().optional(),
    hasWater: z.boolean().optional(),
    hasMosque: z.boolean().optional(),
    hasChurch: z.boolean().optional(),
    hasMarket: z.boolean().optional(),
    infrastructureNotes: z.string().optional(),

    // Chefferie
    chiefTitle: z.string().optional(),
    chieftaincyType: z.string().optional(),
    successionMode: z.string().optional(),

    // Médias
    photoUrl: z.string().url().optional().or(z.literal('')),
    photoUrls: z.array(z.string().url()).optional(),

    // Metadata
    isAutonomousDistrict: z.boolean().optional(),
    developmentScore: z.number().min(0).max(100).optional(),
});

export const villageSchema = villageBaseSchema.extend({
    id: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const villageInputSchema = villageBaseSchema;

export type VillageInput = z.infer<typeof villageInputSchema>;
