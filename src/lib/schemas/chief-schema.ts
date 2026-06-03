import { z } from "zod";

/**
 * Schéma Zod canonique pour la collection `chiefs`.
 *
 * `chiefBaseSchema`  = champs partagés création/édition (sans id, sans audit).
 * `chiefSchema`      = chiefBaseSchema + id + audit. Pour parser une lecture Firestore.
 * `chiefInputSchema` = chiefBaseSchema, pour les inputs de formulaire.
 *
 * Note: `village` (string) et `villageId` (FK) cohabitent intentionnellement,
 * cf. types/chief.ts. Le service chief-service.syncChiefVillageFields() les
 * réaligne sur écriture.
 */

export const chiefRoleSchema = z.enum([
    "Roi",
    "Chef de province",
    "Chef de canton",
    "Chef de tribu",
    "Chef de Village",
]);

export const designationModeSchema = z.enum([
    "Héritage",
    "Élection",
    "Nomination coutumière",
    "Autre",
]);

export const chiefStatusSchema = z.enum(["actif", "archive", "a_vie"]);

export const chiefCareerEventSchema = z.object({
    id: z.string(),
    date: z.string(),
    title: z.string().min(1),
    description: z.string(),
    type: z.enum(["Intronisation", "Médaille", "Médiation", "Mission", "Autre"]),
});

/**
 * Numéro d'enregistrement officiel CNRCT.
 * Format attendu (souple) : CNRCT- ou CNRCT/ suivi d'au moins 3 chiffres ou lettres.
 * Le champ reste optionnel pour ne pas bloquer les imports historiques.
 */
export const cnrctRegistrationNumberSchema = z
    .string()
    .regex(
        /^(CNRCT[-/].{3,}|[A-Z0-9-]{4,})$/i,
        "Format attendu : CNRCT-XXXX (ou code équivalent d'au moins 4 caractères)."
    )
    .optional()
    .or(z.literal(''));

export const chiefBaseSchema = z.object({
    name: z.string().min(1, "Le nom complet est obligatoire."),
    lastName: z.string().optional(),
    firstName: z.string().optional(),
    title: z.string().min(1, "Le titre est obligatoire."),
    role: chiefRoleSchema,
    designationDate: z.string().optional(),
    designationMode: designationModeSchema.optional(),

    // Localisation administrative
    region: z.string().min(1, "La région est obligatoire."),
    department: z.string().min(1, "Le département est obligatoire."),
    subPrefecture: z.string().min(1, "La sous-préfecture est obligatoire."),
    village: z.string().min(1, "La localité est obligatoire."),
    villageId: z.string().optional(),

    // Culture
    ethnicGroup: z.string().optional(),
    customs: z.string().optional(),
    languages: z.array(z.string()).optional(),

    // Contact
    contact: z.string().min(1, "Un contact est obligatoire."),
    phone: z.string().optional(),
    email: z.string().email("Email invalide.").optional().or(z.literal('')),
    address: z.string().optional(),

    CNRCTRegistrationNumber: cnrctRegistrationNumberSchema,
    officialDocuments: z.string().optional(),

    bio: z.string(),
    photoUrl: z.string(),
    territoryMapUrl: z.string().url().optional().or(z.literal('')),

    // Géo
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),

    parentChiefId: z.string().nullable().optional(),
    sexe: z.enum(['Homme', 'Femme', 'Autre']).optional(),
    dateOfBirth: z.string().optional(),
    regencyStartDate: z.string().optional(),
    regencyEndDate: z.string().optional(),
    status: chiefStatusSchema.optional(),

    // Authority Life Hub
    career: z.array(chiefCareerEventSchema).optional(),
    meritPoints: z.number().min(0).optional(),
    audit: z
        .object({
            createdAt: z.string(),
            updatedAt: z.string(),
            lastVerifiedBy: z.string().optional(),
            lastVerifiedAt: z.string().optional(),
        })
        .optional(),
});

export const chiefSchema = chiefBaseSchema.extend({
    id: z.string(),
});

export const chiefInputSchema = chiefBaseSchema;

export type ChiefInput = z.infer<typeof chiefInputSchema>;
