'use server';

/**
 * @fileOverview Generates contracts and policy documents using a generative AI tool.
 *
 * - generateDocument - A function that generates documents based on the provided type and content.
 * - GenerateDocumentInput - The input type for the generateDocument function.
 * - GenerateDocumentOutput - The return type for the generateDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getPayslipDetails } from '@/services/payslip-details-service';
import { numberToWords } from '@/lib/utils';
import type { Employee } from '@/lib/data';


const GenerateDocumentInputSchema = z.object({
  documentType: z
    .string()
    .describe('The type of document to generate (e.g., contract, policy, Attestation de Virement).'),
  documentContent: z.string().describe('The content or context for the document, which may include employee details.'),
  employeeContext: z.object({
      name: z.string().optional(),
      matricule: z.string().optional(),
      poste: z.string().optional(),
      numeroCompte: z.string().optional(),
      banque: z.string().optional(),
      baseSalary: z.number().optional(),
      decisionDetails: z.string().optional().describe("Details of the hiring decision, e.g., 'n°024/CNRCT/DIR/P. du 01 Août 2017'"),
      netSalary: z.number().optional(),
      netSalaryInWords: z.string().optional(),
      currentDate: z.string().optional(),
      signerName: z.string().optional().default('Ange-Marie Christophe Dja GAGNIE'),
      signerTitle: z.string().optional().default('Préfet'),
  }).optional().describe("Contextual information about the employee for document generation."),
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
  prompt: `You are an AI assistant specialized in generating various types of official HR documents for an organization named "Chambre Nationale des Rois et Chefs Traditionnels (CNRCT)" in Côte d'Ivoire.

  Based on the provided document type and context, generate a complete and coherent document.

  {{#if (eq documentType "Attestation de Virement")}}
  ## ATTESTATION IRREVOCABLE DE VIREMENT DE SALAIRE

  Le président de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), soussigné, atteste que Monsieur {{employeeContext.name}}, matricule solde {{employeeContext.matricule}}, nommé par décision {{employeeContext.decisionDetails}}, {{employeeContext.poste}}, y a pris service en cette qualité et à cet effet, engage la CNRCT à virer irrévocablement sur son compte N° {{employeeContext.numeroCompte}}, ouvert à la {{employeeContext.banque}}, toutes les sommes qui lui seront dues au titre de primes et indemnités.

  Cet engagement implique qu'aucun acompte ne doit être versé directement à l'intéressé en dehors dudit compte.

  Salaire net à payer : {{employeeContext.netSalaryInWords}} ({{employeeContext.netSalary}} FCFA)

  Nous nous engageons à virer toutes primes, indemnités ou salaires qui seront dus à l'intéressé s'il venait de quitter, pour quelque raison que ce soit, notre institution et à vous aviser de ce départ définitif au plus tard en même temps que nous vous adressons son virement de liquidation.

  Cet ordre de virement ne pourra être modifié ou suspendu qu'après accord donné par la {{employeeContext.banque}} conjointement avec l'intéressé.

  Fait à Yamoussoukro, le {{employeeContext.currentDate}}

  P. Le Président du Directoire et P.O
  Le Directeur des Affaires Sociales

  {{employeeContext.signerName}}
  {{employeeContext.signerTitle}}
  {{else}}
  ## Generic Document Generation
  Document Type: {{{documentType}}}
  Content: {{{documentContent}}}
  {{/if}}
  `,
});


const generateDocumentFlow = ai.defineFlow(
  {
    name: 'generateDocumentFlow',
    inputSchema: GenerateDocumentInputSchema,
    outputSchema: GenerateDocumentOutputSchema,
  },
  async (input) => {

    if (input.documentType === 'Attestation de Virement' && input.employeeContext) {
        let netSalary = 0;
        let netSalaryInWords = '';

        // Very basic mock employee for calculation if only salary is provided
        const mockEmployee: Employee = {
            id: 'temp',
            name: input.employeeContext.name || '',
            baseSalary: input.employeeContext.baseSalary || 0,
            matricule: '',
            department: '',
            poste: '',
            status: 'Active',
            photoUrl: '',
        };

        try {
            const details = await getPayslipDetails(mockEmployee);
            netSalary = details.totals.netAPayer;
            netSalaryInWords = details.totals.netAPayerInWords;
        } catch (e) {
            console.error("Could not calculate payslip details for attestation:", e);
            // Fallback if calculation fails
            netSalary = input.employeeContext.baseSalary || 0;
            netSalaryInWords = numberToWords(netSalary);
        }

        input.employeeContext.netSalary = Math.round(netSalary);
        input.employeeContext.netSalaryInWords = netSalaryInWords;
        input.employeeContext.currentDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    const { output } = await generateDocumentPrompt(input);
    return output!;
  }
);
