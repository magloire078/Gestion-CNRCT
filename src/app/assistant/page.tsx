"use client";

import { useActionState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { continueConversation, Message } from "./actions";
import { Bot, User, Send, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} aria-label="Envoyer le message">
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
    </Button>
  );
}

export default function AssistantPage() {
  const [state, formAction, isPending] = useActionState(continueConversation, { messages: [] });
  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [state.messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between p-4 border-b">
         <h1 className="text-3xl font-bold tracking-tight">Assistant IA</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <Card className="h-full flex flex-col border-0 shadow-none rounded-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="h-6 w-6"/> Assistant RH SynergieRH</CardTitle>
                <CardDescription>Posez-moi vos questions sur les politiques RH, le droit du travail ou la gestion d'équipe.</CardDescription>
            </CardHeader>
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {state.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Bot className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Bonjour ! Comment puis-je vous aider aujourd'hui ?</p>
                </div>
              )}
              {state.messages.map((message: Message, index: number) => (
                <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                         <Bot className="h-5 w-5" />
                        </div>
                    </Avatar>
                  )}
                  <div className={`max-w-xl rounded-lg p-3 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                   {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                       <AvatarImage src="https://placehold.co/40x40.png" alt="Utilisateur" data-ai-hint="user avatar" />
                       <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isPending && state.messages.at(-1)?.role === 'user' && (
                 <div className="flex items-start gap-4">
                    <Avatar className="h-8 w-8">
                         <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Bot className="h-5 w-5" />
                         </div>
                    </Avatar>
                    <div className="max-w-xl rounded-lg p-3 text-sm bg-muted flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <span>En train de réfléchir...</span>
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
           <CardFooter className="p-4 border-t">
              {state.error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
            <form 
              ref={formRef} 
              action={(formData) => {
                formAction(formData);
                formRef.current?.reset();
              }}
              className="flex w-full items-center space-x-2"
            >
              <Input
                id="userInput"
                name="userInput"
                placeholder="Posez votre question ici..."
                autoComplete="off"
                disabled={isPending}
              />
              <SubmitButton />
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
