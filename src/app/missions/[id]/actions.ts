

"use server";

import { generateDocument } from "@/ai/flows/generate-document";
import { searchEmployees } from "@/services/employee-service";
import { deleteMission } from "@/services/mission-service";
import type { Mission, MissionParticipant } from "@/lib/data";

/**
 * Generates an HTML document for the mission order.
 * @param mission The mission object.
 * @returns An object with the generated document or an error message.
 */
export async function generateMissionOrderAction(mission: Mission): Promise<{ document?: string; error?: string; }> {
    if (!mission.participants || mission.participants.length === 0) {
        return { error: "Aucun participant n'est assigné à cette mission." };
    }

    try {
        let allDocumentsHtml = '';

        for (const participant of mission.participants) {
            const employeesWithName = await searchEmployees(participant.employeeName);
            const employeeDetails = employeesWithName.length > 0 ? employeesWithName[0] : null;

             const input = {
                documentType: 'Ordre de Mission' as const,
                documentContent: mission.description,
                employeeContext: {
                    numeroMission: participant.numeroOrdre || mission.numeroMission,
                    missionType: "SIMPLE", 
                    name: participant.employeeName,
                    poste: employeeDetails?.poste || 'N/A',
                    destination: mission.lieuMission,
                    objetMission: mission.description,
                    moyenTransport: participant.moyenTransport,
                    immatriculation: participant.immatriculation,
                    dateDepart: mission.startDate,
                    dateRetour: mission.endDate,
                }
            };

            const result = await generateDocument(input);
            allDocumentsHtml += `<div class="page-break"><pre>${result.generatedDocument}</pre></div>`;
        }

        const htmlDoc = `
            <html>
                <head>
                    <title>Ordre de Mission ${mission.numeroMission}</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; margin: 2cm; }
                        pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; }
                        .page-break { page-break-after: always; }
                        .page-break:last-child { page-break-after: auto; }
                    </style>
                </head>
                <body>
                    ${allDocumentsHtml}
                </body>
            </html>
        `;

        return { document: htmlDoc };
    } catch (error) {
        console.error("Failed to generate mission order:", error);
        const message = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
        return { error: `Impossible de générer le document: ${message}` };
    }
}


/**
 * Deletes a mission from the database.
 * @param missionId The ID of the mission to delete.
 */
export async function deleteMissionAction(missionId: string): Promise<void> {
    await deleteMission(missionId);
}
