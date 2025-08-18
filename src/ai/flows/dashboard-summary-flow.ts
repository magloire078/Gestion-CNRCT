
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
  input: { schema: z.any() }, // Accept any input, we'll pass the stats object.
  output: { schema: DashboardSummaryOutputSchema },
  tools: [getDashboardStats],
  prompt: `You are a helpful assistant for the company "SYSTEME DE GESTION CNRCT".
  Your goal is to provide a very brief, friendly, and informative summary of the current company stats.
  Use the getDashboardStats tool to get the data you need.
  Mention the number of active employees, pending leaves, and missions in progress.
  Keep it to a single, welcoming sentence. For example: "Bonjour ! Il y a actuellement X employés actifs, Y demandes de congé en attente et Z missions en cours."
  
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
    // First, get the stats directly.
    const stats = await getDashboardStats();

    // If all stats are zero, return a default message without calling the LLM.
    if (stats.activeEmployees === 0 && stats.pendingLeaves === 0 && stats.inProgressMissions === 0) {
      return "Bonjour ! Il n'y a pas d'activité particulière pour le moment.";
    }

    // If there are stats, call the LLM to generate a nice sentence, passing the stats as context.
    const { output } = await dashboardSummaryPrompt(stats);

    // As a final fallback, ensure we never return null.
    return output || "Résumé non disponible pour le moment.";
  }
);
