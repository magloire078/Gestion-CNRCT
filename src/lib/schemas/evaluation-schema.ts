import { z } from "zod";

export const goalSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.enum(['Not Started', 'In Progress', 'Completed']),
});

export const evaluationSchema = z.object({
    id: z.string(),
    employeeId: z.string(),
    employeeName: z.string(),
    managerId: z.string(),
    managerName: z.string(),
    reviewPeriod: z.string(),
    status: z.enum(['Draft', 'Pending Manager Review', 'Pending Employee Sign-off', 'Completed']),
    scores: z.record(z.string(), z.number()),
    strengths: z.string(),
    areasForImprovement: z.string(),
    managerComments: z.string(),
    employeeComments: z.string().optional(),
    goals: z.array(goalSchema),
    evaluationDate: z.string(),
});

export type EvaluationInput = z.infer<typeof evaluationSchema>;
