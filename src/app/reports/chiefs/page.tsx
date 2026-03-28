"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Crown, Map as MapIcon, Users, Building2,
    Download, Printer, Search, Filter,
    FileSpreadsheet, FileJson, BarChart3,
    MapPin, Home, Info, Compass
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
import { DirectoireMap } from "@/components/employees/directoire-map";
import { subscribeToChiefs } from "@/services/chief-service";
import type { Chief } from "@/lib/data";
import Papa from "papaparse";
import { cn } from "@/lib/utils";

export default function ChiefsReportsPage() {
    const [chiefs, setChiefs] = useState<Chief[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"list" | "map">("map");

    useEffect(() => {
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
        const regions = new Set(chiefs.map(c => c.region)).size;
        const villages = new Set(chiefs.map(c => c.village)).size;
        const regionGroups = chiefs.reduce((acc, c) => {
            const reg = c.region || 'Inconnue';
            acc[reg] = (acc[reg] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: chiefs.length,
            regions,
            villages,
            regionGroups
        };
    }, [chiefs]);

    const filteredChiefs = useMemo(() => {
        return chiefs.filter(c => 
            (c.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.village || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [chiefs, searchTerm]);

    const handleExportCsv = () => {
        const csv = Papa.unparse(chiefs.map(c => ({
            Nom: `${c.lastName} ${c.firstName}`,
            Titre: c.title,
            Région: c.region,
            Département: c.department,
            Sous_Préfecture: c.subPrefecture,
            Village: c.village,
            Téléphone: c.phone,
            Email: c.email
        })));
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `rapport_directoire_chefs_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    if (loading) {
        return (
            <div className="p-8 space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                </div>
                <Skeleton className="h-[600px] rounded-[2.5rem]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Directoire des Rois et Chefs</h1>
                    <p className="text-muted-foreground mt-2 font-medium">Cartographie et registre des autorités traditionnelles.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-1 rounded-2xl flex items-center shadow-inner mr-2">
                        <Button 
                            variant={viewMode === "map" ? "default" : "ghost"}
                            className={cn("rounded-xl h-10 px-4 font-bold transition-all", viewMode === "map" ? "bg-slate-900 shadow-lg text-white" : "text-slate-500 hover:bg-white")}
                            onClick={() => setViewMode("map")}
                        >
                            <MapIcon className="mr-2 h-4 w-4" /> Carte
                        </Button>
                        <Button 
                            variant={viewMode === "list" ? "default" : "ghost"}
                            className={cn("rounded-xl h-10 px-4 font-bold transition-all", viewMode === "list" ? "bg-slate-900 shadow-lg text-white" : "text-slate-500 hover:bg-white")}
                            onClick={() => setViewMode("list")}
                        >
                            <Users className="mr-2 h-4 w-4" /> Liste
                        </Button>
                    </div>
                    <Button onClick={() => window.print()} variant="outline" className="rounded-xl h-12 shadow-sm border-slate-200 font-bold">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-[#D4AF37] hover:bg-[#B8972F] text-white rounded-xl h-12 px-6 font-bold shadow-xl shadow-[#D4AF37]/20 border-none">
                                <Download className="mr-2 h-4 w-4" />
                                Exporter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-400">Format d'export</DropdownMenuLabel>
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
                            <div className="h-12 w-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
                                <Crown className="h-6 w-6 text-[#D4AF37]" />
                            </div>
                            <Badge variant="secondary" className="bg-[#D4AF37]/5 text-[#D4AF37] border border-[#D4AF37]/20 font-bold">Autorités</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">{stats.total}</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Membres total</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                <Compass className="h-6 w-6 text-indigo-600" />
                            </div>
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-bold">Zones</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">{stats.regions}</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Régions Couvertes</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                <Home className="h-6 w-6 text-amber-600" />
                            </div>
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-none font-bold">Localités</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">{stats.villages}</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Villages Représentés</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center">
                                <BarChart3 className="h-6 w-6 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none font-bold">Densité</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">{(stats.total / (stats.regions || 1)).toFixed(1)}</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Moyenne par Région</p>
                    </CardContent>
                </Card>
            </div>

            {/* Content View */}
            <div className="space-y-6">
                {viewMode === "map" ? (
                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-900 p-8 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                                    <MapIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-white">Visualisation Cartographique</CardTitle>
                                    <CardDescription className="font-bold text-[#D4AF37]/80 uppercase text-[10px] tracking-widest leading-none mt-1">Distribution géographique des autorités traditionnelles en Côte d'Ivoire</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DirectoireMap members={chiefs} className="min-h-[800px] border-none rounded-none" />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                                        <Users className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-black text-slate-900">Répertoire des Chefs</CardTitle>
                                        <CardDescription className="font-bold text-slate-500 uppercase text-[10px] tracking-widest leading-none mt-1">Liste exhaustive et recherche par circonscription</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 print:hidden">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input 
                                            placeholder="Rechercher un chef ou village..." 
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
                                        <TableHead className="py-6 pl-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Autorité</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Titre / Rôle</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Circonscription</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-8">Localisation</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredChiefs.map((chief) => (
                                        <TableRow key={chief.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-[#D4AF37] overflow-hidden border border-[#D4AF37]/10">
                                                        {chief.photoUrl ? (
                                                            <img src={chief.photoUrl} alt={chief.lastName} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <Crown className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 leading-none uppercase tracking-tighter">{chief.lastName} {chief.firstName}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{chief.phone || 'Aucun contact'}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-none rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-tight">
                                                    {chief.title || 'Chef traditionnel'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700">
                                                        <Building2 className="h-3 w-3 text-slate-400" />
                                                        {chief.region}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-medium ml-4.5">{chief.department}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-1.5 text-slate-900">
                                                        <MapPin className="h-3 w-3 text-[#D4AF37]" />
                                                        <span className="text-xs font-black uppercase tracking-tighter">{chief.village}</span>
                                                    </div>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">{chief.subPrefecture || 'District Central'}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
