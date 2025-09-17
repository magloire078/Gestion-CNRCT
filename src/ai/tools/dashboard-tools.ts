'use server';

/**
 * @fileOverview Defines a tool for gathering dashboard statistics.
 *
 * - getDashboardStats: A tool to retrieve key metrics for the dashboard summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getEmployees } from '@/services/employee-service';
import { getLeaves } from '@/services/leave-service';
import { getMissions } from '@/services/mission-service';

export const getDashboardStats = ai.defineTool(
  {
    name: 'getDashboardStats',
    description: 'Retrieves key statistics for the company dashboard, such as employee counts, leave requests, and mission statuses.',
    outputSchema: z.object({
      activeEmployees: z.number().describe('The number of currently active employees.'),
      pendingLeaves: z.number().describe('The number of leave requests that are pending approval.'),
      inProgressMissions: z.number().describe('The number of missions currently in progress.'),
    }),
  },
  async () => {
    try {
      const [employees, leaves, missions] = await Promise.all([
        getEmployees(),
        getLeaves(),
        getMissions(),
      ]);

      const activeEmployees = employees.filter(e => e.status === 'Actif').length;
      const pendingLeaves = leaves.filter(l => l.status === 'En attente').length;
      const inProgressMissions = missions.filter(m => m.status === 'En cours').length;

      return {
        activeEmployees,
        pendingLeaves,
        inProgressMissions,
      };
    } catch (error) {
      console.error('[getDashboardStats] Error fetching stats:', error);
      // Return 0s on error to avoid breaking the AI flow
      return {
        activeEmployees: 0,
        pendingLeaves: 0,
        inProgressMissions: 0,
      };
    }
  }
);
