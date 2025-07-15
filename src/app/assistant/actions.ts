"use server";

import { askAssistant } from "@/ai/flows/assistant-flow";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type ConversationState = {
  messages: Message[];
  error?: string;
};

export async function continueConversation(
  history: Message[],
  data: FormData
): Promise<ConversationState> {
  const userInput = data.get("userInput") as string;

  if (!userInput) {
    return { messages: history };
  }

  const updatedHistory: Message[] = [...history, { role: "user", content: userInput }];

  try {
    const response = await askAssistant(userInput);
    updatedHistory.push({ role: "assistant", content: response });
    return {
      messages: updatedHistory,
    };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      messages: updatedHistory,
      error: `Failed to get a response from the assistant. ${errorMessage}`
    };
  }
}
