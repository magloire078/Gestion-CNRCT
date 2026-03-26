
"use server";


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

  // AI Generation is disabled for now
  return {
    message: "La génération de document par IA est temporairement désactivée.",
    document: `Type: ${parsed.data.documentType}\n\nContenu: ${parsed.data.documentContent}\n\n(La génération automatique est désactivée)`,
  };
}

