
"use server";

import { addMessageToTicket, updateTicket } from "@/services/helpdesk-service";
import { getSuggestedReply, type SuggestReplyInput } from "@/ai/flows/suggest-reply-flow";
import type { TicketMessage, Ticket } from "@/lib/data";

export type ConversationState = {
  messages: TicketMessage[];
  error?: string;
  pending?: boolean;
};

export async function continueTicketConversation(
  history: any,
  data: FormData
): Promise<ConversationState> {
  const content = data.get("content") as string;
  const ticketId = data.get("ticketId") as string;
  const authorId = data.get("authorId") as string;
  const authorName = data.get("authorName") as string;

  if (!content || !ticketId || !authorId || !authorName) {
    return { messages: [], error: "Données du formulaire invalides." };
  }

  try {
    await addMessageToTicket(ticketId, { content, authorId, authorName });
    // The UI will update via the real-time subscription, so we don't need to return messages here.
    return { messages: [] };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
    return {
      messages: [],
      error: `Impossible d'envoyer le message. Détails : ${errorMessage}`
    };
  }
}

export async function updateTicketStatusAndAssignee(
  ticketId: string,
  data: { status?: Ticket['status'], assignedTo?: string, assignedToName?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateTicket(ticketId, data);
    return { success: true };
  } catch (error) {
    console.error("Failed to update ticket:", error);
    const errorMessage = error instanceof Error ? error.message : "Mise à jour échouée: ${errorMessage}";
    return { success: false, error: `Mise à jour échouée: ${errorMessage}` };
  }
}

export async function suggestReplyAction(input: SuggestReplyInput): Promise<{ suggestion?: string, error?: string }> {
    try {
        const suggestion = await getSuggestedReply(input);
        return { suggestion };
    } catch(error) {
        console.error("AI Suggestion Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la communication avec l'IA.";
        return { error: errorMessage };
    }
}
