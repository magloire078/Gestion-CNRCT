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
import { PrintConflictsList, PrintConflictDetail } from "@/components/conflicts/conflict-print-templates";
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
        setTimeout(() => {
            setIsPrintingList(false);
        }, 3000);
    };

    const handlePrintIndividual = (conflict: Conflict) => {
        setPrintingConflict(conflict);
        setTimeout(() => {
            setPrintingConflict(null);
        }, 3000);
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

    return (
        <PermissionGuard permission="page:conflicts:view">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                    <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5">
                            Observatoire National
                        </Badge>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Gestion des Conflits <ShieldAlert className="h-8 w-8 text-slate-300" />
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl text-slate-500">
                            Suivi stratégique et médiation des litiges communautaires sur l'ensemble du territoire national.
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
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Registre des Litiges</CardTitle>
                                        <CardDescription className="font-medium text-slate-500">
                                            Exploration et filtrage multicritères des dossiers de médiation.
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="relative w-full md:w-80">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Village, médiateur, description..."
                                                className="pl-10 h-10 rounded-xl bg-white border-slate-200 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                                            <SelectTrigger className="w-[120px] h-10 rounded-xl border-slate-200 bg-white font-bold text-xs uppercase">
                                                <SelectValue placeholder="Année" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100">
                                                <SelectItem value="Tous">Années</SelectItem>
                                                {availableYears.map(year => (
                                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                            <SelectTrigger className="w-[160px] h-10 rounded-xl border-slate-200 bg-white font-bold text-xs uppercase">
                                                <SelectValue placeholder="Région" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100">
                                                <SelectItem value="Tous">Régions</SelectItem>
                                                {regions.map(region => (
                                                    <SelectItem key={region} value={region}>{region}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                            <Table className="border-collapse">
                                                <TableHeader className="bg-slate-100/50">
                                                    <TableRow className="hover:bg-transparent border-b-2 border-slate-900">
                                                        <TableHead className="w-12 text-[10px] font-black uppercase text-slate-500 text-center py-4">N°</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase text-slate-500">Localité & Région</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase text-slate-500">Nature du Dossier</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase text-slate-500">Signalement</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase text-slate-500">Médiateur</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase text-slate-500">État d'Avancement</TableHead>
                                                        <TableHead className="w-20 text-[10px] font-black uppercase text-slate-500 text-right pr-8">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {loading ? (
                                                        Array.from({ length: 5 }).map((_, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                                                                <TableCell><Skeleton className="h-10 w-48 rounded-lg" /></TableCell>
                                                                <TableCell><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                                                <TableCell className="pr-8"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        paginatedConflicts.map((conflict, index) => (
                                                            <TableRow key={conflict.id} className="group border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                                <TableCell className="text-center font-bold text-slate-400 tabular-nums">
                                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-black text-slate-900 text-sm group-hover:text-primary transition-colors">{conflict.village}</span>
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{conflict.region || 'SANS RÉGION'}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className={cn(
                                                                        "text-[10px] font-black uppercase border-none px-2 py-0.5",
                                                                         (conflictTypeVariantMap as any)[conflict.type] === 'destructive' ? "bg-rose-50 text-rose-600" :
                                                                         (conflictTypeVariantMap as any)[conflict.type] === 'warning' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                                                                    )}>
                                                                        {conflict.type}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="font-mono text-[11px] font-bold text-slate-500">
                                                                    {conflict.reportedDate ? (
                                                                        (() => {
                                                                            const d = parseISO(conflict.reportedDate);
                                                                            return isValid(d) ? format(d, 'dd MMM yyyy', { locale: fr }) : conflict.reportedDate;
                                                                        })()
                                                                    ) : '-'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className="text-xs font-bold text-slate-600 italic text-slate-600">
                                                                        {conflict.mediatorName || 'Non assigné'}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className={cn(
                                                                        "text-[10px] font-black uppercase border-none",
                                                                        conflict.status === 'Résolu' ? "bg-emerald-50 text-emerald-600" :
                                                                        conflict.status === 'En médiation' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                                                                    )}>
                                                                        {conflict.status || 'Ouvert'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right pr-8">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg group-hover:bg-white group-hover:shadow-sm">
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-100 shadow-xl">
                                                                            <DropdownMenuItem onSelect={() => handleViewDetails(conflict)} className="font-bold cursor-pointer">
                                                                                <Eye className="mr-2 h-4 w-4 text-blue-500" /> Détails & Médiation
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onSelect={() => handlePrintIndividual(conflict)} className="font-bold cursor-pointer">
                                                                                <Printer className="mr-2 h-4 w-4 text-slate-400" /> Imprimer la Fiche
                                                                            </DropdownMenuItem>
                                                                            {canEdit && (
                                                                                <DropdownMenuItem onSelect={() => handleEditClick(conflict)} className="font-bold cursor-pointer">
                                                                                    <Pencil className="mr-2 h-4 w-4 text-amber-500" /> Modifier le dossier
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            {canDelete && (
                                                                                <>
                                                                                    <div className="h-px bg-slate-100 my-1" />
                                                                                    <DropdownMenuItem
                                                                                        onSelect={() => handleDeleteClick(conflict)}
                                                                                        className="text-rose-500 focus:text-rose-600 focus:bg-rose-50 font-bold cursor-pointer"
                                                                                    >
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
                    <PrintConflictsList 
                        conflicts={filteredConflicts} 
                        organizationSettings={settings} 
                        subtitle={`Filtre: ${selectedRegion === 'Tous' ? 'Toutes Régions' : selectedRegion} | ${selectedConflictType === 'Tous' ? 'Tous Types' : selectedConflictType}`}
                    />
                )}

                {printingConflict && (
                    <PrintConflictDetail 
                        conflict={printingConflict} 
                        organizationSettings={settings} 
                    />
                )}
            </div>
        </PermissionGuard>
    );
}
