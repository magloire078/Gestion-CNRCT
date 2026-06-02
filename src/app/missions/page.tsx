"use client";

import { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import {
  PlusCircle, Search, Eye, Pencil, Trash2,
  MoreHorizontal, FileText, Calendar,
  CheckCircle2, Clock, PlayCircle, MapPin, LogOut,
  List, LayoutGrid, GitBranch, ArrowUpDown, ArrowUp, ArrowDown,
  X, FileSpreadsheet, CalendarIcon, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Mission } from "@/lib/data";
import { AddMissionSheet } from "@/components/missions/add-mission-sheet";
import { MissionKanbanBoard } from "@/components/missions/mission-kanban-board";
import { MissionGlobalTimeline } from "@/components/missions/mission-global-timeline";
import { Input } from "@/components/ui/input";
import { subscribeToMissions, addMission, deleteMission, updateMission } from "@/services/mission-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import Link from "next/link";
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PaginationControls } from "@/components/common/pagination-controls";
import { useAuth } from "@/hooks/use-auth";
import { PermissionGuard } from "@/components/auth/permission-guard";

type Status = "Planifiée" | "En cours" | "Terminée" | "Annulée";
const allStatuses: Status[] = ["Planifiée", "En cours", "Terminée", "Annulée"];

const statusBadgeMap: Record<Status, { wrapper: string; dot: string }> = {
  "Planifiée":  { wrapper: "bg-blue-50 text-blue-700 border border-blue-100",       dot: "bg-blue-500" },
  "En cours":   { wrapper: "bg-emerald-50 text-emerald-700 border border-emerald-100", dot: "bg-emerald-500 animate-pulse" },
  "Terminée":   { wrapper: "bg-slate-100 text-slate-700 border border-slate-200",   dot: "bg-slate-500" },
  "Annulée":    { wrapper: "bg-rose-50 text-rose-700 border border-rose-100",       dot: "bg-rose-500" },
};

type SortColumn = "title" | "startDate" | "status" | "lieuMission";
type SortDirection = "asc" | "desc";

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
  return direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

type AgeAlert = { level: "urgent" | "warning"; label: string } | null;

function getMissionAlert(m: Mission): AgeAlert {
  const status = m.status;
  if (status === "Terminée" || status === "Annulée") return null;
  if (!m.startDate) return null;
  const start = parseISO(m.startDate);
  if (!isValid(start)) return null;
  const today = new Date();
  const daysToStart = differenceInDays(start, today);

  if (status === "Planifiée") {
    if (daysToStart < 0) return { level: "urgent", label: `Retard ${-daysToStart}j` };
    if (daysToStart <= 1) return { level: "urgent", label: daysToStart === 0 ? "Aujourd'hui" : "Demain" };
    if (daysToStart <= 7) return { level: "warning", label: `Dans ${daysToStart}j` };
  }
  if (status === "En cours" && m.endDate) {
    const end = parseISO(m.endDate);
    if (isValid(end)) {
      const daysOverdue = differenceInDays(today, end);
      if (daysOverdue > 0) return { level: "urgent", label: `Fin +${daysOverdue}j` };
    }
  }
  return null;
}

function AlertBadge({ alert }: { alert: AgeAlert }) {
  if (!alert) return null;
  const isUrgent = alert.level === "urgent";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm",
      isUrgent ? "bg-rose-600 text-white animate-pulse" : "bg-amber-100 text-amber-800 border border-amber-200"
    )}>
      {isUrgent ? <Flame className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
      {alert.label}
    </span>
  );
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedStatus, setSelectedStatus] = useState<string>("Tous");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "kanban" | "timeline">("list");

  const [sortColumn, setSortColumn] = useState<SortColumn>("startDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const canEdit = hasPermission('page:missions:view');
  const canDelete = hasPermission('page:missions:view') || hasPermission('feature:missions:delete');

  const formatDateRange = (start: string, end: string) => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      const startFormat = format(startDate, 'dd MMM', { locale: fr });
      const endFormat = format(endDate, 'dd MMM yyyy', { locale: fr });
      return `${startFormat} au ${endFormat}`;
    } catch {
      return `${start} au ${end}`;
    }
  };

  useEffect(() => {
    const isAdmin = hasPermission('page:missions:view');
    const unsubscribe = subscribeToMissions(
      (fetchedMissions) => {
        setMissions(fetchedMissions);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Impossible de charger les missions.");
        console.error(err);
        setLoading(false);
      },
      user?.id,
      user?.employeeId,
      isAdmin
    );
    return () => unsubscribe();
  }, [user, hasPermission]);

  const handleAddMission = async (newMissionData: Omit<Mission, "id">) => {
    try {
      const newMission = await addMission(newMissionData);
      setIsSheetOpen(false);
      toast({
        title: "Mission ajoutée",
        description: `La mission "${newMissionData.title}" a été ajoutée avec succès.`,
      });
      router.push(`/missions/${newMission.id}/edit`);
    } catch (err) {
      console.error("Failed to add mission:", err);
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMission(deleteTarget.id);
      toast({
        title: "Mission supprimée",
        description: `La mission "${deleteTarget.title}" a été supprimée.`,
      });
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la mission." });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleQuickStatusChange = async (mission: Mission, newStatus: Status) => {
    if (newStatus === mission.status) return;
    try {
      await updateMission(mission.id, { status: newStatus });
      toast({ title: "Statut mis à jour", description: `${mission.title} → ${newStatus}` });
    } catch (err) {
      console.error("Quick status change failed:", err);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le statut." });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteMission(id)));
      toast({ title: "Suppression groupée", description: `${selectedIds.size} mission(s) supprimée(s).` });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Erreur de suppression groupée" });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExportCsv = () => {
    if (filteredMissions.length === 0) {
      toast({ variant: "destructive", title: "Aucune donnée à exporter" });
      return;
    }
    const csvData = Papa.unparse(filteredMissions.map(m => ({
      numero: m.numeroMission || '',
      titre: m.title,
      lieu: m.lieuMission || '',
      statut: m.status,
      date_debut: m.startDate,
      date_fin: m.endDate,
      participants: (m.participants || []).map(p => p.employeeName).join(' ; '),
      nombre_agents: (m.participants || []).length,
      description: m.description,
    })), { header: true });
    const blob = new Blob(["﻿" + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_missions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast({ title: "Exportation CSV réussie", description: `${filteredMissions.length} mission(s) exportée(s).` });
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    else { setSortColumn(column); setSortDirection("asc"); }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("Tous");
    setDateRange(undefined);
    setCurrentPage(1);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredMissions = useMemo(() => {
    const filtered = missions.filter(mission => {
      if (!hasPermission('page:missions:view') && user?.employeeId) {
        const isParticipant = (mission.participants || []).some(p => p.employeeId === user.employeeId);
        if (!isParticipant) return false;
      }

      const searchTermLower = searchTerm.toLowerCase();
      const participantsString = (mission.participants || []).map(p => p.employeeName).join(" ").toLowerCase();
      const matchesSearch = mission.title.toLowerCase().includes(searchTermLower) ||
        participantsString.includes(searchTermLower) ||
        mission.description.toLowerCase().includes(searchTermLower) ||
        (mission.lieuMission || '').toLowerCase().includes(searchTermLower);

      const matchesStatus = selectedStatus === "Tous" || mission.status === selectedStatus;

      let matchesDate = true;
      if (dateRange?.from || dateRange?.to) {
        const start = mission.startDate ? parseISO(mission.startDate) : null;
        if (!start || !isValid(start)) {
          matchesDate = false;
        } else {
          if (dateRange.from && start < new Date(new Date(dateRange.from).setHours(0, 0, 0, 0))) matchesDate = false;
          if (dateRange.to && start > new Date(new Date(dateRange.to).setHours(23, 59, 59, 999))) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      const av = (a[sortColumn] || '') as string;
      const bv = (b[sortColumn] || '') as string;
      return av.localeCompare(bv, 'fr') * dir;
    });

    if (currentPage > Math.ceil(sorted.length / itemsPerPage)) setCurrentPage(1);
    return sorted;
  }, [missions, searchTerm, selectedStatus, dateRange, currentPage, itemsPerPage, sortColumn, sortDirection, user, hasPermission]);

  const paginatedMissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMissions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMissions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);

  const stats = useMemo(() => {
    const total = missions.length;
    const ongoing = missions.filter(m => m.status === 'En cours').length;
    const planned = missions.filter(m => m.status === 'Planifiée').length;
    const completed = missions.filter(m => m.status === 'Terminée').length;
    return { total, ongoing, planned, completed };
  }, [missions]);

  const hasActiveFilters = searchTerm !== "" || selectedStatus !== "Tous" || !!dateRange?.from || !!dateRange?.to;

  const allVisibleSelected = paginatedMissions.length > 0 && paginatedMissions.every(m => selectedIds.has(m.id));
  const someVisibleSelected = paginatedMissions.some(m => selectedIds.has(m.id));
  const toggleSelectAllVisible = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) paginatedMissions.forEach(m => next.delete(m.id));
      else paginatedMissions.forEach(m => next.add(m.id));
      return next;
    });
  };

  return (
    <PermissionGuard permission="page:missions:view">
      <div className="flex flex-col gap-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900 flex items-center gap-3">
              <LogOut className="h-10 w-10 text-blue-600 rotate-180" />
              Missions & Déplacements
            </h1>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 pl-1">Régulation des Ordres de Mission Institutionnels</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
              <Button variant={activeTab === "list" ? "secondary" : "ghost"} size="sm" className={cn("h-8 rounded-lg font-bold text-xs", activeTab === "list" && "shadow-sm")} onClick={() => setActiveTab("list")}>
                <List className="mr-2 h-3.5 w-3.5" /> Liste
              </Button>
              <Button variant={activeTab === "kanban" ? "secondary" : "ghost"} size="sm" className={cn("h-8 rounded-lg font-bold text-xs", activeTab === "kanban" && "shadow-sm")} onClick={() => setActiveTab("kanban")}>
                <LayoutGrid className="mr-2 h-3.5 w-3.5" /> Kanban
              </Button>
              <Button variant={activeTab === "timeline" ? "secondary" : "ghost"} size="sm" className={cn("h-8 rounded-lg font-bold text-xs", activeTab === "timeline" && "shadow-sm")} onClick={() => setActiveTab("timeline")}>
                <GitBranch className="mr-2 h-3.5 w-3.5" /> Chronologie
              </Button>
            </div>

            {hasPermission('page:missions:view') && (
              <>
                <Button variant="outline" onClick={handleExportCsv} className="h-12 rounded-2xl border-slate-200 bg-white/50 backdrop-blur-md px-5 font-black uppercase tracking-widest text-[11px]">
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> CSV
                </Button>
                <Button variant="outline" asChild className="h-12 rounded-2xl border-slate-200 bg-white/50 backdrop-blur-md px-6 font-black uppercase tracking-widest text-[11px]">
                  <Link href="/missions/report">
                    <FileText className="mr-2 h-4 w-4 text-blue-600" /> Rapport Annuel
                  </Link>
                </Button>
                <Button onClick={() => setIsSheetOpen(true)} className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/20 text-white hover:bg-black gap-2">
                  <PlusCircle className="h-4 w-4 text-emerald-400" /> Nouvelle Mission
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
          <Card className="border-white/10 shadow-2xl bg-slate-900 text-white overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] rounded-2xl">
            <CardHeader className="p-6 relative z-10">
              <CardDescription className="text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">Total Ordonnancements</CardDescription>
              <CardTitle className="text-4xl font-black mt-1">{loading ? <Skeleton className="h-10 w-20 bg-slate-800" /> : stats.total}</CardTitle>
            </CardHeader>
            <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:opacity-20 transition-all duration-700 pointer-events-none group-hover:rotate-0 group-hover:scale-110">
              <Calendar className="h-32 w-32 -rotate-12" />
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          </Card>
          <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] rounded-2xl">
            <CardHeader className="p-6 relative z-10">
              <CardDescription className="text-slate-500 font-black uppercase text-[9px] tracking-[0.2em]">Déploiements Actifs</CardDescription>
              <CardTitle className="text-4xl font-black mt-1 text-slate-900">{loading ? <Skeleton className="h-10 w-16" /> : stats.ongoing}</CardTitle>
            </CardHeader>
            <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none">
              <PlayCircle className="h-32 w-32" />
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          </Card>
          <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] rounded-2xl">
            <CardHeader className="p-6 relative z-10">
              <CardDescription className="text-slate-500 font-black uppercase text-[9px] tracking-[0.2em]">Programmation</CardDescription>
              <CardTitle className="text-4xl font-black mt-1 text-blue-600">{loading ? <Skeleton className="h-10 w-16" /> : stats.planned}</CardTitle>
            </CardHeader>
            <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none">
              <Clock className="h-32 w-32" />
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          </Card>
          <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] rounded-2xl">
            <CardHeader className="p-6 relative z-10">
              <CardDescription className="text-slate-500 font-black uppercase text-[9px] tracking-[0.2em]">Exécutions Validées</CardDescription>
              <CardTitle className="text-4xl font-black mt-1 text-emerald-600">{loading ? <Skeleton className="h-10 w-16" /> : stats.completed}</CardTitle>
            </CardHeader>
            <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none">
              <CheckCircle2 className="h-32 w-32" />
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-600 to-transparent" />
          </Card>
        </div>

        {/* Main panel */}
        {activeTab === "list" && (
          <Card className="border-white/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden rounded-2xl px-2">
            <CardHeader className="border-b border-border/50 bg-primary/5 py-6 px-8">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Registre des Missions</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
                    Base de données centralisée des déploiements
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher mission, agent, lieu..."
                      className="h-11 pl-12 pr-4 rounded-xl border-slate-200 bg-white/50 focus:bg-white transition-all font-bold text-xs tracking-wider"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[160px] h-11 rounded-xl font-black text-[10px] uppercase tracking-widest">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tous" className="font-black text-[10px] uppercase">Tous statuts</SelectItem>
                      {allStatuses.map(s => <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(
                        "w-[220px] h-11 rounded-xl border-slate-200 bg-white/50 font-black text-[10px] uppercase tracking-widest justify-start",
                        (dateRange?.from || dateRange?.to) && "border-primary text-primary"
                      )}>
                        <CalendarIcon className="h-3.5 w-3.5 mr-2 text-slate-400" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <span>{format(dateRange.from, "dd MMM", { locale: fr })} → {format(dateRange.to, "dd MMM yy", { locale: fr })}</span>
                          ) : (
                            <span>Depuis {format(dateRange.from, "dd MMM yy", { locale: fr })}</span>
                          )
                        ) : <span className="text-slate-500">Plage de dates</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                      <CalendarPicker mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={fr} />
                      <div className="flex items-center justify-between p-3 border-t border-slate-100">
                        <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)} className="font-bold text-xs">Effacer</Button>
                        <Button size="sm" onClick={() => setIsDateOpen(false)} className="font-bold text-xs rounded-lg">Appliquer</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {hasActiveFilters && (
                    <Button variant="ghost" onClick={handleResetFilters} className="h-11 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-rose-600 hover:bg-rose-50">
                      <X className="h-3.5 w-3.5 mr-1.5" /> Réinitialiser
                    </Button>
                  )}
                </div>
              </div>

              {!loading && (
                <div className="mt-4 flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <span className="text-slate-900 tabular-nums">{filteredMissions.length}</span> mission{filteredMissions.length > 1 ? 's' : ''}
                    {hasActiveFilters && <span className="text-slate-400 normal-case font-bold italic ml-2">(filtré sur {missions.length})</span>}
                  </p>
                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600">
                        {selectedIds.size} sélectionnée{selectedIds.size > 1 ? 's' : ''}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        Désélectionner
                      </Button>
                      {canDelete && (
                        <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)} className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          <Trash2 className="h-3 w-3 mr-1" /> Supprimer la sélection
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {error && <p className="text-destructive text-center py-10 font-bold">{error}</p>}

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="w-10 pl-6">
                        <Checkbox
                          checked={allVisibleSelected ? true : (someVisibleSelected ? "indeterminate" : false)}
                          onCheckedChange={toggleSelectAllVisible}
                          aria-label="Sélectionner tout"
                        />
                      </TableHead>
                      <TableHead className="w-[60px] font-black uppercase text-[10px] tracking-widest text-center py-6 text-slate-500">ID</TableHead>
                      <TableHead onClick={() => handleSort('title')} className="font-black uppercase text-[10px] tracking-widest text-slate-500 cursor-pointer select-none hover:text-slate-700">
                        <span className="inline-flex items-center gap-1">Désignation Opérationnelle <SortIcon active={sortColumn === 'title'} direction={sortDirection} /></span>
                      </TableHead>
                      <TableHead onClick={() => handleSort('lieuMission')} className="font-black uppercase text-[10px] tracking-widest text-slate-500 cursor-pointer select-none hover:text-slate-700">
                        <span className="inline-flex items-center gap-1">Lieu <SortIcon active={sortColumn === 'lieuMission'} direction={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-center">Équipage</TableHead>
                      <TableHead onClick={() => handleSort('startDate')} className="font-black uppercase text-[10px] tracking-widest text-slate-500 cursor-pointer select-none hover:text-slate-700">
                        <span className="inline-flex items-center gap-1">Calendrier <SortIcon active={sortColumn === 'startDate'} direction={sortDirection} /></span>
                      </TableHead>
                      <TableHead onClick={() => handleSort('status')} className="font-black uppercase text-[10px] tracking-widest text-slate-500 cursor-pointer select-none hover:text-slate-700">
                        <span className="inline-flex items-center gap-1">Statut <SortIcon active={sortColumn === 'status'} direction={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="sr-only">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-border/20">
                          <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32 mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      paginatedMissions.map((mission, index) => {
                        const status = mission.status as Status;
                        const style = statusBadgeMap[status] || statusBadgeMap["Planifiée"];
                        const alert = getMissionAlert(mission);
                        return (
                          <TableRow
                            key={mission.id}
                            className={cn(
                              "cursor-pointer border-border/20 hover:bg-white/40 transition-all group h-20",
                              selectedIds.has(mission.id) && "bg-indigo-50/40 hover:bg-indigo-50/60"
                            )}
                          >
                            <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(mission.id)}
                                onCheckedChange={() => toggleSelectOne(mission.id)}
                                aria-label={`Sélectionner ${mission.title}`}
                              />
                            </TableCell>
                            <TableCell onClick={() => router.push(`/missions/${mission.id}`)} className="text-center font-black text-slate-300 group-hover:text-slate-900 transition-colors">
                              {((currentPage - 1) * itemsPerPage + index + 1).toString().padStart(2, '0')}
                            </TableCell>
                            <TableCell onClick={() => router.push(`/missions/${mission.id}`)}>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900 uppercase tracking-tight text-sm group-hover:text-blue-600 transition-colors">
                                  {mission.title}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 mt-0.5 line-clamp-1 italic">
                                  {mission.description}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell onClick={() => router.push(`/missions/${mission.id}`)}>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                <span className="text-xs font-bold text-slate-700">
                                  {mission.lieuMission || <span className="italic text-slate-300">Non renseigné</span>}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell onClick={() => router.push(`/missions/${mission.id}`)}>
                              <div className="flex justify-center -space-x-2">
                                {(mission.participants || []).slice(0, 3).map((p, idx) => (
                                  <div
                                    key={`${p.employeeId}-${idx}`}
                                    className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm"
                                    title={p.employeeName}
                                  >
                                    {p.employeeName.charAt(0)}
                                  </div>
                                ))}
                                {(mission.participants || []).length > 3 && (
                                  <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                                    +{(mission.participants || []).length - 3}
                                  </div>
                                )}
                                {(mission.participants || []).length === 0 && (
                                  <span className="text-[10px] italic text-slate-300 font-bold">Aucun</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell onClick={() => router.push(`/missions/${mission.id}`)}>
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                                  {formatDateRange(mission.startDate, mission.endDate)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-start gap-1.5">
                                {canEdit ? (
                                  <Select value={status} onValueChange={(v) => handleQuickStatusChange(mission, v as Status)}>
                                    <SelectTrigger asChild>
                                      <button className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm transition-all hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 cursor-pointer", style.wrapper)}>
                                        <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                                        {status}
                                        <ArrowDown className="h-2.5 w-2.5 opacity-40" />
                                      </button>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                      {allStatuses.map(st => <SelectItem key={st} value={st} className="font-bold text-xs">{st}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm", style.wrapper)}>
                                    <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                                    {status}
                                  </div>
                                )}
                                <AlertBadge alert={alert} />
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()} className="h-10 w-10 rounded-xl hover:bg-slate-200/50 transition-colors">
                                    <MoreHorizontal className="h-5 w-5 text-slate-600" />
                                    <span className="sr-only">Ouvrir le menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenuLabel className="px-3 py-2 font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Opérations</DropdownMenuLabel>
                                  <DropdownMenuItem onSelect={() => router.push(`/missions/${mission.id}`)} className="rounded-xl font-bold py-2.5 px-3 focus:bg-slate-100 cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4 text-blue-600" /> Dossier complet
                                  </DropdownMenuItem>
                                  {hasPermission('page:missions:view') && (
                                    <>
                                      <DropdownMenuItem onSelect={() => router.push(`/missions/${mission.id}/edit`)} className="rounded-xl font-bold py-2.5 px-3 focus:bg-slate-100 cursor-pointer">
                                        <Pencil className="mr-2 h-4 w-4 text-slate-600" /> Rectifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onSelect={() => setDeleteTarget(mission)} className="rounded-xl text-rose-600 font-bold py-2.5 px-3 focus:bg-rose-50 focus:text-rose-600 cursor-pointer">
                                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="grid grid-cols-1 gap-4 md:hidden p-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
                ) : (
                  paginatedMissions.map((mission) => {
                    const status = mission.status as Status;
                    const style = statusBadgeMap[status] || statusBadgeMap["Planifiée"];
                    return (
                      <Card key={mission.id} onClick={() => router.push(`/missions/${mission.id}`)} className="bg-white/50 border-white/10 rounded-2xl shadow-lg overflow-hidden active:scale-95 transition-all">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", style.wrapper)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                              {status}
                            </div>
                            <span className="text-[10px] font-black text-slate-300">#{mission.id.slice(-4).toUpperCase()}</span>
                          </div>
                          <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight mt-2 line-clamp-2">{mission.title}</CardTitle>
                          {mission.lieuMission && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                              <MapPin className="h-3 w-3" /> {mission.lieuMission}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="pb-4 space-y-3">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            {formatDateRange(mission.startDate, mission.endDate)}
                          </div>
                          <div className="flex -space-x-1.5 pt-1">
                            {(mission.participants || []).slice(0, 5).map((p, idx) => (
                              <div key={`${p.employeeId || 'm'}-${idx}`} className="h-7 w-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-600">
                                {p.employeeName.charAt(0)}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {!loading && paginatedMissions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-black uppercase tracking-tight">Aucun résultat</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Ajustez votre recherche ou vos filtres</p>
                </div>
              )}
            </CardContent>
            {totalPages > 1 && (
              <CardFooter className="py-8 px-8 border-t border-border/50">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  totalItems={filteredMissions.length}
                />
              </CardFooter>
            )}
          </Card>
        )}

        {activeTab === "kanban" && (
          <Card className="border-white/10 shadow-2xl bg-white overflow-hidden rounded-2xl">
            <CardHeader className="border-b border-border/50 bg-primary/5 py-6 px-8">
              <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Pipeline des Missions</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
                {canEdit ? "Glissez-déposez une mission pour changer son statut." : "Vue d'ensemble du pipeline (lecture seule)."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 p-6">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[400px] rounded-3xl" />)}
                </div>
              ) : (
                <MissionKanbanBoard
                  missions={filteredMissions}
                  onStatusChange={handleQuickStatusChange}
                  onCardClick={(m) => router.push(`/missions/${m.id}`)}
                  canEdit={canEdit}
                />
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "timeline" && (
          <Card className="border-white/10 shadow-2xl bg-white overflow-hidden rounded-2xl">
            <CardHeader className="border-b border-border/50 bg-primary/5 py-6 px-8">
              <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Chronologie des Missions</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
                Frise temporelle des déploiements et clôtures, groupée par mois.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
              ) : (
                <MissionGlobalTimeline missions={filteredMissions} onCardClick={(m) => router.push(`/missions/${m.id}`)} />
              )}
            </CardContent>
          </Card>
        )}

        <AddMissionSheet
          isOpen={isSheetOpen}
          onCloseAction={() => setIsSheetOpen(false)}
          onAddMissionAction={handleAddMission}
        />
      </div>

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onCloseAction={() => setDeleteTarget(null)}
        onConfirmAction={handleDeleteConfirm}
        title={`Supprimer la mission : ${deleteTarget?.title}`}
        description="Êtes-vous sûr de vouloir supprimer cette mission ? Cette action est irréversible."
      />

      <ConfirmationDialog
        isOpen={bulkDeleteOpen}
        onCloseAction={() => setBulkDeleteOpen(false)}
        onConfirmAction={handleBulkDelete}
        title={`Supprimer ${selectedIds.size} mission(s)`}
        description={`Cette action supprimera définitivement ${selectedIds.size} mission(s). Elle est irréversible.`}
      />
    </PermissionGuard>
  );
}
