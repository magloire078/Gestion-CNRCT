
"use client";

import { useState, useEffect, useActionState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import { getTicket, subscribeToTicketMessages } from "@/services/helpdesk-service";
import { getEmployees } from "@/services/employee-service";
import type { Ticket, TicketMessage, Employe } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { continueTicketConversation, updateTicketStatusAndAssignee } from "./actions";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send, Loader2, User, Calendar, Tag, Shield, Bot, UserCog, Ticket as TicketIcon } from "lucide-react";


const statusVariantMap: Record<Ticket['status'], "default" | "secondary" | "outline" | "destructive"> = {
  'Ouvert': 'default',
  'En cours': 'secondary',
  'Fermé': 'outline',
};

const priorityVariantMap: Record<Ticket['priority'], "destructive" | "default" | "secondary"> = {
  'Haute': 'destructive',
  'Moyenne': 'default',
  'Basse': 'secondary',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="icon">
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
       <span className="sr-only">Envoyer</span>
    </Button>
  );
}


export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id: ticketId } = params as { id: string };
  const { user, hasPermission } = useAuth();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);

  const [state, formAction] = useActionState(continueTicketConversation, { messages: [] });
  const formRef = useRef<HTMLFormElement>(null);

  const isAgent = hasPermission('page:helpdesk:view');

  useEffect(() => {
    async function fetchData() {
        if (!ticketId) return;
        setLoading(true);
        try {
            const [ticketData, allEmployees] = await Promise.all([
                getTicket(ticketId),
                isAgent ? getEmployees() : Promise.resolve([]),
            ]);
            setTicket(ticketData);
            setEmployees(allEmployees);
        } catch (error) {
            console.error("Failed to fetch ticket details:", error);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [ticketId, isAgent]);
  
   useEffect(() => {
    if (!ticketId) return;
    const unsubscribe = subscribeToTicketMessages(ticketId, (newMessages) => {
        setMessages(newMessages);
    }, console.error);

    return () => unsubscribe();
  }, [ticketId]);


  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd MMM yyyy, HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const handleStatusChange = async (status: Ticket['status']) => {
    if (!ticket || !isAgent) return;
    try {
        await updateTicketStatusAndAssignee(ticket.id, { status });
        setTicket(prev => prev ? { ...prev, status } : null);
    } catch(err) {
        console.error(err);
    }
  }
  
  const handleAssigneeChange = async (agentId: string) => {
    if (!ticket || !isAgent) return;
    try {
        const agent = employees.find(e => e.id === agentId);
        await updateTicketStatusAndAssignee(ticket.id, { assignedTo: agentId, assignedToName: agent?.name });
        setTicket(prev => prev ? { ...prev, assignedTo: agentId, assignedToName: agent?.name } : null);
    } catch(err) {
        console.error(err);
    }
  }


  if (loading) {
    return <Skeleton className="h-[600px] w-full" />
  }

  if (!ticket) {
    return <div className="text-center py-10">Ticket non trouvé.</div>;
  }
  
  const isOwner = user?.id === ticket.createdBy;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Retour</span>
        </Button>
        <div>
            <p className="text-muted-foreground font-mono text-sm">Ticket #{ticket.id}</p>
            <h1 className="text-2xl font-bold tracking-tight">{ticket.title}</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
             <Card>
                <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="pr-4 max-h-[500px] overflow-y-auto space-y-6">
                       {messages.map((message) => {
                         const isCurrentUser = message.authorId === user?.id;
                         return (
                            <div key={message.id} className={`flex items-start gap-4 ${isCurrentUser ? 'justify-end' : ''}`}>
                               {!isCurrentUser && (
                                <Avatar className="h-8 w-8 border">
                                    <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                                </Avatar>
                               )}
                               <div>
                                    <div className={`max-w-md rounded-lg p-3 text-sm ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                    <p className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? 'text-right' : ''}`}>
                                        {message.authorName} - {formatDate(message.createdAt)}
                                    </p>
                               </div>
                                {isCurrentUser && (
                                <Avatar className="h-8 w-8 border">
                                    <AvatarImage src={user?.photoUrl} />
                                    <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                               )}
                            </div>
                         )
                       })}
                       {state.pending && (
                            <div className="flex items-start gap-4 justify-end">
                                <div>
                                <div className="max-w-md rounded-lg p-3 text-sm bg-primary/80 text-primary-foreground flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                    <span>Envoi...</span>
                                </div>
                                </div>
                                <Avatar className="h-8 w-8 border"><AvatarFallback>{user?.name.charAt(0)}</AvatarFallback></Avatar>
                            </div>
                       )}
                    </div>
                </CardContent>
                 {(isOwner || isAgent) && (
                    <CardFooter className="border-t pt-4">
                        <form
                            ref={formRef}
                            action={async (formData) => {
                                await formAction(formData);
                                formRef.current?.reset();
                            }}
                            className="w-full flex items-center gap-2"
                        >
                            <input type="hidden" name="ticketId" value={ticketId} />
                            <input type="hidden" name="authorId" value={user?.id} />
                            <input type="hidden" name="authorName" value={user?.name} />
                            <Textarea
                                name="content"
                                placeholder="Tapez votre message ici..."
                                className="flex-1"
                                rows={1}
                                required
                            />
                            <SubmitButton />
                        </form>
                    </CardFooter>
                 )}
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TicketIcon className="h-5 w-5"/> Informations
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <InfoItem icon={User} label="Créé par" value={ticket.createdByName} />
                    <InfoItem icon={Calendar} label="Créé le" value={formatDate(ticket.createdAt)} />
                    <InfoItem icon={Tag} label="Catégorie" value={<Badge variant="outline">{ticket.category}</Badge>} />
                    <InfoItem icon={Shield} label="Priorité" value={<Badge variant={priorityVariantMap[ticket.priority]}>{ticket.priority}</Badge>} />

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><UserCog className="h-4 w-4"/> Agent Assigné</Label>
                        {isAgent ? (
                            <Select value={ticket.assignedTo || 'none'} onValueChange={handleAssigneeChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Non assigné</SelectItem>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="font-medium text-sm">{ticket.assignedToName || 'Non assigné'}</p>
                        )}
                    </div>

                     <div className="space-y-2">
                        <Label className="flex items-center gap-2"><UserCog className="h-4 w-4"/> Statut</Label>
                        {isAgent ? (
                            <Select value={ticket.status} onValueChange={handleStatusChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ouvert">Ouvert</SelectItem>
                                    <SelectItem value="En cours">En cours</SelectItem>
                                    <SelectItem value="Fermé">Fermé</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Badge variant={statusVariantMap[ticket.status]}>{ticket.status}</Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Description Initiale</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: string | React.ReactNode; icon: React.ElementType }) {
    return (
        <div className="space-y-1">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon className="h-4 w-4" /> {label}
            </Label>
            <div className="font-medium text-sm">{value}</div>
        </div>
    )
}
