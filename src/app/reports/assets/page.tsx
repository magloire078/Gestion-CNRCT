"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Monitor, HardDrive, ShieldCheck, AlertCircle,
    Download, Printer, Search, Filter,
    FileSpreadsheet, FileJson, BarChart3,
    Tag, Layers, Activity, Wrench, MapPin
} from "lucide-react";
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
import { getAssets } from "@/services/asset-service";
import { getAllHeritageItems } from "@/services/heritage-service";
import type { Asset } from "@/lib/data";
import type { HeritageItem } from "@/types/heritage";
import { Progress } from "@/components/ui/progress";
import Papa from "papaparse";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";

type CombinedAsset = {
    id: string;
    name: string;
    category: string;
    status: string;
    type: 'IT' | 'Heritage';
    location?: string;
    tag?: string;
    dateAcquisition?: string;
};

export default function AssetReportsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [heritage, setHeritage] = useState<HeritageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [aData, hData] = await Promise.all([
                    getAssets(),
                    getAllHeritageItems()
                ]);
                setAssets(aData);
                setHeritage(hData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const combinedData = useMemo((): CombinedAsset[] => {
        const it = assets.map(a => ({
            id: a.tag,
            name: `${a.fabricant || ''} ${a.modele}`.trim(),
            category: a.type,
            status: a.status,
            type: 'IT' as const,
            tag: a.tag,
            location: a.assignedTo,
            dateAcquisition: undefined // Field doesn't exist in Asset type
        }));

        const her = heritage.map(h => ({
            id: h.id,
            name: h.name,
            category: h.category,
            status: 'Protégé',
            type: 'Heritage' as const,
            location: h.region || h.village || 'N/A',
            dateAcquisition: h.createdAt
        }));

        return [...it, ...her];
    }, [assets, heritage]);

    const stats = useMemo(() => {
        const operational = combinedData.filter(a => 
            a.status === 'En utilisation' || 
            a.status === 'En stock' || 
            a.status === 'Protégé'
        ).length;
        const maintenance = combinedData.filter(a => a.status === 'En réparation').length;
        const itCount = assets.length;
        const heritageCount = heritage.length;

        return {
            total: combinedData.length,
            maintenance,
            operational,
            itCount,
            heritageCount
        };
    }, [combinedData, assets, heritage]);

    const filteredData = useMemo(() => {
        return combinedData.filter(a => 
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.tag || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.location || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [combinedData, searchTerm]);

    const handleExportCsv = () => {
        const csv = Papa.unparse(combinedData.map(a => ({
            Nom: a.name,
            Type: a.type,
            Catégorie: a.category,
            Status: a.status,
            Localisation: a.location,
            Tag_Inventaire: a.tag || 'N/A',
            Date_Acquisition: a.dateAcquisition
        })));
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `rapport_patrimoine_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    if (loading) {
        return (
            <div className="p-8 space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                </div>
                <Skeleton className="h-[500px] rounded-[2.5rem]" />
            </div>
        );
    }

    return (
        <PermissionGuard permission="page:it-assets:view">
            <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-1000">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 print:hidden">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] shadow-sm">
                            <Monitor className="h-3.5 w-3.5" />
                            Gestion des Actifs
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 md:text-6xl leading-none">
                            Patrimoine <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-amber-600">Inventory</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-xl text-lg leading-relaxed">
                            Audit et inventaire global des actifs technologiques et du patrimoine mobilier de la CNS.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => window.print()} variant="outline" className="rounded-xl h-12 shadow-sm border-slate-200 font-bold">
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimer
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-6 font-bold shadow-xl border-none">
                                    <Download className="mr-2 h-4 w-4" />
                                    Exporter
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl">
                                <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-400">Inventaire Global</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleExportCsv} className="gap-2 cursor-pointer">
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Excel (CSV)
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                    <FileJson className="h-4 w-4 text-amber-500" /> JSON
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-500 bg-white/80 backdrop-blur-md">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="h-14 w-14 rounded-xl bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-200 group-hover:rotate-6 transition-transform">
                                    <Layers className="h-7 w-7 text-white" />
                                </div>
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">Volume</Badge>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.total}</h3>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.1em] mt-2">Éléments enregistrés</p>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full mt-6 overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full w-[85%]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-500 bg-white/80 backdrop-blur-md">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="h-14 w-14 rounded-xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-200 group-hover:rotate-6 transition-transform">
                                    <ShieldCheck className="h-7 w-7 text-white" />
                                </div>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">Santé</Badge>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.operational}</h3>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.1em] mt-2">Actifs Opérationnels</p>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full mt-6 overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-500 bg-white/80 backdrop-blur-md">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="h-14 w-14 rounded-xl bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-200 group-hover:rotate-6 transition-transform">
                                    <Wrench className="h-7 w-7 text-white" />
                                </div>
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">Alerte</Badge>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.maintenance}</h3>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.1em] mt-2">En Maintenance / Panne</p>
                            <Progress value={(stats.maintenance / stats.total) * 100} className="h-1.5 w-full bg-slate-50 mt-6" />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-500 bg-slate-900/90 backdrop-blur-md text-white">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Activity className="h-7 w-7 text-white" />
                                </div>
                                <Badge variant="secondary" className="bg-white/10 text-white border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">Mix</Badge>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-end gap-3">
                                    <h3 className="text-4xl font-black text-white tracking-tighter">{stats.itCount}</h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Matériel IT</span>
                                </div>
                                <div className="flex items-end gap-3">
                                    <h3 className="text-3xl font-black text-slate-400 tracking-tighter">{stats.heritageCount}</h3>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Mobilier & Autres</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-md group transition-all duration-500">
                    <CardHeader className="p-10 border-b border-slate-50">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-xl bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-900/20 group-hover:rotate-6 transition-transform">
                                    <Monitor className="h-8 w-8 text-indigo-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Inventaire Détaillé</CardTitle>
                                    <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest leading-none mt-1">Récapitulatif technique et physique des biens</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 print:hidden">
                                <div className="relative">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input 
                                        placeholder="Désignation, tag ou lieu..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-14 w-[350px] h-16 rounded-xl border-slate-100 bg-slate-50/50 shadow-inner focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
                                    />
                                </div>
                                <Button variant="outline" className="rounded-xl h-16 w-16 p-0 border-slate-100 bg-slate-50/50 hover:bg-white shadow-sm flex items-center justify-center transition-all">
                                    <Filter className="h-6 w-6 text-slate-600" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100">
                                        <TableHead className="py-8 pl-10 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Actif / Désignation</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Catégorie</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Affectation</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Statut Opérationnel</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right pr-10">Identification</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((a) => {
                                        const isOperational = a.status === 'En utilisation' || a.status === 'En stock' || a.status === 'Protégé';
                                        return (
                                            <TableRow key={a.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50">
                                                <TableCell className="py-6 pl-10">
                                                    <div className="flex items-center gap-5">
                                                        <div className={cn(
                                                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg shadow-slate-100",
                                                            a.type === 'IT' ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
                                                        )}>
                                                            {a.type === 'IT' ? <Monitor className="h-6 w-6 transition-transform group-hover:rotate-12" /> : <HardDrive className="h-6 w-6 transition-transform group-hover:rotate-12" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-base tracking-tight">{a.name}</p>
                                                            <div className="flex items-center gap-2 mt-1.5 font-black uppercase text-[8px] tracking-[0.2em] text-slate-400">
                                                                <span className={cn("px-2 py-0.5 rounded-full border", a.type === 'IT' ? "bg-indigo-50/50 border-indigo-100" : "bg-amber-50/50 border-amber-100")}>
                                                                    Patrimoine {a.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="rounded-xl px-4 py-1 text-[9px] font-black uppercase tracking-widest border-slate-100 bg-white text-slate-500 shadow-sm">
                                                        {a.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
                                                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                        </div>
                                                        <span className="text-sm font-black text-slate-700 tracking-tight">{a.location || 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {isOperational ? (
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100/50">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">En Service</span>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-100 bg-amber-50 text-amber-600 shadow-sm shadow-amber-100/50">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{a.status}</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-10">
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <div className="px-3 py-1 bg-slate-900 rounded-lg shadow-xl shadow-slate-200">
                                                            <span className="text-xs font-mono font-black text-white">{a.tag || 'SANS TAG'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                            <Activity className="h-2.5 w-2.5" />
                                                            {a.dateAcquisition ? new Date(a.dateAcquisition).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }) : 'Inconnue'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
