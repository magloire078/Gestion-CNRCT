"use client";

import { useState, useMemo, useEffect } from "react";
import { 
    PlusCircle, Search, Package, MoreHorizontal, 
    Pencil, Trash2, LayoutGrid, List,
    Archive, AlertTriangle, CheckCircle2,
    TrendingDown, BarChart3, Filter,
    Download, ShoppingCart, Info, ChevronRight
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Supply } from "@/lib/data";
import { AddSupplySheet } from "@/components/supplies/add-supply-sheet";
import { EditSupplySheet } from "@/components/supplies/edit-supply-sheet";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToSupplies, addSupply, updateSupply, deleteSupply } from "@/services/supply-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { PaginationControls } from "@/components/common/pagination-controls";
import { cn } from "@/lib/utils";


import { supplyCategories } from "@/lib/constants/supply";

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supply | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    const unsubscribe = subscribeToSupplies(
      (fetchedSupplies) => {
        setSupplies(fetchedSupplies);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Impossible de charger les fournitures.");
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAddSupply = async (newSupplyData: Omit<Supply, "id">) => {
    try {
      await addSupply(newSupplyData);
      setIsAddSheetOpen(false);
      toast({
        title: "Fourniture ajoutée",
        description: `${newSupplyData.name} a été ajouté à l'inventaire.`,
      });
    } catch (err) {
      console.error("Failed to add supply:", err);
      throw err;
    }
  };

  const handleUpdateSupply = async (id: string, dataToUpdate: Partial<Omit<Supply, "id">>) => {
    try {
      await updateSupply(id, dataToUpdate);
      setIsEditSheetOpen(false);
      toast({
        title: "Fourniture mise à jour",
        description: "L'article a été mis à jour avec succès.",
      });
    } catch (err) {
      console.error("Failed to update supply:", err);
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSupply(deleteTarget.id);
      toast({
        title: "Fourniture supprimée",
        description: `L'article "${deleteTarget.name}" a été supprimé.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer l'article.",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEditSheet = (supply: Supply) => {
    setSelectedSupply(supply);
    setIsEditSheetOpen(true);
  }

  const filteredSupplies = useMemo(() => {
    const filtered = supplies.filter(supply => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = supply.name.toLowerCase().includes(searchTermLower) || (supply.category?.toLowerCase().includes(searchTermLower));
      const matchesCategory = categoryFilter === 'all' || supply.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
      setCurrentPage(1);
    }
    return filtered;

  }, [supplies, searchTerm, categoryFilter, currentPage, itemsPerPage]);

  const paginatedSupplies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSupplies.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSupplies, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSupplies.length / itemsPerPage);

  const stats = useMemo(() => {
    const totalItems = supplies.length;
    const lowStock = supplies.filter(s => s.quantity > 0 && s.quantity <= s.reorderLevel).length;
    const outOfStock = supplies.filter(s => s.quantity <= 0).length;
    return { totalItems, lowStock, outOfStock };
  }, [supplies]);

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity <= 0) return { text: "Rupture", color: "destructive", variant: "destructive" as any, value: 5, className: "bg-red-500", icon: AlertTriangle };
    if (quantity <= reorderLevel) return { text: "Stock Bas", color: "warning", variant: "secondary" as any, value: (quantity / (reorderLevel * 2)) * 100, className: "bg-amber-500", icon: AlertTriangle };
    const percentage = Math.min(100, (quantity / (reorderLevel * 2)) * 100);
    return { text: "Optimal", color: "success", variant: "default" as any, value: percentage, className: "bg-emerald-500", icon: CheckCircle2 };
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gestion des Fournitures</h1>
          <p className="text-muted-foreground mt-1 text-sm">Contrôle de l'inventaire et suivi des réapprovisionnements.</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="p-1 bg-slate-100 rounded-xl flex items-center">
                <Button 
                    variant={viewMode === 'table' ? 'default' : 'ghost'} 
                    size="icon" 
                    className={cn("h-8 w-8 rounded-lg", viewMode === 'table' && "bg-white shadow-sm text-slate-900")} 
                    onClick={() => setViewMode('table')}
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button 
                    variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                    size="icon" 
                    className={cn("h-8 w-8 rounded-lg", viewMode === 'grid' && "bg-white shadow-sm text-slate-900")} 
                    onClick={() => setViewMode('grid')}
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
            </div>
            <Button onClick={() => setIsAddSheetOpen(true)} className="bg-slate-900 rounded-xl h-11">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvel Article
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden group">
            <CardHeader className="pb-2">
                <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total Articles</CardDescription>
                <CardTitle className="text-3xl font-black flex items-center justify-between">
                    {loading ? <Skeleton className="h-9 w-16 bg-slate-800" /> : stats.totalItems}
                    <Package className="h-7 w-7 text-slate-700 transition-transform group-hover:scale-110" />
                </CardTitle>
            </CardHeader>
        </Card>

        <Card className="border-none shadow-sm bg-amber-50/50 overflow-hidden group">
            <CardHeader className="pb-2">
                <CardDescription className="text-amber-600 font-bold text-xs uppercase tracking-widest">Stock Critique</CardDescription>
                <CardTitle className="text-3xl font-black text-amber-900 flex items-center justify-between">
                    {loading ? <Skeleton className="h-9 w-16" /> : stats.lowStock}
                    <TrendingDown className="h-7 w-7 text-amber-200 transition-transform group-hover:-translate-y-1" />
                </CardTitle>
            </CardHeader>
        </Card>

        <Card className="border-none shadow-sm bg-red-50/50 overflow-hidden group">
            <CardHeader className="pb-2">
                <CardDescription className="text-red-600 font-bold text-xs uppercase tracking-widest">En Rupture</CardDescription>
                <CardTitle className="text-3xl font-black text-red-900 flex items-center justify-between">
                    {loading ? <Skeleton className="h-9 w-16" /> : stats.outOfStock}
                    <ShoppingCart className="h-7 w-7 text-red-200 transition-transform group-hover:rotate-12" />
                </CardTitle>
            </CardHeader>
        </Card>
      </div>

      {/* Global Card */}
      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="h-1.5 bg-slate-900 w-full" />
        <CardHeader className="bg-slate-50/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle>Inventaire Office</CardTitle>
              <CardDescription>Liste exhaustive des matériels et consommables.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
               <div className="relative group w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <Input
                  placeholder="Filtrer..."
                  className="pl-9 h-10 w-full md:w-[250px] rounded-xl border-slate-200 focus:ring-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl border-slate-200">
                    <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
                    <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {supplyCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
            {error && <div className="p-8 text-center text-red-500 font-bold">{error}</div>}
            
            {viewMode === 'table' ? (
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/80">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="w-12 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">#</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Libellé Article</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Classification</TableHead>
                            <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Stock</TableHead>
                            <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Seuil Alerte</TableHead>
                            <TableHead className="w-[180px] text-[10px] font-bold uppercase tracking-widest text-slate-400">Santé du Stock</TableHead>
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
                                <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                <TableCell><Skeleton className="h-3 w-full rounded-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                            ))
                        ) : paginatedSupplies.length > 0 ? (
                            paginatedSupplies.map((supply, index) => {
                                const status = getStockStatus(supply.quantity, supply.reorderLevel);
                                const Icon = status.icon;
                                return (
                                    <TableRow key={supply.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100">
                                        <TableCell className="text-center text-slate-300 font-mono text-xs">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-700">{supply.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="rounded-md bg-white border-slate-200 text-slate-500 font-medium px-2 py-0">
                                                {supply.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-black text-slate-900">{supply.quantity}</TableCell>
                                        <TableCell className="text-center text-slate-400 italic text-xs">{supply.reorderLevel}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                <div className="flex items-center justify-between text-[10px] font-bold">
                                                    <span className={cn(
                                                        status.color === 'destructive' ? "text-red-500" :
                                                        status.color === 'warning' ? "text-amber-500" : "text-emerald-500"
                                                    )}>
                                                        {status.text}
                                                    </span>
                                                    <Icon className="h-3 w-3 opacity-40" />
                                                </div>
                                                <Progress 
                                                    value={status.value} 
                                                    className="h-2 rounded-full bg-slate-100 overflow-hidden" 
                                                    indicatorClassName={cn("transition-all duration-700", status.className)} 
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
                                                <DropdownMenuItem onClick={() => openEditSheet(supply)} className="cursor-pointer">
                                                    <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeleteTarget(supply)} className="text-red-600 focus:text-red-600 cursor-pointer">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : null}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="rounded-2xl border-slate-100"><CardContent className="p-6"><Skeleton className="h-40 w-full rounded-xl" /></CardContent></Card>
                        ))
                    ) : paginatedSupplies.map((supply) => {
                        const status = getStockStatus(supply.quantity, supply.reorderLevel);
                        return (
                            <Card key={supply.id} className="group overflow-hidden rounded-2xl border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all border-none bg-slate-50 relative">
                                <div className={cn("h-1 w-full", status.className)} />
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="bg-white border-slate-200 rounded-lg text-[10px] font-bold mb-2">
                                            {supply.category}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl">
                                                <DropdownMenuItem onClick={() => openEditSheet(supply)}><Pencil className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeleteTarget(supply)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardTitle className="text-lg font-black text-slate-800">{supply.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="pb-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En Stock</p>
                                                <p className="text-2xl font-black text-slate-900">{supply.quantity}</p>
                                            </div>
                                            <div className="text-right space-y-0.5">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seuil</p>
                                                <p className="text-xs font-bold text-slate-600">{supply.reorderLevel}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                             <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                                                <span className={cn(
                                                    status.color === 'destructive' ? "text-red-500" :
                                                    status.color === 'warning' ? "text-amber-500" : "text-emerald-500"
                                                )}>{status.text}</span>
                                                <span className="text-slate-400">{Math.round(status.value)}%</span>
                                            </div>
                                            <Progress value={status.value} className="h-1.5 rounded-full bg-white border border-slate-100" indicatorClassName={cn("transition-all duration-1000", status.className)} />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/50 py-3 border-t border-slate-100 flex justify-between items-center px-6">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium italic">
                                        <Info className="h-3 w-3" /> MAJ: {supply.lastRestockDate || 'N/A'}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => openEditSheet(supply)} className="h-7 text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-slate-900 p-0 hover:bg-transparent">
                                        Détails <ChevronRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}

            {!loading && filteredSupplies.length === 0 && (
                <div className="text-center py-32 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-inner">
                        <Archive className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="font-black text-slate-500 uppercase tracking-widest">Aucun article trouvé</p>
                    <p className="text-sm text-slate-400 max-w-[300px] mx-auto mt-2 italic">Ajustez vos filtres ou effectuez une recherche plus précise.</p>
                </div>
            )}
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="bg-slate-50/50 border-t border-slate-100 px-6 py-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={filteredSupplies.length}
              />
            </CardFooter>
          )}
      </Card>

      <AddSupplySheet
        isOpen={isAddSheetOpen}
        onCloseAction={() => setIsAddSheetOpen(false)}
        onAddSupplyAction={handleAddSupply}
      />
      {selectedSupply && (
        <EditSupplySheet
          isOpen={isEditSheetOpen}
          onClose={() => setIsEditSheetOpen(false)}
          onUpdateSupply={handleUpdateSupply}
          supply={selectedSupply}
        />
      )}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onCloseAction={() => setDeleteTarget(null)}
        onConfirmAction={handleDeleteConfirm}
        title={`Supprimer "${deleteTarget?.name}"`}
        description="Êtes-vous sûr de vouloir supprimer cet article de l'inventaire ? Cette action est irréversible."
      />
    </div>
  );
}
