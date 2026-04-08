"use client";

import React, { useState, useEffect, useTransition, useMemo, useCallback, useDeferredValue, memo } from "react";
import { 
  Package, 
  PlusCircle, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Trash2, 
  Pencil, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle2, 
  Archive, 
  BarChart3, 
  TrendingUp, 
  FileText,
  Printer,
  LayoutGrid,
  List,
  Zap,
  Info,
  ChevronRight,
  ExternalLink,
  Settings,
  Database,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import { 
  Supply, 
  SupplyTransaction, 
} from "@/types/asset";
import { SupplyCategory, subscribeToCategories } from "@/services/supply-category-service";
import { 
  subscribeToSupplies, 
  subscribeToSupplyTransactions,
  addSupply, 
  updateSupply, 
  deleteSupply,
  deleteSupplyTransaction,
} from "@/services/supply-service";


import { AddSupplySheet } from "@/components/supplies/add-supply-sheet";
import { EditSupplySheet } from "@/components/supplies/edit-supply-sheet";
import { DistributeSupplyDialog } from "@/components/supplies/distribute-supply-dialog";
import { RestockSupplyDialog } from "@/components/supplies/restock-supply-dialog";
import { SupplyTransactionList } from "@/components/supplies/supply-transaction-list";
import { ManageCategoriesDialog } from "@/components/supplies/manage-categories-dialog";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { PaginationControls } from "@/components/common/pagination-controls";
import { PrintSuppliesDialog, PrintOptions } from "@/components/supplies/print-supplies-dialog";
import { InstitutionalHeader } from "@/components/reports/institutional-header";
import { InstitutionalFooter } from "@/components/reports/institutional-footer";
import { InstitutionalReportWrapper } from "@/components/reports/institutional-report-wrapper";
import { SuppliesOfficialReport } from "@/components/reports/supplies-official-report";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

// Helper component for debounced search
const DebouncedInput = ({ value: initialValue, onChange, debounce = 300, ...props }: any) => {
    const [value, setValue] = useState(initialValue);
    useEffect(() => { setValue(initialValue); }, [initialValue]);
    useEffect(() => {
        const timeout = setTimeout(() => onChange(value), debounce);
        return () => clearTimeout(timeout);
    }, [value]);
    return <Input {...props} value={value} onChange={e => setValue(e.target.value)} />;
};

// Stock Health Status Logic
const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity <= 0) return { text: "Rupture", color: "destructive", variant: "destructive" as any, value: 5, className: "bg-red-500", icon: AlertTriangle };
    if (quantity <= reorderLevel) return { text: "Stock Bas", color: "warning", variant: "secondary" as any, value: (quantity / (reorderLevel * 2)) * 100, className: "bg-amber-500", icon: AlertTriangle };
    const percentage = Math.min(100, (quantity / (reorderLevel * 2)) * 100);
    return { text: "Optimal", color: "success", variant: "default" as any, value: percentage, className: "bg-emerald-500", icon: CheckCircle2 };
};

// Memoized Row component to optimize performance
const SupplyRow = memo(({ 
    supply, 
    index, 
    openDistributeDialog, 
    openRestockDialog,
    openEditSheet, 
    setDeleteTarget 
}: {
    supply: Supply;
    index: number;
    openDistributeDialog: (s: Supply) => void;
    openRestockDialog: (s: Supply) => void;
    openEditSheet: (s: Supply) => void;
    setDeleteTarget: (s: Supply) => void;
}) => {
    const status = getStockStatus(supply.quantity, supply.reorderLevel);
    const Icon = status.icon;

    return (
        <TableRow key={supply.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100">
            <TableCell className="text-center text-slate-300 font-mono text-xs">
                {index + 1}
            </TableCell>
            <TableCell className="font-mono text-xs font-bold text-slate-400">
                {supply.code || '---'}
            </TableCell>
            <TableCell className="font-bold text-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {supply.photoUrl ? (
                            <img src={supply.photoUrl} alt={supply.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package className="h-4 w-4 text-slate-300" />
                        )}
                    </div>
                    <span>{supply.name}</span>
                </div>
            </TableCell>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-slate-100 shadow-sm hover:bg-slate-100">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
                    <DropdownMenuItem onClick={() => openDistributeDialog(supply)} className="cursor-pointer font-bold text-slate-900 border-b border-slate-50">
                        <ShoppingCart className="mr-2 h-4 w-4 text-blue-600" /> Donner à...
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openRestockDialog(supply)} className="cursor-pointer font-bold text-emerald-700 bg-emerald-50/50">
                        <PlusCircle className="mr-2 h-4 w-4" /> Réapprovisionner
                    </DropdownMenuItem>
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
    );
});

// Memoized Card component for Grid view
const SupplyCard = memo(({ 
  supply, 
  status, 
  openDistributeDialog, 
  openEditSheet, 
  setDeleteTarget 
}: {
  supply: Supply;
  status: any;
  openDistributeDialog: (s: Supply) => void;
  openEditSheet: (s: Supply) => void;
  setDeleteTarget: (s: Supply) => void;
}) => {
  return (
    <Card key={supply.id} className="group overflow-hidden rounded-2xl border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all border-none bg-slate-50 relative">
        <div className={cn("h-1 w-full", status.className)} />
        <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
                <Badge variant="outline" className="bg-white border-slate-200 rounded-lg text-[10px] font-bold mb-2">
                    {supply.category}
                </Badge>
                {supply.code && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none rounded-lg text-[10px] font-bold mb-2 ml-2">
                        {supply.code}
                    </Badge>
                )}
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
        <div className="px-6 pb-2">
            <div className="w-full aspect-[4/3] rounded-xl bg-slate-100/50 border border-slate-200/50 overflow-hidden flex items-center justify-center relative group shadow-inner">
                {supply.photoUrl ? (
                    <img src={supply.photoUrl} alt={supply.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Package className="h-10 w-10 text-slate-200" />
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Aucune Photo</span>
                    </div>
                )}
                {supply.quantity <= supply.reorderLevel && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase rounded-full shadow-md z-10">Stock Bas</div>
                )}
            </div>
        </div>
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
                <div className="pt-2">
                    <Button 
                        onClick={() => openDistributeDialog(supply)} 
                        disabled={supply.quantity <= 0}
                        className="w-full bg-slate-900 rounded-xl h-9 text-xs font-bold"
                    >
                        <ShoppingCart className="mr-2 h-3.5 w-3.5" /> Donner à...
                    </Button>
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
  );
});

export default function SuppliesPage() {
  const [isPending, startTransition] = useTransition();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [transactions, setTransactions] = useState<SupplyTransaction[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [isDistributeDialogOpen, setIsDistributeDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supply | null>(null);
  const [activeTab, setActiveTab] = useState("inventory");
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<SupplyCategory[]>([]);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();
  const { user, settings } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [isPendingAction, setIsPendingAction] = useState(false);

  // Valeurs par défaut mémorisées
  const defaultArray = useMemo(() => [], []);

  // Handlers mémorisés pour la navigation et les modals
  const toggleViewMode = useCallback((mode: 'table' | 'grid') => setViewMode(mode), []);
  const handleTabChange = useCallback((v: string) => setActiveTab(v), []);
  
  const handleOpenAddSheet = useCallback(() => {
    startTransition(() => {
      setIsAddSheetOpen(true);
    });
  }, []);

  const closeAddSheet = useCallback(() => setIsAddSheetOpen(false), []);

  const openEditSheet = useCallback((supply: Supply) => {
    startTransition(() => {
      setSelectedSupply(supply);
      setIsEditSheetOpen(true);
    });
  }, []);

  const closeEditSheet = useCallback(() => setIsEditSheetOpen(false), []);

  const openDistributeDialog = useCallback((supply: Supply) => {
    startTransition(() => {
      setSelectedSupply(supply);
      setIsDistributeDialogOpen(true);
    });
  }, []);

  const closeDistributeDialog = useCallback(() => setIsDistributeDialogOpen(false), []);

  const openRestockDialog = useCallback((supply: Supply) => {
    startTransition(() => {
      setSelectedSupply(supply);
      setIsRestockDialogOpen(true);
    });
  }, []);

  const closeRestockDialog = useCallback(() => setIsRestockDialogOpen(false), []);

  const handleSetDeleteTarget = useCallback((s: Supply | null) => setDeleteTarget(s), []);

  const openPrintDialog = useCallback(() => {
    startTransition(() => {
      setIsPrintDialogOpen(true);
    });
  }, []);

  const handleClosePrintDialog = useCallback(() => setIsPrintDialogOpen(false), []);

  const handleSearchChange = useCallback((val: string | number) => {
    startTransition(() => {
      setSearchTerm(String(val));
    });
  }, []);

  const handleCategoryFilterChange = (value: string) => {
    startTransition(() => {
        setCategoryFilter(value);
        setCurrentPage(1);
    });
  };

  useEffect(() => {
    const unsubscribeSupplies = subscribeToSupplies(
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

    const unsubscribeTransactions = subscribeToSupplyTransactions(
      (fetchedTransactions) => {
        setTransactions(fetchedTransactions || defaultArray);
      },
      (err) => {
        console.error("Failed to load transactions", err);
      }
    );

    const unsubscribeCategories = subscribeToCategories(
      (data) => setAvailableCategories(data),
      (err) => console.error("Failed to load categories", err)
    );

    return () => {
        unsubscribeSupplies();
        unsubscribeTransactions();
        unsubscribeCategories();
    };
  }, [defaultArray]);

  const handleAddSupply = async (newSupplyData: Omit<Supply, "id">, photoFile?: File | null) => {
    try {
      await addSupply(newSupplyData, user?.name || user?.email || 'Utilisateur inconnu', photoFile);
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

  const handleUpdateSupply = async (id: string, dataToUpdate: Partial<Omit<Supply, "id">>, photoFile?: File | null) => {
    try {
      await updateSupply(id, dataToUpdate, user?.name || user?.email || 'Utilisateur inconnu', photoFile);
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

  const handleDeleteTransaction = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette trace du journal ? Cela n'affectera pas le stock actuel.")) {
        try {
            await deleteSupplyTransaction(id);
            toast({
                title: "Trace supprimée",
                description: "Le mouvement a été retiré du journal.",
            });
        } catch (err) {
            console.error("Failed to delete transaction:", err);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de supprimer la trace.",
            });
        }
    }
  };

  const handleCleanDuplicates = async () => {
    if (!confirm("Cette opération va supprimer tous les articles d'inventaire dont l'identifiant n'est pas synchronisé. Continuer ?")) return;
    
    setIsPendingAction(true);
    try {
        let deletedCount = 0;
        // Identify duplicates: those whose ID is not their code
        for (const supply of supplies) {
            if (supply.id !== supply.code && supply.code) {
                // Another document already exists with the code as ID
                const exists = supplies.some(s => s.id === supply.code);
                if (exists) {
                    await deleteSupply(supply.id);
                    deletedCount++;
                }
            }
        }
        toast({
            title: "Nettoyage terminé",
            description: `${deletedCount} doublons ont été supprimés.`,
        });
    } catch (err) {
        console.error("Cleanup failed:", err);
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Certains doublons n'ont pas pu être supprimés.",
        });
    } finally {
        setIsPendingAction(false);
    }
  };

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredSupplies = useMemo(() => {
        return supplies.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(deferredSearchTerm.toLowerCase()) || 
                                (s.code && s.code.toLowerCase().includes(deferredSearchTerm.toLowerCase()));
            const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [supplies, deferredSearchTerm, categoryFilter]);

    // --- Statistics calculation ---
    const stats = useMemo(() => {
        const total = filteredSupplies.length;
        const outOfStock = filteredSupplies.filter(s => s.quantity <= 0).length;
        const lowStock = filteredSupplies.filter(s => s.quantity > 0 && s.quantity <= s.reorderLevel).length;
        
        // Calculate average health (0-100)
        const healthVals = filteredSupplies.map(s => getStockStatus(s.quantity, s.reorderLevel).value);
        const avgHealth = healthVals.length > 0 ? healthVals.reduce((a, b) => a + b, 0) / healthVals.length : 100;
        
        return { total, outOfStock, lowStock, avgHealth };
    }, [filteredSupplies]);

  // Adjust current page if filtering reduces total items
  useEffect(() => {
    const maxPage = Math.ceil(filteredSupplies.length / itemsPerPage);
    if (maxPage > 0 && currentPage > maxPage) {
      setCurrentPage(1);
    }
  }, [filteredSupplies.length, itemsPerPage, currentPage]);

  const paginatedSupplies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSupplies.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSupplies, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSupplies.length / itemsPerPage);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (historyPage - 1) * historyItemsPerPage;
    return transactions.slice(startIndex, startIndex + historyItemsPerPage);
  }, [transactions, historyPage, historyItemsPerPage]);

  const historyTotalPages = Math.ceil(transactions.length / historyItemsPerPage);

  const handlePrint = useCallback((options: PrintOptions) => {
    setPrintOptions(options);
    
    // Sort supplies for printing if needed
    const sorted = [...filteredSupplies];
    if (options.sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (options.sortBy === 'quantity') sorted.sort((a, b) => b.quantity - a.quantity);
    if (options.sortBy === 'category') sorted.sort((a, b) => a.category.localeCompare(b.category));
    
    setSupplies(sorted); // Note: this affects the UI too, which is fine for printing
    setIsPrinting(true);
  }, [filteredSupplies]);

  const printableSupplies = useMemo(() => {
    if (!printOptions) return [];
    let items = supplies;
    if (!printOptions.includeOutOfStock) {
        items = items.filter(s => s.quantity > 0);
    }
    if (printOptions.category !== 'all') {
        items = items.filter(s => s.category === printOptions.category);
    }
    
    return [...items].sort((a, b) => {
        if (printOptions.sortBy === 'name') return a.name.localeCompare(b.name);
        if (printOptions.sortBy === 'quantity') return b.quantity - a.quantity;
        if (printOptions.sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
        return 0;
    });
  }, [supplies, printOptions]);


  return (
    <PermissionGuard permission="page:supplies:view">
    <div className="flex flex-col gap-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Gestion des Fournitures
            {categoryFilter !== 'all' && (
              <span className="ml-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-lg align-middle border border-slate-200">
                {categoryFilter}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Contrôle de l'inventaire et suivi des réapprovisionnements.</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="p-1 bg-slate-100 rounded-xl flex items-center shadow-sm">
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
            <Button 
                onClick={() => startTransition(() => setIsPrintDialogOpen(true))} 
                variant="outline" 
                className="rounded-xl border-slate-200 font-bold shadow-sm"
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimer Rapport
            </Button>

            <Button 
                onClick={() => setIsManageCategoriesOpen(true)}
                variant="outline" 
                className="rounded-xl border-slate-200 font-bold shadow-sm"
            >
              <Settings className="mr-2 h-4 w-4" /> Gérer Catégories
            </Button>
            <Button onClick={() => setIsAddSheetOpen(true)} className="bg-slate-900 rounded-xl h-11 font-bold">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvel Article
            </Button>
        </div>
      </div>

      {/* Global Card */}
      <Tabs defaultValue="inventory" className="w-full" onValueChange={handleTabChange}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="inventory" className="gap-2">
                    <Package className="h-4 w-4" /> Inventaire
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                    <Archive className="h-4 w-4" /> Historique
                </TabsTrigger>
            </TabsList>
        </div>

        {/* --- Statistical Dashboard --- */}
        {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-white shadow-sm border-slate-100 hover:border-primary/20 transition-all group">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <Package className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Articles</span>
                            <span className="text-xl font-black text-slate-900">{stats.total}</span>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white shadow-sm border-slate-100 hover:border-red-100 transition-all group">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                            stats.outOfStock > 0 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-300"
                        )}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rupture de Stock</span>
                            <span className={cn("text-xl font-black", stats.outOfStock > 0 ? "text-red-600" : "text-slate-900")}>
                                {stats.outOfStock}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-slate-100 hover:border-amber-100 transition-all group">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                            stats.lowStock > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-300"
                        )}>
                            <Zap className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Stock Critique</span>
                            <span className={cn("text-xl font-black", stats.lowStock > 0 ? "text-amber-600" : "text-slate-900")}>
                                {stats.lowStock}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-slate-100 hover:border-emerald-100 transition-all group">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Santé Globale</span>
                            <span className="text-xl font-black text-emerald-600">{Math.round(stats.avgHealth)}%</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

      <TabsContent value="inventory" className="mt-0">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        {categoryFilter !== 'all' ? categoryFilter : 'Inventaire Complet'}
                    </CardTitle>
                    <CardDescription>
                        {filteredSupplies.length} article(s) trouvé(s)
                    </CardDescription>
                </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
               <div className="relative group w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <DebouncedInput
                  placeholder="Filtrer..."
                  className="pl-9 h-10 w-full md:w-[250px] rounded-xl border-slate-200 focus:ring-slate-900"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
                <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl border-slate-200 text-slate-900 font-bold">
                    <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
                    <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {availableCategories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
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
                            <TableHead className="py-4 pl-6 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Ordre</TableHead>
                            <TableHead className="py-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Code</TableHead>
                            <TableHead className="py-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Désignation</TableHead>
                            <TableHead className="py-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Catégorie</TableHead>
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
                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                <TableCell><Skeleton className="h-3 w-full rounded-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                            ))
                        ) : paginatedSupplies.length > 0 ? (
                            paginatedSupplies.map((item, index) => (
                                <SupplyRow 
                                    key={item.id}
                                    supply={item}
                                    index={(currentPage - 1) * itemsPerPage + index}
                                    openDistributeDialog={openDistributeDialog}
                                    openRestockDialog={openRestockDialog}
                                    openEditSheet={openEditSheet}
                                    setDeleteTarget={handleSetDeleteTarget}
                                />
                            ))
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
                    ) : paginatedSupplies.map((supply) => (
                        <SupplyCard 
                            key={supply.id}
                            supply={supply}
                            status={getStockStatus(supply.quantity, supply.reorderLevel)}
                            openDistributeDialog={openDistributeDialog}
                            openEditSheet={openEditSheet}
                            setDeleteTarget={handleSetDeleteTarget}
                        />
                    ))}
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
      </TabsContent>

      <TabsContent value="history" className="mt-0">
        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="h-1.5 bg-blue-600 w-full" />
            <CardHeader className="bg-slate-50/50">
                <CardTitle>Journal des Mouvements</CardTitle>
                <CardDescription>Suivi détaillé des distributions et réapprovisionnements.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <SupplyTransactionList 
                    transactions={paginatedTransactions} 
                    onDelete={handleDeleteTransaction}
                />
            </CardContent>
            {historyTotalPages > 1 && (
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 px-6 py-4">
                    <PaginationControls
                        currentPage={historyPage}
                        totalPages={historyTotalPages}
                        onPageChange={setHistoryPage}
                        itemsPerPage={historyItemsPerPage}
                        onItemsPerPageChange={setHistoryItemsPerPage}
                        totalItems={transactions.length}
                    />
                </CardFooter>
            )}
        </Card>
      </TabsContent>
      </Tabs>

      {isAddSheetOpen && (
        <AddSupplySheet
          isOpen={isAddSheetOpen}
          onCloseAction={closeAddSheet}
          onAddSupplyAction={handleAddSupply}
        />
      )}
      {isEditSheetOpen && selectedSupply && (
        <EditSupplySheet
          isOpen={isEditSheetOpen}
          onCloseAction={closeEditSheet}
          onUpdateSupplyAction={handleUpdateSupply}
          supply={selectedSupply}
        />
      )}
      
      {selectedSupply && (
        <>
          <DistributeSupplyDialog 
            isOpen={isDistributeDialogOpen} 
            onCloseAction={closeDistributeDialog} 
            supply={selectedSupply} 
          />
          <RestockSupplyDialog
            isOpen={isRestockDialogOpen}
            onCloseAction={closeRestockDialog}
            supply={selectedSupply}
          />
        </>
      )}

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onCloseAction={() => setDeleteTarget(null)}
        onConfirmAction={handleDeleteConfirm}
        title={`Supprimer "${deleteTarget?.name}"`}
        description="Êtes-vous sûr de vouloir supprimer cet article de l'inventaire ? Cette action est irréversible."
      />



      <ManageCategoriesDialog 
        isOpen={isManageCategoriesOpen} 
        onCloseAction={() => setIsManageCategoriesOpen(false)} 
      />

      {isPrintDialogOpen && (
          <PrintSuppliesDialog 
            isOpen={isPrintDialogOpen} 
            onCloseAction={handleClosePrintDialog} 
            onPrintAction={handlePrint}
          />
      )}

      {/* --- OFFICIAL REPORT RENDER --- */}
      {isPrinting && printOptions?.reportTemplate === 'official' && (
          <SuppliesOfficialReport 
            logos={settings || { mainLogoUrl: '', secondaryLogoUrl: '', name: 'CNRCT', id: 'default' } as any}
            supplies={printableSupplies}
            categoryLabel={categoryFilter}
            stats={stats}
            options={{
                includePhotos: printOptions.includePhotos,
                showHealthStatus: printOptions.showHealthStatus
            }}
          />
      )}

      {/* --- STANDARD REPORT RENDER --- */}
      <InstitutionalReportWrapper 
        isPrinting={isPrinting && printOptions?.reportTemplate !== 'official'} 
        onAfterPrint={() => setIsPrinting(false)}
      >
        {isPrinting && printOptions?.reportTemplate !== 'official' && (
            <div id="printable-report" className="bg-white p-10 min-h-screen text-black">
              <InstitutionalHeader 
                title={categoryFilter !== 'all' ? `État des Stocks : ${categoryFilter}` : "État de Gestion des Fournitures et Consommables"} 
                period={`Situation au ${new Date().toLocaleDateString('fr-FR')}`}
              />
                
              <div className="grid grid-cols-4 gap-6 my-8 pb-8 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <Package className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Nombre d'Articles</span>
                          <span className="text-xl font-black text-slate-900 leading-tight">{stats.total}</span>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center",
                          stats.outOfStock > 0 ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400"
                      )}>
                          <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                          <span className={cn("text-[9px] font-black uppercase mb-0.5", stats.outOfStock > 0 ? "text-red-500" : "text-slate-400")}>Ruptures</span>
                          <span className={cn("text-xl font-black leading-tight", stats.outOfStock > 0 ? "text-red-600" : "text-slate-900")}>
                                {stats.outOfStock}
                          </span>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center",
                          stats.lowStock > 0 ? "bg-amber-50 text-amber-500" : "bg-slate-50 text-slate-400"
                      )}>
                          <Zap className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                          <span className={cn("text-[9px] font-black uppercase mb-0.5", stats.lowStock > 0 ? "text-amber-500" : "text-slate-400")}>Critiques</span>
                          <span className={cn("text-xl font-black leading-tight", stats.lowStock > 0 ? "text-amber-600" : "text-slate-900")}>
                                {stats.lowStock}
                          </span>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <BarChart3 className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase text-emerald-500 mb-0.5">Santé</span>
                          <span className="text-xl font-black text-emerald-600 leading-tight">{Math.round(stats.avgHealth)}%</span>
                      </div>
                  </div>
              </div>

              <div className="my-8">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="border-slate-100">
                                {printOptions?.includePhotos && <TableHead className="font-bold py-4 pl-6 w-12">Photo</TableHead>}
                                <TableHead className={cn("font-bold py-4", !printOptions?.includePhotos && "pl-6")}>Code</TableHead>
                                <TableHead className="font-bold py-4">Désignation</TableHead>
                                <TableHead className="font-bold py-4 text-center">Quantité</TableHead>
                                {printOptions?.showHealthStatus && <TableHead className="font-bold py-4 pr-6 w-[160px]">État de santé</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {printableSupplies.map((item) => {
                                const status = getStockStatus(item.quantity, item.reorderLevel);
                                return (
                                    <TableRow key={item.id} className="border-slate-50 h-14">
                                        {printOptions?.includePhotos && (
                                            <TableCell className="py-2 pl-6">
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                                                    {item.photoUrl ? (
                                                        <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="h-4 w-4 text-slate-200" />
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell className={cn("py-2 font-mono text-[10px] text-slate-400", !printOptions?.includePhotos && "pl-6")}>
                                            {item.code || '---'}
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="font-bold text-slate-800 text-[11px]">{item.name}</div>
                                            <div className="text-[9px] text-slate-400 uppercase font-medium">{item.category}</div>
                                        </TableCell>
                                        <TableCell className="py-2 text-center font-black text-slate-900">{item.quantity}</TableCell>
                                        {printOptions?.showHealthStatus && (
                                            <TableCell className="py-2 pr-6">
                                                <div className="flex flex-col gap-1 w-full max-w-[120px]">
                                                    <div className="flex justify-between text-[8px] font-black uppercase">
                                                        <span className={cn(
                                                            status.color === 'destructive' ? "text-red-500" :
                                                            status.color === 'warning' ? "text-amber-500" : "text-emerald-500"
                                                        )}>{status.text}</span>
                                                        <span className="text-slate-300">{Math.round(status.value)}%</span>
                                                    </div>
                                                    <Progress value={status.value} className="h-1 rounded-full overflow-hidden" indicatorClassName={cn("transition-all", status.className)} />
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
              </div>
  
              <InstitutionalFooter 
                signatoryName="COULIBALY Hamadou"
                signatoryTitle="Contrôleur Interne et Qualité, CNRCT"
              />
            </div>
        )}
      </InstitutionalReportWrapper>
    </div>
    </PermissionGuard>
  );
}
