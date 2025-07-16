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
import { getEmployeeInfo } from '@/ai/tools/hr-tools';
import { getMissionInfo } from '@/ai/tools/mission-tools';

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
  tools: [getEmployeeInfo, getMissionInfo],
  prompt: `You are an expert HR assistant for a company named "SYSTEME DE GESTION CNRCT".
  Your role is to provide helpful and accurate information on human resources topics, company policies, and best practices for management.
  
  If the user asks for information about a specific employee by name or matricule, use the getEmployeeInfo tool to find their details.
  If the tool returns no results, inform the user that the employee was not found.
  If the tool returns employee data, present it to the user in a clear and readable format.

  If the user asks about missions (e.g., "what are the current missions?", "show me completed missions"), use the getMissionInfo tool. You can filter by status if the user specifies one.

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
