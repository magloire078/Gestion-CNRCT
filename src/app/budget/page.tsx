"use client";

import { useState, useMemo, useEffect } from "react";
import { 
    PlusCircle, Search, MoreHorizontal, 
    Pencil, Trash2, PieChart as PieIcon, 
    BarChart as BarIcon, TrendingUp, 
    DollarSign, Calendar as CalendarIcon,
    Filter, Download, ArrowUpRight,
    ArrowDownRight, Wallet, Info,
    ArrowLeftRight, FileText, CheckCircle2,
    Activity, BarChart3
} from "lucide-react";
import { 
    AreaChart, Area, XAxis, YAxis, 
    CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
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
  TableFooter,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";

const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];
const CHART_COLORS_CLASSES = [
    'bg-slate-900',
    'bg-slate-700',
    'bg-slate-600',
    'bg-slate-500',
    'bg-slate-400',
    'bg-slate-300'
];

const TOOLTIP_STYLES = {
    contentStyle: {
        backgroundColor: '#020617',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        fontSize: '10px',
        color: '#fff',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    itemStyle: {
        fontWeight: '900'
    }
};

const CHART_CONFIG = {
    tick: { fill: '#475569', fontSize: 9, fontWeight: '900' },
    grid: { stroke: '#ffffff05', strokeDasharray: "3 3" },
    axis: { stroke: '#ffffff20' },
    colors: {
        current: '#10b981',
        previous: '#6366f1'
    }
};

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
  const [isPrinting, setIsPrinting] = useState(false);
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
    setIsPrinting(true);
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

  const analyticsData = useMemo(() => {
    const currentLines = filteredLines.slice(0, 8);
    const data = currentLines.map(line => ({
        name: line.name.length > 15 ? line.name.substring(0, 15) + '...' : line.name,
        current: line.allocatedAmount,
        previous: line.previousAmount || 0,
    }));
    
    const totalCurrent = filteredLines.reduce((acc, l) => acc + l.allocatedAmount, 0);
    return { data, totalCurrent };
  }, [filteredLines]);

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
        <div className="min-h-screen bg-slate-50/50">
            {/* Dark Immersive Header */}
            <div className="bg-slate-950 text-white pt-16 pb-32 px-4 md:px-10 relative overflow-hidden print:hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-primary to-indigo-600" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />

                <div className="container mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left-4">
                                <Wallet className="h-3 w-3" />
                                Finances & Budget
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tight italic uppercase leading-none">
                                Annexe <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-primary">Budgétaire</span>
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl italic">
                                Pilotage financier et comparatif des dotations institutionnelles. Harmonisation des ressources et emplois pour l'exercice {yearFilter}.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button onClick={handlePrint} variant="outline" className="h-12 px-6 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all font-black uppercase text-[10px] tracking-widest backdrop-blur-xl">
                                <Download className="mr-2 h-4 w-4 text-emerald-400" /> Exporter PDF
                            </Button>
                            
                            {yearFilter !== "all" && (
                                <Button 
                                    variant="outline" 
                                    onClick={handleSyncPreviousYear} 
                                    disabled={isSyncing || loading}
                                    className="h-12 px-6 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all font-black uppercase text-[10px] tracking-widest backdrop-blur-xl"
                                >
                                    {isSyncing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                                    ) : (
                                        <RefreshCcw className="mr-2 h-4 w-4 text-primary" />
                                    )}
                                    Synchro N-1
                                </Button>
                            )}
                            
                            <Button onClick={() => setIsAddSheetOpen(true)} className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95 font-black uppercase text-[10px] tracking-widest">
                                <PlusCircle className="mr-2 h-4 w-4" /> Nouvelle Ligne
                            </Button>
                        </div>
                    </div>
                    
                    {/* Special Import Actions */}
                    <div className="mt-8 flex flex-wrap gap-2">
                        {budgetLines.filter(l => l.year === 2025 && l.type).length === 0 && (
                            <button 
                                onClick={handleFullImport2025} 
                                className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-colors"
                            >
                                <ArrowDownRight className="inline mr-1 h-3 w-3" /> Importer Annexe 2025
                            </button>
                        )}
                        {budgetLines.filter(l => l.year === 2026 && l.type).length === 0 && (
                            <button 
                                onClick={handleFullImport2026} 
                                className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-colors"
                            >
                                <ArrowUpRight className="inline mr-1 h-3 w-3" /> Importer Annexe 2026
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-10 -mt-20 relative z-20 pb-20">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-slate-900 text-white overflow-hidden relative group transition-all hover:shadow-2xl hover:-translate-y-2 rounded-[2rem]">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full transition-all group-hover:scale-110" />
                        <CardHeader className="relative z-10 pb-2 p-8">
                            <CardDescription className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Total Emplois</CardDescription>
                            <CardTitle className="text-3xl font-black tracking-tighter">
                                {loading ? <Skeleton className="h-9 w-40 bg-slate-800" /> : formatCurrency(stats.totalEmplois)}
                            </CardTitle>
                        </CardHeader>
                        <div className="absolute bottom-4 right-8 p-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-xl opacity-20 group-hover:opacity-100 transition-all group-hover:scale-110">
                            <ArrowUpRight className="h-5 w-5 text-rose-500" />
                        </div>
                    </Card>

                    <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-emerald-600 text-white overflow-hidden relative group transition-all hover:shadow-2xl hover:-translate-y-2 rounded-[2rem]">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-700" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full transition-all group-hover:scale-110" />
                        <CardHeader className="relative z-10 pb-2 p-8">
                            <CardDescription className="text-emerald-100/60 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Total Ressources</CardDescription>
                            <CardTitle className="text-3xl font-black tracking-tighter">
                                {loading ? <Skeleton className="h-9 w-40 bg-emerald-500" /> : formatCurrency(stats.totalRessources)}
                            </CardTitle>
                        </CardHeader>
                        <div className="absolute bottom-4 right-8 p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xl opacity-40 group-hover:opacity-100 transition-all group-hover:scale-110">
                            <ArrowDownRight className="h-5 w-5 text-white" />
                        </div>
                    </Card>

                    <Card className={cn(
                        "border-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden relative group transition-all hover:shadow-2xl hover:-translate-y-2 rounded-[2rem]",
                        stats.isBalanced ? "bg-indigo-600 text-white" : "bg-amber-500 text-white"
                    )}>
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                        <CardHeader className="relative z-10 pb-2 p-8">
                            <CardDescription className="text-white/60 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Solde / Équilibre</CardDescription>
                            <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-3">
                                {loading ? <Skeleton className="h-9 w-40 bg-white/10" /> : formatCurrency(stats.balance)}
                                {stats.isBalanced && <CheckCircle2 className="h-7 w-7 text-emerald-300 animate-pulse" />}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white/80 backdrop-blur-2xl transition-all hover:shadow-2xl hover:-translate-y-2 group rounded-[2rem] border border-white">
                        <CardHeader className="pb-2 p-8">
                            <CardDescription className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Dotations</CardDescription>
                            <CardTitle className="text-4xl font-black text-slate-950 tracking-tighter">
                                {loading ? <Skeleton className="h-10 w-20" /> : filteredLines.length}
                            </CardTitle>
                        </CardHeader>
                        <div className="absolute bottom-6 right-8 text-slate-100 font-black text-6xl italic -rotate-12 select-none group-hover:text-primary/5 transition-colors">
                            {yearFilter === "all" ? "ALL" : yearFilter}
                        </div>
                    </Card>
                </div>

                    {/* Intelligence Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        <Card className="lg:col-span-2 border-0 shadow-2xl bg-slate-950 overflow-hidden rounded-[2.5rem] relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10 opacity-50 group-hover:opacity-80 transition-opacity" />
                            <CardHeader className="relative z-10 p-8 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Analyse Comparative</CardTitle>
                                        <CardDescription className="text-white text-lg font-black tracking-tighter">Évolution des Dotations par Poste</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                                        <Activity className="h-4 w-4 text-emerald-400" />
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Temps Réel</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10 p-8 h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analyticsData.data}>
                                        <defs>
                                            <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_CONFIG.colors.current} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={CHART_CONFIG.colors.current} stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_CONFIG.colors.previous} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={CHART_CONFIG.colors.previous} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid {...CHART_CONFIG.grid} vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke={CHART_CONFIG.axis.stroke}
                                            fontSize={CHART_CONFIG.tick.fontSize} 
                                            fontWeight={CHART_CONFIG.tick.fontWeight}
                                            tick={CHART_CONFIG.tick}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            stroke={CHART_CONFIG.axis.stroke}
                                            fontSize={CHART_CONFIG.tick.fontSize} 
                                            fontWeight={CHART_CONFIG.tick.fontWeight}
                                            tick={CHART_CONFIG.tick}
                                            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <RechartsTooltip 
                                            contentStyle={TOOLTIP_STYLES.contentStyle}
                                            itemStyle={TOOLTIP_STYLES.itemStyle}
                                        />
                                        <Area type="monotone" dataKey="current" stroke={CHART_CONFIG.colors.current} fillOpacity={1} fill="url(#colorCurrent)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="previous" stroke={CHART_CONFIG.colors.previous} fillOpacity={1} fill="url(#colorPrevious)" strokeWidth={3} strokeDasharray="5 5" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-2xl bg-white overflow-hidden rounded-[2.5rem] border border-slate-100 flex flex-col">
                            <CardHeader className="p-8 border-b border-slate-50">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Répartition Stratégique</CardTitle>
                                <CardDescription className="text-slate-900 text-lg font-black tracking-tighter">Poids des Postes Actuels</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 flex-1 flex flex-col justify-center min-h-[300px]">
                                <div className="h-[200px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analyticsData.data}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={8}
                                                dataKey="current"
                                            >
                                                {analyticsData.data.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                contentStyle={TOOLTIP_STYLES.contentStyle}
                                                itemStyle={TOOLTIP_STYLES.itemStyle}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
                                        <span className="text-xl font-black text-slate-900 tracking-tighter">{(analyticsData.totalCurrent / 1000000).toFixed(1)}M</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-6">
                                    {analyticsData.data.slice(0, 4).map((entry, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                            <div 
                                                className={cn(
                                                    "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]",
                                                    CHART_COLORS_CLASSES[index % CHART_COLORS_CLASSES.length]
                                                )} 
                                            />
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter truncate w-full">{entry.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

          {/* Main Content Card (Table with Tabs) */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <TabsList className="h-14 bg-white shadow-xl shadow-slate-200/50 p-2 rounded-2xl border border-slate-100 shrink-0">
                            <TabsTrigger value="emploi" className="h-full px-8 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-950 data-[state=active]:text-white transition-all">
                                <TrendingUp className="h-4 w-4 mr-2" /> Dotations Emplois
                            </TabsTrigger>
                            <TabsTrigger value="ressource" className="h-full px-8 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-950 data-[state=active]:text-white transition-all">
                                <FileText className="h-4 w-4 mr-2" /> Dotations Ressources
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Rechercher une ligne..."
                                    className="pl-11 h-14 w-[300px] rounded-2xl border-0 bg-white shadow-xl shadow-slate-200/50 focus:ring-4 focus:ring-primary/5 font-bold transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={yearFilter} onValueChange={setYearFilter}>
                                <SelectTrigger className="w-[160px] h-14 rounded-2xl border-0 bg-white shadow-xl shadow-slate-200/50 font-black uppercase text-[10px] tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-primary" />
                                        <SelectValue placeholder="Année" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                                    <SelectItem value="all" className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3">Toutes les années</SelectItem>
                                    {years.map(y => (
                                        <SelectItem key={y} value={y} className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3">Exercice {y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Card className="border-0 shadow-[0_30px_60px_rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-2xl overflow-hidden rounded-[2.5rem] border border-white">
                        <CardHeader className="bg-slate-950 text-white p-8 border-b-0 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-500 opacity-50" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <CardTitle className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">
                                            Registre Budgétaire {yearFilter === "all" ? "Global" : yearFilter}
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-slate-500 font-bold italic">
                                        Détails des postes de l'annexe du budget général
                                    </CardDescription>
                                </div>
                                <div className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                    Devise: Franc CFA (XOF)
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/50">
                                        <TableHead className="w-28 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Paragraphe</TableHead>
                                        <TableHead className="w-28 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ligne</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Libellé du Poste</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dotation {yearFilter !== "all" ? parseInt(yearFilter) - 1 : "Antérieure"}</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dotation {yearFilter}</TableHead>
                                        <TableHead className="w-20"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i} className="border-slate-50">
                                                <TableCell><Skeleton className="h-6 w-16 mx-auto rounded-lg" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-16 mx-auto rounded-lg" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-72 rounded-lg" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-32 ml-auto rounded-lg" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-32 ml-auto rounded-lg" /></TableCell>
                                                <TableCell><Skeleton className="h-10 w-10 ml-auto rounded-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : paginatedLines.length > 0 ? (
                                        paginatedLines.map((line) => (
                                            <TableRow key={line.id} className="hover:bg-slate-50/80 transition-all border-slate-50 group">
                                                <TableCell className="text-center">
                                                    <span className="px-3 py-1 bg-slate-100 rounded-lg font-black text-slate-500 text-[10px] tracking-tighter">
                                                        {line.paragraphe || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-mono text-[10px] font-bold text-slate-400">
                                                        {line.code || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col py-2">
                                                        <span className="font-black text-slate-900 text-sm tracking-tight leading-tight mb-1">{line.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Annexe {line.year}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs text-slate-400 italic">
                                                    {formatCurrency(line.previousAmount || 0)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="inline-flex flex-col items-end">
                                                        <span className="font-black text-slate-950 text-base tracking-tighter">
                                                            {formatCurrency(line.allocatedAmount)}
                                                        </span>
                                                        {line.previousAmount && line.previousAmount > 0 && (
                                                            <span className={cn(
                                                                "text-[9px] font-black px-1.5 py-0.5 rounded-md",
                                                                line.allocatedAmount > line.previousAmount ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                                                            )}>
                                                                {line.allocatedAmount > line.previousAmount ? "+" : ""}
                                                                {Math.round(((line.allocatedAmount - line.previousAmount) / line.previousAmount) * 100)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-slate-100 hover:text-primary transition-all">
                                                                <MoreHorizontal className="h-5 w-5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-100 shadow-2xl p-2">
                                                            <DropdownMenuLabel className="font-black uppercase text-[10px] tracking-[0.3em] opacity-30 text-center py-3">Actions Pilotage</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => openEditSheet(line)} className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3 cursor-pointer">
                                                                <Pencil className="mr-3 h-4 w-4 text-primary" /> Éditer la Dotation
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setDeleteTarget(line)} className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                                                                <Trash2 className="mr-3 h-4 w-4" /> Supprimer la Ligne
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-32">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100">
                                                        <Info className="h-8 w-8 text-slate-200" />
                                                    </div>
                                                    <p className="font-black uppercase text-xs tracking-[0.3em] text-slate-300">Aucun enregistrement trouvé</p>
                                                    <p className="text-slate-400 text-sm mt-2 font-medium italic">Ajustez vos filtres ou lancez une importation</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                        </TableBody>
                                    {filteredLines.length > 0 && !loading && (
                                        <TableFooter className="bg-transparent border-0">
                                            <TableRow className="bg-slate-950 text-white font-black hover:bg-slate-900 border-0">
                                                <TableCell colSpan={3} className="py-8 text-right uppercase text-[10px] tracking-[0.4em] text-slate-500">Total {activeTab === 'emploi' ? 'Emplois' : 'Ressources'}</TableCell>
                                                <TableCell className="text-right font-mono text-slate-500 text-sm">
                                                    {formatCurrency(filteredLines.reduce((acc, l) => acc + (l.previousAmount || 0), 0))}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-emerald-400 text-xl tracking-tighter">
                                                    {formatCurrency(filteredLines.reduce((acc, l) => acc + l.allocatedAmount, 0))}
                                                </TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    )}
                    </Table>
                </CardContent>
                                {totalPages > 1 && (
                                    <div className="bg-slate-50/50 border-t border-slate-100 px-10 py-6">
                                        <PaginationControls
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={setCurrentPage}
                                            itemsPerPage={itemsPerPage}
                                            onItemsPerPageChange={setItemsPerPage}
                                            totalItems={filteredLines.length}
                                        />
                                    </div>
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

       <BudgetPrintTemplate 
         budgetLines={safeBudgetLines.filter(l => yearFilter === "all" || l.year.toString() === yearFilter)}
         year={yearFilter === "all" ? new Date().getFullYear().toString() : yearFilter}
         isPrinting={isPrinting}
         onAfterPrint={() => setIsPrinting(false)}
       />
    </PermissionGuard>
  );
}
