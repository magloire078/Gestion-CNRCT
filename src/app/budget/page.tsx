"use client";

import { useState, useMemo, useEffect } from "react";
import { 
    PlusCircle, Search, MoreHorizontal, 
    Pencil, Trash2, PieChart as PieIcon, 
    BarChart as BarIcon, TrendingUp, 
    DollarSign, Calendar as CalendarIcon,
    Filter, Download, ArrowUpRight,
    ArrowDownRight, Wallet, Info,
    ArrowLeftRight, FileText, CheckCircle2
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { subscribeToBudgetLines, deleteBudgetLine, addBudgetLine, updateBudgetLine, syncBudgetLinesWithPreviousYear } from "@/services/budget-line-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw } from "lucide-react";
import { AddBudgetLineSheet } from "@/components/budget/add-budget-line-sheet";
import { EditBudgetLineSheet } from "@/components/budget/edit-budget-line-sheet";
import { PaginationControls } from "@/components/common/pagination-controls";
import { BudgetPrintTemplate } from "@/components/budget/budget-print-template";
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
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState<string>("emploi");
  
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSyncPreviousYear = async () => {
    if (yearFilter === "all") return;
    const year = parseInt(yearFilter);
    setIsSyncing(true);
    try {
        const { updatedCount } = await syncBudgetLinesWithPreviousYear(year);
        toast({
            title: "Synchronisation terminée",
            description: `${updatedCount} lignes budgétaires ont été mises à jour avec les montants de ${year - 1}.`,
        });
    } catch (err) {
        console.error("Failed to sync budget lines:", err);
        toast({
            variant: "destructive",
            title: "Erreur de synchronisation",
            description: "Une erreur est survenue lors de la récupération des données de l'année précédente.",
        });
    } finally {
        setIsSyncing(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  const handlePrint = () => {
    window.print();
  };

  const years = useMemo(() => {
    const allYears = budgetLines.map(line => line.year.toString());
    if (allYears.length === 0) return [new Date().getFullYear().toString()];
    return [...new Set(allYears)].sort((a, b) => parseInt(b) - parseInt(a));
  }, [budgetLines]);

  // Filter out any corrupted data that might have slipped through from Firestore
  const safeBudgetLines = useMemo(() => {
    return budgetLines.filter(l => l && l.name && typeof l.year === 'number');
  }, [budgetLines]);

  const filteredLines = useMemo(() => {
    return safeBudgetLines.filter(line => {
      const matchesYear = yearFilter === "all" || line.year.toString() === yearFilter;
      const matchesType = line.type === activeTab;
      const matchesSearch = searchTerm === "" || 
                            (line.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (line.code?.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesYear && matchesType && matchesSearch;
    });
  }, [safeBudgetLines, yearFilter, activeTab, searchTerm]);

  // Handle page reset in a side effect, not during render
  useEffect(() => {
    const totalLines = filteredLines.length;
    const maxPage = Math.ceil(totalLines / itemsPerPage) || 1;
    if (currentPage > maxPage) {
        setCurrentPage(1);
    }
  }, [filteredLines, itemsPerPage, currentPage]);
  
  const paginatedLines = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLines.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLines, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLines.length / itemsPerPage);

  const formatCurrency = (amount: number) => {
    if (isNaN(amount)) return "0 F CFA";
    return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };
  
  const stats = useMemo(() => {
    const linesForYear = safeBudgetLines.filter(l => yearFilter === "all" || l.year.toString() === yearFilter);
    const totalEmplois = linesForYear.filter(l => l.type === 'emploi').reduce((acc, line) => acc + (line.allocatedAmount || 0), 0);
    const totalRessources = linesForYear.filter(l => l.type === 'ressource').reduce((acc, line) => acc + (line.allocatedAmount || 0), 0);
    const balance = totalRessources - totalEmplois;
    const isBalanced = Math.abs(balance) < 1;
    
    return { totalEmplois, totalRessources, balance, isBalanced };
  }, [safeBudgetLines, yearFilter]);

  const chartData = useMemo(() => {
    const currentYearLines = safeBudgetLines.filter(l => yearFilter === "all" || l.year.toString() === yearFilter);
    const topLines = [...currentYearLines]
        .filter(l => l.type === 'emploi')
        .sort((a, b) => (b.allocatedAmount || 0) - (a.allocatedAmount || 0))
        .slice(0, 5)
        .map(line => ({ 
            name: (line.name && line.name.length > 20) ? line.name.substring(0, 17) + "..." : (line.name || "Inconnu"), 
            value: line.allocatedAmount || 0 
        }));
    
    const yearData = years.map(yr => {
        const amount = safeBudgetLines.filter(l => l.year.toString() === yr && l.type === 'emploi').reduce((acc, l) => acc + (l.allocatedAmount || 0), 0);
        return { name: yr, amount };
    }).sort((a, b) => parseInt(a.name) - parseInt(b.name));

    return { topLines, yearData };
  }, [safeBudgetLines, yearFilter, years]);

  const handleFullImport2026 = async () => {
    const data2026: Omit<BudgetLine, "id">[] = [
        { type: "emploi", paragraphe: "231", code: "2310", name: "Bâtiments administratifs à usage de bureau", previousAmount: 320000000, allocatedAmount: 0, year: 2026 },
        { type: "emploi", paragraphe: "241", code: "2411", name: "Mobilier et matériel de logement et de bureau (autre qu'informatique)", previousAmount: 0, allocatedAmount: 50000000, year: 2026 },
        { type: "emploi", paragraphe: "242", code: "2411", name: "Mobilier et matériel de bureau (autre qu'informatique)", previousAmount: 0, allocatedAmount: 50000000, year: 2026 },
        { type: "emploi", paragraphe: "242", code: "2420", name: "Matériel informatique de bureau", previousAmount: 8000000, allocatedAmount: 58000000, year: 2026 },
        { type: "emploi", paragraphe: "243", code: "2432", name: "Voitures de service ou de liaison", previousAmount: 50000000, allocatedAmount: 300000000, year: 2026 },
        { type: "emploi", paragraphe: "612", code: "6121", name: "Rémunération du personnel sous contrat et des décisionnaires", previousAmount: 3210850000, allocatedAmount: 3407446195, year: 2026 },
        { type: "emploi", paragraphe: "614", code: "6143", name: "Cotisations CNPS des agents contractuels et décisionnaires", previousAmount: 98000000, allocatedAmount: 100000000, year: 2026 },
        { type: "emploi", paragraphe: "615", code: "6156", name: "Assurances maladie en faveur du personnel", previousAmount: 130000000, allocatedAmount: 305000000, year: 2026 },
        { type: "emploi", paragraphe: "621", code: "6211", name: "Achats de petits matériels, fournitures de bureau et documentation", previousAmount: 2500000, allocatedAmount: 5000000, year: 2026 },
        { type: "emploi", paragraphe: "621", code: "6212", name: "Achats de carburants pour les véhicules de service", previousAmount: 180000000, allocatedAmount: 205000000, year: 2026 },
        { type: "emploi", paragraphe: "621", code: "6214", name: "Achats de fournitures et consommables pour le matériel informatique", previousAmount: 5000000, allocatedAmount: 9250000, year: 2026 },
        { type: "emploi", paragraphe: "621", code: "6215", name: "Achats de petits matériels et fournitures techniques", previousAmount: 500000, allocatedAmount: 500000, year: 2026 },
        { type: "emploi", paragraphe: "622", code: "6221", name: "Entretien des locaux (matériel et fournitures d'entretien)", previousAmount: 2000000, allocatedAmount: 3000000, year: 2026 },
        { type: "emploi", paragraphe: "622", code: "6223", name: "Entretien des installations électriques, climatiseurs, sanitaires et plomberies", previousAmount: 4000000, allocatedAmount: 6000000, year: 2026 },
        { type: "emploi", paragraphe: "622", code: "6224", name: "Entretien et maintenance des mobiliers et matériels informatiques", previousAmount: 3000000, allocatedAmount: 3000000, year: 2026 },
        { type: "emploi", paragraphe: "622", code: "6225", name: "Entretien centraux téléphoniques, téléphones, télécopieurs et mat de télécom", previousAmount: 1000000, allocatedAmount: 1000000, year: 2026 },
        { type: "emploi", paragraphe: "622", code: "6226", name: "Entretien et maintenance des mobiliers et matériels (sauf informatiques)", previousAmount: 2000000, allocatedAmount: 2000000, year: 2026 },
        { type: "emploi", paragraphe: "622", code: "6227", name: "Entretien et réparation des véhicules, pneumatiques", previousAmount: 140000000, allocatedAmount: 140000000, year: 2026 },
        { type: "emploi", paragraphe: "622", code: "6229", name: "Autres dépenses d'entretien et de maintenance", previousAmount: 25000000, allocatedAmount: 20000000, year: 2026 },
        { type: "emploi", paragraphe: "623", code: "6232", name: "Honoraires et frais annexes", previousAmount: 50000000, allocatedAmount: 100000000, year: 2026 },
        { type: "emploi", paragraphe: "623", code: "6239", name: "Autres rémunérations d'intermédiaires et de conseils", previousAmount: 3000000, allocatedAmount: 3000000, year: 2026 },
        { type: "emploi", paragraphe: "624", code: "6242", name: "Assurances des véhicules automobiles", previousAmount: 26500000, allocatedAmount: 28000000, year: 2026 },
        { type: "emploi", paragraphe: "625", code: "6252", name: "Abonnements et consommation d'eau", previousAmount: 1000000, allocatedAmount: 250000, year: 2026 },
        { type: "emploi", paragraphe: "626", code: "6263", name: "Abonnements et consommations Internet", previousAmount: 2500000, allocatedAmount: 7000000, year: 2026 },
        { type: "emploi", paragraphe: "626", code: "6264", name: "Affranchissement du courrier et autres frais de correspondance", previousAmount: 50000, allocatedAmount: 50000, year: 2026 },
        { type: "emploi", paragraphe: "627", code: "6271", name: "Loyers et charges locatives des locaux (hors logements de personnel)", previousAmount: 30000000, allocatedAmount: 100000000, year: 2026 },
        { type: "emploi", paragraphe: "627", code: "6279", name: "Autres locations", previousAmount: 4500000, allocatedAmount: 4500000, year: 2026 },
        { type: "emploi", paragraphe: "628", code: "6282", name: "Indemnités de mission à l'intérieur", previousAmount: 599200000, allocatedAmount: 300000000, year: 2026 },
        { type: "emploi", paragraphe: "629", code: "6292", name: "Frais de réception, de fêtes et de cérémonies", previousAmount: 1000000, allocatedAmount: 10000000, year: 2026 },
        { type: "emploi", paragraphe: "629", code: "6294", name: "Fonds spéciaux", previousAmount: 423600000, allocatedAmount: 460600000, year: 2026 },
        { type: "emploi", paragraphe: "669", code: "6690", name: "Autres charges exceptionnelles", previousAmount: 2000000, allocatedAmount: 4000000, year: 2026 },
        { type: "ressource", paragraphe: "731", code: "731", name: "Transferts reçus du Budget Général", previousAmount: 5325200000, allocatedAmount: 5632596195, year: 2026 }
    ];

    toast({ title: "Importation massive 2026...", description: "Génération de l'annexe budgétaire 2026." });
    try {
        for (const line of data2026) {
            await addBudgetLine(line);
        }
        toast({ title: "Importation terminée !", description: "Le budget 2026 est maintenant complet et équilibré." });
    } catch (err) {
        toast({ variant: "destructive", title: "Erreur lors de l'importation" });
    }
  };

  const handleFullImport2025 = async () => {
    const data2025: Omit<BudgetLine, "id">[] = [
        { type: "emploi", paragraphe: "231", code: "2310", name: "Bâtiments administratifs à usage de bureau", previousAmount: 0, allocatedAmount: 320000000, year: 2025 },
        { type: "emploi", paragraphe: "241", code: "2411", name: "Mobilier et matériel de logement et de bureau (autre qu'informatique)", previousAmount: 500000, allocatedAmount: 0, year: 2025 },
        { type: "emploi", paragraphe: "242", code: "2411", name: "Mobilier et matériel de bureau (autre qu'informatique)", previousAmount: 500000, allocatedAmount: 0, year: 2025 },
        { type: "emploi", paragraphe: "242", code: "2420", name: "Matériel informatique de bureau", previousAmount: 1000000, allocatedAmount: 8000000, year: 2025 },
        { type: "emploi", paragraphe: "243", code: "2432", name: "Voitures de service ou de liaison", previousAmount: 50000000, allocatedAmount: 50000000, year: 2025 },
        { type: "emploi", paragraphe: "244", code: "2449", name: "Autres matériels et outillages techniques", previousAmount: 500000, allocatedAmount: 0, year: 2025 },
        { type: "emploi", paragraphe: "612", code: "6121", name: "Rémunération du personnel sous contrat et des décisionnaires", previousAmount: 2905850000, allocatedAmount: 3210850000, year: 2025 },
        { type: "emploi", paragraphe: "614", code: "6143", name: "Cotisations CNPS des agents contractuels et décisionnaires", previousAmount: 62000000, allocatedAmount: 98000000, year: 2025 },
        { type: "emploi", paragraphe: "615", code: "6156", name: "Assurances maladie en faveur du personnel", previousAmount: 130000000, allocatedAmount: 130000000, year: 2025 },
        { type: "emploi", paragraphe: "621", code: "6211", name: "Achats de petits matériels, fournitures de bureau et documentation", previousAmount: 2500000, allocatedAmount: 2500000, year: 2025 },
        { type: "emploi", paragraphe: "621", code: "6212", name: "Achats de carburants pour les véhicules de service", previousAmount: 170000000, allocatedAmount: 180000000, year: 2025 },
        { type: "emploi", paragraphe: "621", code: "6214", name: "Achats de fournitures et consommables pour le matériel informatique", previousAmount: 2000000, allocatedAmount: 5000000, year: 2025 },
        { type: "emploi", paragraphe: "621", code: "6215", name: "Achats de petits matériels et fournitures techniques", previousAmount: 500000, allocatedAmount: 500000, year: 2025 },
        { type: "emploi", paragraphe: "622", code: "6221", name: "Entretien des locaux (matériel et fournitures d'entretien)", previousAmount: 2000000, allocatedAmount: 2000000, year: 2025 },
        { type: "emploi", paragraphe: "622", code: "6223", name: "Entretien des installations électriques, climatiseurs, sanitaires et plomberies", previousAmount: 2000000, allocatedAmount: 4000000, year: 2025 },
        { type: "emploi", paragraphe: "622", code: "6224", name: "Entretien et maintenance des mobiliers et matériels informatiques", previousAmount: 500000, allocatedAmount: 3000000, year: 2025 },
        { type: "emploi", paragraphe: "622", code: "6225", name: "Entretien centraux téléphoniques, téléphones, télécopieurs et mat de télécom", previousAmount: 1000000, allocatedAmount: 1000000, year: 2025 },
        { type: "emploi", paragraphe: "622", code: "6226", name: "Entretien et maintenance des mobiliers et matériels (sauf informatiques)", previousAmount: 1000000, allocatedAmount: 2000000, year: 2025 },
        { type: "emploi", paragraphe: "622", code: "6227", name: "Entretien et réparation des véhicules, pneumatiques", previousAmount: 151500000, allocatedAmount: 140000000, year: 2025 },
        { type: "emploi", paragraphe: "622", code: "6229", name: "Autres dépenses d'entretien et de maintenance", previousAmount: 35000000, allocatedAmount: 25000000, year: 2025 },
        { type: "emploi", paragraphe: "623", code: "6232", name: "Honoraires et frais annexes", previousAmount: 30000000, allocatedAmount: 50000000, year: 2025 },
        { type: "emploi", paragraphe: "623", code: "6239", name: "Autres rémunérations d'intermédiaires et de conseils", previousAmount: 0, allocatedAmount: 3000000, year: 2025 },
        { type: "emploi", paragraphe: "624", code: "6242", name: "Assurances des véhicules automobiles", previousAmount: 26500000, allocatedAmount: 26500000, year: 2025 },
        { type: "emploi", paragraphe: "625", code: "6252", name: "Abonnements et consommation d'eau", previousAmount: 1000000, allocatedAmount: 1000000, year: 2025 },
        { type: "emploi", paragraphe: "626", code: "6263", name: "Abonnements et consommations Internet", previousAmount: 2550000, allocatedAmount: 2550000, year: 2025 },
        { type: "emploi", paragraphe: "626", code: "6264", name: "Affranchissement du courrier et autres frais de correspondance", previousAmount: 50000, allocatedAmount: 50000, year: 2025 },
        { type: "emploi", paragraphe: "627", code: "6271", name: "Loyers et charges locatives des locaux (hors logements de personnel)", previousAmount: 30000000, allocatedAmount: 30000000, year: 2025 },
        { type: "emploi", paragraphe: "627", code: "6279", name: "Autres locations", previousAmount: 4500000, allocatedAmount: 4500000, year: 2025 },
        { type: "emploi", paragraphe: "628", code: "6282", name: "Indemnités de mission à l'intérieur", previousAmount: 110000000, allocatedAmount: 599200000, year: 2025 },
        { type: "emploi", paragraphe: "629", code: "6292", name: "Frais de réception, de fêtes et de cérémonies", previousAmount: 0, allocatedAmount: 1000000, year: 2025 },
        { type: "emploi", paragraphe: "629", code: "6294", name: "Fonds spéciaux", previousAmount: 413600000, allocatedAmount: 423600000, year: 2025 },
        { type: "emploi", paragraphe: "669", code: "6690", name: "Autres charges exceptionnelles", previousAmount: 0, allocatedAmount: 2000000, year: 2025 },
        { type: "ressource", paragraphe: "731", code: "731", name: "Transferts reçus du Budget Général", previousAmount: 4136000000, allocatedAmount: 5325200000, year: 2025 }
    ];

    toast({ title: "Importation massive 2025...", description: "Génération de l'annexe budgétaire 2025." });
    try {
        for (const line of data2025) {
            await addBudgetLine(line);
        }
        toast({ title: "Importation 2025 terminée !", description: "Le budget 2025 a été chargé." });
    } catch (err) {
        toast({ variant: "destructive", title: "Erreur lors de l'importation" });
    }
  };

  if (!hasMounted) return null;

  return (
    <PermissionGuard permission="page:budget:view">
        <div className="container mx-auto py-10 px-4 md:px-6">
            <div className="flex flex-col gap-8 pb-20 print:hidden">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                 <ArrowLeftRight className="h-8 w-8 text-primary" /> Annexe Budgétaire
              </h1>
              <p className="text-muted-foreground mt-1">Comparatif des dotations entre N-1 et l'exercice en cours.</p>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handlePrint} variant="outline" className="rounded-xl h-11 border-slate-200 hover:bg-slate-50">
                    <Download className="mr-2 h-4 w-4" /> Exporter PDF
                </Button>
                {budgetLines.filter(l => l.year === 2025 && l.type).length === 0 && (
                    <Button 
                        onClick={handleFullImport2025} 
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11"
                    >
                        <ArrowDownRight className="mr-2 h-4 w-4" /> Importer Annexe 2025
                    </Button>
                )}
                {budgetLines.filter(l => l.year === 2026 && l.type).length === 0 && (
                    <Button 
                        onClick={handleFullImport2026} 
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11"
                    >
                        <ArrowUpRight className="mr-2 h-4 w-4" /> Importer Annexe 2026
                    </Button>
                )}
                {yearFilter !== "all" && (
                    <Button 
                        variant="outline" 
                        onClick={handleSyncPreviousYear} 
                        disabled={isSyncing || loading}
                        className="rounded-xl h-11 border-slate-200 hover:bg-slate-50"
                    >
                        {isSyncing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCcw className="mr-2 h-4 w-4" />
                        )}
                        Synchroniser N-1
                    </Button>
                )}
                <Button onClick={() => setIsAddSheetOpen(true)} className="bg-slate-900 rounded-xl h-11">
                    <PlusCircle className="mr-2 h-4 w-4" /> Nouvelle Ligne
                </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-white/10 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative group transition-all hover:shadow-2xl hover:-translate-y-1">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400 font-black uppercase text-[10px] tracking-widest">TOTAL EMPLOIS</CardDescription>
                <CardTitle className="text-2xl font-black">
                    {loading ? <Skeleton className="h-9 w-48 bg-slate-800" /> : formatCurrency(stats.totalEmplois)}
                </CardTitle>
              </CardHeader>
              <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ArrowUpRight className="h-12 w-12" />
              </div>
            </Card>

            <Card className="border-white/10 shadow-xl bg-emerald-600 text-white overflow-hidden relative group transition-all hover:shadow-2xl hover:-translate-y-1">
              <CardHeader className="pb-2">
                <CardDescription className="text-emerald-100 font-black opacity-80 uppercase text-[10px] tracking-widest">TOTAL RESSOURCES</CardDescription>
                <CardTitle className="text-2xl font-black">
                    {loading ? <Skeleton className="h-9 w-48 bg-emerald-500" /> : formatCurrency(stats.totalRessources)}
                </CardTitle>
              </CardHeader>
              <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ArrowDownRight className="h-12 w-12" />
              </div>
            </Card>

            <Card className={cn(
                "border-white/10 shadow-xl overflow-hidden relative group transition-all hover:shadow-2xl hover:-translate-y-1",
                stats.isBalanced ? "bg-blue-600 text-white" : "bg-orange-500 text-white"
            )}>
              <CardHeader className="pb-2">
                <CardDescription className="text-white font-black opacity-80 uppercase text-[10px] tracking-widest">SOLDE / ÉQUILIBRE</CardDescription>
                <CardTitle className="text-2xl font-black flex items-center gap-2">
                    {loading ? <Skeleton className="h-9 w-48 bg-blue-500" /> : formatCurrency(stats.balance)}
                    {stats.isBalanced && <CheckCircle2 className="h-6 w-6 text-emerald-300" />}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md transition-all hover:shadow-2xl hover:-translate-y-1 group">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">NOMBRE DE LIGNES</CardDescription>
                <CardTitle className="text-2xl font-black text-foreground">
                    {loading ? <Skeleton className="h-8 w-24" /> : filteredLines.length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BarIcon className="h-5 w-5 text-primary" /> Évolution des Dépenses
                </CardTitle>
                <CardDescription className="text-xs font-medium">Montants des emplois par exercice.</CardDescription>
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
                        formatter={(value: number) => [formatCurrency(value), 'Dépenses']}
                    />
                    <Bar dataKey="amount" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-primary" /> Répartition des Emplois
                </CardTitle>
                <CardDescription className="text-xs font-medium">Postes les plus importants de l'année.</CardDescription>
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

          {/* Main Content Card (Table with Tabs) */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="emploi" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <TrendingUp className="h-4 w-4 mr-2" /> EMPLOIS
                    </TabsTrigger>
                    <TabsTrigger value="ressource" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <FileText className="h-4 w-4 mr-2" /> RESSOURCES
                    </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-9 h-10 w-[200px] rounded-xl border-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="w-[120px] h-10 rounded-xl">
                            <SelectValue placeholder="Année" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                                Récapitulatif de l'Annexe {yearFilter === "all" ? "" : yearFilter}
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold">Comptes du Budget Général - Côte d'Ivoire</CardDescription>
                        </div>
                        <div className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-full uppercase tracking-widest">EN F CFA</div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 px-0">
                    <Table>
                        <TableHeader className="bg-slate-50/80">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-20 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Paragraphe</TableHead>
                                <TableHead className="w-20 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Ligne</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Libellé du Poste</TableHead>
                                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Dotation {yearFilter !== "all" ? parseInt(yearFilter) - 1 : "Rappel"}</TableHead>
                                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Dotation {yearFilter}</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-border/40">
                                        <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : paginatedLines.length > 0 ? (
                                paginatedLines.map((line) => (
                                    <TableRow key={line.id} className="hover:bg-primary/5 transition-colors border-border/40 group">
                                        <TableCell className="text-center font-black text-muted-foreground bg-primary/5 tracking-tighter text-xs">{line.paragraphe || '-'}</TableCell>
                                        <TableCell className="text-center font-mono text-[10px] font-bold text-muted-foreground">{line.code || '-'}</TableCell>
                                        <TableCell className="font-bold text-foreground text-sm">{line.name}</TableCell>
                                        <TableCell className="text-right font-mono text-xs text-muted-foreground opacity-70">
                                            {formatCurrency(line.previousAmount || 0)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-primary bg-primary/5">
                                            {formatCurrency(line.allocatedAmount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuLabel className="font-black uppercase text-[10px] tracking-widest opacity-50 text-center">Gestion</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openEditSheet(line)} className="font-bold">
                                                        <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setDeleteTarget(line)} className="text-destructive font-bold">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <Info className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                        <p className="font-bold text-slate-400">Aucune donnée pour cette année ou ce type.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        {filteredLines.length > 0 && !loading && (
                            <tfoot className="bg-slate-900 text-white font-bold">
                                <TableRow>
                                    <TableCell colSpan={3} className="py-4 text-right uppercase text-xs tracking-widest opacity-70">Total {activeTab === 'emploi' ? 'Emplois' : 'Ressources'}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(filteredLines.reduce((acc, l) => acc + (l.previousAmount || 0), 0))}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-emerald-400">
                                        {formatCurrency(filteredLines.reduce((acc, l) => acc + l.allocatedAmount, 0))}
                                    </TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </tfoot>
                        )}
                    </Table>
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
          </Tabs>
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
          onCloseAction={() => setDeleteTarget(null)}
          onConfirmAction={handleDeleteConfirm}
          title={`Supprimer la ligne "${deleteTarget?.name}" ?`}
          description="Cette action est irréversible et supprimera définitivement la ligne budgétaire du système."
        />
      </div>

       {/* Hidden Print Template */}
        <div className="hidden print:block absolute inset-0 z-[9999] bg-white">
           <BudgetPrintTemplate 
             budgetLines={safeBudgetLines.filter(l => yearFilter === "all" || l.year.toString() === yearFilter)}
             year={yearFilter === "all" ? new Date().getFullYear().toString() : yearFilter}
           />
       </div>
    </PermissionGuard>
  );
}
