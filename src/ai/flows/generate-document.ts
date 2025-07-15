'use server';

/**
 * @fileOverview Generates contracts and policy documents using a generative AI tool.
 *
 * - generateDocument - A function that generates documents based on the provided type and content.
 * - GenerateDocumentInput - The input type for the generateDocument function.
 * - GenerateDocumentOutput - The return type for the generateDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDocumentInputSchema = z.object({
  documentType: z
    .string()
    .describe('The type of document to generate (e.g., contract, policy).'),
  documentContent: z.string().describe('The content or context for the document.'),
});
export type GenerateDocumentInput = z.infer<typeof GenerateDocumentInputSchema>;

const GenerateDocumentOutputSchema = z.object({
  generatedDocument: z.string().describe('The generated document text.'),
});
export type GenerateDocumentOutput = z.infer<typeof GenerateDocumentOutputSchema>;

export async function generateDocument(input: GenerateDocumentInput): Promise<GenerateDocumentOutput> {
  return generateDocumentFlow(input);
}

const generateDocumentPrompt = ai.definePrompt({
  name: 'generateDocumentPrompt',
  input: {schema: GenerateDocumentInputSchema},
  output: {schema: GenerateDocumentOutputSchema},
  prompt: `You are an AI assistant specialized in generating various types of documents.

  Based on the provided document type and content, generate a complete and coherent document.

  Document Type: {{{documentType}}}
  Content: {{{documentContent}}}
  `,
});

const generateDocumentFlow = ai.defineFlow(
  {
    name: 'generateDocumentFlow',
    inputSchema: GenerateDocumentInputSchema,
    outputSchema: GenerateDocumentOutputSchema,
  },
  async input => {
    const {output} = await generateDocumentPrompt(input);
    return output!;
  }
);
