"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { 
    PlusCircle, Search, Loader2, List, LayoutGrid, 
    MoreHorizontal, Pencil, Eye, Trash2, 
    Printer, RefreshCw, Newspaper, Filter,
    Download, ShieldAlert, AlertTriangle, CheckCircle2,
    Database, Sparkles, Globe, BarChart3
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
import { PressConflictStatsCards } from "@/components/press-conflicts/press-conflict-stats-cards";
import { AddPressConflictSheet } from "@/components/press-conflicts/add-press-conflict-sheet";
import { EditPressConflictSheet } from "@/components/press-conflicts/edit-press-conflict-sheet";
import { PressConflictDetailSheet } from "@/components/press-conflicts/press-conflict-detail-sheet";
import { PressConflictPrintReport } from "@/components/press-conflicts/press-conflict-print-report";
import { PressConflictSynthesisReport } from "@/components/press-conflicts/press-conflict-synthesis-report";

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

    // Handle initial seeding
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

    // Filtered data
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

    // Pagination
    const totalPages = Math.ceil(filteredConflicts.length / itemsPerPage) || 1;
    const paginatedConflicts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredConflicts.slice(start, start + itemsPerPage);
    }, [filteredConflicts, currentPage, itemsPerPage]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedRegion, selectedType, selectedStatus, selectedCategory, itemsPerPage]);

    // CRUD Handlers
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

    if (conflicts === null) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-10 w-36" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                </div>
                <Skeleton className="h-[400px]" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                            Veille Indépendante & Terrain
                        </Badge>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 text-foreground flex items-center gap-2">
                        <Newspaper className="h-7 w-7 text-primary" />
                        Tableau de Veille : Conflits & Faits Signalés
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Relevé systématique des différends, alertes et litiges parus dans la presse écrite ou rapportés du terrain.
                    </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                    {conflicts.length === 0 && (
                        <Button
                            variant="outline"
                            onClick={() => handleSeedData(false)}
                            disabled={isSeeding}
                            className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
                        >
                            {isSeeding ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Database className="h-4 w-4" />
                            )}
                            Initialiser les 41 fiches
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        asChild
                        className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 bg-orange-50/50"
                    >
                        <Link href="/conflicts/press/mapping">
                            <Globe className="h-4 w-4 text-orange-600" />
                            Observatoire Cartographique
                        </Link>
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setIsSynthesisOpen(true)}
                        disabled={filteredConflicts.length === 0}
                        className="gap-2 border-primary/20 text-primary hover:bg-primary/5"
                    >
                        <BarChart3 className="h-4 w-4" />
                        Rapport de Synthèse
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setIsPrinting(true)}
                        disabled={filteredConflicts.length === 0}
                        className="gap-2"
                    >
                        <Printer className="h-4 w-4" />
                        Imprimer le Tableau
                    </Button>

                    <Button
                        onClick={() => setIsAddSheetOpen(true)}
                        className="gap-2 shadow-sm"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Consigner un Fait
                    </Button>
                </div>
            </div>

            {/* Statistiques KPI */}
            <PressConflictStatsCards conflicts={conflicts} />

            {/* Barre de Filtres */}
            <Card className="shadow-sm">
                <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par journal, localité, région, mot-clé dans les faits..."
                                className="pl-9 bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Button
                                variant={viewMode === "table" ? "default" : "outline"}
                                size="icon"
                                onClick={() => setViewMode("table")}
                                title="Vue Tableau"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "grid" ? "default" : "outline"}
                                size="icon"
                                onClick={() => setViewMode("grid")}
                                title="Vue Cartes"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
                        <div>
                            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Région : Tous" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    <SelectItem value="Tous">Toutes les Régions</SelectItem>
                                    <SelectItem value="Abidjan">District d'Abidjan</SelectItem>
                                    <SelectItem value="Yamoussoukro">District de Yamoussoukro</SelectItem>
                                    {IVORIAN_REGIONS.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {r}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Type : Tous" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Tous">Tous les Types</SelectItem>
                                    {PRESS_CONFLICT_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Statut : Tous" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Tous">Tous les Statuts</SelectItem>
                                    {PRESS_CONFLICT_STATUSES.map((st) => (
                                        <SelectItem key={st} value={st}>
                                            {st}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Catégorie : Tous" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Tous">Toutes les Catégories</SelectItem>
                                    {PRESS_CONFLICT_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Vue Données */}
            {filteredConflicts.length === 0 ? (
                <Card className="border-dashed p-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Newspaper className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold">Aucun fait signalé correspondant</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Aucun enregistrement ne correspond à vos critères de recherche ou de filtre.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedRegion("Tous");
                                    setSelectedType("Tous");
                                    setSelectedStatus("Tous");
                                    setSelectedCategory("Tous");
                                }}
                            >
                                Réinitialiser les filtres
                            </Button>
                            {conflicts.length === 0 && (
                                <Button onClick={() => handleSeedData(false)} disabled={isSeeding}>
                                    {isSeeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Charger les 41 données de veille
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            ) : viewMode === "table" ? (
                <Card className="shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table className="text-xs">
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-12 text-center font-bold">N°</TableHead>
                                    <TableHead className="w-24">Date des faits</TableHead>
                                    <TableHead className="w-40">Source / Journal</TableHead>
                                    <TableHead className="w-44">Région & Localité</TableHead>
                                    <TableHead className="w-28">Catégorie</TableHead>
                                    <TableHead className="w-36">Type de conflit</TableHead>
                                    <TableHead className="min-w-[280px]">Description des faits</TableHead>
                                    <TableHead className="w-28 text-center">Statut du suivi</TableHead>
                                    <TableHead className="w-40">Observations</TableHead>
                                    <TableHead className="w-16 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedConflicts.map((conflict, index) => (
                                    <TableRow 
                                        key={conflict.id}
                                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                                        onClick={() => {
                                            setSelectedConflictForDetail(conflict);
                                            setIsDetailSheetOpen(true);
                                        }}
                                    >
                                        <TableCell className="text-center font-bold text-muted-foreground">
                                            {conflict.orderNumber || (currentPage - 1) * itemsPerPage + index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {conflict.dateOfFacts}
                                        </TableCell>
                                        <TableCell className="font-semibold text-primary">
                                            {conflict.source}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{conflict.locality}</div>
                                            <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                                                {conflict.region}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium text-[11px]">
                                                {conflict.category}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {getTypeBadge(conflict.conflictType)}
                                        </TableCell>
                                        <TableCell className="text-foreground leading-snug line-clamp-3 max-w-[350px] py-3">
                                            {conflict.description}
                                        </TableCell>
                                        <TableCell className="text-center whitespace-nowrap">
                                            {getStatusBadge(conflict.status)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground italic text-[11px] line-clamp-2 max-w-[180px]">
                                            {conflict.observations || "—"}
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedConflictForDetail(conflict);
                                                            setIsDetailSheetOpen(true);
                                                        }}
                                                        className="gap-2"
                                                    >
                                                        <Eye className="h-4 w-4 text-blue-500" />
                                                        Voir les détails
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setEditingConflict(conflict);
                                                            setIsEditSheetOpen(true);
                                                        }}
                                                        className="gap-2"
                                                    >
                                                        <Pencil className="h-4 w-4 text-amber-500" />
                                                        Modifier
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setConflictToDelete(conflict);
                                                            setIsDeleteDialogOpen(true);
                                                        }}
                                                        className="gap-2 text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Supprimer
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            ) : (
                /* Vue Grille de cartes */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedConflicts.map((conflict) => (
                        <Card 
                            key={conflict.id} 
                            className="shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer border-t-4 border-t-primary"
                            onClick={() => {
                                setSelectedConflictForDetail(conflict);
                                setIsDetailSheetOpen(true);
                            }}
                        >
                            <CardHeader className="p-4 pb-2 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-muted-foreground">
                                        N° {conflict.orderNumber || "•"} • {conflict.dateOfFacts}
                                    </span>
                                    {getStatusBadge(conflict.status)}
                                </div>
                                <CardTitle className="text-base font-bold text-primary flex items-center gap-1.5">
                                    <Newspaper className="h-4 w-4 shrink-0" />
                                    {conflict.source}
                                </CardTitle>
                                <CardDescription className="text-xs font-medium text-foreground">
                                    📍 {conflict.locality} ({conflict.region})
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-4 pt-2 space-y-3 flex-1">
                                <div>{getTypeBadge(conflict.conflictType)}</div>
                                <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                                    {conflict.description}
                                </p>
                                {conflict.observations && (
                                    <div className="text-[11px] bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 p-2 rounded border border-amber-200">
                                        <strong>Obs:</strong> {conflict.observations}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {filteredConflicts.length > 0 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredConflicts.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            )}

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

            {/* Suppression Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la fiche N° {conflictToDelete?.orderNumber || ""} (
                            {conflictToDelete?.source} - {conflictToDelete?.locality}) ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConflict}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Rapport d'Impression Officiel */}
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

            {/* Rapport de Synthèse Périodique */}
            <PressConflictSynthesisReport 
                isOpen={isSynthesisOpen}
                onClose={() => setIsSynthesisOpen(false)}
                conflicts={filteredConflicts}
            />
        </div>
    );
}
