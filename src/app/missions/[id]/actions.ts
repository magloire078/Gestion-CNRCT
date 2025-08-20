
"use server";

import { generateDocument } from "@/ai/flows/generate-document";
import { getEmployee } from "@/services/employee-service";
import { deleteMission } from "@/services/mission-service";
import type { Mission } from "@/lib/data";

/**
 * Generates an HTML document for the mission order.
 * @param mission The mission object.
 * @returns An object with the generated document or an error message.
 */
export async function generateMissionOrderAction(mission: Mission): Promise<{ document?: string; error?: string; }> {
    if (!mission.assignedTo.length) {
        return { error: "Aucun employé n'est assigné à cette mission." };
    }

    try {
        // For simplicity, we'll use the first assigned employee for the main document fields.
        // A real implementation might generate separate orders or list all participants.
        const primaryEmployeeName = mission.assignedTo[0];
        // We need to fetch the employee details to get their "poste"
        const allEmployees = await getEmployee(primaryEmployeeName);
        
        const employeeDetails = allEmployees;

        const input = {
            documentType: 'Ordre de Mission',
            documentContent: mission.description, // Fallback content
            employeeContext: {
                numeroMission: mission.numeroMission,
                missionType: "SIMPLE", // This could be a field in the Mission object in the future
                name: mission.assignedTo.join(', '),
                poste: employeeDetails?.poste || 'N/A',
                destination: mission.lieuMission,
                objetMission: mission.description,
                moyenTransport: mission.moyenTransport,
                immatriculation: mission.immatriculation,
                dateDepart: mission.startDate,
                dateRetour: mission.endDate,
            }
        };

        const result = await generateDocument(input);
        
        // Wrap the raw text in a basic HTML structure for printing
        const htmlDoc = `
            <html>
                <head>
                    <title>Ordre de Mission ${mission.numeroMission}</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; margin: 2cm; }
                        pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; }
                    </style>
                </head>
                <body>
                    <pre>${result.generatedDocument}</pre>
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
