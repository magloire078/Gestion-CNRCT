"use server";

import { generateDocument, GenerateDocumentInput } from "@/ai/flows/generate-document";
import { z } from "zod";

const formSchema = z.object({
  documentType: z.string().min(1, "Document type is required."),
  documentContent: z.string().min(10, "Content must be at least 10 characters long."),
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
      message: "Invalid form data.",
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
    
    const result = await generateDocument(input);

    return {
      message: "Document generated successfully.",
      document: result.generatedDocument,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Failed to generate document. Please try again.",
      fields: parsed.data,
      issues: [error instanceof Error ? error.message : "An unknown error occurred."]
    };
  }
}