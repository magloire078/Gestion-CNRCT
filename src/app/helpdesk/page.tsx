"use client";

import { useState, useMemo, useEffect } from "react";
import { 
    PlusCircle, Search, Eye, ListFilter, 
    MessageSquare, AlertCircle, CheckCircle2, 
    Clock, Tag, User, ChevronRight,
    LifeBuoy, BarChart3, Filter, Save,
    Layers, Zap, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Ticket, TicketStatus, TicketPriority, TicketCategory } from "@/lib/data";
import { AddTicketSheet } from "@/components/helpdesk/add-ticket-sheet";
import { Input } from "@/components/ui/input";
import { subscribeToTickets, addTicket } from "@/services/helpdesk-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { PaginationControls } from "@/components/common/pagination-controls";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";


const statusVariantMap: Record<TicketStatus, { label: string, color: string, icon: any, bg: string }> = {
  'Ouvert': { label: 'Ouvert', color: 'text-blue-600', icon: MessageSquare, bg: 'bg-blue-50' },
  'En cours': { label: 'En cours', color: 'text-amber-600', icon: Clock, bg: 'bg-amber-50' },
  'Résolu': { label: 'Résolu', color: 'text-emerald-600', icon: CheckCircle2, bg: 'bg-emerald-50' },
  'Fermé': { label: 'Clos', color: 'text-slate-600', icon: Save, bg: 'bg-slate-50' },
};

const priorityVariantMap: Record<TicketPriority, { label: string, color: string, variant: any }> = {
  'Haute': { label: 'Urgente', color: 'text-red-600', variant: 'destructive' },
  'Moyenne': { label: 'Moyenne', color: 'text-slate-600', variant: 'default' },
  'Basse': { label: 'Basse', color: 'text-slate-400', variant: 'secondary' },
};

const ticketCategories: TicketCategory[] = ['Matériel', 'Logiciel', 'Réseau', 'Accès/Comptes', 'Foncier', 'Autre'];
const ticketPriorities: TicketPriority[] = ['Basse', 'Moyenne', 'Haute'];
const ticketStatuses: TicketStatus[] = ['Ouvert', 'En cours', 'Résolu', 'Fermé'];

export default function HelpdeskPage() {
    return (
        <PermissionGuard permission="page:tickets:view">
            <HelpdeskContent />
        </PermissionGuard>
    );
}

function HelpdeskContent() {
  const { user, hasPermission } = useAuth();
  // Seuls les vrais administrateurs peuvent voir tous les tickets.
  const isAdmin = user?.roleId === 'super-admin' || user?.roleId === 'admin' || hasPermission("group:admin:view");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [filters, setFilters] = useState({
    status: new Set<TicketStatus>(),
    priority: new Set<TicketPriority>(),
  });

  const handleFilterChange = (type: 'status' | 'priority', value: TicketStatus | TicketPriority) => {
    setFilters(prev => {
        const newSet = new Set(prev[type]);
        if (newSet.has(value as any)) {
            newSet.delete(value as any);
        } else {
            newSet.add(value as any);
        }
        return { ...prev, [type]: newSet };
    });
  };

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTickets(
      (fetchedTickets) => {
        setTickets(fetchedTickets);
        setLoading(false);
      },
      (err) => {
        setError("Impossible de charger les tickets.");
        console.error(err);
        setLoading(false);
      },
      isAdmin ? undefined : user.id
    );
    return () => unsubscribe();
  }, [user, isAdmin]);

  const handleAddTicket = async (newTicketData: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "status">) => {
     try {
        await addTicket(newTicketData);
        setIsAddSheetOpen(false);
        toast({
            title: "Ticket créé",
            description: `Votre ticket "${newTicketData.title}" a été créé avec succès.`,
        });
     } catch (err) {
        console.error("Failed to add ticket:", err);
        throw err;
     }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Sécurité supplémentaire : si l'utilisateur n'est pas admin, on force le client-side
      if (!isAdmin && ticket.createdBy !== user?.id) {
          return false;
      }

      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = ticket.title.toLowerCase().includes(searchTermLower) ||
                            ticket.id.toLowerCase().includes(searchTermLower) ||
                            ticket.createdByName.toLowerCase().includes(searchTermLower);
      
      const matchesStatus = filters.status.size === 0 || filters.status.has(ticket.status);
      const matchesPriority = filters.priority.size === 0 || filters.priority.has(ticket.priority);

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, filters, isAdmin, user]);

  const stats = useMemo(() => {
    const open = tickets.filter(t => t.status === 'Ouvert').length;
    const inProgress = tickets.filter(t => t.status === 'En cours').length;
    const highPriority = tickets.filter(t => t.priority === 'Haute' && t.status !== 'Fermé').length;
    return { open, inProgress, highPriority };
  }, [tickets]);
  
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const formatDate = (dateString: string) => {
    try {
        return format(parseISO(dateString), 'dd MMM yyyy • HH:mm', { locale: fr });
    } catch {
        return dateString;
    }
  }

  return (
      <div className="flex flex-col gap-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{isAdmin ? "Centre de Support" : "Mes Billets (Tickets)"}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{isAdmin ? "Gestion des incidents et demandes d'assistance IT." : "Suivez et gérez vos demandes d'assistance."}</p>
          </div>
          <Button onClick={() => setIsAddSheetOpen(true)} className="bg-slate-900 rounded-xl h-11 shadow-lg shadow-slate-200">
            <PlusCircle className="mr-2 h-4 w-4" />
            Ouvrir un ticket
          </Button>
        </div>

        {/* Analytics Mini Dashboard */}
        {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-blue-50/80 group">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">Tickets Ouverts</CardDescription>
              <CardTitle className="text-3xl font-black text-blue-900 flex items-center justify-between">
                {loading ? <Skeleton className="h-9 w-12" /> : stats.open}
                <MessageSquare className="h-8 w-8 text-blue-200 transition-transform group-hover:scale-110" />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-sm bg-amber-50/80 group">
            <CardHeader className="pb-2">
              <CardDescription className="text-amber-600 font-bold text-[10px] uppercase tracking-widest">En cours de résolution</CardDescription>
              <CardTitle className="text-3xl font-black text-amber-900 flex items-center justify-between">
                {loading ? <Skeleton className="h-9 w-12" /> : stats.inProgress}
                <Clock className="h-8 w-8 text-amber-200 transition-transform group-hover:scale-110" />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-sm bg-red-50/80 group">
            <CardHeader className="pb-2">
              <CardDescription className="text-red-600 font-bold text-[10px] uppercase tracking-widest">Urgences Non Traitées</CardDescription>
              <CardTitle className="text-3xl font-black text-red-900 flex items-center justify-between">
                {loading ? <Skeleton className="h-9 w-12" /> : stats.highPriority}
                <AlertCircle className="h-8 w-8 text-red-200 transition-transform group-hover:scale-110" />
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        )}

        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="h-1.5 bg-slate-900 w-full" />
          <CardHeader className="bg-slate-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Flux des Demandes</CardTitle>
                <CardDescription>Tous les tickets triés par priorité et date.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative group w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-10 h-10 w-full md:w-[280px] rounded-xl border-slate-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 rounded-xl border-slate-200 gap-2">
                      <Filter className="h-4 w-4 text-slate-400" />
                      Filtrer
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-100">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Filtrer par Statut</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ticketStatuses.map((status) => (
                        <DropdownMenuCheckboxItem
                            key={status}
                            checked={filters.status.has(status)}
                            onCheckedChange={() => handleFilterChange('status', status)}
                            className="rounded-lg"
                        >
                            {status}
                        </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Filtrer par Priorité</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ticketPriorities.map((priority) => (
                        <DropdownMenuCheckboxItem
                            key={priority}
                            checked={filters.priority.has(priority)}
                            onCheckedChange={() => handleFilterChange('priority', priority)}
                            className="rounded-lg"
                        >
                            {priority}
                        </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
              {error && <div className="p-8 text-center text-red-500 font-bold">{error}</div>}
              
              <div className="overflow-x-auto">
                  <Table>
                      <TableHeader className="bg-slate-50/50">
                          <TableRow className="hover:bg-transparent border-slate-100">
                              <TableHead className="w-12 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">#</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Objet de la demande</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Collaborateur</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Catégorie</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Priorité</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Statut</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dernière activité</TableHead>
                              <TableHead className="w-12"></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {loading ? (
                              Array.from({ length: 5 }).map((_, i) => (
                                  <TableRow key={i} className="border-slate-50">
                                      <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                                      <TableCell><Skeleton className="h-4 w-60" /></TableCell>
                                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                  </TableRow>
                              ))
                          ) : paginatedTickets.map((ticket, index) => {
                              const statusInfo = statusVariantMap[ticket.status];
                              const priorityInfo = priorityVariantMap[ticket.priority];
                              const StatusIcon = statusInfo.icon;
                              
                              return (
                                  <TableRow 
                                      key={ticket.id} 
                                      onClick={() => router.push(`/helpdesk/${ticket.id}`)} 
                                      className="group cursor-pointer hover:bg-slate-50/50 transition-colors border-slate-100"
                                  >
                                      <TableCell className="text-center text-slate-300 font-mono text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                      <TableCell>
                                          <div className="flex flex-col">
                                              <span className="font-bold text-slate-700 max-w-xs truncate group-hover:text-slate-900 transition-colors">{ticket.title}</span>
                                              <span className="text-[10px] font-mono text-slate-400 uppercase">Ticket #{ticket.id.slice(0, 8)}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell>
                                          <div className="flex items-center gap-2">
                                              <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                                  <User className="h-3.5 w-3.5 text-slate-400" />
                                              </div>
                                              <span className="text-sm font-medium text-slate-600">{ticket.createdByName}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell>
                                          <Badge variant="outline" className="rounded-md border-slate-200 bg-white text-slate-500 font-medium px-2 py-0">
                                              {ticket.category}
                                          </Badge>
                                      </TableCell>
                                      <TableCell>
                                          <div className="flex items-center gap-1.5">
                                              <div className={cn("h-1.5 w-1.5 rounded-full", 
                                                  ticket.priority === 'Haute' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : 
                                                  ticket.priority === 'Moyenne' ? "bg-slate-400" : "bg-slate-200"
                                              )} />
                                              <span className={cn("text-xs font-bold", priorityInfo.color)}>{priorityInfo.label}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell>
                                          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", statusInfo.bg, statusInfo.color)}>
                                              <StatusIcon className="h-3 w-3" />
                                              {statusInfo.label}
                                          </div>
                                      </TableCell>
                                      <TableCell>
                                          <div className="flex items-center gap-1.5 text-slate-400">
                                              <Clock className="h-3 w-3" />
                                              <span className="text-xs font-medium">{formatDate(ticket.updatedAt)}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                              <ChevronRight className="h-4 w-4" />
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              )
                          })}
                      </TableBody>
                  </Table>
              </div>
              
              {!loading && paginatedTickets.length === 0 && (
                  <div className="text-center py-24 bg-slate-50/30">
                      <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-inner">
                          <LifeBuoy className="h-10 w-10 text-slate-200" />
                      </div>
                      <p className="font-black text-slate-400 uppercase tracking-widest">Aucun ticket à afficher</p>
                      <p className="text-xs text-slate-300 mt-2 px-8">Tout est sous contrôle ! Vos filtres actuels ne retournent aucun incident.</p>
                  </div>
              )}
          </CardContent>
          {totalPages > 1 && (
              <CardFooter className="bg-slate-50/50 border-t border-slate-100 px-6 py-4">
                  <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={setItemsPerPage}
                      totalItems={filteredTickets.length}
                  />
              </CardFooter>
          )}
        </Card>

        {/* Expert Tips / Help */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-none text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:scale-125">
                  <Shield className="h-32 w-32" />
              </div>
              <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-400" /> Résolution Prioritaire
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-slate-400 leading-relaxed">
                      Les tickets marqués comme <span className="text-white font-bold italic underline decoration-red-500">Urgentes</span> sont traités par nos ingénieurs système en moins de 2 heures ouvrées.
                  </p>
              </CardContent>
          </Card>

          <Card className="bg-emerald-50 border-none group transition-all hover:bg-emerald-100/50">
              <CardHeader>
                  <CardTitle className="text-lg text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Satisfaction Support
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-emerald-800 leading-relaxed">
                      94% des demandes transmises au Helpdesk le mois dernier ont été résolues dès le premier contact. Merci pour votre confiance.
                  </p>
              </CardContent>
          </Card>
        </div>
      {user && (
          <AddTicketSheet
              isOpen={isAddSheetOpen}
              onClose={() => setIsAddSheetOpen(false)}
              onAddTicket={handleAddTicket}
              currentUser={{ id: user.id, name: user.name }}
          />
      )}
      </div>
  );
}
