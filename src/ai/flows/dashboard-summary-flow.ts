
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
  output: { schema: DashboardSummaryOutputSchema },
  tools: [getDashboardStats],
  prompt: `You are a helpful assistant for the company "SYSTEME DE GESTION CNRCT".
  Your goal is to provide a very brief, friendly, and informative summary of the current company stats.
  Use the getDashboardStats tool to get the data you need.
  Mention the number of active employees, pending leaves, and missions in progress.
  Keep it to a single, welcoming sentence. For example: "Bonjour ! Il y a actuellement X employés actifs, Y demandes de congé en attente et Z missions en cours."
  
  IMPORTANT: Your entire response must be a single, raw string, not a JSON object.
  `,
});

const dashboardSummaryFlow = ai.defineFlow(
  {
    name: 'dashboardSummaryFlow',
    outputSchema: DashboardSummaryOutputSchema,
  },
  async () => {
    const { output } = await dashboardSummaryPrompt();
    return output!;
  }
);

    