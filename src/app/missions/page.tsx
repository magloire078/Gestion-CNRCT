"use client";

import { useState, useMemo, useEffect } from "react";
import {
  PlusCircle, Search, Eye, Pencil, Trash2,
  MoreHorizontal, FileText, Calendar,
  CheckCircle2, Clock, PlayCircle, MapPin, 
  ChevronRight, Sparkles, Filter, Users, XCircle, ArrowUpRight,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import type { Mission, OrganizationSettings } from "@/lib/data";
import { AddMissionSheet } from "@/components/missions/add-mission-sheet";
import { Input } from "@/components/ui/input";
import { subscribeToMissions, addMission, deleteMission } from "@/services/mission-service";
import { getOrganizationSettings } from "@/services/organization-service";
import { CollectiveMissionOrderPrint, GroupedIndividualMissionsPrint, GroupMissionRequestPrint } from "@/components/missions/mission-print-templates";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import Link from "next/link";
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PaginationControls } from "@/components/common/pagination-controls";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { PermissionGuard } from "@/components/auth/permission-guard";

type Status = "Planifiée" | "En cours" | "Terminée" | "Annulée";

const AVATAR_GRADIENTS = [
  "from-blue-600 to-indigo-600 text-white",
  "from-emerald-600 to-teal-600 text-white",
  "from-purple-600 to-violet-600 text-white",
  "from-amber-500 to-orange-600 text-white",
  "from-rose-500 to-pink-600 text-white",
  "from-cyan-600 to-blue-600 text-white",
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

const statusBadgeStyles: Record<Status, { bg: string; dot: string; icon: React.ReactNode }> = {
  'Planifiée': {
    bg: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dot: 'bg-sky-500',
    icon: <Clock className="h-3 w-3" />
  },
  'En cours': {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500 animate-ping',
    icon: <PlayCircle className="h-3 w-3" />
  },
  'Terminée': {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  'Annulée': {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
    icon: <XCircle className="h-3 w-3" />
  },
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { toast } = useToast();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Print States
  const [logos, setLogos] = useState<OrganizationSettings | null>(null);
  const [printTargetMission, setPrintTargetMission] = useState<Mission | null>(null);
  const [showCollectivePrint, setShowCollectivePrint] = useState(false);
  const [showGroupedIndividualPrint, setShowGroupedIndividualPrint] = useState(false);
  const [showGroupPrint, setShowGroupPrint] = useState(false);

  const formatDateRange = (start: string, end: string) => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      const startFormat = format(startDate, 'dd MMM', { locale: fr });
      const endFormat = format(endDate, 'dd MMM yyyy', { locale: fr });
      return `${startFormat} - ${endFormat}`;
    } catch {
      return `${start} - ${end}`;
    }
  };

  const getDuration = (start: string, end: string) => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      const diff = differenceInCalendarDays(endDate, startDate) + 1;
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  };

  useEffect(() => {
    getOrganizationSettings().then(setLogos).catch(console.error);

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
        description: `La mission "${newMissionData.title}" a été enregistrée avec succès.`,
      });
      router.push(`/missions/${newMission.id}`);
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
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer la mission."
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const { can } = usePermissions();
  const canCreate = hasPermission('page:missions:view') && can('missions', 'create');
  const canUpdate = hasPermission('page:missions:view') && can('missions', 'update');
  const canDelete = hasPermission('page:missions:view') && can('missions', 'delete');

  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      // Data-level filtering: If not admin/HR, only show missions where user is a participant
      if (!hasPermission('page:missions:view') && user?.employeeId) {
        const isParticipant = (mission.participants || []).some(p => p.employeeId === user.employeeId);
        if (!isParticipant) return false;
      }

      if (selectedStatus !== "all" && mission.status !== selectedStatus) {
        return false;
      }

      const searchTermLower = searchTerm.toLowerCase();
      const participantsString = (mission.participants || []).map(p => p.employeeName).join(" ").toLowerCase();
      const orderNumber = mission.numeroMission?.toLowerCase() || "";
      const lieu = (mission.lieuMission || "").toLowerCase();

      return (
        mission.title.toLowerCase().includes(searchTermLower) ||
        participantsString.includes(searchTermLower) ||
        orderNumber.includes(searchTermLower) ||
        lieu.includes(searchTermLower) ||
        mission.description.toLowerCase().includes(searchTermLower)
      );
    });
  }, [missions, searchTerm, selectedStatus, hasPermission, user?.employeeId]);

  useEffect(() => {
    const maxPages = Math.max(1, Math.ceil(filteredMissions.length / itemsPerPage));
    if (currentPage > maxPages) {
      setCurrentPage(1);
    }
  }, [filteredMissions.length, itemsPerPage, currentPage]);

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

  return (
    <PermissionGuard permission="page:missions:view" allowPersonal>
      <div className="flex flex-col gap-6 pb-16 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                {hasPermission('page:missions:view') ? "Direction des Opérations" : "Mon Espace Personnel"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
              {hasPermission('page:missions:view') ? "Missions & Déplacements" : "Mes Missions & Déplacements"}
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {hasPermission('page:missions:view') 
                ? "Gestion et suivi des ordres de mission institutionnels du CNRCT" 
                : "Consultez et suivez vos ordres de mission au CNRCT"}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {hasPermission('page:missions:view') && (
              <Button 
                variant="outline" 
                asChild 
                className="h-10 rounded-xl border-slate-200/80 bg-white px-4 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Link href="/missions/report">
                  <FileText className="mr-2 h-4 w-4 text-blue-600" />
                  Rapport Annuel
                </Link>
              </Button>
            )}

            {canCreate && (
              <Button 
                onClick={() => setIsSheetOpen(true)} 
                className="h-10 rounded-xl bg-slate-900 px-4 font-bold text-xs shadow-md shadow-slate-900/15 active:scale-95 transition-all text-white hover:bg-slate-800 gap-2"
              >
                <PlusCircle className="h-4 w-4 text-emerald-400" />
                Nouvelle Mission
              </Button>
            )}
          </div>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-4">
          {/* Total */}
          <div 
            onClick={() => setSelectedStatus("all")}
            className={cn(
              "rounded-2xl bg-white p-4 lg:p-5 border shadow-sm transition-all duration-200 cursor-pointer group",
              selectedStatus === "all" ? "border-slate-900 ring-2 ring-slate-900/5 shadow-md" : "border-slate-200/70 hover:border-slate-300"
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Total Dossiers
              </span>
              <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.total}
            </div>
            <div className="text-[10px] font-medium text-slate-400 mt-1">
              Registre global actif
            </div>
          </div>

          {/* En cours */}
          <div 
            onClick={() => setSelectedStatus(selectedStatus === "En cours" ? "all" : "En cours")}
            className={cn(
              "rounded-2xl bg-white p-4 lg:p-5 border shadow-sm transition-all duration-200 cursor-pointer group",
              selectedStatus === "En cours" ? "border-amber-500 ring-2 ring-amber-500/10 shadow-md" : "border-slate-200/70 hover:border-slate-300"
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">
                En cours
              </span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <PlayCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.ongoing}
            </div>
            <div className="text-[10px] font-medium text-amber-600 mt-1">
              Déploiements sur le terrain
            </div>
          </div>

          {/* Planifiées */}
          <div 
            onClick={() => setSelectedStatus(selectedStatus === "Planifiée" ? "all" : "Planifiée")}
            className={cn(
              "rounded-2xl bg-white p-4 lg:p-5 border shadow-sm transition-all duration-200 cursor-pointer group",
              selectedStatus === "Planifiée" ? "border-blue-500 ring-2 ring-blue-500/10 shadow-md" : "border-slate-200/70 hover:border-slate-300"
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                Planifiées
              </span>
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.planned}
            </div>
            <div className="text-[10px] font-medium text-blue-600 mt-1">
              Missions à venir
            </div>
          </div>

          {/* Terminées */}
          <div 
            onClick={() => setSelectedStatus(selectedStatus === "Terminée" ? "all" : "Terminée")}
            className={cn(
              "rounded-2xl bg-white p-4 lg:p-5 border shadow-sm transition-all duration-200 cursor-pointer group",
              selectedStatus === "Terminée" ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-md" : "border-slate-200/70 hover:border-slate-300"
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
                Terminées
              </span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.completed}
            </div>
            <div className="text-[10px] font-medium text-emerald-600 mt-1">
              Dossiers clôturés
            </div>
          </div>
        </div>

        {/* Main Data Container */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Filter & Search Bar */}
          <div className="p-4 lg:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50/50">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: "all", label: "Toutes", count: stats.total },
                { id: "En cours", label: "En cours", count: stats.ongoing },
                { id: "Planifiée", label: "Planifiées", count: stats.planned },
                { id: "Terminée", label: "Terminées", count: stats.completed },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedStatus(filter.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
                    selectedStatus === filter.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70"
                  )}
                >
                  <span>{filter.label}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                    selectedStatus === filter.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher une mission, un agent..."
                className="h-10 pl-10 pr-4 rounded-xl border-slate-200 bg-white text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Table View (Desktop) */}
          <div className="hidden md:block">
            {error && <p className="text-destructive text-center py-6 font-bold">{error}</p>}

            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                  <TableHead className="w-[120px] font-bold uppercase text-[10px] tracking-wider text-slate-500 pl-6">
                    N° Dossier
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-500">
                    Objet de la Mission
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-500">
                    Destination
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-500 text-center">
                    Équipage
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-500">
                    Période
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-500">
                    Statut
                  </TableHead>
                  <TableHead className="w-[60px] pr-6 text-right font-bold uppercase text-[10px] tracking-wider text-slate-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-slate-100">
                      <TableCell className="pl-6"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-7 w-20 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedMissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <Search className="h-6 w-6" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">Aucune mission trouvée</p>
                      <p className="text-xs text-slate-400 mt-1">Modifiez votre recherche ou vos critères de filtrage.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMissions.map((mission) => {
                    const statusConfig = statusBadgeStyles[mission.status as Status] || statusBadgeStyles['Planifiée'];
                    const duration = getDuration(mission.startDate, mission.endDate);

                    return (
                      <TableRow
                        key={mission.id}
                        onClick={() => router.push(`/missions/${mission.id}`)}
                        className="cursor-pointer border-b border-slate-100 hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* N° Dossier */}
                        <TableCell className="pl-6 font-bold text-xs text-slate-900">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-[11px] font-black tracking-wider uppercase border border-slate-200/60">
                            {mission.numeroMission || "N/A"}
                          </span>
                        </TableCell>

                        {/* Titre */}
                        <TableCell className="max-w-[320px]">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase">
                              {mission.title}
                            </span>
                            {mission.dateSaisie && (
                              <span className="text-[10px] text-slate-600 font-medium block">
                                Saisie le {format(parseISO(mission.dateSaisie), "dd MMM yyyy", { locale: fr })}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Destination */}
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[140px] uppercase font-bold text-[11px]">
                              {mission.lieuMission || "Territoire National"}
                            </span>
                          </span>
                        </TableCell>

                        {/* Équipage */}
                        <TableCell>
                          <div className="flex items-center justify-center -space-x-1.5">
                            {(mission.participants || []).slice(0, 3).map((p, idx) => (
                              <div
                                key={`${p.employeeId}-${idx}`}
                                className={cn(
                                  "h-7 w-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black bg-gradient-to-br shadow-sm",
                                  getAvatarGradient(p.employeeName)
                                )}
                                title={p.employeeName}
                              >
                                {p.employeeName.charAt(0)}
                              </div>
                            ))}
                            {(mission.participants || []).length > 3 && (
                              <div className="h-7 w-7 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-[9px] font-black text-white shadow-sm">
                                +{(mission.participants || []).length - 3}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Calendrier */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-slate-700">
                              {formatDateRange(mission.startDate, mission.endDate)}
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                              {duration} {duration > 1 ? 'jours' : 'jour'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Statut */}
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                            statusConfig.bg
                          )}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dot)} />
                            {mission.status}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              title="Imprimer l'Ordre de Mission Collectif"
                              onClick={() => {
                                setPrintTargetMission(mission);
                                setShowCollectivePrint(true);
                              }} 
                              className="h-8 w-8 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl border-slate-200 shadow-xl bg-white">
                                <DropdownMenuItem onSelect={() => router.push(`/missions/${mission.id}`)} className="rounded-lg text-xs font-bold py-2 cursor-pointer">
                                  <Eye className="mr-2 h-3.5 w-3.5 text-blue-600" /> Voir le dossier
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                  Impressions & Documents
                                </DropdownMenuLabel>

                                <DropdownMenuItem 
                                  onSelect={() => {
                                    setPrintTargetMission(mission);
                                    setShowCollectivePrint(true);
                                  }} 
                                  className="rounded-lg text-xs font-bold py-2 cursor-pointer text-slate-700 hover:text-purple-600"
                                >
                                  <Printer className="mr-2 h-3.5 w-3.5 text-purple-600" /> Ordre Collectif
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                  onSelect={() => {
                                    setPrintTargetMission(mission);
                                    setShowGroupedIndividualPrint(true);
                                  }} 
                                  className="rounded-lg text-xs font-bold py-2 cursor-pointer text-slate-700 hover:text-emerald-600"
                                >
                                  <Printer className="mr-2 h-3.5 w-3.5 text-emerald-600" /> Ordres Individuels
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                  onSelect={() => {
                                    setPrintTargetMission(mission);
                                    setShowGroupPrint(true);
                                  }} 
                                  className="rounded-lg text-xs font-bold py-2 cursor-pointer text-slate-700 hover:text-blue-600"
                                >
                                  <FileText className="mr-2 h-3.5 w-3.5 text-blue-600" /> Demande d'Ordre
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {canUpdate && (
                                  <DropdownMenuItem onSelect={() => router.push(`/missions/${mission.id}/edit`)} className="rounded-lg text-xs font-bold py-2 cursor-pointer">
                                    <Pencil className="mr-2 h-3.5 w-3.5 text-slate-600" /> Modifier
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem onSelect={() => setDeleteTarget(mission)} className="rounded-lg text-xs font-bold py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600 cursor-pointer">
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="grid grid-cols-1 gap-3 md:hidden p-3.5">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-xl" />
              ))
            ) : paginatedMissions.length === 0 ? (
              <div className="text-center py-10">
                <p className="font-bold text-slate-600 text-sm">Aucune mission trouvée</p>
              </div>
            ) : (
              paginatedMissions.map((mission) => {
                const statusConfig = statusBadgeStyles[mission.status as Status] || statusBadgeStyles['Planifiée'];

                return (
                  <div
                    key={mission.id}
                    onClick={() => router.push(`/missions/${mission.id}`)}
                    className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm active:scale-98 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                        {mission.numeroMission || "N/A"}
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase",
                        statusConfig.bg
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dot)} />
                        {mission.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-2 uppercase">
                        {mission.title}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-600" />
                        {mission.lieuMission || "Territoire National"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-600">
                        {formatDateRange(mission.startDate, mission.endDate)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrintTargetMission(mission);
                            setShowCollectivePrint(true);
                          }}
                          className="h-7 px-2 text-[10px] font-bold text-purple-600 hover:bg-purple-50"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1" /> Imprimer
                        </Button>
                        <span className="font-bold text-indigo-600 flex items-center gap-0.5">
                          Détails <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="py-3 px-4 border-t border-slate-100 bg-slate-50/50">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={filteredMissions.length}
              />
            </div>
          )}
        </div>

        <AddMissionSheet
          isOpen={isSheetOpen}
          onCloseAction={() => setIsSheetOpen(false)}
          onAddMissionAction={handleAddMission}
        />

        <ConfirmationDialog
          isOpen={!!deleteTarget}
          onCloseAction={() => setDeleteTarget(null)}
          onConfirmAction={handleDeleteConfirm}
          title={`Supprimer la mission : ${deleteTarget?.title}`}
          description="Êtes-vous sûr de vouloir supprimer cette mission ? Cette action est irréversible."
        />

        {/* Print Templates Modals */}
        {showCollectivePrint && printTargetMission && logos && (
          <CollectiveMissionOrderPrint
            mission={printTargetMission}
            logos={logos}
            onCloseAction={() => {
              setShowCollectivePrint(false);
              setPrintTargetMission(null);
            }}
          />
        )}

        {showGroupedIndividualPrint && printTargetMission && logos && (
          <GroupedIndividualMissionsPrint
            mission={printTargetMission}
            logos={logos}
            onCloseAction={() => {
              setShowGroupedIndividualPrint(false);
              setPrintTargetMission(null);
            }}
          />
        )}

        {showGroupPrint && printTargetMission && logos && (
          <GroupMissionRequestPrint
            mission={printTargetMission}
            logos={logos}
            onCloseAction={() => {
              setShowGroupPrint(false);
              setPrintTargetMission(null);
            }}
          />
        )}
      </div>
    </PermissionGuard>
  );
}
