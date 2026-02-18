import { z } from "zod";

export const missionParticipantSchema = z.object({
    employeeName: z.string(),
    moyenTransport: z.enum(['Véhicule personnel', 'Véhicule CNRCT']).optional(),
    immatriculation: z.string().optional(),
    numeroOrdre: z.string().optional(),
    coutTransport: z.number().optional(),
    coutHebergement: z.number().optional(),
    totalIndemnites: z.number().optional(),
});

export const missionSchema = z.object({
    id: z.string(),
    numeroMission: z.string(),
    title: z.string(),
    description: z.string(),
    participants: z.array(missionParticipantSchema),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['Planifiée', 'En cours', 'Terminée', 'Annulée']),
    lieuMission: z.string().optional(),
});

export type MissionInput = z.infer<typeof missionSchema>;
