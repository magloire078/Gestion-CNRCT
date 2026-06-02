"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import Papa from "papaparse";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import {
    PlusCircle, Search, Loader2, List, Map,
    MoreHorizontal, Pencil, Eye, Trash2,
    Printer, TrendingUp, ShieldAlert,
    AlertTriangle, History, X, ArrowUpDown,
    ArrowUp, ArrowDown, FileSpreadsheet,
    Tags, Plus, ClipboardList,
    CalendarIcon, LayoutGrid, Flame, Clock,
    GitBranch, Globe2, BarChart3
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import type { Conflict, Chief, ConflictType, ConflictTypeData, ConflictStatus } from "@/lib/data";
import { conflictTypeVariantMap, conflictTypes, conflictStatuses } from "@/lib/data";
import { subscribeToConflictTypes } from "@/services/conflict-type-service";
import { AddConflictSheet } from "@/components/conflicts/add-conflict-sheet";
import { EditConflictSheet } from "@/components/conflicts/edit-conflict-sheet";
import { Input } from "@/components/ui/input";
import { subscribeToConflicts, addConflict, updateConflict, deleteConflict, updateConflictStatus } from "@/services/conflict-service";
import { checkAndNotifyForOverdueConflicts } from "@/services/notification-service";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { differenceInDays } from "date-fns";
import { ConflictKanbanBoard } from "@/components/conflicts/conflict-kanban-board";
import { ConflictGlobalTimeline } from "@/components/conflicts/conflict-global-timeline";
import { BlankFormPdfDialog } from "@/components/conflicts/blank-form-pdf-dialog";
import { ManageConflictTypesDialog } from "@/components/conflicts/manage-conflict-types-dialog";
import { getChiefs } from "@/services/chief-service";
import { getAllHeritageItems } from "@/services/heritage-service";
import type { HeritageItem } from "@/types/heritage";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { PaginationControls } from "@/components/common/pagination-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConflictsOfficialReport } from "@/components/reports/conflicts-official-report";
import { PrintConflictDetail } from "@/components/conflicts/conflict-print-templates";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';
import { PermissionGuard } from "@/components/auth/permission-guard";
import { getEmployee } from "@/services/employee-service";
import { ConflictStatsCards } from "@/components/conflicts/conflict-stats-cards";
import { ConflictDetailSheet } from "@/components/conflicts/conflict-detail-sheet";

const GISMap = dynamic(() => import('@/components/common/gis-map-v3').then(m => m.GISMap), {
    ssr: false,
    loading: () => <Skeleton className="h-[800px] w-full" />,
});


type Status = ConflictStatus;

const statusBadgeMap: Record<Status, { wrapper: string; dot: string }> = {
    "Ouvert": { wrapper: "bg-rose-50 text-rose-600 border border-rose-100", dot: "bg-rose-500" },
    "En médiation": { wrapper: "bg-indigo-50 text-indigo-600 border border-indigo-100", dot: "bg-indigo-500 animate-pulse" },
    "Résolu": { wrapper: "bg-emerald-50 text-emerald-600 border border-emerald-100", dot: "bg-emerald-500" },
    "Classé sans suite": { wrapper: "bg-slate-100 text-slate-600 border border-slate-200", dot: "bg-slate-500" },
};

type SortColumn = "village" | "type" | "reportedDate" | "mediatorName" | "status";
type SortDirection = "asc" | "desc";

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
    if (!active) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

type AgeAlert = { level: "urgent" | "warning"; days: number; label: string } | null;

function getConflictAgeAlert(conflict: Conflict): AgeAlert {
    const status = conflict.status || "Ouvert";
    if (status === "Résolu" || status === "Classé sans suite") return null;
    if (!conflict.reportedDate) return null;
    const reported = parseISO(conflict.reportedDate);
    if (!isValid(reported)) return null;
    const days = differenceInDays(new Date(), reported);
    if (days >= 60) return { level: "urgent", days, label: `${days}j sans suite` };
    if (days >= 30) return { level: "warning", days, label: `${days}j en attente` };
    return null;
}

function AgeBadge({ alert }: { alert: AgeAlert }) {
    if (!alert) return null;
    const isUrgent = alert.level === "urgent";
    return (
        <span
            title={`Dossier ouvert depuis ${alert.days} jour(s)`}
            className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm",
                isUrgent ? "bg-rose-600 text-white animate-pulse" : "bg-amber-100 text-amber-800 border border-amber-200"
            )}
        >
            {isUrgent ? <Flame className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
            {alert.label}
        </span>
    );
}

export default function ConflictsPage() {
    const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
    const [chiefs, setChiefs] = useState<Chief[] | null>(null);
    const [heritageItems, setHeritageItems] = useState<HeritageItem[] | null>(null);

    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [editingConflict, setEditingConflict] = useState<Conflict | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isDateOpen, setIsDateOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const { user, hasPermission, settings } = useAuth();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [conflictToDelete, setConflictToDelete] = useState<Conflict | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // New Enhancement States
    const [dynamicConflictTypes, setDynamicConflictTypes] = useState<ConflictTypeData[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string>("Tous");
    const [selectedConflictType, setSelectedConflictType] = useState<string>("Tous");
    const [selectedStatus, setSelectedStatus] = useState<string>("Tous");
    const [isManageTypesDialogOpen, setIsManageTypesDialogOpen] = useState(false);

    // Sorting & Selection
    const [sortColumn, setSortColumn] = useState<SortColumn>("reportedDate");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Printing States
    const [isPrintingList, setIsPrintingList] = useState(false);
    const [printingConflict, setPrintingConflict] = useState<Conflict | null>(null);
    const [isBlankFormDialogOpen, setIsBlankFormDialogOpen] = useState(false);

    // Details State
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedConflictForDetails, setSelectedConflictForDetails] = useState<Conflict | null>(null);

    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState("list");

    const searchParams = useSearchParams();
    useEffect(() => {
        const region = searchParams?.get("region");
        if (region && IVORIAN_REGIONS.includes(region)) {
            setSelectedRegion(region);
        }
        const focus = searchParams?.get("focus");
        if (focus) {
            setActiveTab("list");
        }
    }, [searchParams]);

    const canDelete = hasPermission('page:admin:view') || hasPermission('feature:conflicts:delete');
    const canEdit = hasPermission('page:conflicts:view') || hasPermission('feature:conflicts:edit');
    const canAdd = hasPermission('page:conflicts:view') || true; // Everyone can report (standard MGP)

    const loading = conflicts === null || chiefs === null || heritageItems === null;

    useEffect(() => {
        let overdueCheckRun = false;
        const unsubscribe = subscribeToConflicts(
            (fetchedConflicts) => {
                setConflicts(fetchedConflicts);
                setError(null);

                if (!overdueCheckRun && fetchedConflicts.length > 0) {
                    overdueCheckRun = true;
                    const lastCheck = typeof window !== 'undefined' ? window.localStorage.getItem('conflicts:overdueLastCheck') : null;
                    const lastCheckMs = lastCheck ? Number(lastCheck) : 0;
                    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
                    if (Date.now() - lastCheckMs > TWELVE_HOURS) {
                        checkAndNotifyForOverdueConflicts(fetchedConflicts).then(({ warnings, urgents }) => {
                            if (typeof window !== 'undefined') {
                                window.localStorage.setItem('conflicts:overdueLastCheck', String(Date.now()));
                            }
                            if (urgents > 0 || warnings > 0) {
                                toast({
                                    title: "Dossiers à relancer",
                                    description: `${urgents} critique(s), ${warnings} en attente prolongée.`,
                                });
                            }
                        }).catch(err => console.error('Overdue check failed:', err));
                    }
                }
            },
            (err) => {
                setError("Impossible de charger les conflits.");
                console.error(err);
                setConflicts([]); // Set to empty array on error
            }
        );

        getChiefs().then(fetchedChiefs => {
            setChiefs(fetchedChiefs);
        }).catch(err => {
            setError("Impossible de charger les données de localisation des chefs.");
            console.error(err);
            setChiefs([]);
        });

        getAllHeritageItems().then(fetchedHeritage => {
            setHeritageItems(fetchedHeritage);
        }).catch(err => {
            console.error("Impossible de charger le patrimoine:", err);
            setHeritageItems([]);
        });

        const unsubscribeTypes = subscribeToConflictTypes(
            (types) => setDynamicConflictTypes(types),
            (err) => console.error("Error loading conflict types:", err)
        );

        // Regional Auto-Filter for COMITE REGIONAL
        if (user?.employeeId && user?.role?.name?.toLowerCase().includes('régional')) {
            getEmployee(user.employeeId).then(emp => {
                if (emp?.Region) {
                    setSelectedRegion(emp.Region);
                }
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
            if (unsubscribeTypes) unsubscribeTypes();
        };
    }, [user?.employeeId, user?.role?.name]);

    const handleAddConflict = async (newConflictData: Omit<Conflict, "id">) => {
        try {
            await addConflict(newConflictData);
            setIsAddSheetOpen(false);
            toast({
                title: "Conflit ajouté",
                description: `Le conflit à ${newConflictData.village} a été enregistré.`,
            });
        } catch (err) {
            console.error("Failed to add conflict:", err);
            throw err;
        }
    };

    const handleUpdateConflict = async (id: string, data: Partial<Omit<Conflict, 'id'>>) => {
        try {
            await updateConflict(id, data);
            setIsEditSheetOpen(false);
            setEditingConflict(null);
            toast({
                title: "Conflit mis à jour",
            });
        } catch (err) {
            console.error("Failed to update conflict:", err);
            throw err;
        }
    }

    const handleEditClick = (conflict: Conflict) => {
        setEditingConflict(conflict);
        setTimeout(() => setIsEditSheetOpen(true), 50);
    }


    const handleDeleteClick = (conflict: Conflict) => {
        setConflictToDelete(conflict);
        setTimeout(() => setIsDeleteDialogOpen(true), 50);
    };

    const handleDeleteConfirm = async () => {
        if (!conflictToDelete) return;
        setIsDeleting(true);
        try {
            await deleteConflict(conflictToDelete.id);
            setIsDeleteDialogOpen(false);
            setConflictToDelete(null);
            toast({
                title: "Conflit supprimé",
                description: "Le signalement de conflit a été retiré de la base de données.",
            });
        } catch (err) {
            console.error("Failed to delete conflict:", err);
            toast({
                variant: "destructive",
                title: "Erreur de suppression",
                description: "Une erreur est survenue lors de la suppression du conflit.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePrint = () => {
        setIsPrintingList(true);
    };

    const handlePrintIndividual = (conflict: Conflict) => {
        setPrintingConflict(conflict);
    };

    const handleViewDetails = (conflict: Conflict) => {
        setSelectedConflictForDetails(conflict);
        setIsDetailsOpen(true);
    };

    const filteredConflicts = useMemo(() => {
        if (!conflicts) return [];
        const filtered = conflicts.filter(conflict => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = conflict.village.toLowerCase().includes(searchTermLower) ||
                conflict.description.toLowerCase().includes(searchTermLower) ||
                (conflict.mediatorName || '').toLowerCase().includes(searchTermLower) ||
                (conflict.region || '').toLowerCase().includes(searchTermLower);

            let matchesDate = true;
            if (dateRange?.from || dateRange?.to) {
                const reported = conflict.reportedDate ? parseISO(conflict.reportedDate) : null;
                if (!reported || !isValid(reported)) {
                    matchesDate = false;
                } else {
                    if (dateRange.from && reported < new Date(dateRange.from.setHours(0, 0, 0, 0))) matchesDate = false;
                    if (dateRange.to && reported > new Date(new Date(dateRange.to).setHours(23, 59, 59, 999))) matchesDate = false;
                }
            }
            const matchesRegion = selectedRegion === "Tous" || conflict.region === selectedRegion;
            const matchesType = selectedConflictType === "Tous" || conflict.type === selectedConflictType;
            const matchesStatus = selectedStatus === "Tous" || (conflict.status || 'Ouvert') === selectedStatus;

            return matchesSearch && matchesDate && matchesRegion && matchesType && matchesStatus;
        });

        const sorted = [...filtered].sort((a, b) => {
            const dir = sortDirection === "asc" ? 1 : -1;
            const av = (a[sortColumn] || '') as string;
            const bv = (b[sortColumn] || '') as string;
            return av.localeCompare(bv, 'fr') * dir;
        });

        if (currentPage > Math.ceil(sorted.length / itemsPerPage)) {
            setCurrentPage(1);
        }
        return sorted;
    }, [conflicts, searchTerm, currentPage, itemsPerPage, dateRange, selectedRegion, selectedConflictType, selectedStatus, sortColumn, sortDirection]);

    const hasActiveFilters = searchTerm !== "" || !!dateRange?.from || !!dateRange?.to || selectedRegion !== "Tous" || selectedConflictType !== "Tous" || selectedStatus !== "Tous";

    const handleResetFilters = () => {
        setSearchTerm("");
        setDateRange(undefined);
        setSelectedRegion("Tous");
        setSelectedConflictType("Tous");
        setSelectedStatus("Tous");
        setCurrentPage(1);
    };

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const handleExportCsv = () => {
        if (filteredConflicts.length === 0) {
            toast({ variant: "destructive", title: "Aucune donnée à exporter" });
            return;
        }
        const csvData = Papa.unparse(filteredConflicts.map(c => ({
            reference: c.trackingId || c.id.substring(0, 8),
            village: c.village,
            region: c.region || '',
            type: c.type,
            statut: c.status || 'Ouvert',
            date_signalement: c.reportedDate,
            date_incident: c.incidentDate || '',
            mediateur: c.mediatorName || '',
            parties: c.parties || '',
            description: c.description,
            impact: c.impact || '',
            date_resolution: c.resolutionDate || '',
            details_resolution: c.resolutionDetails || '',
        })), { header: true });
        const blob = new Blob(["﻿" + csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `export_conflits_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        toast({ title: "Exportation CSV réussie", description: `${filteredConflicts.length} dossier(s) exporté(s).` });
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkDeleting(true);
        try {
            await Promise.all(Array.from(selectedIds).map(id => deleteConflict(id)));
            toast({ title: "Suppression groupée", description: `${selectedIds.size} dossier(s) supprimé(s).` });
            setSelectedIds(new Set());
            setBulkDeleteDialogOpen(false);
        } catch (err) {
            toast({ variant: "destructive", title: "Erreur de suppression groupée" });
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleQuickStatusChange = async (conflict: Conflict, newStatus: ConflictStatus) => {
        if (newStatus === (conflict.status || 'Ouvert')) return;
        try {
            const authorName = user?.displayName || user?.email || "Utilisateur";
            await updateConflictStatus(conflict.id, newStatus, authorName);
            toast({ title: "Statut mis à jour", description: `${conflict.village} → ${newStatus}` });
        } catch (err) {
            console.error("Quick status change failed:", err);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le statut." });
        }
    };

    const regions = useMemo(() => {
        return IVORIAN_REGIONS;
    }, []);

    const allConflictTypes = useMemo(() => {
        const staticTypes = Array.from(conflictTypes);
        const dynamicTypes = dynamicConflictTypes.map(t => t.name);
        return Array.from(new Set([...staticTypes, ...dynamicTypes])).sort();
    }, [dynamicConflictTypes]);

    const paginatedConflicts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredConflicts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredConflicts, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredConflicts.length / itemsPerPage);

    const conflictStats = useMemo(() => {
        const total = filteredConflicts.length;
        if (total === 0) return { total: 0, resolved: 0, mediation: 0, open: 0, closed: 0, resolutionRate: 0, topType: "N/A" };

        const resolved = filteredConflicts.filter(c => c.status === 'Résolu').length;
        const mediation = filteredConflicts.filter(c => c.status === 'En médiation').length;
        const open = filteredConflicts.filter(c => c.status === 'Ouvert' || !c.status).length;
        const closed = filteredConflicts.filter(c => c.status === 'Classé sans suite').length;

        const typeCounts = filteredConflicts.reduce((acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

        return {
            total,
            resolved,
            mediation,
            open,
            closed,
            resolutionRate: Math.round((resolved / total) * 100),
            topType
        };
    }, [filteredConflicts]);

    const allVisibleSelected = paginatedConflicts.length > 0 && paginatedConflicts.every(c => selectedIds.has(c.id));
    const someVisibleSelected = paginatedConflicts.some(c => selectedIds.has(c.id));

    const toggleSelectAllVisible = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                paginatedConflicts.forEach(c => next.delete(c.id));
            } else {
                paginatedConflicts.forEach(c => next.add(c.id));
            }
            return next;
        });
    };

    return (
        <PermissionGuard permission="page:conflicts:view">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                    <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-primary/20 bg-primary/5 px-3 py-1 rounded-full shadow-sm">
                            Observatoire National
                        </Badge>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-4 italic">
                            Gestion des Conflits <div className="h-10 w-1 bg-slate-200 rounded-full rotate-12" /> <ShieldAlert className="h-10 w-10 text-rose-500 drop-shadow-lg" />
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl text-sm leading-relaxed border-l-2 border-slate-100 pl-4 mt-2">
                            Dispositif stratégique de veille et de médiation communautaire. 
                            <span className="text-primary font-black ml-1 uppercase text-[10px] tracking-widest bg-primary/5 px-2 py-0.5 rounded">Digital Audit Trail enabled</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl mr-2">
                            <Button
                                variant={activeTab === "list" ? "secondary" : "ghost"}
                                size="sm"
                                className={cn("h-8 rounded-lg font-bold text-xs", activeTab === "list" && "shadow-sm")}
                                onClick={() => setActiveTab("list")}
                            >
                                <List className="mr-2 h-3.5 w-3.5" /> Liste
                            </Button>
                            <Button
                                variant={activeTab === "kanban" ? "secondary" : "ghost"}
                                size="sm"
                                className={cn("h-8 rounded-lg font-bold text-xs", activeTab === "kanban" && "shadow-sm")}
                                onClick={() => setActiveTab("kanban")}
                            >
                                <LayoutGrid className="mr-2 h-3.5 w-3.5" /> Kanban
                            </Button>
                            <Button
                                variant={activeTab === "timeline" ? "secondary" : "ghost"}
                                size="sm"
                                className={cn("h-8 rounded-lg font-bold text-xs", activeTab === "timeline" && "shadow-sm")}
                                onClick={() => setActiveTab("timeline")}
                            >
                                <GitBranch className="mr-2 h-3.5 w-3.5" /> Chronologie
                            </Button>
                            <Button
                                variant={activeTab === "map" ? "secondary" : "ghost"}
                                size="sm"
                                className={cn("h-8 rounded-lg font-bold text-xs", activeTab === "map" && "shadow-sm")}
                                onClick={() => setActiveTab("map")}
                            >
                                <Map className="mr-2 h-3.5 w-3.5" /> Carte
                            </Button>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="rounded-xl font-bold h-11 border-slate-200">
                                    <Printer className="mr-2 h-4 w-4" /> Rapports
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 rounded-xl">
                                <DropdownMenuItem onClick={handlePrint}>
                                    <List className="mr-2 h-4 w-4" /> Imprimer la liste filtrée
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportCsv}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Exporter en CSV (Excel)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsBlankFormDialogOpen(true)}>
                                    <ClipboardList className="mr-2 h-4 w-4" /> Fiche d'enregistrement vierge
                                </DropdownMenuItem>
                                <Link href="/conflicts/analytics">
                                    <DropdownMenuItem>
                                        <TrendingUp className="mr-2 h-4 w-4" /> Statistiques & Analyses
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/conflicts/regions">
                                    <DropdownMenuItem>
                                        <Globe2 className="mr-2 h-4 w-4" /> Tableau régional
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/conflicts/comparative">
                                    <DropdownMenuItem>
                                        <BarChart3 className="mr-2 h-4 w-4" /> Rapport comparatif annuel
                                    </DropdownMenuItem>
                                </Link>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" onClick={() => setIsManageTypesDialogOpen(true)} className="rounded-xl font-bold h-11 border-slate-200">
                            <Tags className="mr-2 h-4 w-4" /> Types
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setIsBlankFormDialogOpen(true)}
                            className="rounded-xl font-bold h-11 border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100"
                            title="Imprimer une fiche vierge à remplir à la main"
                        >
                            <ClipboardList className="mr-2 h-4 w-4" /> Fiche vierge
                        </Button>

                        <Button onClick={() => setIsAddSheetOpen(true)} className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20">
                            <PlusCircle className="mr-2 h-4 w-4" /> Nouveau Dossier
                        </Button>
                    </div>
                </div>

                {!loading && conflicts && <ConflictStatsCards conflicts={filteredConflicts} />}
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsContent value="list" className="mt-0 focus-visible:ring-0">
                        <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100 p-8">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-12 bg-slate-900 rounded-full" />
                                        <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Registre des Litiges</CardTitle>
                                    </div>
                                    <CardDescription className="font-bold text-slate-400 italic text-sm">
                                        Exploration et arbitrage des dossiers de médiation communautaire.
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="relative group w-full md:w-96">
                                        <div className="absolute inset-0 bg-slate-900/5 rounded-2xl blur-lg group-hover:bg-slate-900/10 transition-all duration-500" />
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-900 transition-colors z-10" />
                                        <Input
                                            placeholder="Rechercher un village, un médiateur..."
                                            className="relative pl-12 h-14 rounded-2xl bg-white border-slate-100 focus:border-slate-900 focus:ring-0 transition-all font-black text-xs uppercase tracking-widest shadow-sm z-10"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-[240px] h-14 rounded-2xl border-slate-100 bg-white font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-slate-900 transition-all justify-start",
                                                        (dateRange?.from || dateRange?.to) && "border-primary text-primary"
                                                    )}
                                                >
                                                    <CalendarIcon className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                                    {dateRange?.from ? (
                                                        dateRange.to ? (
                                                            <span>{format(dateRange.from, "dd MMM", { locale: fr })} → {format(dateRange.to, "dd MMM yy", { locale: fr })}</span>
                                                        ) : (
                                                            <span>Depuis {format(dateRange.from, "dd MMM yyyy", { locale: fr })}</span>
                                                        )
                                                    ) : (
                                                        <span className="text-slate-500">Plage de dates</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                                                <Calendar
                                                    mode="range"
                                                    selected={dateRange}
                                                    onSelect={setDateRange}
                                                    numberOfMonths={2}
                                                    locale={fr}
                                                />
                                                <div className="flex items-center justify-between p-3 border-t border-slate-100">
                                                    <Button variant="ghost" size="sm" onClick={() => { setDateRange(undefined); }} className="font-bold text-xs">
                                                        Effacer
                                                    </Button>
                                                    <Button size="sm" onClick={() => setIsDateOpen(false)} className="font-bold text-xs rounded-lg">
                                                        Appliquer
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                            <SelectTrigger className="w-[200px] h-14 rounded-2xl border-slate-100 bg-white font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-slate-900 transition-all">
                                                <div className="flex items-center gap-2">
                                                    <Map className="h-3.5 w-3.5 text-slate-400" />
                                                    <SelectValue placeholder="Région" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                                <SelectItem value="Tous" className="font-black text-[10px] uppercase">Toutes Régions</SelectItem>
                                                {regions.map(region => (
                                                    <SelectItem key={region} value={region} className="font-bold">{region}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={selectedConflictType} onValueChange={setSelectedConflictType}>
                                            <SelectTrigger className="w-[200px] h-14 rounded-2xl border-slate-100 bg-white font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-slate-900 transition-all">
                                                <div className="flex items-center gap-2">
                                                    <Tags className="h-3.5 w-3.5 text-slate-400" />
                                                    <SelectValue placeholder="Nature" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                                <SelectItem value="Tous" className="font-black text-[10px] uppercase">Toutes Natures</SelectItem>
                                                {allConflictTypes.map(t => (
                                                    <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                            <SelectTrigger className="w-[180px] h-14 rounded-2xl border-slate-100 bg-white font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-slate-900 transition-all">
                                                <div className="flex items-center gap-2">
                                                    <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                                                    <SelectValue placeholder="Statut" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                                <SelectItem value="Tous" className="font-black text-[10px] uppercase">Tous Statuts</SelectItem>
                                                {conflictStatuses.map(s => (
                                                    <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {hasActiveFilters && (
                                            <Button
                                                variant="ghost"
                                                onClick={handleResetFilters}
                                                className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                            >
                                                <X className="h-3.5 w-3.5 mr-1.5" /> Réinitialiser
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!loading && (
                                <div className="mt-6 flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-slate-100">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                                        <span className="text-slate-900 tabular-nums">{filteredConflicts.length}</span> dossier{filteredConflicts.length > 1 ? 's' : ''}
                                        {hasActiveFilters && <span className="text-slate-400 normal-case font-bold italic ml-2">(filtré sur {conflicts?.length || 0})</span>}
                                    </p>
                                    {selectedIds.size > 0 && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600">
                                                {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
                                            </span>
                                            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                Désélectionner
                                            </Button>
                                            {canDelete && (
                                                <Button size="sm" variant="destructive" onClick={() => setBulkDeleteDialogOpen(true)} className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    <Trash2 className="h-3 w-3 mr-1" /> Supprimer la sélection
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardHeader>
                            <CardContent className="p-0">
                                {error && (
                                    <div className="m-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                                        <AlertTriangle className="h-5 w-5" />
                                        <p className="text-sm font-bold">{error}</p>
                                    </div>
                                )}

                                {isPending ? (
                                    <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-slate-400">
                                        <Loader2 className="h-10 w-10 animate-spin opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Mise à jour...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="hidden md:block">
                                            <Table>
                                                <TableHeader className="bg-slate-50/50">
                                                    <TableRow className="hover:bg-transparent border-b border-slate-100">
                                                        <TableHead className="w-10 pl-6">
                                                            <Checkbox
                                                                checked={allVisibleSelected ? true : (someVisibleSelected ? "indeterminate" : false)}
                                                                onCheckedChange={toggleSelectAllVisible}
                                                                aria-label="Sélectionner tout"
                                                            />
                                                        </TableHead>
                                                        <TableHead className="w-16 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center py-6">Réf.</TableHead>
                                                        <TableHead onClick={() => handleSort('village')} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer select-none hover:text-slate-700 transition-colors">
                                                            <span className="inline-flex items-center gap-1">Localité & Région <SortIcon active={sortColumn === 'village'} direction={sortDirection} /></span>
                                                        </TableHead>
                                                        <TableHead onClick={() => handleSort('type')} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer select-none hover:text-slate-700 transition-colors">
                                                            <span className="inline-flex items-center gap-1">Nature du Dossier <SortIcon active={sortColumn === 'type'} direction={sortDirection} /></span>
                                                        </TableHead>
                                                        <TableHead onClick={() => handleSort('reportedDate')} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer select-none hover:text-slate-700 transition-colors">
                                                            <span className="inline-flex items-center gap-1">Date Signalement <SortIcon active={sortColumn === 'reportedDate'} direction={sortDirection} /></span>
                                                        </TableHead>
                                                        <TableHead onClick={() => handleSort('mediatorName')} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer select-none hover:text-slate-700 transition-colors">
                                                            <span className="inline-flex items-center gap-1">Médiateur Assigné <SortIcon active={sortColumn === 'mediatorName'} direction={sortDirection} /></span>
                                                        </TableHead>
                                                        <TableHead onClick={() => handleSort('status')} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer select-none hover:text-slate-700 transition-colors">
                                                            <span className="inline-flex items-center gap-1">Statut <SortIcon active={sortColumn === 'status'} direction={sortDirection} /></span>
                                                        </TableHead>
                                                        <TableHead className="w-24 text-right pr-10"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {loading ? (
                                                        Array.from({ length: 5 }).map((_, i) => (
                                                            <TableRow key={i} className="border-b border-slate-50">
                                                                <TableCell className="pl-6"><Skeleton className="h-4 w-4 rounded" /></TableCell>
                                                                <TableCell><Skeleton className="h-4 w-4 mx-auto rounded" /></TableCell>
                                                                <TableCell><Skeleton className="h-10 w-48 rounded-xl" /></TableCell>
                                                                <TableCell><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                                                                <TableCell><Skeleton className="h-4 w-24 rounded" /></TableCell>
                                                                <TableCell><Skeleton className="h-4 w-32 rounded" /></TableCell>
                                                                <TableCell><Skeleton className="h-7 w-24 rounded-full" /></TableCell>
                                                                <TableCell className="pr-10"><Skeleton className="h-10 w-10 ml-auto rounded-xl" /></TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        paginatedConflicts.map((conflict, index) => (
                                                            <TableRow key={conflict.id} className={cn("group border-b border-slate-50 hover:bg-slate-50/30 transition-all duration-300", selectedIds.has(conflict.id) && "bg-indigo-50/40 hover:bg-indigo-50/60")}>
                                                                <TableCell className="pl-6">
                                                                    <Checkbox
                                                                        checked={selectedIds.has(conflict.id)}
                                                                        onCheckedChange={() => toggleSelectOne(conflict.id)}
                                                                        aria-label={`Sélectionner ${conflict.village}`}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <span className="text-[10px] font-black text-slate-300 tabular-nums bg-slate-50 px-2 py-1 rounded-lg group-hover:bg-white group-hover:text-slate-900 transition-colors">
                                                                        #{String((currentPage - 1) * itemsPerPage + index + 1).padStart(3, '0')}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="font-black text-slate-900 text-sm tracking-tight group-hover:translate-x-1 transition-transform duration-300">{conflict.village}</span>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Map className="h-2.5 w-2.5 text-slate-400" />
                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{conflict.region || 'National'}</span>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className={cn(
                                                                        "text-[9px] font-black uppercase tracking-widest border-none px-2.5 py-1 rounded-lg shadow-sm",
                                                                         (conflictTypeVariantMap as any)[conflict.type] === 'destructive' ? "bg-rose-50 text-rose-600 shadow-rose-100/50" :
                                                                         (conflictTypeVariantMap as any)[conflict.type] === 'warning' ? "bg-amber-50 text-amber-600 shadow-amber-100/50" : "bg-indigo-50 text-indigo-600 shadow-indigo-100/50"
                                                                    )}>
                                                                        {conflict.type}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <History className="h-3 w-3 text-slate-300" />
                                                                        <span className="text-[11px] font-bold text-slate-500 italic">
                                                                            {conflict.reportedDate ? (
                                                                                (() => {
                                                                                    const d = parseISO(conflict.reportedDate);
                                                                                    return isValid(d) ? format(d, 'dd MMM yyyy', { locale: fr }) : conflict.reportedDate;
                                                                                })()
                                                                            ) : '-'}
                                                                        </span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                                            {conflict.mediatorName?.charAt(0) || '?'}
                                                                        </div>
                                                                        <span className="text-xs font-black text-slate-700 tracking-tight">
                                                                            {conflict.mediatorName || 'Non assigné'}
                                                                        </span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {(() => {
                                                                        const s = (conflict.status || 'Ouvert') as Status;
                                                                        const style = statusBadgeMap[s] || statusBadgeMap['Ouvert'];
                                                                        const alert = getConflictAgeAlert(conflict);
                                                                        const trigger = (
                                                                            <button className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm transition-all", style.wrapper, canEdit && "hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 cursor-pointer")}>
                                                                                <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                                                                                {s}
                                                                                {canEdit && <ArrowDown className="h-2.5 w-2.5 opacity-40" />}
                                                                            </button>
                                                                        );
                                                                        return (
                                                                            <div className="flex flex-col items-start gap-1.5">
                                                                                {canEdit ? (
                                                                                    <Select value={s} onValueChange={(v) => handleQuickStatusChange(conflict, v as ConflictStatus)}>
                                                                                        <SelectTrigger asChild>{trigger}</SelectTrigger>
                                                                                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                                                                            {conflictStatuses.map(st => (
                                                                                                <SelectItem key={st} value={st} className="font-bold text-xs">{st}</SelectItem>
                                                                                            ))}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                ) : (
                                                                                    trigger
                                                                                )}
                                                                                <AgeBadge alert={alert} />
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </TableCell>
                                                                <TableCell className="text-right pr-10">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                                                                                <MoreHorizontal className="h-5 w-5 text-slate-400" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-slate-100 shadow-2xl bg-white/95 backdrop-blur-xl">
                                                                            <DropdownMenuItem onSelect={() => handleViewDetails(conflict)} className="p-3 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-colors">
                                                                                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                                                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                                                </div>
                                                                                Consulter le dossier
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onSelect={() => handlePrintIndividual(conflict)} className="p-3 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-colors">
                                                                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3">
                                                                                    <Printer className="h-4 w-4 text-slate-600" />
                                                                                </div>
                                                                                Imprimer la fiche
                                                                            </DropdownMenuItem>
                                                                            {canEdit && (
                                                                                <DropdownMenuItem onSelect={() => handleEditClick(conflict)} className="p-3 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-colors text-amber-600">
                                                                                    <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center mr-3">
                                                                                        <Pencil className="h-4 w-4 text-amber-600" />
                                                                                    </div>
                                                                                    Modifier les données
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            {canDelete && (
                                                                                <>
                                                                                    <div className="h-px bg-slate-100 my-2" />
                                                                                    <DropdownMenuItem
                                                                                        onSelect={() => handleDeleteClick(conflict)}
                                                                                        className="p-3 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-rose-50 text-rose-500 transition-colors"
                                                                                    >
                                                                                        <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center mr-3">
                                                                                            <Trash2 className="h-4 w-4 text-rose-600" />
                                                                                        </div>
                                                                                        Supprimer
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

                                        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                                            {loading ? (
                                                Array.from({ length: 3 }).map((_, i) => (
                                                    <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                                                ))
                                            ) : (
                                                paginatedConflicts.map((conflict) => (
                                                    <Card key={conflict.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-slate-50/50">
                                                        <CardHeader className="pb-2">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h3 className="font-black text-slate-900">{conflict.village}</h3>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{conflict.region || '-'}</p>
                                                                </div>
                                                                <Badge variant="outline" className={cn(
                                                                    "text-[9px] font-black uppercase border-none",
                                                                    conflict.status === 'Résolu' ? "bg-emerald-50 text-emerald-600" :
                                                                    conflict.status === 'En médiation' ? "bg-blue-50 text-blue-600" :
                                                                    conflict.status === 'Classé sans suite' ? "bg-slate-100 text-slate-600" : "bg-rose-50 text-rose-600"
                                                                )}>
                                                                    {conflict.status || 'Ouvert'}
                                                                </Badge>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3 pb-4">
                                                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 italic">
                                                                "{conflict.description}"
                                                            </p>
                                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                                                <span className="flex items-center gap-1"><History className="h-3 w-3" /> {conflict.reportedDate}</span>
                                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-100">{conflict.type}</span>
                                                            </div>
                                                            <div className="flex gap-2 pt-2">
                                                                <Button size="sm" className="flex-1 rounded-lg h-9 font-bold" onClick={() => handleViewDetails(conflict)}>Consulter</Button>
                                                                <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg" onClick={() => handlePrintIndividual(conflict)}><Printer className="h-4 w-4" /></Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                        
                                        {!loading && paginatedConflicts.length === 0 && (
                                            <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 p-8 text-slate-400">
                                                <Search className="h-12 w-12 mb-4 opacity-10" />
                                                <p className="font-bold text-sm uppercase tracking-widest text-center">Aucun dossier ne correspond aux critères.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                            {totalPages > 1 && !isPending && (
                                <CardFooter className="bg-slate-50/30 border-t border-slate-100 p-6">
                                    <PaginationControls
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                        itemsPerPage={itemsPerPage}
                                        onItemsPerPageChange={setItemsPerPage}
                                        totalItems={filteredConflicts.length}
                                    />
                                </CardFooter>
                            )}
                        </Card>
                    </TabsContent>
                    <TabsContent value="kanban" className="mt-0 focus-visible:ring-0">
                        <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] overflow-hidden bg-white">
                            <CardHeader className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-12 bg-slate-900 rounded-full" />
                                    <div>
                                        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">Pipeline de Médiation</CardTitle>
                                        <CardDescription className="font-bold text-slate-400 italic text-xs mt-1">
                                            {canEdit ? "Glissez-déposez un dossier pour changer son statut." : "Vue d'ensemble du pipeline (lecture seule)."}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 p-6">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <Skeleton key={i} className="h-[400px] rounded-3xl" />
                                        ))}
                                    </div>
                                ) : (
                                    <ConflictKanbanBoard
                                        conflicts={filteredConflicts}
                                        onStatusChange={handleQuickStatusChange}
                                        onCardClick={handleViewDetails}
                                        canEdit={canEdit}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="timeline" className="mt-0 focus-visible:ring-0">
                        <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] overflow-hidden bg-white">
                            <CardHeader className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-12 bg-slate-900 rounded-full" />
                                    <div>
                                        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">Chronologie Nationale</CardTitle>
                                        <CardDescription className="font-bold text-slate-400 italic text-xs mt-1">
                                            Frise temporelle des signalements et résolutions, groupée par mois.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="p-8 space-y-6">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-32 rounded-2xl" />
                                        ))}
                                    </div>
                                ) : (
                                    <ConflictGlobalTimeline conflicts={filteredConflicts} onCardClick={handleViewDetails} />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="map" className="mt-0 focus-visible:ring-0">
                        <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] overflow-hidden bg-white">
                            <div className="h-[800px] w-full relative">
                                {isPending && (
                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-[100] flex items-center justify-center">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    </div>
                                )}
                                <GISMap
                                    conflicts={filteredConflicts}
                                    chiefs={chiefs || []}
                                    heritage={heritageItems || []}
                                    onAddPoint={(lat, lng) => {
                                        toast({
                                            title: "Point SIG sélectionné",
                                            description: `Coordonnées: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                                        });
                                    }}
                                />
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>

                <ConflictDetailSheet 
                    open={isDetailsOpen}
                    conflict={selectedConflictForDetails}
                    onOpenChange={setIsDetailsOpen}
                />

                <AddConflictSheet
                    isOpen={isAddSheetOpen}
                    onCloseAction={() => setIsAddSheetOpen(false)}
                    onAddConflictAction={handleAddConflict}
                    availableTypes={allConflictTypes}
                />
                
                {editingConflict && (
                    <EditConflictSheet
                        isOpen={isEditSheetOpen}
                        onCloseAction={() => setIsEditSheetOpen(false)}
                        onUpdateConflictAction={handleUpdateConflict}
                        conflict={editingConflict}
                        availableTypes={allConflictTypes}
                    />
                )}

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer définitivement le signalement de conflit à <span className="font-bold">{conflictToDelete?.village}</span> ? Cette action est irréversible.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteConfirm();
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {isPrintingList && (
                    <ConflictsOfficialReport 
                        conflicts={filteredConflicts} 
                        organizationSettings={settings} 
                        subtitle={`Périmètre: ${selectedRegion === 'Tous' ? 'National' : selectedRegion} | ${selectedConflictType === 'Tous' ? 'Toutes Natures' : selectedConflictType}`}
                        stats={conflictStats}
                        isPrinting={isPrintingList}
                        onAfterPrint={() => setIsPrintingList(false)}
                    />
                )}

                {printingConflict && (
                    <PrintConflictDetail
                        conflict={printingConflict}
                        organizationSettings={settings}
                        isPrinting={!!printingConflict}
                        onAfterPrint={() => setPrintingConflict(null)}
                    />
                )}

                <BlankFormPdfDialog open={isBlankFormDialogOpen} onOpenChange={setIsBlankFormDialogOpen} />

                <ManageConflictTypesDialog
                    open={isManageTypesDialogOpen}
                    onOpenChange={setIsManageTypesDialogOpen}
                    dynamicTypes={dynamicConflictTypes}
                />

                {/* Bulk delete dialog */}
                <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer {selectedIds.size} dossier(s) ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action supprimera définitivement {selectedIds.size} signalement(s) de conflit. Elle est irréversible.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isBulkDeleting}>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => { e.preventDefault(); handleBulkDelete(); }}
                                disabled={isBulkDeleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isBulkDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Confirmer la suppression
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PermissionGuard>
    );
}
