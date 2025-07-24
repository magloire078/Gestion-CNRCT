'use server';

/**
 * @fileOverview An AI flow to provide conflict resolution advice.
 *
 * - getConflictResolutionAdvice - A function that analyzes a conflict and provides suggestions.
 * - ConflictResolutionInput - The input type for the function.
 * - ConflictResolutionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConflictResolutionInputSchema = z.object({
  description: z.string().describe('The description of the conflict to be analyzed.'),
});
export type ConflictResolutionInput = z.infer<typeof ConflictResolutionInputSchema>;

const ConflictResolutionOutputSchema = z.object({
  analysis: z.string().describe("A brief analysis of the conflict's key issues."),
  mediationSteps: z.array(z.string()).describe('A list of concrete steps for mediation.'),
  communicationStrategies: z.array(z.string()).describe('A list of communication tips for the involved parties.'),
});
export type ConflictResolutionOutput = z.infer<typeof ConflictResolutionOutputSchema>;


export async function getConflictResolutionAdvice(
  input: ConflictResolutionInput
): Promise<ConflictResolutionOutput> {
  return conflictResolutionFlow(input);
}


const conflictResolutionPrompt = ai.definePrompt({
  name: 'conflictResolutionPrompt',
  input: { schema: ConflictResolutionInputSchema },
  output: { schema: ConflictResolutionOutputSchema },
  prompt: `You are an expert conflict resolution mediator and HR professional.
  Your task is to analyze a conflict description and provide structured, actionable advice.

  Analyze the following conflict:
  "{{{description}}}"

  Based on your analysis, provide the following:
  1. A brief analysis of the core issues at play.
  2. A list of concrete, step-by-step actions for a neutral mediator to take.
  3. A list of communication strategies or phrases that can be used to de-escalate the situation.

  Your response must be professional, impartial, and constructive.
  `,
});

const conflictResolutionFlow = ai.defineFlow(
  {
    name: 'conflictResolutionFlow',
    inputSchema: ConflictResolutionInputSchema,
    outputSchema: ConflictResolutionOutputSchema,
  },
  async (input) => {
    const { output } = await conflictResolutionPrompt(input);
    return output!;
  }
);
