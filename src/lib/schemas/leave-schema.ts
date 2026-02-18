import { z } from "zod";

export const leaveTypeSchema = z.enum(["Congé Annuel", "Congé Maladie", "Congé Personnel", "Congé Maternité", "Congé sans solde"]);
export const leaveStatusSchema = z.enum(['Approuvé', 'En attente', 'Rejeté']);

export const leaveSchema = z.object({
    id: z.string(),
    employee: z.string(),
    type: leaveTypeSchema,
    startDate: z.string(),
    endDate: z.string(),
    status: leaveStatusSchema,
    num_decision: z.string().optional(),
    reason: z.string().optional(),
});

export type LeaveInput = z.infer<typeof leaveSchema>;
