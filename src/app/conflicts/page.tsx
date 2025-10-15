
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search, Sparkles, Loader2, List, Map, MoreHorizontal, Pencil, Eye } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { Conflict, Chief, ConflictType } from "@/lib/data";
import { conflictTypeVariantMap, conflictTypes, conflictStatuses } from "@/lib/data";
import { AddConflictSheet } from "@/components/conflicts/add-conflict-sheet";
import { EditConflictSheet } from "@/components/conflicts/edit-conflict-sheet";
import { Input } from "@/components/ui/input";
import { subscribeToConflicts, addConflict, updateConflict } from "@/services/conflict-service";
import { getChiefs } from "@/services/chief-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getConflictResolutionAdvice, type ConflictResolutionOutput } from "@/ai/flows/conflict-resolution-flow";
import { PaginationControls } from "@/components/common/pagination-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConflictMap } from "@/components/conflicts/conflict-map";


type Status = "En cours" | "Résolu" | "En médiation";

const statusVariantMap: Record<Status, "destructive" | "default" | "secondary"> = {
  "En cours": "destructive",
  "Résolu": "default",
  "En médiation": "secondary",
};

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [chiefs, setChiefs] = useState<Chief[] | null>(null);
  
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingConflict, setEditingConflict] = useState<Conflict | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<Conflict | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<ConflictResolutionOutput | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const loading = conflicts === null || chiefs === null;

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
        setChiefs([]); // Set to empty array on error
    });

    return () => unsubscribe();
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
    setIsEditSheetOpen(true);
  }
  
  const handleAnalyzeConflict = async (conflict: Conflict) => {
    setCurrentConflict(conflict);
    setIsAnalysisDialogOpen(true);
    setIsAiLoading(true);
    setAiSuggestions(null);
    try {
        const suggestions = await getConflictResolutionAdvice({ description: conflict.description });
        setAiSuggestions(suggestions);
    } catch (err) {
        toast({
            variant: "destructive",
            title: "Erreur d'analyse IA",
            description: "Impossible d'obtenir des suggestions de l'IA. Veuillez réessayer."
        })
        console.error(err);
    } finally {
        setIsAiLoading(false);
    }
  }

  const filteredConflicts = useMemo(() => {
    if (!conflicts) return [];
    const filtered = conflicts.filter(conflict => {
      const searchTermLower = searchTerm.toLowerCase();
      return conflict.village.toLowerCase().includes(searchTermLower) ||
             conflict.description.toLowerCase().includes(searchTermLower) ||
             (conflict.mediatorName || '').toLowerCase().includes(searchTermLower);
    });
     if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
        setCurrentPage(1);
    }
    return filtered;
  }, [conflicts, searchTerm, currentPage, itemsPerPage]);

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
        <Button onClick={() => setIsAddSheetOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Signaler un conflit
        </Button>
      </div>

       <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-2 sm:w-[400px] mb-6">
            <TabsTrigger value="list"><List className="mr-2 h-4 w-4"/>Liste</TabsTrigger>
            <TabsTrigger value="map"><Map className="mr-2 h-4 w-4"/>Carte</TabsTrigger>
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
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Médiateur</TableHead>
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
                                <TableCell><Badge variant={conflictTypeVariantMap[conflict.type] || 'outline'}>{conflict.type}</Badge></TableCell>
                                <TableCell className="max-w-xs truncate">{conflict.description}</TableCell>
                                <TableCell>{conflict.mediatorName || 'Non assigné'}</TableCell>
                                <TableCell>
                                    <Badge variant={statusVariantMap[conflict.status] || 'default'}>{conflict.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => handleEditClick(conflict)}>
                                                <Pencil className="mr-2 h-4 w-4"/> Modifier
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleAnalyzeConflict(conflict)}>
                                                <Sparkles className="mr-2 h-4 w-4" /> Analyser avec IA
                                            </DropdownMenuItem>
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
                                    <CardDescription>
                                        <Badge variant={conflictTypeVariantMap[conflict.type] || 'outline'}>{conflict.type}</Badge>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-2">
                                    <Badge variant={statusVariantMap[conflict.status] || 'default'}>{conflict.status}</Badge>
                                    <p className="text-sm"><span className="font-medium">Médiateur:</span> {conflict.mediatorName || 'Non assigné'}</p>
                                    <p className="text-sm text-muted-foreground">{conflict.description}</p>
                                    <p className="text-sm"><span className="font-medium">Signalé le:</span> {conflict.reportedDate}</p>
                                    <div className="flex gap-2 pt-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(conflict)}>
                                          <Pencil className="mr-2 h-4 w-4" /> Modifier
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleAnalyzeConflict(conflict)}>
                                            <Sparkles className="mr-2 h-4 w-4" /> Analyser
                                        </Button>
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
                    <div className="h-[600px] w-full rounded-lg border overflow-hidden">
                        {loading ? <Skeleton className="h-[600px] w-full" /> : <ConflictMap conflicts={filteredConflicts} chiefs={chiefs || []} />}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      <AddConflictSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onAddConflict={handleAddConflict}
      />
       {editingConflict && (
         <EditConflictSheet
            isOpen={isEditSheetOpen}
            onClose={() => setIsEditSheetOpen(false)}
            onUpdateConflict={handleUpdateConflict}
            conflict={editingConflict}
        />
      )}
      
      <AlertDialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
                <AlertDialogTitle>Analyse IA du Conflit</AlertDialogTitle>
                <AlertDialogDescription>
                    Suggestions générées par l'IA pour le conflit à <span className="font-bold">{currentConflict?.village}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            {isAiLoading && (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            {aiSuggestions && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                    <div>
                        <h4 className="font-semibold mb-2">Analyse du Conflit</h4>
                        <p className="text-sm text-muted-foreground">{aiSuggestions.analysis}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Étapes de Médiation Suggérées</h4>
                        <ul className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                           {aiSuggestions.mediationSteps.map((step, i) => <li key={i}>{step}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Stratégies de Communication</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                           {aiSuggestions.communicationStrategies.map((strategy, i) => <li key={i}>{strategy}</li>)}
                        </ul>
                    </div>
                </div>
            )}
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setIsAnalysisDialogOpen(false)}>Fermer</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
