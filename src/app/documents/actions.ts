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
    const context: Record<string, any> = {};
    const lines = content.split('\\n');
    lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length < 2) return;
        const key = parts[0].replace(/\\*|\s/g, '').trim().toLowerCase();
        const value = parts.slice(1).join(':').trim();

        if (key.includes('nom')) context.name = value;
        if (key.includes('matricule')) context.matricule = value;
        if (key.includes('fonction')) context.role = value;
        if (key.includes('compte')) context.numeroCompte = value;
        if (key.includes('banque')) context.banque = value;
        if (key.includes('salaire')) context.baseSalary = parseFloat(value.replace(/\\s/g, '')) || 0;
        if (key.includes('décision')) context.decisionDetails = value;
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

    if(input.documentType === 'Attestation de Virement') {
        input.employeeContext = parseEmployeeContext(input.documentContent);
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
