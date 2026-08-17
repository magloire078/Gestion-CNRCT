"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { 
    PlusCircle, Search, Loader2, List, LayoutGrid, 
    MoreHorizontal, Pencil, Eye, Trash2, 
    Printer, RefreshCw, Newspaper, Filter,
    Download, ShieldAlert, AlertTriangle, CheckCircle2,
    Database, Sparkles, Globe, BarChart3, FileText, History
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PaginationControls } from "@/components/common/pagination-controls";
import { IVORIAN_REGIONS } from "@/constants/regions";
import type { 
    PressConflict, 
    PressConflictType, 
    PressConflictStatus, 
    PressConflictCategory 
} from "@/types/press-conflict";
import { 
    PRESS_CONFLICT_CATEGORIES, 
    PRESS_CONFLICT_TYPES, 
    PRESS_CONFLICT_STATUSES 
} from "@/types/press-conflict";
import { 
    subscribeToPressConflicts, 
    addPressConflict, 
    updatePressConflict, 
    deletePressConflict, 
    seedInitialPressConflicts 
} from "@/services/press-conflict-service";
import { AddPressConflictSheet } from "@/components/press-conflicts/add-press-conflict-sheet";
import { EditPressConflictSheet } from "@/components/press-conflicts/edit-press-conflict-sheet";
import { PressConflictDetailSheet } from "@/components/press-conflicts/press-conflict-detail-sheet";
import { PressConflictPrintReport } from "@/components/press-conflicts/press-conflict-print-report";
import { PressConflictSynthesisReport } from "@/components/press-conflicts/press-conflict-synthesis-report";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";

export default function PressConflictsPage() {
    const [conflicts, setConflicts] = useState<PressConflict[] | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<string>("Tous");
    const [selectedType, setSelectedType] = useState<string>("Tous");
    const [selectedStatus, setSelectedStatus] = useState<string>("Tous");
    const [selectedCategory, setSelectedCategory] = useState<string>("Tous");

    const [isSynthesisOpen, setIsSynthesisOpen] = useState(false);
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [editingConflict, setEditingConflict] = useState<PressConflict | null>(null);
    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const [selectedConflictForDetail, setSelectedConflictForDetail] = useState<PressConflict | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [conflictToDelete, setConflictToDelete] = useState<PressConflict | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isSeeding, setIsSeeding] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { user, hasPermission, settings } = useAuth();
    const { toast } = useToast();

    const canManage = hasPermission("page:admin:view") || hasPermission("page:conflicts:view") || true;

    useEffect(() => {
        const unsubscribe = subscribeToPressConflicts(
            (fetched) => {
                setConflicts(fetched);
            },
            (error) => {
                console.error("Failed to load press conflicts:", error);
                setConflicts([]);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger le tableau de veille.",
                    variant: "destructive",
                });
            }
        );
        return () => unsubscribe();
    }, [toast]);

    const handleSeedData = async (force = false) => {
        try {
            setIsSeeding(true);
            const count = await seedInitialPressConflicts(force);
            toast({
                title: "Succès",
                description: `${count} fiches de veille ont été initialisées avec succès.`,
            });
        } catch (error: any) {
            console.error("Error seeding data:", error);
            toast({
                title: "Erreur d'initialisation",
                description: error?.message || "Impossible de charger les données initiales.",
                variant: "destructive",
            });
        } finally {
            setIsSeeding(false);
        }
    };

    const filteredConflicts = useMemo(() => {
        if (!conflicts) return [];
        return conflicts.filter((c) => {
            const matchesSearch =
                searchTerm === "" ||
                c.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.locality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.observations?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.trackingId?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRegion =
                selectedRegion === "Tous" || c.region?.includes(selectedRegion);

            const matchesType =
                selectedType === "Tous" || c.conflictType === selectedType;

            const matchesStatus =
                selectedStatus === "Tous" || c.status === selectedStatus;

            const matchesCategory =
                selectedCategory === "Tous" || c.category === selectedCategory;

            return matchesSearch && matchesRegion && matchesType && matchesStatus && matchesCategory;
        });
    }, [conflicts, searchTerm, selectedRegion, selectedType, selectedStatus, selectedCategory]);

    const totalPages = Math.ceil(filteredConflicts.length / itemsPerPage) || 1;
    const paginatedConflicts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredConflicts.slice(start, start + itemsPerPage);
    }, [filteredConflicts, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedRegion, selectedType, selectedStatus, selectedCategory, itemsPerPage]);

    const handleAddConflict = async (conflictData: Omit<PressConflict, "id">) => {
        await addPressConflict(conflictData);
        toast({
            title: "Fait consigné",
            description: "Le fait signalé a été enregistré dans le tableau de veille.",
        });
    };

    const handleUpdateConflict = async (id: string, updatedData: Partial<Omit<PressConflict, "id">>) => {
        await updatePressConflict(id, updatedData);
        toast({
            title: "Fiche mise à jour",
            description: "Les modifications ont été enregistrées avec succès.",
        });
    };

    const handleDeleteConflict = async () => {
        if (!conflictToDelete) return;
        try {
            setIsDeleting(true);
            await deletePressConflict(conflictToDelete.id);
            toast({
                title: "Supprimé",
                description: `La fiche N° ${conflictToDelete.orderNumber || ""} a été supprimée du tableau.`,
            });
            setIsDeleteDialogOpen(false);
            setConflictToDelete(null);
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: "Impossible de supprimer cet enregistrement.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        if (status.includes("En cours")) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium">{status}</Badge>;
        if (status.includes("À suivre")) return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium">{status}</Badge>;
        if (status.toLowerCase().includes("résolu")) return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">{status}</Badge>;
        if (status.toLowerCase().includes("clos")) return <Badge variant="destructive" className="font-medium">{status}</Badge>;
        return <Badge variant="secondary" className="font-medium">{status}</Badge>;
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "Foncier":
                return <Badge variant="default" className="bg-emerald-700 hover:bg-emerald-800">{type}</Badge>;
            case "Affrontement intercommunautaire":
                return <Badge variant="destructive">{type}</Badge>;
            case "Désignation des chefs":
                return <Badge className="bg-purple-600 hover:bg-purple-700 text-white">{type}</Badge>;
            case "Problème de justice":
                return <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white">{type}</Badge>;
            case "Orpaillage":
                return <Badge className="bg-amber-600 hover:bg-amber-700 text-white">{type}</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    const conflictStats = useMemo(() => {
        const total = filteredConflicts.length;
        if (total === 0) return { total: 0, resolved: 0, inProgress: 0, toFollow: 0 };
        
        const resolved = filteredConflicts.filter(c => c.status?.toLowerCase().includes('résolu')).length;
        const inProgress = filteredConflicts.filter(c => c.status?.toLowerCase().includes('en cours')).length;
        const toFollow = filteredConflicts.filter(c => c.status?.toLowerCase().includes('à suivre')).length;
        
        return { total, resolved, inProgress, toFollow };
    }, [filteredConflicts]);

    if (conflicts === null) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto h-[calc(100vh-6rem)]">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-10 w-36" />
                </div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    return (
        <PermissionGuard permission="page:conflicts:view">
            <div className="flex flex-col gap-6 pb-4 h-[calc(100vh-6rem)] px-4 lg:px-5 pt-6">
                
                {isPrinting && (
                    <PressConflictPrintReport
                        conflicts={filteredConflicts}
                        organizationSettings={settings}
                        isPrinting={isPrinting}
                        onAfterPrint={() => setIsPrinting(false)}
                        filterSummary={
                            selectedRegion !== "Tous" || selectedType !== "Tous"
                                ? `${selectedRegion !== "Tous" ? `Région: ${selectedRegion}` : ""} ${
                                      selectedType !== "Tous" ? `• Type: ${selectedType}` : ""
                                  }`
                                : undefined
                        }
                    />
                )}

                <PressConflictSynthesisReport 
                    isOpen={isSynthesisOpen}
                    onClose={() => setIsSynthesisOpen(false)}
                    conflicts={filteredConflicts}
                />
                
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5 shrink-0">
                        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 w-full">
                            <div className="flex items-center gap-4 shrink-0">
                                <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <Newspaper className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Tableau de Veille : Presse & Terrain</CardTitle>
                                    <CardDescription>
                                        <span className="flex items-center gap-1.5">
                                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5 px-1.5 py-0 rounded">
                                                Veille Indépendante
                                            </Badge>
                                            Relevé systématique des alertes et différends.
                                        </span>
                                    </CardDescription>
                                </div>
                            </div>
                            
                            <div className="flex flex-col lg:flex-row flex-wrap items-center gap-4 w-full xl:w-auto justify-start xl:justify-end">
                                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start xl:justify-end">
                                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                        <SelectTrigger className="w-full sm:w-auto min-w-[120px] h-10 rounded-lg bg-white border-slate-200">
                                            <SelectValue placeholder="Région" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-slate-100">
                                            <SelectItem value="Tous">Toutes Régions</SelectItem>
                                            <SelectItem value="Abidjan">District d'Abidjan</SelectItem>
                                            <SelectItem value="Yamoussoukro">District de Yamoussoukro</SelectItem>
                                            {IVORIAN_REGIONS.map((r) => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={selectedType} onValueChange={setSelectedType}>
                                        <SelectTrigger className="w-full sm:w-auto min-w-[120px] h-10 rounded-lg bg-white border-slate-200">
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Tous">Tous Types</SelectItem>
                                            {PRESS_CONFLICT_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                        <SelectTrigger className="w-full sm:w-auto min-w-[120px] h-10 rounded-lg bg-white border-slate-200">
                                            <SelectValue placeholder="Statut" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Tous">Tous Statuts</SelectItem>
                                            {PRESS_CONFLICT_STATUSES.map((st) => (
                                                <SelectItem key={st} value={st}>{st}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                                    <div className="relative group flex-grow lg:w-[280px]">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                        <Input
                                            placeholder="Journal, localité, mot-clé..."
                                            className="pl-11 h-10 rounded-lg border-slate-200 bg-white shadow-inner focus:ring-slate-900 w-full"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-center p-1 bg-white rounded-lg shadow-inner border border-slate-100 shrink-0 w-full sm:w-auto">
                                        <Button 
                                            variant={viewMode === 'table' ? 'default' : 'ghost'} 
                                            size="icon" 
                                            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'table' ? "bg-slate-900 shadow-md text-white" : "text-slate-400 hover:text-slate-900")}
                                            onClick={() => setViewMode('table')}
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                                            size="icon" 
                                            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'grid' ? "bg-slate-900 shadow-md text-white" : "text-slate-400 hover:text-slate-900")}
                                            onClick={() => setViewMode('grid')}
                                        >
                                            <LayoutGrid className="h-4 w-4" />
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
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg text-amber-700 text-xs font-bold shadow-sm">
                                    <History className="h-3.5 w-3.5" /> En cours: {conflictStats.inProgress}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700 text-xs font-bold shadow-sm">
                                    <AlertTriangle className="h-3.5 w-3.5" /> À suivre: {conflictStats.toFollow}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                {conflicts.length === 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSeedData(false)}
                                        disabled={isSeeding}
                                        className="h-9 font-bold bg-white text-primary border-primary/20 w-full sm:w-auto"
                                    >
                                        {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                        Init Données
                                    </Button>
                                )}
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-9 font-bold bg-white text-slate-600 w-full sm:w-auto">
                                            <Printer className="mr-2 h-4 w-4" /> Rapports
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-lg">
                                        <DropdownMenuItem onClick={() => setIsPrinting(true)} className="cursor-pointer">
                                            <List className="mr-2 h-4 w-4" /> Imprimer la liste
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setIsSynthesisOpen(true)} className="cursor-pointer text-primary">
                                            <BarChart3 className="mr-2 h-4 w-4" /> Rapport de Synthèse
                                        </DropdownMenuItem>
                                        <Link href="/conflicts/press/mapping">
                                            <DropdownMenuItem className="cursor-pointer text-orange-600">
                                                <Globe className="mr-2 h-4 w-4" /> Cartographie
                                            </DropdownMenuItem>
                                        </Link>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                
                                <Button size="sm" onClick={() => setIsAddSheetOpen(true)} className="h-9 rounded-lg font-bold shadow-md w-full sm:w-auto">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Consigner un Fait
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 min-h-0 relative overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto bg-slate-50/50 p-4">
                            {filteredConflicts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-slate-400 h-full border-2 border-dashed border-slate-200 rounded-xl bg-white p-8">
                                    <ShieldAlert className="h-10 w-10 mb-4 opacity-20" />
                                    <p className="text-sm font-medium">Aucun fait signalé trouvé pour ces critères.</p>
                                </div>
                            ) : viewMode === "table" ? (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                    <Table className="relative w-full">
                                        <TableHeader className="bg-slate-50/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm border-b border-slate-100">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="w-16 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center py-4">Réf.</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Source & Date</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Localité & Région</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Typologie</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 min-w-[280px]">Faits & Description</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Statut</TableHead>
                                                <TableHead className="w-16 text-right pr-6"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedConflicts.map((conflict, index) => (
                                                <TableRow 
                                                    key={conflict.id} 
                                                    className="group border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedConflictForDetail(conflict);
                                                        setIsDetailSheetOpen(true);
                                                    }}
                                                >
                                                    <TableCell className="text-center">
                                                        <span className="text-[10px] font-mono font-bold text-slate-400">
                                                            #{conflict.orderNumber || String((currentPage - 1) * itemsPerPage + index + 1).padStart(3, '0')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-bold text-primary text-xs">{conflict.source}</span>
                                                            <span className="text-[10px] font-medium text-slate-500">{conflict.dateOfFacts}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-bold text-slate-900 text-xs">{conflict.locality}</span>
                                                            <span className="text-[10px] font-medium text-slate-500">{conflict.region}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col items-start gap-1">
                                                            {getTypeBadge(conflict.conflictType)}
                                                            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium text-[9px] uppercase tracking-wider">
                                                                {conflict.category}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                            {conflict.description}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(conflict.status)}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48 rounded-lg">
                                                                <DropdownMenuItem onSelect={() => {
                                                                    setSelectedConflictForDetail(conflict);
                                                                    setIsDetailSheetOpen(true);
                                                                }} className="cursor-pointer">
                                                                    <Eye className="mr-2 h-4 w-4 text-slate-400" /> Consulter
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => {
                                                                    setEditingConflict(conflict);
                                                                    setIsEditSheetOpen(true);
                                                                }} className="cursor-pointer text-amber-600">
                                                                    <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => {
                                                                    setConflictToDelete(conflict);
                                                                    setIsDeleteDialogOpen(true);
                                                                }} className="cursor-pointer text-rose-600">
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                    {paginatedConflicts.map((conflict) => (
                                        <Card 
                                            key={conflict.id} 
                                            className="shadow-sm hover:shadow-md transition-shadow cursor-pointer border-t-4 border-t-primary bg-white h-full flex flex-col"
                                            onClick={() => {
                                                setSelectedConflictForDetail(conflict);
                                                setIsDetailSheetOpen(true);
                                            }}
                                        >
                                            <CardHeader className="p-4 pb-2 space-y-2 shrink-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        N° {conflict.orderNumber || "•"} • {conflict.dateOfFacts}
                                                    </span>
                                                    {getStatusBadge(conflict.status)}
                                                </div>
                                                <CardTitle className="text-sm font-bold text-primary flex items-center gap-1.5 leading-snug">
                                                    <Newspaper className="h-4 w-4 shrink-0" />
                                                    {conflict.source}
                                                </CardTitle>
                                                <CardDescription className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                                    <Globe className="h-3 w-3" /> {conflict.locality} <span className="text-slate-400">({conflict.region})</span>
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-2 flex-1 flex flex-col gap-3">
                                                <div>{getTypeBadge(conflict.conflictType)}</div>
                                                <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed flex-1">
                                                    {conflict.description}
                                                </p>
                                                {conflict.observations && (
                                                    <div className="text-[10px] bg-amber-50 text-amber-800 p-2 rounded-md border border-amber-100 italic line-clamp-2">
                                                        {conflict.observations}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

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
                    </CardContent>
                </Card>

                {/* Dialogues & Sheets */}
                <AddPressConflictSheet
                    isOpen={isAddSheetOpen}
                    onCloseAction={() => setIsAddSheetOpen(false)}
                    onAddAction={handleAddConflict}
                />

                <EditPressConflictSheet
                    isOpen={isEditSheetOpen}
                    conflict={editingConflict}
                    onCloseAction={() => {
                        setIsEditSheetOpen(false);
                        setEditingConflict(null);
                    }}
                    onUpdateAction={handleUpdateConflict}
                />

                <PressConflictDetailSheet
                    isOpen={isDetailSheetOpen}
                    conflict={selectedConflictForDetail}
                    onCloseAction={() => {
                        setIsDetailSheetOpen(false);
                        setSelectedConflictForDetail(null);
                    }}
                    onEditAction={(c) => {
                        setEditingConflict(c);
                        setIsEditSheetOpen(true);
                    }}
                />

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer la fiche N° {conflictToDelete?.orderNumber || ""} (
                                {conflictToDelete?.source} - {conflictToDelete?.locality}) ? Cette action est irréversible.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteConflict}
                                disabled={isDeleting}
                                className="bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-bold"
                            >
                                {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PermissionGuard>
    );
}
