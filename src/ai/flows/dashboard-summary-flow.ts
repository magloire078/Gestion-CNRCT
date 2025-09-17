'use server';

/**
 * @fileOverview An AI flow to generate a dashboard summary.
 *
 * - getDashboardSummary - A function that returns a brief summary of company activities.
 */

import { ai } from '@/ai/genkit';
import { getDashboardStats } from '@/ai/tools/dashboard-tools';
import { z } from 'zod';

const DashboardSummaryOutputSchema = z.string().describe("A brief, friendly summary of the company's current status.");
export type DashboardSummaryOutput = z.infer<typeof DashboardSummaryOutputSchema>;

export async function getDashboardSummary(): Promise<DashboardSummaryOutput> {
  return dashboardSummaryFlow();
}

const dashboardSummaryPrompt = ai.definePrompt({
  name: 'dashboardSummaryPrompt',
  tools: [getDashboardStats],
  prompt: `You are a helpful assistant for the company "SYSTEME DE GESTION CNRCT".
  Your goal is to provide a very brief, friendly, and informative summary of the current company stats.
  Use the getDashboardStats tool to get the data you need.
  Mention the number of active employees, pending leaves, and missions in progress.
  If all stats are zero, output a message like: "Bonjour ! Il n'y a pas d'activité particulière pour le moment."
  Otherwise, keep it to a single, welcoming sentence. For example: "Bonjour ! Il y a actuellement X employés actifs, Y demandes de congé en attente et Z missions en cours."
  
  IMPORTANT: Your entire response MUST BE A SINGLE, RAW STRING, not a JSON object or null.
  DO NOT output JSON.
  `,
});

const dashboardSummaryFlow = ai.defineFlow(
  {
    name: 'dashboardSummaryFlow',
    outputSchema: DashboardSummaryOutputSchema,
  },
  async () => {
    try {
      const { output } = await dashboardSummaryPrompt();
      return output || "Résumé non disponible pour le moment.";
    } catch (error) {
      console.error("[dashboardSummaryFlow] Error calling AI:", error);
      return "Résumé non disponible pour le moment.";
    }
  }
);
