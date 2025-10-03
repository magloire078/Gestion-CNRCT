
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BudgetLine } from "@/lib/data";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToBudgetLines, deleteBudgetLine, addBudgetLine, updateBudgetLine } from "@/services/budget-line-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AddBudgetLineSheet } from "@/components/budget/add-budget-line-sheet";
import { EditBudgetLineSheet } from "@/components/budget/edit-budget-line-sheet";
import { PaginationControls } from "@/components/common/pagination-controls";

export default function BudgetPage() {
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<BudgetLine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetLine | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const unsubscribe = subscribeToBudgetLines(
      (data) => {
        setBudgetLines(data);
        setLoading(false);
      },
      (err) => {
        setError("Impossible de charger les lignes budgétaires.");
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);
  
  const handleAddBudgetLine = async (newLineData: Omit<BudgetLine, "id">) => {
    try {
        await addBudgetLine(newLineData);
        setIsAddSheetOpen(false);
        toast({
            title: "Ligne budgétaire ajoutée",
            description: `${newLineData.name} a été ajouté au budget.`,
        });
    } catch(err) {
        console.error("Failed to add budget line:", err);
        throw err;
    }
  };
  
  const handleUpdateBudgetLine = async (id: string, dataToUpdate: Partial<Omit<BudgetLine, 'id'>>) => {
    try {
        await updateBudgetLine(id, dataToUpdate);
        setIsEditSheetOpen(false);
        toast({
            title: "Ligne budgétaire mise à jour",
        });
    } catch (err) {
        console.error("Failed to update budget line:", err);
        throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBudgetLine(deleteTarget.id);
      toast({ title: "Ligne budgétaire supprimée" });
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la ligne." });
    } finally {
      setDeleteTarget(null);
    }
  };
  
  const openEditSheet = (line: BudgetLine) => {
    setEditingTarget(line);
    setIsEditSheetOpen(true);
  };

  const years = useMemo(() => {
    const allYears = budgetLines.map(line => line.year.toString());
    return [...new Set(allYears)].sort((a, b) => parseInt(b) - parseInt(a));
  }, [budgetLines]);

  const filteredLines = useMemo(() => {
    const filtered = budgetLines.filter(line => {
      const matchesYear = yearFilter === "all" || line.year.toString() === yearFilter;
      const matchesSearch = searchTerm === "" || 
                            line.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            line.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesYear && matchesSearch;
    });
     if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
        setCurrentPage(1);
    }
    return filtered;
  }, [budgetLines, yearFilter, searchTerm, currentPage, itemsPerPage]);
  
  const paginatedLines = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLines.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLines, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLines.length / itemsPerPage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF' }).format(amount);
  };
  
  const totalAllocated = useMemo(() => {
    return filteredLines.reduce((acc, line) => acc + line.allocatedAmount, 0);
  }, [filteredLines]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Gestion Budgétaire</h1>
          <Button onClick={() => setIsAddSheetOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter une Ligne
          </Button>
        </div>
        
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Total Alloué (Filtré)</CardTitle>
                        <CardDescription>Montant total pour la sélection actuelle.</CardDescription>
                    </div>
                    {loading ? <Skeleton className="h-8 w-32" /> : <p className="text-2xl font-bold">{formatCurrency(totalAllocated)}</p>}
                </div>
            </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lignes Budgétaires</CardTitle>
            <CardDescription>Liste de toutes les lignes budgétaires de l'organisation.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou code..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrer par année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Année</TableHead>
                    <TableHead className="text-right">Montant Alloué</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : paginatedLines.length > 0 ? (
                    paginatedLines.map((line, index) => (
                      <TableRow key={line.id}>
                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-mono">{line.code}</TableCell>
                        <TableCell className="font-medium">{line.name}</TableCell>
                        <TableCell>{line.year}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(line.allocatedAmount)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditSheet(line)}>
                                <Pencil className="mr-2 h-4 w-4" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteTarget(line)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">Aucune ligne budgétaire trouvée.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
           {totalPages > 1 && (
            <CardFooter>
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalItems={filteredLines.length}
                />
            </CardFooter>
        )}
        </Card>
      </div>

       <AddBudgetLineSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onAddBudgetLine={handleAddBudgetLine}
      />
      {editingTarget && (
        <EditBudgetLineSheet
            isOpen={isEditSheetOpen}
            onClose={() => setIsEditSheetOpen(false)}
            onUpdateBudgetLine={handleUpdateBudgetLine}
            budgetLine={editingTarget}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Supprimer la ligne "${deleteTarget?.name}" ?`}
        description="Cette action est irréversible et supprimera définitivement la ligne budgétaire."
      />
    </>
  );
}
