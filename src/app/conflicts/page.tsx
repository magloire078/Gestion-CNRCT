"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    PlusCircle, Search, Loader2, List, Map, 
    MoreHorizontal, Pencil, Eye, Trash2, 
    Printer, Settings2, TrendingUp, ShieldAlert,
    AlertTriangle, CheckCircle2, History, FileText
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { Conflict, Chief, ConflictType, ConflictTypeData, ConflictStatus } from "@/lib/data";
import { conflictTypeVariantMap, conflictTypes, conflictStatuses } from "@/lib/data";
import { subscribeToConflictTypes, addConflictType, deleteConflictType } from "@/services/conflict-type-service";
import { AddConflictSheet } from "@/components/conflicts/add-conflict-sheet";
import { EditConflictSheet } from "@/components/conflicts/edit-conflict-sheet";
import { Input } from "@/components/ui/input";
import { subscribeToConflicts, addConflict, updateConflict, deleteConflict } from "@/services/conflict-service";
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

const statusVariantMap: Record<Status, string> = {
    "Ouvert": "bg-slate-100 text-slate-700 hover:bg-slate-100",
    "En médiation": "bg-blue-100 text-blue-700 hover:bg-blue-100",
    "Résolu": "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    "Classé sans suite": "bg-slate-100 text-slate-700 hover:bg-slate-100",
    "Escaladé à la justice": "bg-purple-100 text-purple-700 hover:bg-purple-100",
    "En appel": "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

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

    const [selectedYear, setSelectedYear] = useState<string>("Tous");

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
    const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false);
    const [newTypeName, setNewTypeName] = useState("");
    const [isAddingType, setIsAddingType] = useState(false);

    // Printing States
    const [isPrintingList, setIsPrintingList] = useState(false);
    const [printingConflict, setPrintingConflict] = useState<Conflict | null>(null);

    // Details State
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedConflictForDetails, setSelectedConflictForDetails] = useState<Conflict | null>(null);

    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState("list");

    const canDelete = hasPermission('page:admin:view') || hasPermission('feature:conflicts:delete');
    const canEdit = hasPermission('page:conflicts:view') || hasPermission('feature:conflicts:edit');
    const canAdd = hasPermission('page:conflicts:view') || true; // Everyone can report (standard MGP)

    const loading = conflicts === null || chiefs === null || heritageItems === null;

    useEffect(() => {
        const unsubscribe = subscribeToConflicts(
            (fetchedConflicts) => {
                setConflicts(fetchedConflicts);
                setError(null);
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
            
            const conflictYear = conflict.reportedDate.split('-')[0];
            const matchesYear = selectedYear === "Tous" || conflictYear === selectedYear;
            const matchesRegion = selectedRegion === "Tous" || conflict.region === selectedRegion;
            const matchesType = selectedConflictType === "Tous" || conflict.type === selectedConflictType;
            
            return matchesSearch && matchesYear && matchesRegion && matchesType;
        });
        if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
            setCurrentPage(1);
        }
        return filtered;
    }, [conflicts, searchTerm, currentPage, itemsPerPage, selectedYear, selectedRegion, selectedConflictType]);

    const regions = useMemo(() => {
        return IVORIAN_REGIONS;
    }, []);

    const allConflictTypes = useMemo(() => {
        const staticTypes = Array.from(conflictTypes);
        const dynamicTypes = dynamicConflictTypes.map(t => t.name);
        return Array.from(new Set([...staticTypes, ...dynamicTypes])).sort();
    }, [dynamicConflictTypes]);

    const availableYears = useMemo(() => {
        if (!conflicts) return [];
        const years = new Set<string>();
        conflicts.forEach(c => {
            const year = c.reportedDate.split('-')[0];
            if (year) years.add(year);
        });
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [conflicts]);

    const paginatedConflicts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredConflicts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredConflicts, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredConflicts.length / itemsPerPage);

    const conflictStats = useMemo(() => {
        const total = filteredConflicts.length;
        if (total === 0) return { total: 0, resolved: 0, mediation: 0, open: 0, resolutionRate: 0, topType: "N/A" };
        
        const resolved = filteredConflicts.filter(c => c.status === 'Résolu').length;
        const mediation = filteredConflicts.filter(c => c.status === 'En médiation').length;
        const open = filteredConflicts.filter(c => c.status === 'Ouvert' || !c.status).length;
        
        // Find top type
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
            resolutionRate: Math.round((resolved / total) * 100),
            topType
        };
    }, [filteredConflicts]);

    return (
        <PermissionGuard permission="page:conflicts:view">
            <div className="flex flex-col gap-6 pb-4 h-[calc(100vh-6rem)] px-4 lg:px-8 pt-6">
                
                {isPrintingList && (
                    <ConflictsOfficialReport 
                        conflicts={filteredConflicts} 
                        organizationSettings={settings}
                        isPrinting={isPrintingList}
                        onAfterPrint={() => setIsPrintingList(false)}
                        stats={conflictStats}
                    />
                )}
                
                {printingConflict && (
                    <div className="print-only">
                        <PrintConflictDetail 
                            conflict={printingConflict} 
                            organizationSettings={settings} 
                        />
                    </div>
                )}
                
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5 shrink-0">
                        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 w-full">
                            <div className="flex items-center gap-4 shrink-0">
                                <div className="h-10 w-10 rounded-lg bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                                    <ShieldAlert className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Gestion des Conflits</CardTitle>
                                    <CardDescription>
                                        <span className="flex items-center gap-1.5">
                                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5 px-1.5 py-0 rounded">
                                                Audit Trail Enabled
                                            </Badge>
                                            Registre des litiges et de la médiation.
                                        </span>
                                    </CardDescription>
                                </div>
                            </div>
                            
                            <div className="flex flex-col lg:flex-row flex-wrap items-center gap-4 w-full xl:w-auto justify-start xl:justify-end">
                                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start xl:justify-end">
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="w-full sm:w-auto min-w-[120px] h-10 rounded-lg bg-white border-slate-200">
                                            <SelectValue placeholder="Année" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-slate-100">
                                            <SelectItem value="Tous">Toutes Années</SelectItem>
                                            {availableYears.map(year => (
                                                <SelectItem key={year} value={year}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    
                                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                        <SelectTrigger className="w-full sm:w-auto min-w-[140px] h-10 rounded-lg bg-white border-slate-200">
                                            <SelectValue placeholder="Région" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-slate-100">
                                            <SelectItem value="Tous">Toutes Régions</SelectItem>
                                            {regions.map(region => (
                                                <SelectItem key={region} value={region}>{region}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                                    <div className="relative group flex-grow lg:w-[280px]">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                        <Input
                                            placeholder="Village, médiateur..."
                                            className="pl-11 h-10 rounded-lg border-slate-200 bg-white shadow-inner focus:ring-slate-900 w-full"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-center p-1 bg-white rounded-lg shadow-inner border border-slate-100 shrink-0 w-full sm:w-auto">
                                        <Button 
                                            variant={activeTab === 'list' ? 'default' : 'ghost'} 
                                            size="icon" 
                                            className={cn("h-9 w-9 rounded-lg transition-all", activeTab === 'list' ? "bg-slate-900 shadow-md text-white" : "text-slate-400 hover:text-slate-900")}
                                            onClick={() => setActiveTab('list')}
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant={activeTab === 'map' ? 'default' : 'ghost'} 
                                            size="icon" 
                                            className={cn("h-9 w-9 rounded-lg transition-all", activeTab === 'map' ? "bg-slate-900 shadow-md text-white" : "text-slate-400 hover:text-slate-900")}
                                            onClick={() => setActiveTab('map')}
                                        >
                                            <Map className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions & Stats Row */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-700 text-xs font-bold shadow-sm">
                                    <FileText className="h-3.5 w-3.5" /> Total: {conflictStats.total}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg text-emerald-700 text-xs font-bold shadow-sm">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Résolus: {conflictStats.resolved}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700 text-xs font-bold shadow-sm">
                                    <History className="h-3.5 w-3.5" /> Médiation: {conflictStats.mediation}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-lg text-rose-700 text-xs font-bold shadow-sm">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Ouverts: {conflictStats.open}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-9 font-bold bg-white text-slate-600 w-full sm:w-auto">
                                            <Printer className="mr-2 h-4 w-4" /> Rapports
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-lg">
                                        <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
                                            <List className="mr-2 h-4 w-4" /> Imprimer la liste
                                        </DropdownMenuItem>
                                        <Link href="/conflicts/analytics">
                                            <DropdownMenuItem className="cursor-pointer">
                                                <TrendingUp className="mr-2 h-4 w-4" /> Statistiques
                                            </DropdownMenuItem>
                                        </Link>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button size="sm" onClick={() => setIsAddSheetOpen(true)} className="h-9 rounded-lg font-bold shadow-md w-full sm:w-auto">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Nouveau Dossier
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 min-h-0 relative overflow-hidden">
                        {error && (
                            <div className="m-5 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600">
                                <AlertTriangle className="h-5 w-5" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                            <TabsContent value="list" className="mt-0 h-full flex flex-col focus-visible:ring-0">
                                {isPending || loading ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                                        <Loader2 className="h-10 w-10 animate-spin opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Mise à jour...</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-auto bg-white">
                                        <Table className="relative w-full">
                                            <TableHeader className="bg-slate-50/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
                                                <TableRow className="hover:bg-transparent border-slate-100">
                                                    <TableHead className="w-16 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center py-4">Réf.</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Localité & Région</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nature du Dossier</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Médiateur</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Statut</TableHead>
                                                    <TableHead className="w-16 text-right pr-6"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedConflicts.length > 0 ? (
                                                    paginatedConflicts.map((conflict, index) => (
                                                        <TableRow key={conflict.id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                            <TableCell className="text-center">
                                                                <span className="text-[10px] font-mono font-bold text-slate-400">
                                                                    #{String((currentPage - 1) * itemsPerPage + index + 1).padStart(3, '0')}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-slate-900 text-sm">{conflict.village}</span>
                                                                        {(!conflict.status || conflict.status === 'Ouvert') && (
                                                                            <span className="flex items-center gap-1 bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                                                                                <AlertTriangle className="h-2 w-2" /> Urgent
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Map className="h-2.5 w-2.5 text-slate-400" />
                                                                        <span className="text-[10px] font-medium text-slate-500">{conflict.region || 'National'}</span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className={cn(
                                                                    "text-[10px] font-bold border-none px-2 py-0.5 rounded-md",
                                                                    (conflictTypeVariantMap as any)[conflict.type] === 'destructive' ? "bg-rose-50 text-rose-700" :
                                                                    (conflictTypeVariantMap as any)[conflict.type] === 'warning' ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"
                                                                )}>
                                                                    {conflict.type}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-xs text-slate-600">
                                                                    {conflict.reportedDate ? (
                                                                        (() => {
                                                                            const d = parseISO(conflict.reportedDate);
                                                                            return isValid(d) ? format(d, 'dd MMM yyyy', { locale: fr }) : conflict.reportedDate;
                                                                        })()
                                                                    ) : '-'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                        {conflict.mediatorName?.charAt(0) || '?'}
                                                                    </div>
                                                                    <span className="text-xs font-medium text-slate-700">
                                                                        {conflict.mediatorName || 'Non assigné'}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={cn(
                                                                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                                                    conflict.status === 'Résolu' ? "bg-emerald-500 text-white" :
                                                                    conflict.status === 'En médiation' ? "bg-blue-500 text-white" : "bg-rose-500 text-white"
                                                                )}>
                                                                    {conflict.status || 'Ouvert'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48 rounded-lg">
                                                                        <DropdownMenuItem onSelect={() => handleViewDetails(conflict)} className="cursor-pointer">
                                                                            <Eye className="mr-2 h-4 w-4 text-slate-400" /> Consulter
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onSelect={() => handlePrintIndividual(conflict)} className="cursor-pointer">
                                                                            <Printer className="mr-2 h-4 w-4 text-slate-400" /> Imprimer
                                                                        </DropdownMenuItem>
                                                                        {canEdit && (
                                                                            <DropdownMenuItem onSelect={() => handleEditClick(conflict)} className="cursor-pointer text-amber-600">
                                                                                <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {canDelete && (
                                                                            <DropdownMenuItem onSelect={() => handleDeleteClick(conflict)} className="cursor-pointer text-rose-600">
                                                                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="h-64 text-center">
                                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                                <ShieldAlert className="h-10 w-10 mb-4 opacity-20" />
                                                                <p className="text-sm font-medium">Aucun conflit trouvé pour ces critères.</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                                
                                {/* Pagination pinned to bottom */}
                                {totalPages > 1 && (
                                    <div className="border-t border-slate-100 p-4 bg-slate-50/50 shrink-0">
                                        <PaginationControls 
                                            currentPage={currentPage} 
                                            totalPages={totalPages} 
                                            onPageChange={setCurrentPage} 
                                            itemsPerPage={itemsPerPage}
                                            onItemsPerPageChange={setItemsPerPage}
                                            totalItems={filteredConflicts.length}
                                        />
                                    </div>
                                )}
                            </TabsContent>
                            
                            <TabsContent value="map" className="mt-0 h-full border-0 focus-visible:ring-0">
                                <GISMap 
                                    chiefs={chiefs || []} 
                                    conflicts={filteredConflicts} 
                                    heritage={heritageItems || []}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <AddConflictSheet
                isOpen={isAddSheetOpen}
                onCloseAction={() => setIsAddSheetOpen(false)}
                onAddConflictAction={handleAddConflict}
                availableTypes={allConflictTypes}
            />

            <EditConflictSheet
                isOpen={isEditSheetOpen}
                onCloseAction={() => setIsEditSheetOpen(false)}
                conflict={editingConflict}
                onUpdateConflictAction={handleUpdateConflict}
                availableTypes={allConflictTypes}
            />

            <ConflictDetailSheet
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                conflict={selectedConflictForDetails}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDeleteConfirm(); }}
                            disabled={isDeleting}
                            className="bg-rose-500 hover:bg-rose-600 rounded-xl font-bold"
                        >
                            {isDeleting ? "Suppression..." : "Supprimer"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PermissionGuard>
    );
}

