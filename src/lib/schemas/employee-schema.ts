import { z } from "zod";

export const employeeStatusSchema = z.string().optional().default('Actif');

export const employeeSchema = z.object({
    id: z.string(),
    matricule: z.string().optional().default(''),
    name: z.string().optional().default(''),
    lastName: z.string().optional().default(''),
    firstName: z.string().optional().default(''),
    poste: z.string().optional().default(''),
    departmentId: z.string().optional(),
    directionId: z.string().optional(),
    serviceId: z.string().optional(),
    status: employeeStatusSchema,
    photoUrl: z.string().optional().default(''),
    userId: z.string().optional(),
    
    // Replacement Info
    remplaceId: z.string().optional(),
    remplaceNom: z.string().optional(),

    // Personal Info
    email: z.string().optional().or(z.literal('')).default(''),
    mobile: z.string().optional(),
    Date_Naissance: z.string().optional(),
    Lieu_Naissance: z.string().optional(),
    sousPrefecture: z.string().optional(),
    village: z.string().optional(),
    situationMatrimoniale: z.string().optional(),
    enfants: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    sexe: z.string().optional().transform((val) => {
        if (!val) return undefined;
        if (val === 'M' || val === 'H') return 'Homme';
        if (val === 'F') return 'Femme';
        return val;
    }),

    // Professional Info
    dateEmbauche: z.string().optional(),
    Date_Depart: z.string().optional(),
    Date_Immatriculation: z.string().optional(),
    Date_Cessation_CNPS: z.string().optional(),
    Num_Decision: z.string().optional(),

    // Payroll Info
    baseSalary: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    payFrequency: z.string().optional(),
    nextPayDate: z.string().optional(),
    Salaire_Brut: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    Salaire_Net: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    indemniteTransportImposable: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    indemniteResponsabilite: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    indemniteLogement: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    indemniteSujetion: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    indemniteCommunication: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    indemniteRepresentation: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    primeAnciennete: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    transportNonImposable: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    parts: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    categorie: z.string().optional(),
    cnpsEmploye: z.string().optional(),
    cnpsEmployeur: z.string().optional(),

    // Bank Info
    banque: z.string().optional(),
    numeroCompte: z.string().optional(),
    CB: z.string().optional(),
    CG: z.string().optional(),
    Cle_RIB: z.string().optional(),

    // Other fields
    CNPS: z.union([z.boolean(), z.string()]).optional().transform((val) => typeof val === 'string' ? val === 'true' || val === '1' || val === 'OUI' : val),
    solde_conges: z.union([z.number(), z.string()]).optional().transform((val) => val === undefined || val === '' ? undefined : Number(val)),
    department: z.string().optional(), // Legacy fallback
    Departement: z.string().optional(),
    Region: z.string().optional(),
}).passthrough();

export type EmployeeInput = z.infer<typeof employeeSchema>;
