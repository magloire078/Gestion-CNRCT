"use client";

import { useState, useMemo, useEffect } from "react";
import { 
    PlusCircle, Search, MoreHorizontal, 
    Pencil, Trash2, PieChart as PieIcon, 
    BarChart as BarIcon, TrendingUp, 
    DollarSign, Calendar as CalendarIcon,
    Filter, Download, ArrowUpRight,
    ArrowDownRight, Wallet, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { 
    BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";

const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

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
    return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };
  
  const stats = useMemo(() => {
    const total = filteredLines.reduce((acc, line) => acc + line.allocatedAmount, 0);
    const count = filteredLines.length;
    const avg = count > 0 ? total / count : 0;
    
    // Pour l'exemple, on imagine une variation
    return { total, count, avg };
  }, [filteredLines]);

  const chartData = useMemo(() => {
    // Top 5 lines for Pie Chart
    const topLines = [...filteredLines]
        .sort((a, b) => b.allocatedAmount - a.allocatedAmount)
        .slice(0, 5)
        .map(line => ({ name: line.name.length > 20 ? line.name.substring(0, 17) + "..." : line.name, value: line.allocatedAmount }));
    
    // Budget by Year for Bar Chart
    const yearData = years.map(yr => {
        const amount = budgetLines.filter(l => l.year.toString() === yr).reduce((acc, l) => acc + l.allocatedAmount, 0);
        return { name: yr, amount };
    }).sort((a, b) => parseInt(a.name) - parseInt(b.name));

    return { topLines, yearData };
  }, [filteredLines, budgetLines, years]);

  return (
    <PermissionGuard permission="page:budget:view">
        <div className="flex flex-col gap-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gestion Budgétaire</h1>
          <p className="text-muted-foreground mt-1">Planification et suivi de l'allocation des ressources financières.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl h-11">
                <Download className="mr-2 h-4 w-4" /> Exporter Rapport
            </Button>
            <Button onClick={() => setIsAddSheetOpen(true)} className="bg-slate-900 rounded-xl h-11">
                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une Ligne
            </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-medium">Budget Total Alloué</CardDescription>
            <CardTitle className="text-3xl font-bold">
                {loading ? <Skeleton className="h-9 w-48 bg-slate-800" /> : formatCurrency(stats.total)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mt-2">
                <ArrowUpRight className="h-4 w-4" />
                <span>+12.5% par rapport à l'an dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-600 font-bold uppercase text-[10px] tracking-widest">Nombre de Lignes</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-blue-900">
                {loading ? <Skeleton className="h-9 w-24" /> : stats.count}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 font-medium mt-2 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-400" /> Moyenne: {formatCurrency(stats.avg)} / ligne
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Année Budgétaire Active</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-900">
                {yearFilter === 'all' ? years[0] || 'N/A' : yearFilter}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mt-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Exercice en cours</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <BarIcon className="h-5 w-5 text-primary" /> Évolution par Exercice
            </CardTitle>
            <CardDescription>Montants alloués par année budgétaire.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.yearData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis hide />
                <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Montant']}
                />
                <Bar dataKey="amount" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <PieIcon className="h-5 w-5 text-primary" /> Répartition du Budget
            </CardTitle>
            <CardDescription>Top 5 des lignes budgétaires les plus importantes.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {chartData.topLines.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData.topLines}
                            cx="50%"
                            cy="45%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.topLines.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground italic">
                    <Info className="h-8 w-8 mb-2 opacity-20" />
                    Aucune donnée disponible
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card (Table) */}
      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="h-1.5 bg-slate-900 w-full" />
        <CardHeader className="bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Détail des Lignes Budgétaires</CardTitle>
              <CardDescription>Liste exhaustive des crédits alloués.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
               <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Code ou nom..."
                  className="pl-9 h-10 w-full md:w-[250px] rounded-xl border-slate-200 focus:ring-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Toutes</SelectItem>
                  {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
            <div className="rounded-xl border border-slate-100 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                    <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="w-12 text-center text-xs font-bold uppercase tracking-wider text-slate-500">#</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Code / Poste</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Génellé de la Ligne</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Année</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">Montant Alloué</TableHead>
                        <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                        ))
                    ) : paginatedLines.length > 0 ? (
                        paginatedLines.map((line, index) => (
                        <TableRow key={line.id} className="hover:bg-slate-50 transition-colors border-slate-100">
                            <TableCell className="text-center text-slate-400 font-mono text-xs">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                            </TableCell>
                            <TableCell>
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 font-mono">
                                    {line.code}
                                </span>
                            </TableCell>
                            <TableCell className="font-semibold text-slate-700">
                                {line.name}
                            </TableCell>
                            <TableCell className="text-center">
                                <span className="text-xs font-medium text-slate-500">{line.year}</span>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-slate-900">
                                {formatCurrency(line.allocatedAmount)}
                            </TableCell>
                            <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl">
                                <DropdownMenuItem onClick={() => openEditSheet(line)} className="cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeleteTarget(line)} className="text-destructive focus:text-destructive cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-20 bg-slate-50/20">
                                <div className="flex flex-col items-center justify-center gap-2 grayscale">
                                    <TrendingUp className="h-12 w-12 text-slate-300 mb-2" />
                                    <p className="font-bold text-slate-500">Aucune ligne budgétaire trouvée</p>
                                    <p className="text-sm text-slate-400">Essayez de modifier vos filtres ou ajoutez une nouvelle ligne.</p>
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
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalItems={filteredLines.length}
                />
            </CardFooter>
        )}
      </Card>

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
        onCloseAction={() => setDeleteTarget(null)}
        onConfirmAction={handleDeleteConfirm}
        title={`Supprimer la ligne "${deleteTarget?.name}" ?`}
        description="Cette action est irréversible et supprimera définitivement la ligne budgétaire du système."
      />
    </div>
    </PermissionGuard>
  );
}
