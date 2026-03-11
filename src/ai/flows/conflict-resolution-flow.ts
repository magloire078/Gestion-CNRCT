
'use server';

/**
 * @fileOverview An AI flow to provide conflict resolution advice.
 *
 * - getConflictResolutionAdvice - A function that analyzes a conflict and provides suggestions.
 * - ConflictResolutionInput - The input type for the function.
 * - ConflictResolutionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { findNearbyChiefs } from '@/ai/tools/gis-tools';

const ConflictResolutionInputSchema = z.object({
  description: z.string().describe('La description du conflit à analyser.'),
  latitude: z.number().optional().describe('La latitude optionnelle du conflit.'),
  longitude: z.number().optional().describe('La longitude optionnelle du conflit.'),
});
export type ConflictResolutionInput = z.infer<typeof ConflictResolutionInputSchema>;

const ConflictResolutionOutputSchema = z.object({
  analysis: z.string().describe("Une brève analyse des problèmes clés du conflit."),
  mediationSteps: z.array(z.string()).describe('Une liste d\'étapes concrètes pour un médiateur neutre.'),
  communicationStrategies: z.array(z.string()).describe('Une liste de conseils de communication pour les parties impliquées.'),
  riskScore: z.number().min(1).max(10).optional().describe('Un score de risque de 1 à 10 évalué par l\'IA.'),
});
export type ConflictResolutionOutput = z.infer<typeof ConflictResolutionOutputSchema>;


export async function getConflictResolutionAdvice(
  input: ConflictResolutionInput
): Promise<ConflictResolutionOutput> {
  return conflictResolutionFlow(input);
}

const conflictResolutionFlow = ai.defineFlow(
  {
    name: 'conflictResolutionFlow',
    inputSchema: ConflictResolutionInputSchema,
    outputSchema: ConflictResolutionOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleAI/gemini-1.5-flash',
      tools: [findNearbyChiefs],
      prompt: `Tu es un médiateur expert en résolution de conflits et professionnel des RH spécialisé dans la gestion des autorités coutumières et des crises communautaires.
      
      Analyse le conflit suivant :
      "Description : ${input.description}"
      ${input.latitude && input.longitude ? `Coordonnées géographiques : Lat ${input.latitude}, Lng ${input.longitude}` : 'Aucune coordonnée géographique fournie.'}

      INSTRUCTIONS CRITIQUES :
      1. Si des coordonnées sont fournies, utilise IMPÉRATIVEMENT l'outil 'findNearbyChiefs' pour identifier les autorités locales (Chefs de village, etc.) à proximité du point de conflit.
      2. Mentionne EXPLICITEMENT les noms et titres des chefs trouvés dans tes étapes de médiation pour ancrer la solution dans le contexte local.
      3. Évalue un 'riskScore' de 1 (faible) à 10 (critique) basé sur la violence potentielle ou l'impact social décrit.
      4. fournis une analyse structurée, des étapes de médiation et des stratégies de communication.

      Réponds de manière professionnelle, impartiale et constructive.`,
      output: { schema: ConflictResolutionOutputSchema },
    });

    if (!output) {
      throw new Error("L'IA n'a pas pu générer de conseils de résolution.");
    }

    return output;
  }
);
