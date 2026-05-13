"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    PlusCircle, Search, Loader2, List, Map, 
    MoreHorizontal, Pencil, Eye, Trash2, 
    Printer, Settings2, TrendingUp, ShieldAlert,
    AlertTriangle, CheckCircle2, History
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
    "Classé sans suite": "bg-red-100 text-red-700 hover:bg-red-100",
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
                            <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                <DropdownMenuItem onClick={handlePrint}>
                                    <List className="mr-2 h-4 w-4" /> Imprimer la liste filtrée
                                </DropdownMenuItem>
                                <Link href="/conflicts/analytics">
                                    <DropdownMenuItem>
                                        <TrendingUp className="mr-2 h-4 w-4" /> Statistiques & Analyses
                                    </DropdownMenuItem>
                                </Link>
                            </DropdownMenuContent>
                        </DropdownMenu>

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
                                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                                            <SelectTrigger className="w-[140px] h-14 rounded-2xl border-slate-100 bg-white font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-slate-900 transition-all">
                                                <div className="flex items-center gap-2">
                                                    <History className="h-3.5 w-3.5 text-slate-400" />
                                                    <SelectValue placeholder="Année" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                                <SelectItem value="Tous" className="font-black text-[10px] uppercase">Toutes Années</SelectItem>
                                                {availableYears.map(year => (
                                                    <SelectItem key={year} value={year} className="font-bold">{year}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                    </div>
                                </div>
                            </div>
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
                                                        <TableHead className="w-16 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center py-6">Réf.</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Localité & Région</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nature du Dossier</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date Signalement</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Médiateur Assigné</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Statut</TableHead>
                                                        <TableHead className="w-24 text-right pr-10"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {loading ? (
                                                        Array.from({ length: 5 }).map((_, i) => (
                                                            <TableRow key={i} className="border-b border-slate-50">
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
                                                            <TableRow key={conflict.id} className="group border-b border-slate-50 hover:bg-slate-50/30 transition-all duration-300">
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
                                                                    <div className={cn(
                                                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                                                                        conflict.status === 'Résolu' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                                        conflict.status === 'En médiation' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                                                    )}>
                                                                        <span className={cn(
                                                                            "h-1.5 w-1.5 rounded-full",
                                                                            conflict.status === 'Résolu' ? "bg-emerald-500" :
                                                                            conflict.status === 'En médiation' ? "bg-indigo-500 animate-pulse" : "bg-rose-500"
                                                                        )} />
                                                                        {conflict.status || 'Ouvert'}
                                                                    </div>
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
                                                                    conflict.status === 'En médiation' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
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
            </div>
        </PermissionGuard>
    );
}
