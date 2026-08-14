"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getConflicts } from "@/services/conflict-service";
import type { Conflict, ConflictType } from "@/lib/data";
import { conflictTypes, conflictStatuses } from "@/lib/data";
import { 
  Loader2, 
  Printer, 
  FileText, 
  Search, 
  Download, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  TrendingUp, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from "@/hooks/use-auth";
import { ConflictsOfficialReport } from "@/components/reports/conflicts-official-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface ReportData {
  conflicts: Conflict[];
}

export default function ConflictReportPage() {
  const { settings } = useAuth();
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [statusFilter, setStatusFilter] = useState<"all" | Conflict['status']>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ConflictType>("all");
  
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isPending, startTransition] = useTransition();

  // Interactive Table States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { value: "all", label: "Toute l'année" },
    ...Array.from({ length: 12 }, (_, i) => ({ 
        value: (i + 1).toString(), 
        label: format(new Date(2000, i, 1), 'MMMM', { locale: fr }) 
    }))
  ];
  
  const selectedPeriodText = month === "all" 
    ? `Année ${year}` 
    : `${months.find(m => m.value === month)?.label || ''} ${year}`;

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    setSearchQuery("");
    setExpandedRows({});

    const selectedYear = parseInt(year);

    try {
      const allConflicts = await getConflicts();

      let periodStart: Date;
      let periodEnd: Date;

      if (month === "all") {
        periodStart = new Date(selectedYear, 0, 1);
        periodEnd = new Date(selectedYear, 11, 31, 23, 59, 59);
      } else {
        const selectedMonth = parseInt(month) - 1;
        periodStart = startOfMonth(new Date(selectedYear, selectedMonth));
        periodEnd = endOfMonth(new Date(selectedYear, selectedMonth));
      }

      const filteredConflicts = allConflicts.filter(c => {
        try {
            const conflictDate = parseISO(c.reportedDate);
            const isInPeriod = conflictDate >= periodStart && conflictDate <= periodEnd;
            const matchesStatus = statusFilter === "all" || c.status === statusFilter;
            const matchesType = typeFilter === "all" || c.type === typeFilter;
            return isInPeriod && matchesStatus && matchesType;
        } catch (e) {
            console.error("Invalid date format for conflict:", c);
            return false;
        }
      });
      
      startTransition(() => {
        setReportData({
          conflicts: filteredConflicts,
        });
      });

    } catch (err) {
      console.error(err);
      setError("Impossible de générer le rapport. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Main Statistics calculation
  const stats = useMemo(() => {
    if (!reportData) return null;
    
    const conflicts = reportData.conflicts;
    const total = conflicts.length;
    const resolved = conflicts.filter(c => c.status === 'Résolu').length;
    const mediation = conflicts.filter(c => c.status === 'En médiation').length;
    const open = conflicts.filter(c => c.status === 'Ouvert').length;
    
    const conflictsWithRisk = conflicts.filter(c => typeof c.riskScore === 'number');
    const avgRisk = conflictsWithRisk.length > 0
        ? parseFloat((conflictsWithRisk.reduce((sum, c) => sum + (c.riskScore || 0), 0) / conflictsWithRisk.length).toFixed(1))
        : 0;

    const typeCounts = conflicts.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    let topType = "Aucun";
    let maxCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
        if (count > maxCount) {
            maxCount = count;
            topType = type;
        }
    });

    return {
        total,
        resolved,
        mediation,
        open,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        topType,
        avgRisk
    };
  }, [reportData]);

  // Recharts Trend Data calculation
  const trendData = useMemo(() => {
    if (!reportData) return [];
    const conflicts = reportData.conflicts;

    if (month === "all") {
      const monthsData = Array.from({ length: 12 }, (_, i) => {
        const monthLabel = format(new Date(2000, i, 1), 'MMM', { locale: fr });
        return {
          name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          conflits: 0
        };
      });

      conflicts.forEach(c => {
        try {
          const date = parseISO(c.reportedDate);
          const m = date.getMonth();
          if (m >= 0 && m < 12) {
            monthsData[m].conflits += 1;
          }
        } catch (e) {
          console.error(e);
        }
      });
      return monthsData;
    } else {
      const selectedYear = parseInt(year);
      const selectedMonth = parseInt(month) - 1;
      const end = endOfMonth(new Date(selectedYear, selectedMonth));
      const numDays = end.getDate();

      const daysData = Array.from({ length: numDays }, (_, i) => ({
        name: `${i + 1}`,
        conflits: 0
      }));

      conflicts.forEach(c => {
        try {
          const date = parseISO(c.reportedDate);
          const d = date.getDate();
          if (d >= 1 && d <= numDays) {
            daysData[d - 1].conflits += 1;
          }
        } catch (e) {
          console.error(e);
        }
      });
      return daysData;
    }
  }, [reportData, month, year]);

  // Recharts Type Data calculation
  const typeData = useMemo(() => {
    if (!reportData) return [];
    const conflicts = reportData.conflicts;
    const counts: Record<string, number> = {};
    conflicts.forEach(c => {
      counts[c.type] = (counts[c.type] || 0) + 1;
    });

    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
      "hsl(var(--muted-foreground))"
    ];

    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      fill: colors[index % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [reportData]);

  // Recharts Status Data calculation
  const statusData = useMemo(() => {
    if (!reportData) return [];
    const conflicts = reportData.conflicts;
    const counts: Record<string, number> = {};
    conflicts.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });

    const statusColors: Record<string, string> = {
      "Résolu": "#10b981",       
      "En médiation": "#3b82f6",  
      "Ouvert": "#ef4444",        
      "Classé sans suite": "#64748b", 
      "Escaladé à la justice": "#8b5cf6", 
      "En appel": "#f59e0b",      
    };

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: statusColors[name] || "#94a3b8"
    }));
  }, [reportData]);

  // Filtered and Sorted list for the interactive data table
  const filteredAndSortedConflicts = useMemo(() => {
    if (!reportData) return [];
    
    let result = [...reportData.conflicts];
    
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.village.toLowerCase().includes(q) ||
        (c.region || "").toLowerCase().includes(q) ||
        (c.district || "").toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.parties || "").toLowerCase().includes(q) ||
        (c.trackingId || "").toLowerCase().includes(q)
      );
    }
    
    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return b.reportedDate.localeCompare(a.reportedDate);
      }
      if (sortBy === "date-asc") {
        return a.reportedDate.localeCompare(b.reportedDate);
      }
      if (sortBy === "risk-desc") {
        return (b.riskScore || 0) - (a.riskScore || 0);
      }
      if (sortBy === "risk-asc") {
        return (a.riskScore || 0) - (b.riskScore || 0);
      }
      if (sortBy === "location") {
        return a.village.localeCompare(b.village);
      }
      return 0;
    });
    
    return result;
  }, [reportData, searchQuery, sortBy]);

  const handlePrint = () => {
    if (reportData && settings) {
      setIsPrinting(true);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const exportToCSV = () => {
    if (!reportData || reportData.conflicts.length === 0) return;
    
    const headers = ["ID de Suivi", "Date Signalement", "Village/Ville", "Région", "District", "Type de Conflit", "Parties", "Description", "Score de Risque", "Statut", "Médiateur", "Date Résolution"];
    const rows = reportData.conflicts.map(c => [
      c.trackingId || c.id,
      c.reportedDate,
      c.village,
      c.region || "",
      c.district || "",
      c.type,
      c.parties || "",
      c.description.replace(/\n/g, " "),
      c.riskScore?.toString() || "",
      c.status,
      c.mediatorName || "",
      c.resolutionDate || ""
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(";"))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_conflits_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusVariantMap: Record<string, string> = {
    "Ouvert": "bg-rose-50 text-rose-700 border-rose-200",
    "En médiation": "bg-blue-50 text-blue-700 border-blue-200",
    "Résolu": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Classé sans suite": "bg-slate-50 text-slate-700 border-slate-200",
    "Escaladé à la justice": "bg-purple-50 text-purple-700 border-purple-200",
    "En appel": "bg-amber-50 text-amber-700 border-amber-200",
  };

  const renderRiskScoreMeter = (score?: number) => {
    if (score === undefined || score === null) return <span className="text-slate-400 italic text-[11px]">N/A</span>;
    
    let colorClass = "bg-emerald-500";
    let textClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 7) {
      colorClass = "bg-rose-500";
      textClass = "text-rose-700 bg-rose-50 border-rose-200";
    } else if (score >= 4) {
      colorClass = "bg-amber-500";
      textClass = "text-amber-700 bg-amber-50 border-amber-200";
    }
    
    return (
      <div className="flex flex-col gap-1 w-24">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className={cn("px-1.5 py-0.5 rounded text-[9px] border font-black", textClass)}>Risque: {score}/10</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-500", colorClass)} style={{ width: `${score * 10}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`flex flex-col gap-6 ${isPrinting ? 'print-hidden' : ''} pb-12`}>
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 bg-clip-text text-transparent">
              Rapports & Analyses des Conflits
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Générez, analysez et visualisez l'état d'évolution des dossiers de médiation territoriale.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {reportData && (
              <>
                <Button variant="outline" size="sm" onClick={exportToCSV} className="h-9 font-semibold text-slate-700 border-slate-200 hover:bg-slate-50">
                  <Download className="mr-2 h-4 w-4" />
                  Exporter CSV
                </Button>
                <Button variant="default" size="sm" onClick={handlePrint} className="h-9 font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimer Rapport
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Generator Controls */}
        <Card className="shadow-md border-slate-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" />
          <CardHeader className="bg-slate-50/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <Layers className="h-5 w-5 text-rose-600 animate-pulse" />
              Générateur de Période
            </CardTitle>
            <CardDescription>
              Sélectionnez les critères temporels et thématiques pour extraire les données.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-xl bg-slate-50/20">
                <div className="grid gap-2">
                  <Label htmlFor="year" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Année</Label>
                  <Select value={year} onValueChange={(val) => startTransition(() => setYear(val))}>
                    <SelectTrigger id="year" className="bg-white border-slate-200 rounded-lg h-10 shadow-sm focus:ring-rose-500 focus:border-rose-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="month" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Période Mensuelle</Label>
                  <Select value={month} onValueChange={(val) => startTransition(() => setMonth(val))}>
                    <SelectTrigger id="month" className="bg-white border-slate-200 rounded-lg h-10 shadow-sm focus:ring-rose-500 focus:border-rose-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="typeFilter" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type de Conflit</Label>
                  <Select value={typeFilter} onValueChange={(val: any) => startTransition(() => setTypeFilter(val))}>
                    <SelectTrigger id="typeFilter" className="bg-white border-slate-200 rounded-lg h-10 shadow-sm focus:ring-rose-500 focus:border-rose-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {conflictTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="statusFilter" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut de la Procédure</Label>
                  <Select value={statusFilter} onValueChange={(val: any) => startTransition(() => setStatusFilter(val))}>
                    <SelectTrigger id="statusFilter" className="bg-white border-slate-200 rounded-lg h-10 shadow-sm focus:ring-rose-500 focus:border-rose-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      {conflictStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end border-t pt-4">
                <Button onClick={generateReport} disabled={loading} className="w-full sm:w-auto px-6 h-10 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-md">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extraction en cours...
                    </>
                  ) : (
                    <>
                      <Activity className="mr-2 h-4 w-4 text-emerald-400" />
                      Générer les analyses
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Erreur d'extraction</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {reportData && stats && (
          <>
            {/* KPI Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="relative overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-5 flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Conflits</span>
                    <div className="p-2 rounded-full bg-slate-100 text-slate-600">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-black text-slate-800 tracking-tight">{stats.total}</span>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">enregistrés sur la période</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-5 flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Taux Résolution</span>
                    <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-black text-emerald-600 tracking-tight">{stats.resolutionRate}%</span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{stats.resolved} résolus</span>
                    </div>
                    <Progress value={stats.resolutionRate} className="h-1.5 mt-2 bg-slate-100 [&>div]:bg-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-5 flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">En Médiation</span>
                    <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-black text-blue-600 tracking-tight">{stats.mediation}</span>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">dossiers en cours d'arbitrage</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-5 flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dossiers Ouverts</span>
                    <div className="p-2 rounded-full bg-rose-50 text-rose-600">
                      <AlertTriangle className="h-4 w-4 animate-bounce" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-black text-rose-600 tracking-tight">{stats.open}</span>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">plaintes ouvertes en attente</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-5 flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gravité Moyenne</span>
                    <div className="p-2 rounded-full bg-amber-50 text-amber-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-black text-slate-800 tracking-tight">{stats.avgRisk}<span className="text-xs text-slate-400">/10</span></span>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase px-1.5 py-0.5",
                        stats.avgRisk >= 7 ? "text-rose-700 bg-rose-50 border-rose-100" :
                        stats.avgRisk >= 4 ? "text-amber-700 bg-amber-50 border-amber-100" :
                        "text-emerald-700 bg-emerald-50 border-emerald-100"
                      )}>
                        {stats.avgRisk >= 7 ? "Critique" : stats.avgRisk >= 4 ? "Modéré" : "Faible"}
                      </Badge>
                    </div>
                    <Progress value={stats.avgRisk * 10} className={cn(
                      "h-1.5 mt-2 bg-slate-100",
                      stats.avgRisk >= 7 ? "[&>div]:bg-rose-500" :
                      stats.avgRisk >= 4 ? "[&>div]:bg-amber-500" :
                      "[&>div]:bg-emerald-500"
                    )} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend Curve (2 cols wide) */}
              <Card className="lg:col-span-2 shadow-md border-slate-100 overflow-hidden">
                <CardHeader className="bg-slate-50/30">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-rose-600" />
                    Courbe d'Evolution et Intensité Temporelle
                  </CardTitle>
                  <CardDescription>
                    Nombre de conflits déclarés au fil de la période : {selectedPeriodText}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {trendData.length > 0 ? (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.1)" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                            allowDecimals={false}
                          />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                              border: '1px solid #e2e8f0', 
                              borderRadius: '8px', 
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                              fontSize: '11px'
                            }} 
                            labelFormatter={(label) => month === "all" ? `Mois : ${label}` : `Jour : ${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="conflits" 
                            stroke="hsl(var(--chart-1))" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#trendGrad)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-[300px] items-center justify-center border border-dashed rounded-lg">
                      <p className="text-slate-400 text-sm">Données insuffisantes pour tracer la courbe.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Categorization charts (1 col wide with Tabs) */}
              <Card className="shadow-md border-slate-100 overflow-hidden flex flex-col justify-between">
                <CardHeader className="bg-slate-50/30 pb-2">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-blue-600" />
                    Répartition Thématique & Statuts
                  </CardTitle>
                  <CardDescription>
                    Visualisation comparative des catégories de dossiers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  <Tabs defaultValue="types" className="w-full h-full flex flex-col justify-between">
                    <TabsList className="grid grid-cols-2 w-full mb-4 bg-slate-100/80 p-0.5 rounded-lg">
                      <TabsTrigger value="types" className="text-xs font-bold rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Par Nature</TabsTrigger>
                      <TabsTrigger value="status" className="text-xs font-bold rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Par Statut</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="types" className="flex-1 focus-visible:outline-none">
                      {typeData.length > 0 ? (
                        <div className="h-[230px] w-full flex flex-col justify-center">
                          <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                              <Pie
                                data={typeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {typeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                  borderRadius: '6px', 
                                  border: '1px solid #e2e8f0', 
                                  fontSize: '11px' 
                                }} 
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 max-h-[70px] overflow-y-auto px-1">
                            {typeData.map((entry, index) => (
                              <div key={entry.name} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                                <span className="text-[10px] font-medium text-slate-600">{entry.name} ({entry.value})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-[230px] items-center justify-center text-slate-400 text-sm">
                          Aucun type de conflit disponible.
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="status" className="flex-1 focus-visible:outline-none">
                      {statusData.length > 0 ? (
                        <div className="h-[230px] w-full flex flex-col justify-center">
                          <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={statusData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.1)" />
                              <XAxis 
                                dataKey="name" 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }} 
                              />
                              <YAxis 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} 
                                allowDecimals={false}
                              />
                              <RechartsTooltip 
                                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                contentStyle={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                  borderRadius: '6px', 
                                  border: '1px solid #e2e8f0', 
                                  fontSize: '11px' 
                                }} 
                              />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={28}>
                                {statusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex h-[230px] items-center justify-center text-slate-400 text-sm">
                          Aucun statut disponible.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Interactive Data Table Card */}
            <Card className="shadow-md border-slate-100 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
                      Tableau Interactif du Rapport ({filteredAndSortedConflicts.length} dossiers)
                    </CardTitle>
                    <CardDescription>
                      Consultez la disposition ordonnée des données, effectuez des tris ou développez les lignes pour le détail complet.
                    </CardDescription>
                  </div>
                </div>

                {/* Table Filters & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
                  <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <Input 
                      placeholder="Rechercher par village, région, type, parties prenantes..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10 border-slate-200 rounded-lg shadow-sm focus-visible:ring-rose-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider text-nowrap">Trier par :</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full md:w-[220px] bg-white border-slate-200 rounded-lg shadow-sm h-10">
                        <SelectValue placeholder="Trier par" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">Date (Récent → Ancien)</SelectItem>
                        <SelectItem value="date-asc">Date (Ancien → Récent)</SelectItem>
                        <SelectItem value="risk-desc">Gravité (Élevée → Faible)</SelectItem>
                        <SelectItem value="risk-asc">Gravité (Faible → Élevée)</SelectItem>
                        <SelectItem value="location">Localisation (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/70">
                      <TableRow>
                        <TableHead className="w-[50px] text-center font-bold text-slate-500">Détails</TableHead>
                        <TableHead className="w-[120px] font-bold text-slate-500">ID de suivi</TableHead>
                        <TableHead className="w-[180px] font-bold text-slate-500">Lieu / Territoire</TableHead>
                        <TableHead className="w-[130px] font-bold text-slate-500">Date Sig.</TableHead>
                        <TableHead className="w-[150px] font-bold text-slate-500">Type de litige</TableHead>
                        <TableHead className="font-bold text-slate-500">Parties concernées</TableHead>
                        <TableHead className="w-[120px] font-bold text-slate-500">Gravité</TableHead>
                        <TableHead className="w-[130px] font-bold text-slate-500 text-center">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedConflicts.length > 0 ? (
                        filteredAndSortedConflicts.map((conflict) => {
                          const isExpanded = !!expandedRows[conflict.id];
                          return (
                            <>
                              <TableRow 
                                key={conflict.id}
                                className={cn(
                                  "hover:bg-slate-50/50 transition-colors border-b border-slate-100 cursor-pointer align-middle",
                                  isExpanded && "bg-rose-50/10 hover:bg-rose-50/10 border-b-0"
                                )}
                                onClick={() => toggleRow(conflict.id)}
                              >
                                <TableCell className="text-center p-3">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRow(conflict.id);
                                    }}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4.5 w-4.5 text-rose-600" />
                                    ) : (
                                      <ChevronDown className="h-4.5 w-4.5" />
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell className="p-3 font-mono font-bold text-xs text-slate-500">
                                  {conflict.trackingId || conflict.id.substring(0, 8).toUpperCase()}
                                </TableCell>
                                <TableCell className="p-3">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                      <div className="font-bold text-slate-800 text-sm">{conflict.village}</div>
                                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                                        {conflict.district || "-"} • {conflict.region || "-"}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="p-3 font-medium text-slate-600 text-xs">
                                  {isValid(parseISO(conflict.reportedDate)) 
                                    ? format(parseISO(conflict.reportedDate), 'dd MMM yyyy', { locale: fr })
                                    : conflict.reportedDate
                                  }
                                </TableCell>
                                <TableCell className="p-3 font-semibold text-slate-700 text-sm">
                                  {conflict.type}
                                </TableCell>
                                <TableCell className="p-3 max-w-[200px]">
                                  <div className="font-bold text-slate-700 truncate text-xs">
                                    {conflict.parties || "Non documenté"}
                                  </div>
                                  <div className="text-[10px] text-slate-400 italic truncate mt-0.5">
                                    {conflict.description}
                                  </div>
                                </TableCell>
                                <TableCell className="p-3">
                                  {renderRiskScoreMeter(conflict.riskScore)}
                                </TableCell>
                                <TableCell className="p-3 text-center">
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm",
                                      statusVariantMap[conflict.status] || "bg-slate-100 text-slate-700"
                                    )}
                                  >
                                    {conflict.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>

                              {/* Expandable details container */}
                              {isExpanded && (
                                <TableRow className="bg-slate-50/30 border-b border-slate-100">
                                  <TableCell colSpan={8} className="p-4 bg-slate-50/20 border-t border-slate-100">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm px-4">
                                      <div className="space-y-2">
                                        <h4 className="font-bold text-slate-700 uppercase text-xs tracking-wider flex items-center gap-1.5">
                                          <FileText className="h-4 w-4 text-slate-400" />
                                          Description Complète
                                        </h4>
                                        <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-200 text-xs leading-relaxed max-h-[200px] overflow-y-auto shadow-sm">
                                          {conflict.description || "Aucune description fournie."}
                                        </p>
                                      </div>
                                      <div className="space-y-2">
                                        <h4 className="font-bold text-slate-700 uppercase text-xs tracking-wider flex items-center gap-1.5">
                                          <ShieldAlert className="h-4 w-4 text-slate-400" />
                                          Impact & Conséquences
                                        </h4>
                                        <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-200 text-xs leading-relaxed max-h-[200px] overflow-y-auto shadow-sm">
                                          {conflict.impact || "Aucun impact spécifique documenté."}
                                        </p>
                                      </div>
                                      <div className="space-y-2">
                                        <h4 className="font-bold text-slate-700 uppercase text-xs tracking-wider flex items-center gap-1.5">
                                          <CheckCircle2 className="h-4 w-4 text-slate-400" />
                                          Suivi & Médiateur Assigné
                                        </h4>
                                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2.5 shadow-sm">
                                          <div className="flex justify-between items-center pb-2 border-b">
                                            <span className="font-semibold text-slate-400">Médiateur :</span>
                                            <span className="font-bold text-slate-800 uppercase tracking-tight">
                                              {conflict.mediatorName || "Non désigné"}
                                            </span>
                                          </div>
                                          {conflict.resolutionDate && (
                                            <div className="flex justify-between items-center pb-2 border-b">
                                              <span className="font-semibold text-slate-400">Résolu le :</span>
                                              <span className="font-bold text-emerald-600 font-mono">
                                                {isValid(parseISO(conflict.resolutionDate))
                                                  ? format(parseISO(conflict.resolutionDate), 'dd/MM/yyyy')
                                                  : conflict.resolutionDate
                                                }
                                              </span>
                                            </div>
                                          )}
                                          {conflict.resolutionDetails && (
                                            <div>
                                              <span className="font-semibold text-slate-400">Détails de résolution :</span>
                                              <p className="mt-1 text-slate-500 italic bg-slate-50 p-2.5 rounded border border-dashed text-[11px] leading-relaxed">
                                                "{conflict.resolutionDetails}"
                                              </p>
                                            </div>
                                          )}
                                          {!conflict.resolutionDate && (
                                            <div className="text-amber-600 font-bold flex items-center gap-1.5 bg-amber-50/50 p-2 rounded-lg border border-amber-100 text-[11px] justify-center mt-2">
                                              <Clock className="h-3.5 w-3.5 animate-spin" /> Médiation en cours d'instruction...
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-slate-400 py-12 bg-slate-50/10">
                            <FileText className="mx-auto h-12 w-12 opacity-20" />
                            <p className="mt-4 font-medium">Aucun conflit trouvé avec vos filtres ou mots-clés.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!reportData && !loading && (
          <Card className="flex flex-col items-center justify-center h-80 border-dashed border-2 bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
            <div className="text-center max-w-sm px-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-slate-400 opacity-60" />
              </div>
              <h3 className="font-bold text-slate-700 text-lg">Aucun rapport actif</h3>
              <p className="text-slate-400 mt-2 text-xs leading-relaxed">
                Veuillez sélectionner vos filtres de dates et de catégories dans le panneau ci-dessus puis cliquez sur "Générer les analyses".
              </p>
            </div>
          </Card>
        )}
      </div>
      
      {/* Official printable document block */}
      {isPrinting && reportData && settings && (
        <ConflictsOfficialReport 
          conflicts={reportData.conflicts as any}
          organizationSettings={settings as any}
          subtitle={`Période : ${selectedPeriodText}`}
          isPrinting={isPrinting}
          onAfterPrint={() => setIsPrinting(false)}
          stats={stats || { 
            total: 0, 
            resolved: 0, 
            mediation: 0, 
            open: 0, 
            resolutionRate: 0, 
            topType: "N/A" 
          }}
        />
      )}
    </>
  );
}
