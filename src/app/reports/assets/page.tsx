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
            <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Registre du Patrimoine</h1>
                        <p className="text-muted-foreground mt-2 font-medium">Audit et inventaire global des actifs IT et du patrimoine.</p>
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
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                    <Layers className="h-6 w-6 text-indigo-600" />
                                </div>
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-bold">Volume</Badge>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">{stats.total}</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Éléments enregistrés</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                                </div>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none font-bold">Santé</Badge>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">{stats.operational}</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">En bon état (Opérationnel)</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                    <Wrench className="h-6 w-6 text-amber-600" />
                                </div>
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-none font-bold">Suivi</Badge>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">{stats.maintenance}</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">En intervention / Panne</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-slate-900/5 flex items-center justify-center">
                                    <Activity className="h-6 w-6 text-slate-900" />
                                </div>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none font-bold">Répartition</Badge>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-black text-slate-900">{stats.itCount}</h3>
                                <span className="text-xs font-bold text-slate-400 mb-1">IT</span>
                                <span className="text-slate-200 mx-1">|</span>
                                <h3 className="text-3xl font-black text-slate-600">{stats.heritageCount}</h3>
                                <span className="text-xs font-bold text-slate-400 mb-1 text-slate-400">Patri.</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                                    <Monitor className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-slate-900">Inventaire Détaillé</CardTitle>
                                    <CardDescription className="font-bold text-slate-500 uppercase text-[10px] tracking-widest leading-none mt-1">Récapitulatif technique et physique des biens</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 print:hidden">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Désignation, tag ou lieu..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-12 w-[300px] h-12 rounded-2xl border-slate-200 bg-white shadow-sm"
                                    />
                                </div>
                                <Button variant="outline" className="rounded-xl h-12 w-12 p-0 border-slate-200 shadow-sm">
                                    <Filter className="h-4 w-4 text-slate-600" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                                    <TableHead className="py-6 pl-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Désignation</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Type / Catégorie</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Localisation</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-8">Identification</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((a) => {
                                    const isOperational = a.status === 'En utilisation' || a.status === 'En stock' || a.status === 'Protégé';
                                    return (
                                        <TableRow key={a.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                        {a.type === 'IT' ? <Monitor className="h-4 w-4 text-indigo-500" /> : <HardDrive className="h-4 w-4 text-amber-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 leading-none">{a.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Patrimoine {a.type}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase border-slate-200 text-slate-500">
                                                        {a.category}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3 w-3 text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-700">{a.location || 'Non défini'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {isOperational ? (
                                                        <div className="flex items-center gap-1.5 text-emerald-600">
                                                            <ShieldCheck className="h-3.5 w-3.5" />
                                                            <span className="text-[10px] font-black uppercase">En Service</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-amber-600">
                                                            <AlertCircle className="h-3.5 w-3.5" />
                                                            <span className="text-[10px] font-black uppercase">{a.status}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Tag className="h-3 w-3 text-slate-400" />
                                                        <span className="text-xs font-black text-slate-900">{a.tag || 'SANS TAG'}</span>
                                                    </div>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">{a.dateAcquisition || 'Inconnue'}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
