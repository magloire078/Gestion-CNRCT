
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  PlusCircle, Search, Eye, Pencil, Trash2,
  MoreHorizontal, FileText, Calendar,
  CheckCircle2, Clock, PlayCircle, MapPin, LogOut
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
import type { Mission } from "@/lib/data";
import { AddMissionSheet } from "@/components/missions/add-mission-sheet";
import { Input } from "@/components/ui/input";
import { subscribeToMissions, addMission, deleteMission } from "@/services/mission-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import Link from "next/link";
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PaginationControls } from "@/components/common/pagination-controls";
import { useAuth } from "@/hooks/use-auth";
import { PermissionGuard } from "@/components/auth/permission-guard";

type Status = "Planifiée" | "En cours" | "Terminée" | "Annulée";

const statusVariantMap: Record<Status, "secondary" | "default" | "outline" | "destructive"> = {
  'Planifiée': 'secondary',
  'En cours': 'default',
  'Terminée': 'outline',
  'Annulée': 'destructive',
};

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
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer la mission."
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  const filteredMissions = useMemo(() => {
    const filtered = missions.filter(mission => {
      // Data-level filtering: If not admin/HR, only show missions where user is a participant
      if (!hasPermission('page:missions:view') && user?.employeeId) {
        const isParticipant = (mission.participants || []).some(p => p.employeeId === user.employeeId);
        if (!isParticipant) return false;
      }

      const searchTermLower = searchTerm.toLowerCase();
      // Ensure participants array exists before trying to access it
      const participantsString = (mission.participants || []).map(p => p.employeeName).join(" ").toLowerCase();
      return mission.title.toLowerCase().includes(searchTermLower) ||
        participantsString.includes(searchTermLower) ||
        mission.description.toLowerCase().includes(searchTermLower);
    });
    if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
      setCurrentPage(1);
    }
    return filtered;
  }, [missions, searchTerm, currentPage, itemsPerPage]);

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

  // Redirection logic removed in favor of PermissionGuard wrapper

  return (
    <PermissionGuard permission="page:missions:view">
      <div className="flex flex-col gap-8 pb-12">
        {/* Institutional Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900 flex items-center gap-3">
              <LogOut className="h-10 w-10 text-blue-600 rotate-180" />
              Missions & Déplacements
            </h1>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 pl-1">Régulation des Ordres de Mission Institutionnels</p>
          </div>

          <div className="flex items-center gap-3">
            {hasPermission('page:missions:view') && (
              <>
                <Button variant="outline" asChild className="h-12 rounded-2xl border-slate-200 bg-white/50 backdrop-blur-md px-6 font-black uppercase tracking-widest text-[11px] hover:bg-white hover:border-slate-300 transition-all shadow-sm">
                  <Link href="/missions/report">
                    <FileText className="mr-2 h-4 w-4 text-blue-600" />
                    Rapport Annuel
                  </Link>
                </Button>
                <Button onClick={() => setIsSheetOpen(true)} className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/20 active:scale-95 transition-all text-white hover:bg-black gap-2">
                  <PlusCircle className="h-4 w-4 text-emerald-400" />
                  Nouvelle Mission
                </Button>
              </>
            )}
          </div>
        </div>

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

        <Card className="border-white/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden rounded-2xl px-2">
          <CardHeader className="border-b border-border/50 bg-primary/5 py-8 px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Registre des Missions</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
                  Base de données centralisée des déploiements
                </CardDescription>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="RECHERCHER UNE MISSION OU UN AGENT..."
                  className="h-12 pl-12 pr-4 rounded-xl border-slate-200 bg-white/50 focus:bg-white transition-all font-bold text-xs tracking-wider"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error && <p className="text-destructive text-center py-10 font-bold">{error}</p>}

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="w-[80px] font-black uppercase text-[10px] tracking-widest text-center py-6 text-slate-500">ID</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Désignation Opérationnelle</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-center">Équipage</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Calendrier d'Exécution</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Statut</TableHead>
                    <TableHead className="sr-only">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-border/20">
                        <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    paginatedMissions.map((mission, index) => (
                      <TableRow
                        key={mission.id}
                        onClick={() => router.push(`/missions/${mission.id}`)}
                        className="cursor-pointer border-border/20 hover:bg-white/40 transition-all group h-20"
                      >
                        <TableCell className="text-center font-black text-slate-300 group-hover:text-slate-900 transition-colors">
                          {((currentPage - 1) * itemsPerPage + index + 1).toString().padStart(2, '0')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 uppercase tracking-tight text-sm group-hover:text-blue-600 transition-colors">
                              {mission.title}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Côte d'Ivoire / Localité Indéfinie</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
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
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                              {formatDateRange(mission.startDate, mission.endDate)}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">Durée Standard</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariantMap[mission.status] || 'default'} className="font-black text-[9px] uppercase tracking-[0.15em] rounded-lg px-3 py-1 shadow-sm border-none">
                            {mission.status}
                          </Badge>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View Card-based */}
            <div className="grid grid-cols-1 gap-4 md:hidden p-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                ))
              ) : (
                paginatedMissions.map((mission) => (
                  <Card key={mission.id} onClick={() => router.push(`/missions/${mission.id}`)} className="bg-white/50 border-white/10 rounded-2xl shadow-lg overflow-hidden active:scale-95 transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant={statusVariantMap[mission.status] || 'default'} className="font-black text-[9px] uppercase tracking-widest rounded-md px-2 py-0.5 border-none">
                          {mission.status}
                        </Badge>
                        <span className="text-[10px] font-black text-slate-300">#{mission.id.slice(-4).toUpperCase()}</span>
                      </div>
                      <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight mt-2 line-clamp-2">
                        {mission.title}
                      </CardTitle>
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
                ))
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
    </PermissionGuard>
  );
}
