
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search, Eye, Filter, ListFilter, User, Calendar, Tag } from "lucide-react";
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
  DropdownMenuItem,
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


const statusVariantMap: Record<TicketStatus, "default" | "secondary" | "outline" | "destructive"> = {
  'Ouvert': 'default',
  'En cours': 'secondary',
  'Fermé': 'outline',
};

const priorityVariantMap: Record<TicketPriority, "destructive" | "default" | "secondary"> = {
  'Haute': 'destructive',
  'Moyenne': 'default',
  'Basse': 'secondary',
};

const ticketCategories: TicketCategory[] = ['Technique', 'Facturation', 'Général'];
const ticketPriorities: TicketPriority[] = ['Basse', 'Moyenne', 'Haute'];
const ticketStatuses: TicketStatus[] = ['Ouvert', 'En cours', 'Fermé'];

export default function HelpdeskPage() {
  const { user } = useAuth();
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
    const unsubscribe = subscribeToTickets(
      (fetchedTickets) => {
        setTickets(fetchedTickets);
        setLoading(false);
      },
      (err) => {
        setError("Impossible de charger les tickets.");
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

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
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = ticket.title.toLowerCase().includes(searchTermLower) ||
                            ticket.id.toLowerCase().includes(searchTermLower) ||
                            ticket.createdByName.toLowerCase().includes(searchTermLower);
      
      const matchesStatus = filters.status.size === 0 || filters.status.has(ticket.status);
      const matchesPriority = filters.priority.size === 0 || filters.priority.has(ticket.priority);

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, filters]);
  
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const formatDate = (dateString: string) => {
    try {
        return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
        return dateString;
    }
  }

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Helpdesk
        </h1>
        <Button onClick={() => setIsAddSheetOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouveau Ticket
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Suivi des Tickets</CardTitle>
          <CardDescription>
            Affichez, gérez et suivez toutes les demandes de support.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, ID, créateur..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filtrer
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Statut</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ticketStatuses.map((status) => (
                    <DropdownMenuCheckboxItem
                        key={status}
                        checked={filters.status.has(status)}
                        onCheckedChange={() => handleFilterChange('status', status)}
                    >
                        {status}
                    </DropdownMenuCheckboxItem>
                ))}
                 <DropdownMenuSeparator />
                 <DropdownMenuLabel>Priorité</DropdownMenuLabel>
                 <DropdownMenuSeparator />
                {ticketPriorities.map((priority) => (
                    <DropdownMenuCheckboxItem
                        key={priority}
                        checked={filters.priority.has(priority)}
                        onCheckedChange={() => handleFilterChange('priority', priority)}
                    >
                        {priority}
                    </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredTickets.length} résultat(s) trouvé(s).
            </div>
          {error && <p className="text-destructive text-center py-4">{error}</p>}
           
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[120px]">Ticket ID</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Demandeur</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière MàJ</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    paginatedTickets.map((ticket) => (
                        <TableRow key={ticket.id} onClick={() => router.push(`/helpdesk/${ticket.id}`)} className="cursor-pointer">
                          <TableCell className="font-mono text-xs">{ticket.id}</TableCell>
                          <TableCell className="font-medium max-w-xs truncate">{ticket.title}</TableCell>
                          <TableCell>{ticket.createdByName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ticket.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={priorityVariantMap[ticket.priority]}>{ticket.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariantMap[ticket.status]}>{ticket.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(ticket.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); router.push(`/helpdesk/${ticket.id}`); }}>
                                  <Eye className="h-4 w-4" />
                              </Button>
                          </TableCell>
                        </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
            
          {!loading && paginatedTickets.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                <p>Aucun ticket trouvé.</p>
            </div>
          )}
        </CardContent>
         {totalPages > 1 && (
            <CardFooter>
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
    </div>
    {user && (
         <AddTicketSheet
            isOpen={isAddSheetOpen}
            onClose={() => setIsAddSheetOpen(false)}
            onAddTicket={handleAddTicket}
            currentUser={{ id: user.id, name: user.name }}
        />
    )}
    </>
  );
}
