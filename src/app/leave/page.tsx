"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import Link from 'next/link';
import { 
  PlusCircle, Check, X, Search, FileText, Pencil, Trash2, 
  Calendar, Clock, CheckCircle2, XCircle, CalendarDays, 
  ListFilter, Sparkles, UserCircle2, AlertCircle, ShieldAlert
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DebouncedInput } from "@/components/ui/debounced-input";
import type { Leave, Employe } from "@/lib/data";
import { AddLeaveRequestSheet } from "@/components/leave/add-leave-request-sheet";
import { EditLeaveRequestSheet } from "@/components/leave/edit-leave-request-sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subscribeToLeaves, addLeave, updateLeaveStatus, updateLeave, deleteLeave } from "@/services/leave-service";
import { getEmployees } from "@/services/employee-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { LeaveCalendar } from "@/components/leave/leave-calendar";
import { format, parseISO, eachDayOfInterval, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PaginationControls } from "@/components/common/pagination-controls";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { cn } from "@/lib/utils";

type Status = "Approuvé" | "En attente" | "Rejeté";

const leaveTypes = ["Congé Annuel", "Congé Maladie", "Congé Personnel", "Congé Maternité", "Congé sans solde"];

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("list");
  const [isPending, startTransition] = useTransition();

  const { user, hasPermission } = useAuth();
  const { can } = usePermissions();

  const isSuperAdmin = ['super-admin', 'administrateur', 'LHcHyfBzile3r0vyFOFb', 'manager-rh', 'dirigeant-president'].includes(user?.roleId || '');
  const canManageLeaves = isSuperAdmin || can('leaves', 'update') || hasPermission('leaves:update') || hasPermission('page:leaves:edit') || hasPermission('page:admin:view');
  const canDeleteLeaves = isSuperAdmin || can('leaves', 'delete') || hasPermission('leaves:delete') || hasPermission('page:admin:view');
  const canViewAllLeaves = isSuperAdmin || can('leaves', 'read') || hasPermission('leaves:read') || hasPermission('page:leaves:view') || hasPermission('page:admin:view');

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const calculateWorkingDays = (startDate: string, endDate: string): number => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const days = eachDayOfInterval({ start, end });
      // Exclude Sundays (0)
      return days.filter(day => getDay(day) !== 0).length;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubLeaves = subscribeToLeaves(
      (fetchedLeaves) => {
        setLeaves(fetchedLeaves);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Impossible de charger les demandes de congé.");
        console.error(err);
        setLoading(false);
      },
      user?.employeeId,
      canViewAllLeaves
    );

    getEmployees().then(fetchedEmployees => {
      setEmployees(fetchedEmployees.filter(e => e.status === 'Actif'));
    }).catch(err => {
      console.warn("Could not fetch full directory:", err);
    });

    return () => {
      unsubLeaves();
    };
  }, [user?.employeeId, canViewAllLeaves]);

  const handleLeaveStatusChange = async (id: string, status: "Approuvé" | "Rejeté") => {
    try {
      await updateLeaveStatus(id, status);
      toast({
        title: "Statut mis à jour",
        description: `La demande a été marquée comme ${status}.`,
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la demande.",
        variant: "destructive",
      });
    }
  };

  const handleAddLeaveRequest = async (newLeaveRequest: Omit<Leave, 'id' | 'status'>) => {
    try {
      const newRequest = await addLeave(newLeaveRequest);
      setIsAddSheetOpen(false);
      toast({
        title: "Demande enregistrée",
        description: `Votre demande de congé a été transmise pour validation.`,
      });
    } catch (err) {
      console.error("Failed to add leave request:", err);
      throw err;
    }
  };

  const handleUpdateLeaveRequest = async (id: string, data: Partial<Omit<Leave, "id" | "status">>) => {
    try {
      await updateLeave(id, data);
      setIsEditSheetOpen(false);
      toast({
        title: "Demande mise à jour",
        description: "Les modifications ont été enregistrées avec succès.",
      });
    } catch (err) {
      console.error("Failed to update leave request:", err);
      throw err;
    }
  };

  const handleDeleteLeave = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette demande de congé ? Cette action est irréversible.")) {
      return;
    }

    try {
      await deleteLeave(id);
      toast({
        title: "Demande supprimée",
        description: "La demande de congé a été supprimée avec succès.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la demande de congé.",
        variant: "destructive",
      });
    }
  };

  const openEditSheet = (leave: Leave) => {
    startTransition(() => {
      setSelectedLeave(leave);
      setIsEditSheetOpen(true);
    });
  };

  const filteredLeaves = useMemo(() => {
    const filtered = leaves.map(leave => {
      const employeeDetails = employees.find(e => e.id === leave.employeeId || e.name === leave.employee);
      return {
        ...leave,
        employeeDetails
      };
    }).filter(leaveWithDetails => {
      // If employee only, client-side safety filter on employeeId
      if (!canViewAllLeaves && user?.employeeId) {
        if (leaveWithDetails.employeeId !== user.employeeId) return false;
      }

      const { employee, employeeDetails } = leaveWithDetails;
      const searchTermLower = searchTerm.toLowerCase();

      const matchesSearch = searchTerm ? (
        employee.toLowerCase().includes(searchTermLower) ||
        (employeeDetails?.firstName?.toLowerCase().includes(searchTermLower)) ||
        (employeeDetails?.lastName?.toLowerCase().includes(searchTermLower)) ||
        (employeeDetails?.matricule?.toLowerCase().includes(searchTermLower))
      ) : true;

      const matchesType = typeFilter === 'all' || leaveWithDetails.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || leaveWithDetails.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    return filtered;
  }, [leaves, employees, searchTerm, typeFilter, statusFilter, canViewAllLeaves, user?.employeeId]);

  const paginatedLeaves = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLeaves.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLeaves, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / itemsPerPage));

  // KPIs
  const stats = useMemo(() => {
    const pending = leaves.filter((l) => l.status === "En attente").length;
    const approved = leaves.filter((l) => l.status === "Approuvé").length;
    const rejected = leaves.filter((l) => l.status === "Rejeté").length;
    const totalDaysTaken = leaves
      .filter((l) => l.status === "Approuvé")
      .reduce((sum, l) => sum + calculateWorkingDays(l.startDate, l.endDate), 0);
    return {
      pending,
      approved,
      rejected,
      totalDaysTaken,
      total: leaves.length,
    };
  }, [leaves]);

  return (
    <PermissionGuard permission="page:leaves:view" allowPersonal>
      <div className="flex flex-col gap-6 pb-12">
        {/* Header Hero Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-md shadow-slate-900/10">
              <CalendarDays className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl lg:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {canViewAllLeaves ? "Gestion des Congés & Absences" : "Mon Espace Congés"}
                </h1>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border-none",
                    canViewAllLeaves 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "bg-emerald-50 text-emerald-700"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", canViewAllLeaves ? "bg-indigo-500" : "bg-emerald-500")} />
                  {canViewAllLeaves ? "Gouvernance RH" : "Espace Collaborateur"}
                </Badge>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                {canViewAllLeaves 
                  ? "Registre institutionnel et arbitrage des permissions d'absence" 
                  : "Suivi individuel de vos demandes de congés et autorisations"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 relative z-10">
            {canViewAllLeaves && (
              <Button 
                variant="outline" 
                asChild
                className="h-10 rounded-xl border-slate-200/80 bg-white px-4 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Link href="/leave/report">
                  <FileText className="mr-2 h-4 w-4 text-blue-600" />
                  Rapport des Congés
                </Link>
              </Button>
            )}

            {(canManageLeaves || !!user?.employeeId) && (
              <Button 
                onClick={() => setIsAddSheetOpen(true)}
                className="h-10 rounded-xl bg-slate-900 px-4 font-bold text-xs shadow-md shadow-slate-900/15 active:scale-95 transition-all text-white hover:bg-slate-800 gap-2"
              >
                <PlusCircle className="h-4 w-4 text-emerald-400" />
                Nouvelle Demande
              </Button>
            )}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-4">
          {/* En attente */}
          <div 
            onClick={() => setStatusFilter("En attente")}
            className={cn(
              "rounded-2xl bg-white p-4 lg:p-5 border shadow-sm transition-all duration-200 cursor-pointer group",
              statusFilter === "En attente" ? "border-amber-500 ring-2 ring-amber-500/10 shadow-md" : "border-slate-200/70 hover:border-slate-300"
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                En Attente
              </span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.pending}
            </div>
            <div className="text-[10px] font-medium text-amber-600 mt-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              En cours de validation
            </div>
          </div>

          {/* Approuvées */}
          <div 
            onClick={() => setStatusFilter("Approuvé")}
            className={cn(
              "rounded-2xl bg-white p-4 lg:p-5 border shadow-sm transition-all duration-200 cursor-pointer group",
              statusFilter === "Approuvé" ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-md" : "border-slate-200/70 hover:border-slate-300"
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Approuvées
              </span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.approved}
            </div>
            <div className="text-[10px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Validées avec succès
            </div>
          </div>

          {/* Total Jours Pris */}
          <div 
            className="rounded-2xl bg-white p-4 lg:p-5 border border-slate-200/70 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Jours Consommés
              </span>
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.totalDaysTaken} <span className="text-xs font-bold text-slate-400">jours</span>
            </div>
            <div className="text-[10px] font-medium text-slate-400 mt-1">
              Jours ouvrés accordés
            </div>
          </div>

          {/* Rejetées */}
          <div 
            onClick={() => setStatusFilter("Rejeté")}
            className={cn(
              "rounded-2xl bg-white p-4 lg:p-5 border shadow-sm transition-all duration-200 cursor-pointer group",
              statusFilter === "Rejeté" ? "border-rose-500 ring-2 ring-rose-500/10 shadow-md" : "border-slate-200/70 hover:border-slate-300"
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Rejetées
              </span>
              <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.rejected}
            </div>
            <div className="text-[10px] font-medium text-slate-400 mt-1">
              Dossiers refusés
            </div>
          </div>
        </div>

        {/* Tabs & Content */}
        <Tabs value={activeTab} onValueChange={(v) => startTransition(() => setActiveTab(v))} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <TabsList className="bg-white/80 p-1 border border-slate-200/80 backdrop-blur-md rounded-xl shadow-sm inline-flex gap-1 h-11 w-full sm:w-auto">
              <TabsTrigger 
                value="list" 
                className="gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md active:scale-95 transition-all text-xs font-bold uppercase tracking-wider"
              >
                <ListFilter className="h-3.5 w-3.5" />
                Vue Liste
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md active:scale-95 transition-all text-xs font-bold uppercase tracking-wider"
              >
                <Calendar className="h-3.5 w-3.5" />
                Vue Calendrier
              </TabsTrigger>
            </TabsList>

            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider self-end sm:self-center">
              {filteredLeaves.length} dossier{filteredLeaves.length > 1 ? 's' : ''} trouvé{filteredLeaves.length > 1 ? 's' : ''}
            </span>
          </div>

          <TabsContent value="list" className="space-y-4 focus-visible:outline-none">
            <Card className="border border-slate-200/80 shadow-sm bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
              {/* Filter Toolbar */}
              <div className="p-4 lg:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <DebouncedInput
                    placeholder={canViewAllLeaves ? "RECHERCHER UN AGENT (NOM, MATRICULE)..." : "RECHERCHER DANS MES CONGÉS..."}
                    className="pl-10 h-10 bg-white border-slate-200/80 rounded-xl font-bold uppercase tracking-wider text-xs placeholder:text-slate-400/70 focus-visible:ring-slate-900"
                    value={searchTerm}
                    onChange={(val) => startTransition(() => setSearchTerm(String(val)))}
                  />
                </div>

                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <Select value={typeFilter} onValueChange={(v) => startTransition(() => setTypeFilter(v))}>
                    <SelectTrigger className="h-10 w-full sm:w-[190px] bg-white border-slate-200/80 rounded-xl font-bold text-xs uppercase tracking-wider">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="font-bold text-xs uppercase tracking-wider">Tous les types</SelectItem>
                      {leaveTypes.map(type => (
                        <SelectItem key={type} value={type} className="font-medium text-xs">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(v) => startTransition(() => setStatusFilter(v))}>
                    <SelectTrigger className="h-10 w-full sm:w-[170px] bg-white border-slate-200/80 rounded-xl font-bold text-xs uppercase tracking-wider">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="font-bold text-xs uppercase tracking-wider">Tous les statuts</SelectItem>
                      <SelectItem value="En attente" className="font-medium text-xs text-amber-600">En attente</SelectItem>
                      <SelectItem value="Approuvé" className="font-medium text-xs text-emerald-600">Approuvé</SelectItem>
                      <SelectItem value="Rejeté" className="font-medium text-xs text-rose-600">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="p-4 mx-5 my-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/60">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3.5 pl-6">Collaborateur</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3.5">Nature Congé</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3.5">Période d'absence</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3.5 text-center">Durée</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3.5">Motif / Décision</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3.5">Statut</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3.5 text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i} className="border-slate-100">
                          <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="pr-6"><div className="flex justify-end gap-1.5"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-8 w-8 rounded-lg" /></div></TableCell>
                        </TableRow>
                      ))
                    ) : paginatedLeaves.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Calendar className="h-10 w-10 text-slate-300 stroke-1" />
                            <p className="font-bold text-xs uppercase tracking-wider text-slate-500">Aucune demande de congé enregistrée</p>
                            <p className="text-xs text-slate-400 max-w-sm">
                              {canViewAllLeaves 
                                ? "Aucun dossier ne correspond aux filtres de recherche sélectionnés." 
                                : "Vous n'avez aucune demande d'absence en cours. Cliquez sur Nouvelle Demande pour poser un congé."}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedLeaves.map((leave) => {
                        const displayName = `${leave.employeeDetails?.lastName || ''} ${leave.employeeDetails?.firstName || ''}`.trim() || leave.employee;
                        const workingDays = calculateWorkingDays(leave.startDate, leave.endDate);
                        const isPendingRow = leave.status === "En attente";
                        const isApproved = leave.status === "Approuvé";
                        const isRejected = leave.status === "Rejeté";

                        return (
                          <TableRow key={leave.id} className="border-slate-100 hover:bg-slate-50/70 transition-colors">
                            <TableCell className="py-3 pl-6 font-bold text-xs text-slate-900 uppercase">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">
                                  {displayName.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span>{displayName}</span>
                                  {leave.employeeDetails?.matricule && (
                                    <span className="text-[9px] font-semibold text-slate-400 tracking-wider">MAT: {leave.employeeDetails.matricule}</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-3 text-xs font-semibold text-slate-700">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                {leave.type}
                              </span>
                            </TableCell>

                            <TableCell className="py-3 text-xs font-medium text-slate-600">
                              {formatDate(leave.startDate)} <span className="text-slate-400">→</span> {formatDate(leave.endDate)}
                            </TableCell>

                            <TableCell className="py-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 font-black text-[10px] text-slate-700">
                                {workingDays} j
                              </span>
                            </TableCell>

                            <TableCell className="py-3 text-xs text-slate-500 max-w-xs truncate">
                              {leave.type === "Congé Annuel" && leave.num_decision ? (
                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-wider bg-slate-50 text-slate-700 border-slate-200">
                                  {leave.num_decision}
                                </Badge>
                              ) : (
                                leave.reason || '—'
                              )}
                            </TableCell>

                            <TableCell className="py-3">
                              <Badge
                                className={cn(
                                  "font-black text-[9px] uppercase tracking-wider px-2.5 py-1 border-none shadow-none",
                                  isApproved && "bg-emerald-50 text-emerald-700",
                                  isPendingRow && "bg-amber-50 text-amber-700",
                                  isRejected && "bg-rose-50 text-rose-700"
                                )}
                              >
                                <span className={cn(
                                  "h-1.5 w-1.5 rounded-full mr-1.5",
                                  isApproved && "bg-emerald-500",
                                  isPendingRow && "bg-amber-500 animate-pulse",
                                  isRejected && "bg-rose-500"
                                )} />
                                {leave.status}
                              </Badge>
                            </TableCell>

                            <TableCell className="py-3 pr-6 text-right">
                              <div className="flex justify-end gap-1">
                                {(isPendingRow || canManageLeaves) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                                    onClick={() => openEditSheet(leave)}
                                    title="Modifier la demande"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                )}

                                {(isPendingRow || canDeleteLeaves) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                                    onClick={() => handleDeleteLeave(leave.id)}
                                    title="Supprimer la demande"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}

                                {canManageLeaves && isPendingRow && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                                      onClick={() => handleLeaveStatusChange(leave.id, "Approuvé")}
                                      title="Approuver le congé"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                                      onClick={() => handleLeaveStatusChange(leave.id, "Rejeté")}
                                      title="Rejeter le congé"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-4 border-slate-100"><Skeleton className="h-20 w-full" /></Card>
                  ))
                ) : paginatedLeaves.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-semibold uppercase">
                    Aucune demande de congé trouvée.
                  </div>
                ) : (
                  paginatedLeaves.map((leave) => {
                    const displayName = `${leave.employeeDetails?.lastName || ''} ${leave.employeeDetails?.firstName || ''}`.trim() || leave.employee;
                    const workingDays = calculateWorkingDays(leave.startDate, leave.endDate);
                    const isPendingRow = leave.status === "En attente";

                    return (
                      <div key={leave.id} className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2.5 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-xs uppercase text-slate-900">{displayName}</p>
                            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">{leave.type}</p>
                          </div>
                          <Badge
                            className={cn(
                              "font-black text-[8px] uppercase tracking-wider px-2 py-0.5 border-none",
                              leave.status === "Approuvé" && "bg-emerald-50 text-emerald-700",
                              leave.status === "En attente" && "bg-amber-50 text-amber-700",
                              leave.status === "Rejeté" && "bg-rose-50 text-rose-700"
                            )}
                          >
                            {leave.status}
                          </Badge>
                        </div>

                        <div className="text-xs text-slate-600 flex items-center justify-between pt-1 border-t border-slate-100">
                          <span>{formatDate(leave.startDate)} → {formatDate(leave.endDate)}</span>
                          <span className="font-black text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{workingDays} j</span>
                        </div>

                        <div className="flex justify-end gap-1 pt-2 border-t border-slate-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg"
                            onClick={() => openEditSheet(leave)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg"
                            onClick={() => handleDeleteLeave(leave.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {totalPages > 1 && (
                <CardFooter className="p-4 border-t border-slate-100 bg-slate-50/40">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => startTransition(() => setCurrentPage(page))}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalItems={filteredLeaves.length}
                    isPending={isPending}
                  />
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="focus-visible:outline-none">
            <Card className="border border-slate-200/80 shadow-sm bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden p-6">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Planning & Calendrier des Congés Validés
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Visualisez les absences approuvées sur le calendrier institutionnel.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <LeaveCalendar leaves={leaves.filter(l => l.status === 'Approuvé')} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal Sheets */}
        <AddLeaveRequestSheet
          isOpen={isAddSheetOpen}
          onCloseAction={() => setIsAddSheetOpen(false)}
          onAddLeaveRequestAction={handleAddLeaveRequest}
        />
        <EditLeaveRequestSheet
          isOpen={isEditSheetOpen}
          onCloseAction={() => setIsEditSheetOpen(false)}
          onUpdateLeaveAction={handleUpdateLeaveRequest}
          leaveRequest={selectedLeave}
        />
      </div>
    </PermissionGuard>
  );
}
