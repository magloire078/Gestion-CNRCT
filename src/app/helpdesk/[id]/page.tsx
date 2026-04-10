
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, LifeBuoy, AlertCircle, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "@/lib/firebase";
import type { Ticket } from "@/lib/data";
import { TicketConversation } from "@/components/helpdesk/TicketConversation";
import { TicketSidebar } from "@/components/helpdesk/TicketSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGuard } from "@/components/auth/permission-guard";

export default function TicketDetailPage() {
    return (
        <PermissionGuard permission="page:tickets:view">
            <TicketDetailContent />
        </PermissionGuard>
    );
}

function TicketDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.roleId === 'super-admin' || user?.roleId === 'admin' || hasPermission("group:admin:view");

  useEffect(() => {
    if (!id) return;

    const ticketDocRef = doc(db, 'tickets', id as string);
    const unsubscribe = onSnapshot(ticketDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTicket({ 
            id: docSnap.id, 
            ...data,
            messages: [] // Conversation handled by sub-component
        } as Ticket);
        setLoading(false);
      } else {
        setError("Ticket introuvable.");
        setLoading(false);
      }
    }, (err) => {
      console.error("Error fetching ticket:", err);
      setError("Erreur lors de la récupération du ticket.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-[500px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">{error || "Ticket introuvable"}</h2>
        <Button onClick={() => router.push("/helpdesk")}>Retour au support</Button>
      </div>
    );
  }

  // Security check: only author or admin can see the ticket
  if (!isAdmin && ticket.createdBy !== user?.id) {
      return (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-bold">Accès non autorisé</h2>
            <p className="text-muted-foreground text-center">Vous n'avez pas les droits pour consulter ce ticket.</p>
            <Button onClick={() => router.push("/helpdesk")}>Retour au support</Button>
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header with Breadcrumb-like back button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full h-10 w-10 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
                <LifeBuoy className="h-4 w-4 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Support IT / Ticket Detail</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none truncate max-w-md md:max-w-xl">
                {ticket.title}
            </h1>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Créé par</span>
                <span className="text-sm font-medium text-slate-900">{ticket.createdByName}</span>
             </div>
             <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-slate-200">
                {ticket.createdByName.charAt(0)}
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main section: Conversation */}
        <div className="lg:col-span-2">
          {user && <TicketConversation ticket={ticket} currentUser={{ id: user.id, name: user.name }} />}
        </div>

        {/* Sidebar section: Info & Admin tasks */}
        <div className="lg:col-span-1">
          {user && <TicketSidebar ticket={ticket} isAdmin={isAdmin} currentUser={{ id: user.id, name: user.name }} />}
        </div>
      </div>
    </div>
  );
}
