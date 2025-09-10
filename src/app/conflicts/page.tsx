
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search, Sparkles, Loader2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";

import { Badge } from "@/components/ui/badge";
import type { Conflict } from "@/lib/data";
import { AddConflictSheet } from "@/components/conflicts/add-conflict-sheet";
import { Input } from "@/components/ui/input";
import { subscribeToConflicts, addConflict } from "@/services/conflict-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getConflictResolutionAdvice, type ConflictResolutionOutput } from "@/ai/flows/conflict-resolution-flow";

type Status = "En cours" | "Résolu" | "En médiation";

const statusVariantMap: Record<Status, "destructive" | "default" | "secondary"> = {
  "En cours": "destructive",
  "Résolu": "default",
  "En médiation": "secondary",
};

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<Conflict | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<ConflictResolutionOutput | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToConflicts(
      (fetchedConflicts) => {
        setConflicts(fetchedConflicts);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Impossible de charger les conflits.");
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAddConflict = async (newConflictData: Omit<Conflict, "id">) => {
     try {
        await addConflict(newConflictData);
        // State is managed by real-time subscription
        setIsSheetOpen(false);
        toast({
            title: "Conflit ajouté",
            description: `Le conflit à ${newConflictData.village} a été enregistré.`,
        });
     } catch (err) {
        console.error("Failed to add conflict:", err);
        throw err;
     }
  };

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
        // Optionally close the dialog on error
        // setIsAnalysisDialogOpen(false); 
    } finally {
        setIsAiLoading(false);
    }
  }

  const filteredConflicts = useMemo(() => {
    return conflicts.filter(conflict => {
      const searchTermLower = searchTerm.toLowerCase();
      return conflict.village.toLowerCase().includes(searchTermLower) ||
             conflict.description.toLowerCase().includes(searchTermLower);
    });
  }, [conflicts, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des Conflits
        </h1>
        <Button onClick={() => setIsSheetOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Signaler un conflit
        </Button>
      </div>
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
                placeholder="Rechercher par village, description..."
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
                    <TableHead>Village</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date Signalée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    filteredConflicts.map((conflict) => (
                        <TableRow key={conflict.id}>
                          <TableCell className="font-medium">{conflict.village}</TableCell>
                          <TableCell className="max-w-xs truncate">{conflict.description}</TableCell>
                          <TableCell>{conflict.reportedDate}</TableCell>
                          <TableCell>
                             <Badge variant={statusVariantMap[conflict.status] || 'default'}>{conflict.status}</Badge>
                          </TableCell>
                          <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleAnalyzeConflict(conflict)}>
                                <Sparkles className="h-4 w-4" />
                                <span className="sr-only">Analyser avec IA</span>
                              </Button>
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
                filteredConflicts.map((conflict) => (
                    <Card key={conflict.id}>
                        <CardContent className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <p className="font-bold">{conflict.village}</p>
                                <Badge variant={statusVariantMap[conflict.status] || 'default'}>{conflict.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{conflict.description}</p>
                            <p className="text-sm"><span className="font-medium">Signalé le:</span> {conflict.reportedDate}</p>
                            <Button variant="outline" size="sm" onClick={() => handleAnalyzeConflict(conflict)} className="mt-2">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Analyser avec IA
                            </Button>
                        </CardContent>
                    </Card>
                ))
              )}
            </div>
          {!loading && filteredConflicts.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucun conflit trouvé.
            </div>
          )}
        </CardContent>
      </Card>
      <AddConflictSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddConflict={handleAddConflict}
      />
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
