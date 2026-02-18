import { z } from "zod";

export const employeeStatusSchema = z.enum(['Actif', 'En congé', 'Licencié', 'Retraité', 'Décédé']);

export const employeeSchema = z.object({
    id: z.string(),
    matricule: z.string(),
    name: z.string(),
    lastName: z.string().optional(),
    firstName: z.string().optional(),
    poste: z.string(),
    departmentId: z.string().optional(),
    directionId: z.string().optional(),
    serviceId: z.string().optional(),
    status: employeeStatusSchema,
    photoUrl: z.string(),
    userId: z.string().optional(),

    // Personal Info
    email: z.string().email().optional().or(z.literal('')),
    mobile: z.string().optional(),
    Date_Naissance: z.string().optional(),
    Lieu_Naissance: z.string().optional(),
    situationMatrimoniale: z.string().optional(),
    enfants: z.number().optional(),
    sexe: z.enum(['Homme', 'Femme', 'Autre', 'M', 'F', 'H'])
        .optional()
        .transform((val) => {
            // Normaliser les valeurs abrégées vers les valeurs complètes
            if (val === 'M') return 'Homme';
            if (val === 'H') return 'Homme';
            if (val === 'F') return 'Femme';
            return val;
        }),

    // Professional Info
    dateEmbauche: z.string().optional(),
    Date_Depart: z.string().optional(),
    Date_Immatriculation: z.string().optional(),
    Num_Decision: z.string().optional(),

    // Payroll Info
    baseSalary: z.number().optional(),
    payFrequency: z.enum(['Mensuel', 'Bi-hebdomadaire']).optional(),
    nextPayDate: z.string().optional(),
    Salaire_Brut: z.number().optional(),
    Salaire_Net: z.number().optional(),

    // Bank Info
    banque: z.string().optional(),
    numeroCompte: z.string().optional(),
    CB: z.string().optional(),
    CG: z.string().optional(),
    Cle_RIB: z.string().optional(),

    // Other fields
    CNPS: z.boolean().optional(),
    solde_conges: z.number().optional(),
    department: z.string().optional(), // Legacy fallback
    Departement: z.string().optional(),
    Region: z.string().optional(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
