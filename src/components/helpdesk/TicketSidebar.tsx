
"use client";

import { useState } from "react";
import { 
    AlertCircle, CheckCircle2, Clock, 
    MessageSquare, Tag, User, Shield,
    Save, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Ticket, TicketStatus, TicketPriority, TicketUrgency, TicketImpact, TicketCategory } from "@/lib/data";
import { updateTicket, resolveTicket } from "@/services/helpdesk-service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TicketSidebarProps {
  ticket: Ticket;
  isAdmin: boolean;
  currentUser: { id: string; name: string };
}

const statusVariantMap: Record<TicketStatus, { label: string, color: string, icon: any, bg: string }> = {
  'Ouvert': { label: 'Ouvert', color: 'text-blue-600', icon: MessageSquare, bg: 'bg-blue-50' },
  'En cours': { label: 'En cours', color: 'text-amber-600', icon: Clock, bg: 'bg-amber-50' },
  'Résolu': { label: 'Résolu', color: 'text-emerald-600', icon: CheckCircle2, bg: 'bg-emerald-100' },
  'Fermé': { label: 'Clos', color: 'text-slate-600', icon: Save, bg: 'bg-slate-100' },
};

export function TicketSidebar({ ticket, isAdmin, currentUser }: TicketSidebarProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [solution, setSolution] = useState(ticket.solution || "");
  const { toast } = useToast();

  const handleUpdate = async (field: keyof Ticket, value: any) => {
    setIsUpdating(true);
    try {
      await updateTicket(ticket.id, { [field]: value });
      toast({
        title: "Mis à jour",
        description: `Le champ ${field} a été mis à jour.`,
      });
    } catch (error) {
      console.error("Update failed", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le ticket.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolve = async () => {
    if (!solution.trim()) {
        toast({ title: "Action requise", description: "Veuillez saisir une solution avant de résoudre le ticket.", variant: "destructive" });
        return;
    }
    setIsUpdating(true);
    try {
      await resolveTicket(ticket.id, solution, currentUser.name);
      toast({
        title: "Ticket Résolu",
        description: "L'employé a été notifié de la résolution.",
      });
    } catch (error) {
      console.error("Resolution failed", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusInfo = statusVariantMap[ticket.status];

  return (
    <div className="flex flex-col gap-6">
      {/* Principal status card */}
      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
        <div className={cn("h-1.5 w-full", statusInfo.bg.replace('bg-', 'bg-').split(' ')[0])} />
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">État du Ticket</CardTitle>
          <div className="flex items-center justify-between mt-2">
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest", statusInfo.bg, statusInfo.color)}>
              <statusInfo.icon className="h-4 w-4" />
              {statusInfo.label}
            </div>
            {isAdmin && ticket.status !== 'Fermé' && (
                <Select disabled={isUpdating} value={ticket.status} onValueChange={(val: TicketStatus) => handleUpdate('status', val)}>
                    <SelectTrigger className="w-10 h-8 p-0 border-none bg-slate-100 rounded-lg flex items-center justify-center">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Ouvert">Ouvert</SelectItem>
                        <SelectItem value="En cours">En cours</SelectItem>
                        <SelectItem value="Résolu">Résolu</SelectItem>
                        <SelectItem value="Fermé">Fermer définitivement</SelectItem>
                    </SelectContent>
                </Select>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
            <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catégorie</span>
                    <Badge variant="secondary" className="bg-white text-slate-700">{ticket.category}</Badge>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Urgence</span>
                    <span className={cn("text-xs font-bold", ticket.urgency === 'Haute' ? "text-red-600" : "text-slate-600")}>{ticket.urgency}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impact</span>
                    <span className="text-xs font-bold text-slate-600">{ticket.impact}</span>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Technicien assigné</Label>
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm italic text-slate-500">
                    <User className="h-4 w-4 text-slate-300" />
                    <span className="text-sm">{ticket.assignedToName || "Non assigné"}</span>
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Resolution section for Admins */}
      {isAdmin && ticket.status !== 'Fermé' && (
          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b bg-emerald-50/50">
                  <CardTitle className="text-sm font-black flex items-center gap-2 text-emerald-900">
                      <Shield className="h-4 w-4 text-emerald-600" /> ACTIONS TECHNICIEN
                  </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="solution" className="text-xs font-bold text-slate-600">Solution technique</Label>
                      <Textarea 
                        id="solution"
                        placeholder="Détaillez la résolution..."
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        className="min-h-[120px] rounded-xl border-slate-200 focus:ring-emerald-500"
                        disabled={ticket.status === 'Résolu'}
                      />
                  </div>
                  {ticket.status !== 'Résolu' ? (
                      <Button onClick={handleResolve} disabled={isUpdating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-100 py-6">
                        <Check className="mr-2 h-4 w-4" /> Résoudre le ticket
                      </Button>
                  ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-medium">
                          <CheckCircle2 className="h-4 w-4" /> Solution enregistrée
                      </div>
                  )}
              </CardContent>
          </Card>
      )}

      {/* Solution viewing for Requester if solved */}
      {!isAdmin && ticket.status === 'Résolu' && ticket.solution && (
          <Card className="border-none shadow-xl shadow-green-200/50 bg-emerald-600 text-white">
              <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-200" /> SOLUTION APPORTÉE
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm leading-relaxed opacity-90">{ticket.solution}</p>
              </CardContent>
              <CardFooter className="pt-0">
                  <p className="text-[10px] font-medium italic opacity-60">Le support a marqué cette demande comme résolue.</p>
              </CardFooter>
          </Card>
      )}
    </div>
  );
}
