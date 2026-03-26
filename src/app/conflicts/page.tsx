"use client";

import { useState, useMemo, useEffect } from "react";
import { format, parseISO, isValid } from "date-fns";
import { PlusCircle, Search, Loader2, List, Map, MoreHorizontal, Pencil, Eye, Trash2, Printer, Settings2, TrendingUp } from "lucide-react";
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
import type { Conflict, Chief, ConflictType, ConflictTypeData } from "@/lib/data";
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

const GISMap = dynamic(() => import('@/components/common/gis-map-v3').then(m => m.GISMap), {
    ssr: false,
    loading: () => <Skeleton className="h-[800px] w-full" />,
});


type Status = "En cours" | "Résolu" | "En médiation";

const statusVariantMap: Record<Status, "destructive" | "default" | "secondary"> = {
    "En cours": "destructive",
    "Résolu": "default",
    "En médiation": "secondary",
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

        return () => {
            if (unsubscribe) unsubscribe();
            if (unsubscribeTypes) unsubscribeTypes();
        };
    }, []);

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

    const handleAddType = async () => {
        if (!newTypeName.trim()) return;
        setIsAddingType(true);
        try {
            await addConflictType(newTypeName.trim());
            setNewTypeName("");
            setIsAddTypeDialogOpen(false);
            toast({
                title: "Type de conflit ajouté",
            });
        } catch (err) {
            console.error(err);
            toast({
                variant: "destructive",
                title: "Erreur lors de l'ajout du type",
            });
        } finally {
            setIsAddingType(false);
        }
    };

    const handlePrint = () => {
        setIsPrintingList(true);
        // The PrintConflictsList component handles calling window.print() via PrintLayout
        // We'll reset the state after a timeout to allow the print dialog to open
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
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">
                    Gestion des Conflits
                </h1>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddTypeDialogOpen(true)} title="Gérer les types de conflit">
                        <Settings2 className="h-4 w-4" />
                    </Button>
                    <Link href="/conflicts/analytics">
                        <Button variant="outline" className="w-full sm:w-auto bg-blue-50/50 border-blue-100 hover:bg-blue-50 text-blue-600">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Analyses
                        </Button>
                    </Link>
                    <Link href="/conflicts/report">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <List className="mr-2 h-4 w-4" />
                            Rapport
                        </Button>
                    </Link>
                    <Button onClick={() => setIsAddSheetOpen(true)} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Signaler un conflit
                    </Button>
                </div>
            </div>


            <Tabs defaultValue="list">
                <TabsList className="grid w-full grid-cols-2 sm:w-[400px] mb-6">
                    <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />Liste</TabsTrigger>
                    <TabsTrigger value="map"><Map className="mr-2 h-4 w-4" />Carte</TabsTrigger>
                </TabsList>
                <TabsContent value="list">
                    <Card>
                        <CardHeader>
                            <CardTitle>Conflits Villageois</CardTitle>
                            <CardDescription>
                                Suivi et résolution des conflits au sein des communautés.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher par village, médiateur..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-full sm:w-[150px]">
                                        <SelectValue placeholder="Année" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tous">Toutes les années</SelectItem>
                                        {availableYears.map(year => (
                                            <SelectItem key={year} value={year}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                    <SelectTrigger className="w-full sm:w-[150px]">
                                        <SelectValue placeholder="Région" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tous">Toutes les régions</SelectItem>
                                        {regions.map(region => (
                                            <SelectItem key={region} value={region}>{region}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={selectedConflictType} onValueChange={setSelectedConflictType}>
                                    <SelectTrigger className="w-full sm:w-[150px]">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tous">Tous les types</SelectItem>
                                        {allConflictTypes.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>


                            </div>
                            <div className="mb-4 text-sm text-muted-foreground">
                                {filteredConflicts.length} résultat(s) trouvé(s).
                            </div>
                            {error && <p className="text-destructive text-center py-4">{error}</p>}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>N°</TableHead>
                                            <TableHead>Village</TableHead>
                                            <TableHead>Région</TableHead>
                                            <TableHead>Typologie</TableHead>
                                            <TableHead>Parties</TableHead>
                                            <TableHead>Impact</TableHead>
                                            <TableHead>Signalé le</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                                    <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            paginatedConflicts.map((conflict, index) => (
                                                <TableRow key={conflict.id}>
                                                    <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                                    <TableCell className="font-medium">{conflict.village}</TableCell>
                                                    <TableCell>{conflict.region || '-'}</TableCell>
                                                     <TableCell><Badge variant={(conflictTypeVariantMap as any)[conflict.type] || 'outline'}>{conflict.type}</Badge></TableCell>
                                                    <TableCell className="max-w-[150px] truncate" title={conflict.parties}>{conflict.parties || '-'}</TableCell>
                                                    <TableCell className="max-w-[200px] truncate" title={conflict.impact}>{conflict.impact || '-'}</TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {conflict.reportedDate ? (
                                                            (() => {
                                                                const d = parseISO(conflict.reportedDate);
                                                                return isValid(d) ? format(d, 'dd/MM/yyyy') : conflict.reportedDate;
                                                            })()
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={statusVariantMap[conflict.status] || 'default'}>{conflict.status}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {canEdit && (
                                                                    <DropdownMenuItem onSelect={() => handleEditClick(conflict)}>
                                                                        <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                                    </DropdownMenuItem>
                                                                )}
                                                                 <DropdownMenuItem onSelect={() => handlePrintIndividual(conflict)}>
                                                                     <Printer className="mr-2 h-4 w-4" /> Imprimer Fiche MGP
                                                                 </DropdownMenuItem>
                                                                {canDelete && (
                                                                    <DropdownMenuItem
                                                                        onSelect={() => handleDeleteClick(conflict)}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                                    </DropdownMenuItem>
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
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <Card key={i}><CardContent className="p-4"><Skeleton className="h-28 w-full" /></CardContent></Card>
                                    ))
                                ) : (
                                    paginatedConflicts.map((conflict, index) => (
                                        <Card key={conflict.id}>
                                            <CardHeader>
                                                <CardTitle className="text-base">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}. {conflict.village}
                                                </CardTitle>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Typologie</p>
                                                            <Badge variant={(conflictTypeVariantMap as any)[conflict.type] || 'outline'} className="mt-1 font-medium">{conflict.type}</Badge>
                                                        </div>
                                                    </div>

                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Région</p>
                                                            <p className="mt-1 font-medium text-foreground">{conflict.region || '-'}</p>
                                                        </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0 space-y-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant={statusVariantMap[conflict.status] || 'default'}>{conflict.status}</Badge>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</p>
                                                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{conflict.description}</p>
                                                </div>

                                                {(conflict.parties || conflict.impact) && (
                                                    <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                        {conflict.parties && (
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Parties en conflit</p>
                                                                <p className="text-xs text-slate-600 italic">{conflict.parties}</p>
                                                            </div>
                                                        )}
                                                        {conflict.impact && (
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Impact</p>
                                                                <p className="text-xs text-slate-600 line-clamp-2">{conflict.impact}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                                                    <p className="text-[11px] font-medium text-slate-500">
                                                        <span className="text-slate-400 italic">Médiateur:</span> {conflict.mediatorName || 'Non assigné'}
                                                    </p>
                                                    <p className="text-[11px] font-medium text-slate-500">
                                                        <span className="text-slate-400 italic">Signalé le:</span> {conflict.reportedDate}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 pt-2">
                                                    {canEdit && (
                                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(conflict)} className="flex-1">
                                                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                        </Button>
                                                    )}
                                                     <Button variant="outline" size="sm" onClick={() => handlePrintIndividual(conflict)} className="flex-1">
                                                         <Printer className="mr-2 h-4 w-4" /> Imprimer
                                                     </Button>
                                                    {canDelete && (
                                                        <Button variant="outline" size="sm" onClick={() => handleDeleteClick(conflict)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                            {!loading && paginatedConflicts.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    Aucun conflit trouvé.
                                </div>
                            )}
                        </CardContent>
                        {totalPages > 1 && (
                            <CardFooter>
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
                <TabsContent value="map">
                    <Card>
                        <CardHeader>
                            <CardTitle>Carte des Conflits</CardTitle>
                            <CardDescription>Visualisation géographique des conflits signalés.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher un village..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="h-[800px] w-full rounded-lg border overflow-hidden">
                                <GISMap
                                    conflicts={filteredConflicts}
                                    chiefs={chiefs || []}
                                    heritage={heritageItems || []}
                                    onAddPoint={(lat, lng) => {
                                        toast({
                                            title: "Signalement Map",
                                            description: `Sélectionnez ce village pour signaler un conflit aux coordonnées ${lat.toFixed(6)}, ${lng.toFixed(6)}.`,
                                        });
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
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

            {/* Print Templates Rendering */}
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
    );
}
