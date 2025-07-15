'use server';

/**
 * @fileOverview A simple HR assistant flow.
 *
 * - askAssistant - A function that handles the assistant's response.
 * - AskAssistantInput - The input type for the askAssistant function.
 * - AskAssistantOutput - The return type for the askAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskAssistantInputSchema = z.string().describe('The user question for the HR assistant.');
export type AskAssistantInput = z.infer<typeof AskAssistantInputSchema>;

const AskAssistantOutputSchema = z.string().describe("The assistant's response.");
export type AskAssistantOutput = z.infer<typeof AskAssistantOutputSchema>;

export async function askAssistant(input: AskAssistantInput): Promise<AskAssistantOutput> {
  return assistantFlow(input);
}

const assistantPrompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: {schema: AskAssistantInputSchema},
  output: {schema: AskAssistantOutputSchema},
  prompt: `You are an expert HR assistant for a company named SynergieRH.
  Your role is to provide helpful and accurate information on human resources topics, company policies, and best practices for management.
  
  When responding, be professional, clear, and concise.

  Here is the user's question: {{{prompt}}}
  `,
});

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AskAssistantInputSchema,
    outputSchema: AskAssistantOutputSchema,
  },
  async input => {
    const {output} = await assistantPrompt(input);
    return output!;
  }
);
