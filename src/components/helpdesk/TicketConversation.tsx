
"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { Ticket, TicketMessage } from "@/lib/data";
import { subscribeToTicketMessages, addMessageToTicket } from "@/services/helpdesk-service";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TicketConversationProps {
  ticket: Ticket;
  currentUser: { id: string; name: string };
}

export function TicketConversation({ ticket, currentUser }: TicketConversationProps) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToTicketMessages(
      ticket.id,
      (fetchedMessages) => {
        setMessages(fetchedMessages);
        setIsLoading(false);
      },
      (error) => {
        console.error("Failed to subscribe to messages:", error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [ticket.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await addMessageToTicket(ticket.id, {
        authorId: currentUser.id,
        authorName: currentUser.name,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy • HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="flex flex-col h-[600px] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
      <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                    <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                    <CardTitle className="text-lg">Fil de Discussion</CardTitle>
                    <p className="text-xs text-muted-foreground italic">Historique des échanges sur ce ticket</p>
                </div>
            </div>
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-400 font-mono">
                #{ticket.id.slice(0, 8)}
            </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full p-6">
          <div className="space-y-6">
            {/* Initial Ticket Description */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
              </div>
              <div className="flex flex-col gap-1 max-w-[85%]">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-sm text-slate-900">{ticket.createdByName}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Auteur du ticket</span>
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 text-sm text-slate-700 leading-relaxed shadow-sm">
                  <p className="font-bold mb-2 text-slate-900 border-b border-slate-200 pb-2">{ticket.title}</p>
                  {ticket.description}
                </div>
                <span className="text-[10px] text-slate-400 ml-1 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDate(ticket.createdAt)}
                </span>
              </div>
            </div>

            {/* Messages */}
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-64 rounded-xl" />
                  </div>
                </div>
              ))
            ) : (
              messages.map((message) => {
                const isMe = message.authorId === currentUser.id;
                return (
                  <div key={message.id} className={cn("flex gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm",
                        isMe ? "bg-slate-900 text-white" : "bg-white text-slate-400 border-slate-100"
                      )}>
                        {message.authorName.charAt(0)}
                      </div>
                    </div>
                    <div className={cn("flex flex-col gap-1 max-w-[80%]", isMe ? "items-end" : "items-start")}>
                      <span className="text-[10px] font-bold text-slate-400 px-1">{message.authorName}</span>
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                        isMe 
                          ? "bg-slate-900 text-white rounded-tr-none" 
                          : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                      )}>
                        {message.content}
                      </div>
                      <span className="text-[10px] text-slate-400 px-1 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-slate-50/30">
        <form onSubmit={handleSendMessage} className="flex w-full items-end gap-3 translate-y-[-4px]">
          <div className="flex-grow relative group">
            <Textarea
              placeholder="Écrivez votre réponse ici..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[80px] w-full rounded-2xl border-slate-200 bg-white focus-visible:ring-slate-900 pr-12 transition-all resize-none shadow-inner"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <div className="absolute right-3 bottom-3">
                 <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!newMessage.trim() || isSending} 
                    className="h-8 w-8 rounded-xl bg-slate-900 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                    <Send className={cn("h-4 w-4", isSending && "animate-pulse")} />
                </Button>
            </div>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}
