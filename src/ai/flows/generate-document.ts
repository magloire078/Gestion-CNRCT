
'use server';

/**
 * @fileOverview Generates contracts and policy documents using a generative AI tool.
 *
 * - generateDocument - A function that generates documents based on the provided type and content.
 * - GenerateDocumentInput - The input type for the generateDocument function.
 * - GenerateDocumentOutput - The return type for the generateDocument function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getPayslipDetails } from '@/services/payslip-details-service';
import { numberToWords } from '@/lib/utils';
import type { Employe } from '@/lib/data';


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
    dateEmbauche: z.string().optional(),
    lieuNaissance: z.string().optional(),

    // Fields for Ordre de Mission
    numeroMission: z.string().optional(),
    villeRedaction: z.string().optional().default('Yamoussoukro'),
    dateRedaction: z.string().optional(),
    destination: z.string().optional(),
    objetMission: z.string().optional(),
    moyenTransport: z.string().optional(),
    immatriculation: z.string().optional(),
    dateDepart: z.string().optional(),
    dateRetour: z.string().optional(),
    imputationBudgetaire: z.string().optional().default('Chambre Nationale des Rois et Chefs Traditionnels'),
    missionType: z.string().optional(),
    totalIndemnites: z.number().optional(),
    coutTransport: z.number().optional(),
    coutHebergement: z.number().optional(),
    totalFraisMission: z.number().optional(),


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
  input: { schema: GenerateDocumentInputSchema },
  output: { schema: GenerateDocumentOutputSchema },
  prompt: `You are an AI assistant specialized in generating various types of official HR documents for an organization named "Chambre Nationale des Rois et Chefs Traditionnels (CNRCT)" in Côte d'Ivoire.

  Based on the provided document type and context, generate a complete and coherent document. Your response should contain ONLY the raw text of the document, without any additional formatting like Markdown headers or titles.

  {{#if (eq documentType "Attestation de Virement")}}
ATTESTATION IRREVOCABLE DE VIREMENT DE SALAIRE

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
  {{else if (eq documentType "Employment Contract")}}
CONTRAT DE TRAVAIL A DUREE INDETERMINEE

**ENTRE LES SOUSSIGNES :**

La Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), ci-après dénommée "l'Employeur", représentée par son Président, {{employeeContext.signerName}}.

**ET**

Monsieur/Madame {{employeeContext.name}}, né(e) le {{employeeContext.dateEmbauche}} à {{employeeContext.lieuNaissance}}, ci-après dénommé(e) "l'Employé(e)".

**IL A ETE CONVENU CE QUI SUIT :**

**Article 1 : Engagement**
L'Employeur engage l'Employé(e) en qualité de {{employeeContext.poste}}, à compter du {{employeeContext.dateEmbauche}}.

**Article 2 : Fonctions**
L'Employé(e) exercera les fonctions de {{employeeContext.poste}}. Il/Elle sera chargé(e) de [Description générique des tâches].

**Article 3 : Rémunération**
L'Employé(e) percevra une rémunération mensuelle brute de {{employeeContext.baseSalary}} FCFA.

**Article 4 : Durée et Période d'essai**
Le présent contrat est conclu pour une durée indéterminée. La période d'essai est fixée à trois (3) mois, renouvelable une fois.

**Article 5 : Lieu de travail**
Le lieu de travail est fixé au siège de la CNRCT à Yamoussoukro.

Fait à Yamoussoukro, le {{employeeContext.currentDate}}, en deux exemplaires originaux.

**Pour l'Employeur,**
{{employeeContext.signerName}}
{{employeeContext.signerTitle}}

**L'Employé(e),**
(Signature précédée de la mention "Lu et approuvé")
{{employeeContext.name}}
  {{else if (eq documentType "Ordre de Mission")}}
Le Directoire
------555------
Le Président
-----555---
N° {{employeeContext.numeroMission}}/CNRCT/DIR/PDT.               Yamoussoukro, le {{employeeContext.dateRedaction}}

ORDRE DE MISSION{{#if employeeContext.missionType}} {{employeeContext.missionType}}{{/if}}

LE PRESIDENT DU DIRECTOIRE

Donne ordre à : Monsieur {{employeeContext.name}}

Fonction : {{employeeContext.poste}}

De se rendre à : {{employeeContext.destination}}

Objet de la mission : {{{employeeContext.objetMission}}}

Moyen de transport : {{employeeContext.moyenTransport}}

Immatriculation : {{employeeContext.immatriculation}}

Date de départ : {{employeeContext.dateDepart}}

Date de retour : {{employeeContext.dateRetour}}

Imputation budgétaire : {{employeeContext.imputationBudgetaire}}

Frais de Mission (en FCFA):
- Indemnités: {{employeeContext.totalIndemnites}}
- Coût Transport: {{employeeContext.coutTransport}}
- Coût Hébergement: {{employeeContext.coutHebergement}}
- TOTAL: {{employeeContext.totalFraisMission}}

P. Le Président du Directoire et P.O
Le Directeur des Affaires Sociales


{{employeeContext.signerName}}
{{employeeContext.signerTitle}}
  {{else}}
Document Type: {{{documentType}}}
Content: {{{documentContent}}}
  {{/if}}
  `
});


const generateDocumentFlow = ai.defineFlow(
  {
    name: 'generateDocumentFlow',
    inputSchema: GenerateDocumentInputSchema,
    outputSchema: GenerateDocumentOutputSchema,
  },
  async (input) => {

    // Set current date for all document types that need it
    if (input.documentType === 'Attestation de Virement' || input.documentType === 'Employment Contract' || input.documentType === 'Ordre de Mission') {
      if (!input.employeeContext) {
        input.employeeContext = {
          signerName: 'Ange-Marie Christophe Dja GAGNIE',
          signerTitle: 'Préfet',
          villeRedaction: 'Yamoussoukro',
          imputationBudgetaire: 'Chambre Nationale des Rois et Chefs Traditionnels'
        };
      }
      const today = new Date();
      const formattedDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);

      if (input.documentType === 'Ordre de Mission') {
        input.employeeContext.dateRedaction = formattedDate;
      } else {
        input.employeeContext.currentDate = formattedDate;
      }
    }

    if (input.documentType === 'Attestation de Virement' && input.employeeContext?.baseSalary) {
      let netSalary = 0;
      let netSalaryInWords = '';

      // Very basic mock employee for calculation if only salary is provided
      const mockEmployee: Employe = {
        id: 'temp',
        name: input.employeeContext.name || '',
        baseSalary: input.employeeContext.baseSalary || 0,
        matricule: '',
        departmentId: '',
        poste: '',
        status: 'Actif',
        photoUrl: '',
      };

      try {
        // Use the current date for the payslip calculation
        const payslipDate = new Date().toISOString().split('T')[0];
        const details = await getPayslipDetails(mockEmployee, payslipDate);
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
    }

    const { output } = await generateDocumentPrompt(input);
    return output!;
  }
);


