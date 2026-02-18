'use server';
/**
 * @fileOverview Defines mission-related tools for the AI assistant.
 * 
 * - getMissionInfo: A tool to retrieve mission information, optionally filtered by status.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getMissions } from '@/services/mission-service';
import type { Mission } from '@/lib/data';

const MissionStatusSchema = z.enum(["Planned", "In Progress", "Completed", "Cancelled"]);

export const getMissionInfo = ai.defineTool(
  {
    name: 'getMissionInfo',
    description: 'Get a list of company missions. You can optionally filter by status.',
    inputSchema: z.object({
      status: MissionStatusSchema.optional().describe('The status of the missions to retrieve.'),
    }),
    outputSchema: z.string().describe('A JSON string containing a list of missions or a "not found" message.'),
  },
  async (input) => {
    console.log(`[getMissionInfo] Searching for missions with status: ${input.status || 'any'}`);
    try {
      let missions = await getMissions();

      if (input.status) {
        const statusMap: Record<string, Mission['status']> = {
          "Planned": "Planifiée",
          "In Progress": "En cours",
          "Completed": "Terminée",
          "Cancelled": "Annulée"
        };
        const targetStatus = statusMap[input.status];
        if (targetStatus) {
          missions = missions.filter(mission => mission.status === targetStatus);
        }
      }

      if (missions.length === 0) {
        return `No missions found${input.status ? ` with status "${input.status}"` : ''}.`;
      }

      // Return a summary of the found missions
      return JSON.stringify(missions.map(m => ({
        title: m.title,
        assignedTo: m.participants?.map(p => p.employeeName).join(', ') || 'Unassigned',
        startDate: m.startDate,
        endDate: m.endDate,
        status: m.status,
      })));
    } catch (error) {
      console.error('[getMissionInfo] Error searching for missions:', error);
      return 'An error occurred while searching for missions.';
    }
  }
);
