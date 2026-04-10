"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { 
    PlusCircle, Search, Eye, 
    FileText, User, Calendar as CalendarIcon,
    ChevronRight, Award, Clock,
    BarChart3, Target, CheckCircle2
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
import { Badge } from "@/components/ui/badge";
import type { Evaluation } from "@/lib/data";
import { subscribeToEvaluations, addEvaluation } from "@/services/evaluation-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { AddEvaluationSheet } from "@/components/evaluations/add-evaluation-sheet";
import { useRouter } from "next/navigation";
import { PaginationControls } from "@/components/common/pagination-controls";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";

type Status = "Draft" | "Pending Manager Review" | "Pending Employee Sign-off" | "Completed";

const statusConfig: Record<Status, { label: string, variant: "secondary" | "default" | "outline" | "destructive", icon: any, color: string }> = {
  'Draft': { label: 'Brouillon', variant: 'secondary', icon: Clock, color: 'text-slate-500 bg-slate-100' },
  'Pending Manager Review': { label: 'En attente Manager', variant: 'default', icon: User, color: 'text-blue-600 bg-blue-50' },
  'Pending Employee Sign-off': { label: 'Attente Signature', variant: 'outline', icon: FileText, color: 'text-amber-600 bg-amber-50' },
  'Completed': { label: 'Terminée', variant: 'default', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
};

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPending, startTransition] = useTransition();

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
    const filtered = evaluations.filter(e => 
      e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.managerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
        setCurrentPage(1);
    }
    return filtered;
  }, [evaluations, searchTerm, currentPage, itemsPerPage]);

  const paginatedEvaluations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEvaluations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEvaluations, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredEvaluations.length / itemsPerPage);

  const stats = useMemo(() => {
      const completed = evaluations.filter(e => e.status === 'Completed').length;
      const pending = evaluations.filter(e => e.status !== 'Completed').length;
      return { completed, pending, total: evaluations.length };
  }, [evaluations]);

  return (
    <PermissionGuard permission="page:evaluations:view">
      <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Évaluations de Performance</h1>
          <p className="text-muted-foreground mt-1">Gérez les cycles de revue et le développement des compétences.</p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)} className="bg-slate-900 rounded-xl h-11">
          <PlusCircle className="mr-2 h-4 w-4" />
          Lancer une évaluation
        </Button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-blue-50/50 overflow-hidden group">
            <CardHeader className="pb-2">
                <CardDescription className="text-blue-600 font-bold text-xs uppercase tracking-wider">Total Evalué</CardDescription>
                <CardTitle className="text-3xl font-black text-blue-900 flex items-center justify-between">
                    {loading ? <Skeleton className="h-9 w-16" /> : stats.total}
                    <BarChart3 className="h-8 w-8 text-blue-200 group-hover:scale-110 transition-transform" />
                </CardTitle>
            </CardHeader>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/50 overflow-hidden group">
            <CardHeader className="pb-2">
                <CardDescription className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Terminées</CardDescription>
                <CardTitle className="text-3xl font-black text-emerald-900 flex items-center justify-between">
                    {loading ? <Skeleton className="h-9 w-16" /> : stats.completed}
                    <Award className="h-8 w-8 text-emerald-200 group-hover:scale-110 transition-transform" />
                </CardTitle>
            </CardHeader>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50/50 overflow-hidden group">
            <CardHeader className="pb-2">
                <CardDescription className="text-amber-600 font-bold text-xs uppercase tracking-wider">En cours</CardDescription>
                <CardTitle className="text-3xl font-black text-amber-900 flex items-center justify-between">
                    {loading ? <Skeleton className="h-9 w-16" /> : stats.pending}
                    <Target className="h-8 w-8 text-amber-200 group-hover:scale-110 transition-transform" />
                </CardTitle>
            </CardHeader>
        </Card>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="h-1.5 bg-slate-900" />
        <CardHeader className="bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Historique des Évaluations</CardTitle>
              <CardDescription>Liste des sessions de revue par cycle.</CardDescription>
            </div>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              <Input
                placeholder="Rechercher par employé..."
                className="pl-9 h-11 w-full md:w-[300px] rounded-xl border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && <div className="p-8 text-center text-destructive font-medium">{error}</div>}
          
          <div className="overflow-x-auto text-sm">
            <Table>
                <TableHeader className="bg-slate-50/80">
                <TableRow className="border-slate-100">
                    <TableHead className="w-12 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">#</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Collaborateur</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Manager Référent</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Période / Cycle</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Statut actuel</TableHead>
                    <TableHead className="w-12"></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))
                ) : paginatedEvaluations.length > 0 ? (
                    paginatedEvaluations.map((evaluation, index) => {
                        const config = statusConfig[evaluation.status] || { 
                            label: evaluation.status, 
                            variant: 'default', 
                            icon: Info, 
                            color: 'text-slate-500 bg-slate-100' 
                        };
                        const StatusIcon = config.icon;

                        return (
                            <TableRow 
                                key={evaluation.id} 
                                className="group hover:bg-slate-50/80 cursor-pointer border-slate-100 transition-colors" 
                                onClick={() => router.push(`/evaluations/${evaluation.id}`)}
                            >
                                <TableCell className="text-center font-mono text-xs text-slate-400">
                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 group-hover:text-slate-900">{evaluation.employeeName}</span>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                            <CalendarIcon className="h-3 w-3" /> {evaluation.evaluationDate}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-600 font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                            <User className="h-3 w-3 text-slate-400" />
                                        </div>
                                        {evaluation.managerName}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="rounded-md border-slate-200 bg-white font-medium text-slate-600">
                                        {evaluation.reviewPeriod}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm",
                                        config.color
                                    )}>
                                        <StatusIcon className="h-3 w-3" />
                                        {config.label}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="p-1.5 rounded-full bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-24 bg-slate-50/20">
                            <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                                <Award className="h-16 w-16 mb-2" />
                                <p className="font-bold text-lg">Aucune évaluation</p>
                                <p className="text-sm">Lancez votre premier cycle d'évaluation pour commencer.</p>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
         {totalPages > 1 && (
          <CardFooter className="bg-slate-50/50 border-t border-slate-100 px-6 py-4">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => startTransition(() => setCurrentPage(page))}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={filteredEvaluations.length}
              isPending={isPending}
            />
          </CardFooter>
        )}
      </Card>
      
      <AddEvaluationSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddEvaluation={handleAddEvaluation}
      />
    </div>
    </PermissionGuard>
  );
}

const Info = (props: any) => (
    <svg 
        {...props} 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);
