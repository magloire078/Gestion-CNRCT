"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle, Search, Eye } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import type { Evaluation } from "@/lib/data";
import { subscribeToEvaluations, addEvaluation } from "@/services/evaluation-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { AddEvaluationSheet } from "@/components/evaluations/add-evaluation-sheet";
import { useRouter } from "next/navigation";

type Status = "Draft" | "Pending Manager Review" | "Pending Employee Sign-off" | "Completed";

const statusVariantMap: Record<Status, "secondary" | "default" | "outline" | "destructive"> = {
  'Draft': 'secondary',
  'Pending Manager Review': 'default',
  'Pending Employee Sign-off': 'outline',
  'Completed': 'default', // Should be a success/green color, but using default for now
};

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeToEvaluations(
      (fetchedEvaluations) => {
        setEvaluations(fetchedEvaluations);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Impossible de charger les évaluations.");
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);
  
  const handleAddEvaluation = async (newEvaluationData: Omit<Evaluation, "id">) => {
    try {
        const newEval = await addEvaluation(newEvaluationData);
        setIsSheetOpen(false);
        toast({
            title: "Évaluation lancée",
            description: `Une nouvelle évaluation a été créée pour ${newEvaluationData.employeeName}.`,
        });
        router.push(`/evaluations/${newEval.id}`);
    } catch (err) {
        console.error(err);
        throw err;
    }
  };

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(e => 
      e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.managerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [evaluations, searchTerm]);

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Évaluations de Performance
        </h1>
        <Button onClick={() => setIsSheetOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Lancer une évaluation
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historique des Évaluations</CardTitle>
          <CardDescription>
            Consultez toutes les évaluations de performance passées et en cours.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par employé, manager..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredEvaluations.length} résultat(s) trouvé(s).
            </div>
          {error && <p className="text-destructive text-center py-4">{error}</p>}
           <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Date d'évaluation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    filteredEvaluations.map((evaluation) => (
                        <TableRow key={evaluation.id} className="cursor-pointer" onClick={() => router.push(`/evaluations/${evaluation.id}`)}>
                          <TableCell className="font-medium">{evaluation.employeeName}</TableCell>
                          <TableCell>{evaluation.managerName}</TableCell>
                          <TableCell>{evaluation.reviewPeriod}</TableCell>
                          <TableCell>{evaluation.evaluationDate}</TableCell>
                          <TableCell>
                             <Badge variant={statusVariantMap[evaluation.status] || 'default'}>{evaluation.status}</Badge>
                          </TableCell>
                           <TableCell>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Voir</span>
                              </Button>
                          </TableCell>
                        </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
            </div>
          {!loading && filteredEvaluations.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucune évaluation trouvée.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    <AddEvaluationSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddEvaluation={handleAddEvaluation}
    />
    </>
  );
}
