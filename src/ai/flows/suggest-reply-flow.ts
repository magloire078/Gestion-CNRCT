
'use server';

/**
 * @fileOverview An AI flow to suggest replies for helpdesk tickets.
 *
 * - getSuggestedReply - A function that analyzes a ticket conversation and suggests a reply.
 * - SuggestReplyInput - The input type for the function.
 * - SuggestReplyOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']), // 'user' is the client, 'assistant' is the agent
  content: z.string(),
});

const SuggestReplyInputSchema = z.object({
  history: z.array(MessageSchema).describe("The conversation history of the ticket."),
  ticketTitle: z.string().describe("The title of the ticket."),
  userName: z.string().describe("The name of the user who created the ticket."),
});
export type SuggestReplyInput = z.infer<typeof SuggestReplyInputSchema>;

export type SuggestReplyOutput = z.string();


export async function getSuggestedReply(
  input: SuggestReplyInput
): Promise<SuggestReplyOutput> {
  return suggestReplyFlow(input);
}


const suggestReplyPrompt = ai.definePrompt({
  name: 'suggestReplyPrompt',
  input: { schema: SuggestReplyInputSchema },
  output: { schema: z.string().describe("The suggested reply text.") },
  prompt: `You are a professional and helpful IT support agent for "SYSTEME DE GESTION CNRCT".
Your task is to analyze the conversation history for a support ticket and provide a concise, helpful, and professional reply to the user.

- The user who opened the ticket is named {{userName}}. Address them politely.
- The ticket title is: "{{ticketTitle}}".
- The conversation history is below:
{{#each history}}
  **{{role}}**: {{content}}
{{/each}}

Based on the entire conversation, suggest the next appropriate response for the support agent.
If you need more information, ask for it. If you have a solution, provide it clearly.
The response should be just the text of the reply, without any preamble or explanation.
`,
});

const suggestReplyFlow = ai.defineFlow(
  {
    name: 'suggestReplyFlow',
    inputSchema: SuggestReplyInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await suggestReplyPrompt(input);
    return output!;
  }
);
