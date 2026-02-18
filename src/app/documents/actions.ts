
"use server";

import { generateDocument, GenerateDocumentInput } from "@/ai/flows/generate-document";
import { z } from "zod";

const formSchema = z.object({
  documentType: z.string().min(1, "Le type de document est requis."),
  documentContent: z.string().min(10, "Le contenu doit contenir au moins 10 caractères."),
});

export type FormState = {
  message: string;
  document?: string;
  fields?: Record<string, string>;
  issues?: string[];
};

function parseEmployeeContext(content: string) {
  const context: Record<string, any> = {
    signerName: "Le Directeur",
    signerTitle: "Directeur Général",
    villeRedaction: "Abidjan",
    imputationBudgetaire: "Budget 2024"
  };
  const lines = content.split('\n');
  lines.forEach(line => {
    const parts = line.split(':');
    if (parts.length < 2) return;

    let key = parts[0].trim().toLowerCase().replace(/\s/g, '');
    const value = parts.slice(1).join(':').trim();

    if (key.includes('nom')) context.name = value;
    if (key.includes('matricule')) context.matricule = value;
    if (key.includes('poste') || key.includes('fonction')) context.poste = value;
    if (key.includes('compte')) context.numeroCompte = value;
    if (key.includes('banque')) context.banque = value;
    if (key.includes('salaire')) {
      const salaryString = value.replace(/[^0-9]/g, '');
      context.baseSalary = parseFloat(salaryString) || 0;
    }
    if (key.includes('decision')) context.decisionDetails = value;
    if (key.includes("datedembauche")) context.dateEmbauche = value;
    if (key.includes('lieudenaissance')) context.lieuNaissance = value;

    // Ordre de Mission fields
    if (key === 'numeromission') context.numeroMission = value;
    if (key === 'typemission') context.missionType = value;
    if (key === 'destination') context.destination = value;
    if (key === 'objetmission') context.objetMission = value;
    if (key === 'moyentransport') context.moyenTransport = value;
    if (key === 'immatriculation') context.immatriculation = value;
    if (key === 'datedepart') context.dateDepart = value;
    if (key === 'dateretour') context.dateRetour = value;

  });
  return context;
}


export async function generateDocumentAction(
  prevState: FormState,
  data: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const parsed = formSchema.safeParse(formData);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    return {
      message: "Formulaire invalide.",
      issues,
      fields: {
        documentType: formData.documentType as string,
        documentContent: formData.documentContent as string,
      }
    };
  }

  try {
    const input: GenerateDocumentInput = {
      documentType: parsed.data.documentType,
      documentContent: parsed.data.documentContent,
    };

    if (input.documentType === 'Attestation de Virement' || input.documentType === 'Employment Contract' || input.documentType === 'Ordre de Mission') {
      input.employeeContext = {
        signerName: "Le Directeur",
        signerTitle: "Directeur Général",
        villeRedaction: "Abidjan",
        imputationBudgetaire: "Budget 2024",
        ...parseEmployeeContext(input.documentContent)
      };
    }

    const result = await generateDocument(input);

    return {
      message: "Document généré avec succès.",
      document: result.generatedDocument,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Échec de la génération du document. Veuillez réessayer.",
      fields: parsed.data,
      issues: [error instanceof Error ? error.message : "Une erreur inconnue est survenue."]
    };
  }
}

