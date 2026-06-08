"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { 
    Crown, Map as MapIcon, Users, Building2,
    Download, Printer, Search, Filter,
    FileSpreadsheet, FileJson, BarChart3,
    MapPin, Home, Info, Compass,
    AlertTriangle, CheckCircle2, TrendingUp,
    Skull, Scale, LogOut, RefreshCw, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChiefsOfficialReport } from "@/components/reports/chiefs-official-report";
import { ChiefsStatisticsReport } from "@/components/reports/chiefs-statistics-report";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/lib/data";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from 'next/dynamic';
import { subscribeToChiefs } from "@/services/chief-service";
import { getVillages } from "@/services/village-service";
import type { Chief } from "@/lib/data";
import type { Village } from "@/types/village";
import Papa from "papaparse";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { usePermissions } from "@/hooks/use-permissions";

const DirectoireMap = dynamic<{ members: any[]; className?: string }>(
  () => import('@/components/employees/directoire-map').then(m => m.DirectoireMap),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full rounded-2xl" />
  }
);

export default function ChiefsReportsPage() {
    const { canSeeGovernanceStatus } = usePermissions();
    const showStatus = canSeeGovernanceStatus();
    const [chiefs, setChiefs] = useState<Chief[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [viewMode, setViewMode] = useState<"list" | "map" | "analytics">("map");
    const [isPrinting, setIsPrinting] = useState(false);
    const [isPrintingStats, setIsPrintingStats] = useState(false);
    const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        getOrganizationSettings().then(setOrgSettings);
        getVillages().then(setVillages);
        const unsubscribe = subscribeToChiefs(
            (data) => {
                setChiefs(data);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    const stats = useMemo(() => {
        const activeChiefs = chiefs.filter(c => c.status !== 'archive');
        const archivedChiefs = chiefs.filter(c => c.status === 'archive');
        const regionsCount = new Set(chiefs.map(c => c.region)).size;
        const villagesCount = new Set(chiefs.map(c => c.village)).size;
        const regionGroups = chiefs.reduce((acc, c) => {
            const reg = c.region || 'Inconnue';
            acc[reg] = (acc[reg] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Archive reason breakdown
        const archiveReasons = archivedChiefs.reduce((acc, c) => {
            const reason = c.archiveReason || 'Non spécifié';
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Role distribution (active only)
        const roleDistribution = activeChiefs.reduce((acc, c) => {
            const role = c.role || 'Autre';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: chiefs.length,
            active: activeChiefs.length,
            archived: archivedChiefs.length,
            regions: regionsCount,
            villages: villagesCount,
            regionGroups,
            archiveReasons,
            roleDistribution
        };
    }, [chiefs]);

    // Analytics: vacances par région
    const vacancyAnalytics = useMemo(() => {
        const allRegions = [...new Set([...villages.map(v => v.region), ...chiefs.map(c => c.region)].filter(Boolean))].sort();
        return allRegions.map(region => {
            const regionVillages = villages.filter(v => v.region === region && v.type !== 'campement');
            const coveredVillageIds = new Set(
                chiefs
                    .filter(c => (c.status === 'actif' || c.status === 'a_vie') && c.region === region && c.villageId)
                    .map(c => c.villageId!)
            );
            const activeChiefsInRegion = chiefs.filter(c => (c.status === 'actif' || c.status === 'a_vie') && c.region === region).length;
            const vacantVillages = regionVillages.filter(v => !coveredVillageIds.has(v.id)).length;
            const coverageRate = regionVillages.length > 0 ? Math.round((coveredVillageIds.size / regionVillages.length) * 100) : 0;
            return { region, totalVillages: regionVillages.length, coveredVillages: coveredVillageIds.size, vacantVillages, activeChiefs: activeChiefsInRegion, coverageRate };
        }).sort((a, b) => b.vacantVillages - a.vacantVillages);
    }, [villages, chiefs]);

    const filteredChiefs = useMemo(() => {
        return chiefs.filter(c => {
            const matchesSearch = (c.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.village || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const chiefRole = (c.role || c.title || '').toLowerCase();
            const matchesRole = roleFilter === 'all' 
                ? true 
                : roleFilter === 'village' 
                    ? chiefRole.includes('village')
                    : roleFilter === 'tribu'
                    ? chiefRole.includes('tribu')
                    : roleFilter === 'canton'
                    ? chiefRole.includes('canton')
                    : roleFilter === 'province'
                    ? chiefRole.includes('province')
                    : roleFilter === 'roi'
                    ? chiefRole.includes('roi') || chiefRole.includes('royaume')
                    : true;

            return matchesSearch && matchesRole;
        });
    }, [chiefs, searchTerm, roleFilter]);

    const handleExportCsv = () => {
        const csv = Papa.unparse(chiefs.map(c => ({
            Nom: `${c.lastName} ${c.firstName}`,
            Titre: c.title,
            Région: c.region,
            Département: c.department,
            Sous_Préfecture: c.subPrefecture,
            Village: c.village,
            Téléphone: c.phone || c.contact,
            Email: c.email,
            Statut: c.status || 'actif'
        })));
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `rapport_directoire_chefs_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    if (loading) {
        return (
            <div className="p-5 space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <Skeleton className="h-[600px] rounded-2xl" />
            </div>
        );
    }

    return (
        <PermissionGuard permission="page:chiefs:view">
            <div className="flex flex-col gap-5 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Header Section with Premium Glassmorphism */}
                <div className="relative overflow-hidden rounded-xl bg-slate-950 p-6 md:p-14 shadow-2xl print:hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#D4AF37]/10 to-transparent opacity-50" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#D4AF37]/20 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                <Crown className="h-4 w-4 text-[#D4AF37]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Institutionnel</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                                Directoire des Rois <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F1D279] to-[#D4AF37]">
                                    et Chefs Traditionnels
                                </span>
                            </h1>
                            <p className="text-slate-400 text-lg font-medium max-w-xl">
                                Cartographie stratégique et registre centralisé des autorités traditionnelles de Côte d'Ivoire.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="bg-white/5 p-1.5 rounded-[1.25rem] border border-white/10 backdrop-blur-xl flex items-center shadow-2xl">
                                <Button 
                                    variant="ghost"
                                    className={cn(
                                        "rounded-xl h-12 px-6 font-bold transition-all duration-300", 
                                        viewMode === "map" 
                                            ? "bg-[#D4AF37] text-slate-950 shadow-lg shadow-[#D4AF37]/20 hover:bg-[#D4AF37]/90" 
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                    onClick={() => startTransition(() => setViewMode("map"))}
                                    disabled={isPending}
                                >
                                    <MapIcon className="mr-2 h-4 w-4" /> Carte
                                </Button>
                                <Button 
                                    variant="ghost"
                                    className={cn(
                                        "rounded-xl h-12 px-6 font-bold transition-all duration-300", 
                                        viewMode === "list" 
                                            ? "bg-white text-slate-950 shadow-lg hover:bg-white/90" 
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                    onClick={() => startTransition(() => setViewMode("list"))}
                                    disabled={isPending}
                                >
                                    <Users className="mr-2 h-4 w-4" /> Liste
                                </Button>
                                <Button 
                                    variant="ghost"
                                    className={cn(
                                        "rounded-xl h-12 px-6 font-bold transition-all duration-300", 
                                        viewMode === "analytics" 
                                            ? "bg-emerald-400 text-slate-950 shadow-lg hover:bg-emerald-300" 
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                    onClick={() => startTransition(() => setViewMode("analytics"))}
                                    disabled={isPending}
                                >
                                    <BarChart3 className="mr-2 h-4 w-4" /> Analyse
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="rounded-2xl h-14 px-6 shadow-xl border-white/10 bg-white/5 text-white font-bold hover:bg-white/10">
                                            <Printer className="mr-2 h-5 w-5" />
                                            Imprimer
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] shadow-2xl p-2 bg-white/95 backdrop-blur-xl border-slate-100">
                                        <DropdownMenuLabel className="px-4 py-3 text-[10px] uppercase font-black text-slate-400 tracking-widest">Options d'impression</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-slate-100" />
                                        <DropdownMenuItem onClick={() => setIsPrinting(true)} className="gap-3 cursor-pointer rounded-xl py-3 px-4 focus:bg-slate-50">
                                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                <Users className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">Registre Nominatif</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setIsPrintingStats(true)} className="gap-3 cursor-pointer rounded-xl py-3 px-4 focus:bg-slate-50">
                                            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                                <BarChart3 className="h-4 w-4 text-amber-600" />
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">Rapport Statistique</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="bg-gradient-to-br from-[#D4AF37] to-[#B8972F] hover:from-[#B8972F] hover:to-[#D4AF37] text-slate-950 rounded-2xl h-14 px-5 font-black shadow-2xl shadow-[#D4AF37]/30 border-none transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]">
                                            <Download className="mr-2 h-5 w-5" />
                                            Exporter
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] shadow-2xl p-2 bg-white/95 backdrop-blur-xl border-slate-100">
                                        <DropdownMenuLabel className="px-4 py-3 text-[10px] uppercase font-black text-slate-400 tracking-widest">Format d'export</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-slate-100" />
                                        <DropdownMenuItem onClick={handleExportCsv} className="gap-3 cursor-pointer rounded-xl py-3 px-4 focus:bg-slate-50">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">Excel (CSV)</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="gap-3 cursor-pointer rounded-xl py-3 px-4 focus:bg-slate-50">
                                            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                                <FileJson className="h-4 w-4 text-amber-600" />
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">JSON</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid - Hyper-Premium Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { 
                            label: "Chefs Actifs", 
                            value: stats.active, 
                            icon: Crown, 
                            color: "#D4AF37", 
                            bg: "bg-[#D4AF37]/5", 
                            tag: "En fonction",
                            sub: `${stats.archived} archivés`
                        },
                        { 
                            label: "Régions Couvertes", 
                            value: stats.regions, 
                            icon: Compass, 
                            color: "#6366f1", 
                            bg: "bg-indigo-50", 
                            tag: "Géo-Data",
                            sub: `Sur ${vacancyAnalytics.length} régions`
                        },
                        { 
                            label: "Villages avec Chef", 
                            value: stats.villages, 
                            icon: Home, 
                            color: "#10b981", 
                            bg: "bg-emerald-50", 
                            tag: "Localités",
                            sub: `${villages.filter(v => v.type !== 'campement' && !v.currentChiefId).length} vacants`
                        },
                        { 
                            label: "Vacances Critiques", 
                            value: vacancyAnalytics.filter(r => r.vacantVillages > 0).length, 
                            icon: AlertTriangle, 
                            color: "#f59e0b", 
                            bg: "bg-amber-50", 
                            tag: "Alertes",
                            sub: "Régions avec vacances"
                        }
                    ].map((stat, i) => (
                        <Card key={i} className="group relative border-none shadow-xl shadow-slate-200/40 rounded-xl overflow-hidden bg-white hover:scale-[1.02] transition-all duration-500">
                            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-full -mr-16 -mt-16 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity`} />
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-6">
                                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner", stat.bg)}>
                                        <stat.icon className="h-7 w-7" style={{ color: stat.color }} />
                                    </div>
                                    <Badge variant="secondary" className={cn("rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-wider border-none", stat.bg)} style={{ color: stat.color }}>
                                        {stat.tag}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-4xl font-black text-slate-950 tracking-tighter">{stat.value}</h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.15em]">{stat.label}</p>
                                    {stat.sub && <p className="text-[10px] text-slate-400 font-bold mt-2">{stat.sub}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>


                {/* Content Area */}
                <div className="space-y-4">
                    {viewMode === "analytics" ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Vacancy by region */}
                            <Card className="border-none shadow-2xl rounded-xl overflow-hidden bg-white">
                                <CardHeader className="p-6 border-b border-slate-50">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl">
                                            <AlertTriangle className="h-8 w-8 text-amber-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-3xl font-black text-slate-950 tracking-tight">Vacances du Trône par Région</CardTitle>
                                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Villages sans chef actif — couverture chefferie</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    {vacancyAnalytics.map(({ region, totalVillages, coveredVillages, vacantVillages, activeChiefs, coverageRate }) => (
                                        <div key={region} className="group p-5 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all duration-300 border border-transparent hover:border-slate-100">
                                            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-2.5 w-2.5 rounded-full",
                                                        vacantVillages === 0 ? 'bg-emerald-500' : vacantVillages > 5 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                                                    )} />
                                                    <span className="font-black text-slate-900 uppercase tracking-tight text-sm">{region}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black uppercase text-slate-400">{activeChiefs} chefs actifs</span>
                                                    {vacantVillages > 0 ? (
                                                        <Badge className="bg-red-50 text-red-600 border-none font-black text-[9px] uppercase tracking-widest px-3">
                                                            {vacantVillages} vacant{vacantVillages > 1 ? 's' : ''}
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-3 flex items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />Couvert
                                                        </Badge>
                                                    )}
                                                    <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[10px] uppercase tracking-widest px-3">{coverageRate}%</Badge>
                                                </div>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-700",
                                                        coverageRate >= 80 ? 'bg-emerald-500' : coverageRate >= 50 ? 'bg-amber-400' : 'bg-red-500'
                                                    )}
                                                    style={{ width: `${coverageRate}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1.5">
                                                <span className="text-[9px] font-bold text-slate-400">{coveredVillages} villages couverts</span>
                                                <span className="text-[9px] font-bold text-slate-400">{totalVillages} villages total</span>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Role distribution + Archive reasons */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Role distribution */}
                                <Card className="border-none shadow-2xl rounded-xl overflow-hidden bg-white">
                                    <CardHeader className="p-5 border-b border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                                                <Crown className="h-6 w-6 text-[#D4AF37]" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-black text-slate-950">Répartition par Rang</CardTitle>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Chefs actifs uniquement</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-4">
                                        {Object.entries(stats.roleDistribution)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([role, count]) => {
                                                const pct = Math.round((count / (stats.active || 1)) * 100);
                                                const colors: Record<string, string> = {
                                                    'Roi': 'bg-amber-500',
                                                    'Chef de province': 'bg-purple-500',
                                                    'Chef de canton': 'bg-blue-500',
                                                    'Chef de tribu': 'bg-teal-500',
                                                    'Chef de Village': 'bg-slate-500',
                                                };
                                                return (
                                                    <div key={role} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-black uppercase text-slate-700">{role}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold text-slate-400">{count}</span>
                                                                <Badge className="bg-slate-100 text-slate-600 border-none text-[9px] font-black">{pct}%</Badge>
                                                            </div>
                                                        </div>
                                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={cn('h-full rounded-full transition-all duration-700', colors[role] || 'bg-slate-400')} style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </CardContent>
                                </Card>

                                {/* Archive reasons */}
                                <Card className="border-none shadow-2xl rounded-xl overflow-hidden bg-white">
                                    <CardHeader className="p-5 border-b border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                                <TrendingUp className="h-6 w-6 text-slate-500" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-black text-slate-950">Motifs de Fin de Règne</CardTitle>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">{stats.archived} chefs archivés</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-4">
                                        {stats.archived === 0 ? (
                                            <div className="flex flex-col items-center gap-3 py-4 text-center">
                                                <CheckCircle2 className="h-10 w-10 text-emerald-300" />
                                                <p className="text-sm font-black text-slate-400">Aucun chef archivé</p>
                                            </div>
                                        ) : (
                                            Object.entries(stats.archiveReasons)
                                                .sort((a, b) => b[1] - a[1])
                                                .map(([reason, count]) => {
                                                    const pct = Math.round((count / (stats.archived || 1)) * 100);
                                                    const reasonConfig: Record<string, { icon: any; color: string; bar: string }> = {
                                                        'Décès': { icon: Skull, color: 'text-slate-500', bar: 'bg-slate-400' },
                                                        'Déchéance': { icon: Scale, color: 'text-red-500', bar: 'bg-red-400' },
                                                        'Démission': { icon: LogOut, color: 'text-blue-500', bar: 'bg-blue-400' },
                                                        'Succession générationnelle': { icon: RefreshCw, color: 'text-purple-500', bar: 'bg-purple-400' },
                                                        'Autre': { icon: FileText, color: 'text-slate-400', bar: 'bg-slate-300' },
                                                        'Non spécifié': { icon: Info, color: 'text-slate-300', bar: 'bg-slate-200' },
                                                    };
                                                    const cfg = reasonConfig[reason] || reasonConfig['Autre'];
                                                    const Icon = cfg.icon;
                                                    return (
                                                        <div key={reason} className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Icon className={cn('h-4 w-4', cfg.color)} />
                                                                    <span className="text-[11px] font-black uppercase text-slate-700">{reason}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-bold text-slate-400">{count}</span>
                                                                    <Badge className="bg-slate-100 text-slate-600 border-none text-[9px] font-black">{pct}%</Badge>
                                                                </div>
                                                            </div>
                                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={cn('h-full rounded-full transition-all duration-700', cfg.bar)} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : viewMode === "map" ? (
                        <div className="group relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/20 to-transparent rounded-xl blur-xl opacity-50 transition duration-1000 group-hover:opacity-100" />
                            <Card className="relative border-none shadow-2xl rounded-xl overflow-hidden bg-white">
                                <CardHeader className="bg-slate-950 p-6 border-b border-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8972F] flex items-center justify-center shadow-2xl shadow-[#D4AF37]/20">
                                            <MapIcon className="h-8 w-8 text-slate-950" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-3xl font-black text-white tracking-tight">Visualisation Cartographique</CardTitle>
                                            <p className="text-[#D4AF37] font-black uppercase text-[10px] tracking-[0.3em] mt-2 opacity-80">Réseau des autorités traditionnelles</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="min-h-[850px] relative">
                                        <DirectoireMap members={chiefs} className="min-h-[850px]" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card className="border-none shadow-2xl rounded-xl overflow-hidden bg-white">
                            <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-2xl bg-slate-950 flex items-center justify-center shadow-2xl">
                                            <Users className="h-8 w-8 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-3xl font-black text-slate-950 tracking-tight">Répertoire des Chefs</CardTitle>
                                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Registre officiel consolidé</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 print:hidden">
                                        <div className="relative group">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 transition-colors group-focus-within:text-[#D4AF37]" />
                                            <Input 
                                                placeholder="Rechercher par nom, titre ou localité..." 
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-14 w-[300px] h-16 rounded-2xl border-none bg-slate-100 font-medium text-slate-700 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 shadow-inner"
                                            />
                                        </div>
                                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                                            <SelectTrigger className="w-[220px] h-16 rounded-2xl border-none bg-slate-100 font-bold text-slate-700 focus:ring-2 focus:ring-[#D4AF37]/50 shadow-inner">
                                                <div className="flex items-center gap-2">
                                                    <Filter className="h-4 w-4 text-slate-400" />
                                                    <SelectValue placeholder="Filtrer par rôle" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl font-bold">
                                                <SelectItem value="all">Toutes les autorités</SelectItem>
                                                <SelectItem value="roi">Rois</SelectItem>
                                                <SelectItem value="province">Chefs de Province</SelectItem>
                                                <SelectItem value="canton">Chefs de Canton</SelectItem>
                                                <SelectItem value="tribu">Chefs de Tribu</SelectItem>
                                                <SelectItem value="village">Chefs de Village</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                                                <TableHead className="py-4 pl-10 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Autorité / Identité</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Titre & Rôle</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Circonscription</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Statut</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right pr-10">Localisation</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredChiefs.map((chief) => (
                                                <TableRow key={chief.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50/50">
                                                    <TableCell className="py-6 pl-10">
                                                        <div className="flex items-center gap-5">
                                                            <div className="relative">
                                                                <div className="absolute -inset-1 bg-gradient-to-br from-[#D4AF37] to-[#B8972F] rounded-[1.25rem] blur opacity-0 group-hover:opacity-40 transition duration-500" />
                                                                <div className="relative h-14 w-14 rounded-[1.25rem] bg-slate-100 flex items-center justify-center font-black text-[#D4AF37] overflow-hidden border border-slate-200 shadow-sm">
                                                                    {chief.photoUrl ? (
                                                                        <img src={chief.photoUrl} alt={chief.lastName} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                                                                    ) : (
                                                                        <Crown className="h-6 w-6 opacity-40" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="font-black text-slate-900 leading-none uppercase tracking-tight text-base group-hover:text-[#D4AF37] transition-colors">{chief.lastName} {chief.firstName}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{chief.phone || chief.contact || 'Contact non renseigné'}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-[#D4AF37]/5 text-[#D4AF37] hover:bg-[#D4AF37]/10 border border-[#D4AF37]/10 rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-wider">
                                                            {chief.title || 'Chef traditionnel'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2 font-black text-[11px] text-slate-700 uppercase">
                                                                <Building2 className="h-3.5 w-3.5 text-slate-300" />
                                                                {chief.region}
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-bold ml-5.5 uppercase">{chief.department}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {showStatus && (
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "h-2 w-2 rounded-full",
                                                                    chief.status === 'archive' || chief.status === 'décédé' ? "bg-slate-300" : 
                                                                    chief.status === 'intérimaire' ? "bg-orange-500 animate-pulse" : "bg-emerald-500 animate-pulse"
                                                                )} />
                                                                <span className={cn(
                                                                    "text-[10px] font-black uppercase tracking-widest",
                                                                    chief.status === 'archive' || chief.status === 'décédé' ? "text-slate-400" : 
                                                                    chief.status === 'intérimaire' ? "text-orange-700" : "text-emerald-700"
                                                                )}>
                                                                    {chief.status === 'a_vie' ? 'Mandat À Vie' : 
                                                                     chief.status === 'intérimaire' ? 'Intérimaire' : 
                                                                     chief.status === 'décédé' ? 'Décédé' : 
                                                                     chief.status === 'archive' ? 'Archivé' : 
                                                                     'Actif'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-10">
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <div className="flex items-center gap-2 text-slate-950">
                                                                <MapPin className="h-4 w-4 text-[#D4AF37]" />
                                                                <span className="text-sm font-black uppercase tracking-tighter">{chief.village}</span>
                                                            </div>
                                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{chief.subPrefecture || 'District Central'}</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* --- PRINT PORTALS --- */}
                <ChiefsOfficialReport 
                    chiefs={chiefs}
                    organizationSettings={orgSettings}
                    isPrinting={isPrinting}
                    onAfterPrint={() => setIsPrinting(false)}
                    stats={{
                        total: stats.total,
                        regions: stats.regions,
                        villages: stats.villages
                    }}
                    subtitle={viewMode === 'map' ? "Vue Cartographique" : "Liste Nominative"}
                />

                <ChiefsStatisticsReport 
                    chiefs={chiefs}
                    organizationSettings={orgSettings}
                    isPrinting={isPrintingStats}
                    onAfterPrint={() => setIsPrintingStats(false)}
                    stats={{
                        total: stats.total,
                        regions: stats.regions,
                        villages: stats.villages
                    }}
                />
            </div>
        </PermissionGuard>
    );
}
