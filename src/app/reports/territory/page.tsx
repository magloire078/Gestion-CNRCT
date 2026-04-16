"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Compass, MapPin, Users, Building2,
    Download, Printer, Search, Filter,
    FileSpreadsheet, FileJson, BarChart3,
    Zap, Droplets, School, Activity,
    ChevronRight, Info, Map, Globe,
    ArrowUpRight, ArrowDownRight, Loader2,
    CheckCircle2, XCircle
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getVillages } from "@/services/village-service";
import type { Village } from "@/types/village";
import { getOrganizationSettings } from "@/services/organization-service";
import { PrintLayout } from "@/components/reports/print-layout";
import { Progress } from "@/components/ui/progress";
import { OrganizationSettings } from "@/types/common";
import Papa from "papaparse";
import { cn } from "@/lib/utils";

import { PermissionGuard } from "@/components/auth/permission-guard";

export default function TerritoryReportPage() {
    const [villages, setVillages] = useState<Village[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [regionFilter, setRegionFilter] = useState("all");
    const [isPrinting, setIsPrinting] = useState(false);
    const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [data, settings] = await Promise.all([
                    getVillages(),
                    getOrganizationSettings()
                ]);
                setVillages(data);
                setOrgSettings(settings);
            } catch (err) {
                console.error("Error fetching territory data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const regions = useMemo(() => {
        return ["all", ...new Set(villages.map(v => v.region))].sort();
    }, [villages]);

    const filteredVillages = useMemo(() => {
        return villages.filter(v => {
            const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 v.subPrefecture.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 v.department.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRegion = regionFilter === "all" || v.region === regionFilter;
            return matchesSearch && matchesRegion;
        });
    }, [villages, searchTerm, regionFilter]);

    const stats = useMemo(() => {
        if (filteredVillages.length === 0) return {
            total: 0,
            population: 0,
            electricity: 0,
            water: 0,
            health: 0,
            school: 0
        };

        const total = filteredVillages.length;
        const population = filteredVillages.reduce((acc, v) => acc + (v.population || 0), 0);
        const electricity = (filteredVillages.filter(v => v.hasElectricity).length / total) * 100;
        const water = (filteredVillages.filter(v => v.hasWater).length / total) * 100;
        const health = (filteredVillages.filter(v => v.hasHealthCenter).length / total) * 100;
        const school = (filteredVillages.filter(v => v.hasSchool).length / total) * 100;

        return { total, population, electricity, water, health, school };
    }, [filteredVillages]);

    const handleExportCsv = () => {
        const csvData = filteredVillages.map(v => ({
            "Localité": v.name,
            "Région": v.region,
            "Département": v.department,
            "S-Préfecture": v.subPrefecture,
            "Population": v.population || "N/A",
            "Électricité": v.hasElectricity ? "OUI" : "NON",
            "Eau Potable": v.hasWater ? "OUI" : "NON",
            "Santé": v.hasHealthCenter ? "OUI" : "NON",
            "Éducation": v.hasSchool ? "OUI" : "NON"
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `observatoire_territorial_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6 p-8">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <Skeleton className="h-[400px] rounded-2xl" />
            </div>
        );
    }

    return (
        <PermissionGuard permission="page:reports:view">
            <div className="flex flex-col gap-8 pb-20">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 print:hidden">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 text-amber-600 font-black uppercase tracking-[0.2em] text-[10px] shadow-sm">
                            <Globe className="h-3.5 w-3.5" />
                            Diagnostic Territorial
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 md:text-6xl leading-none">
                            Observatoire <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">Territorial</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-xl text-lg leading-relaxed">
                            Analyse structurelle et suivi multi-critères des infrastructures de base en milieu rural pour le pilotage du développement.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleExportCsv} className="rounded-2xl h-14 px-6 border-slate-200 bg-white/50 backdrop-blur-sm shadow-xl shadow-slate-200/20 font-black text-slate-600 hover:bg-white transition-all text-sm">
                            <Download className="mr-2 h-4 w-4 text-amber-500" /> 
                            Exporter CSV
                        </Button>
                        <Button onClick={() => setIsPrinting(true)} className="bg-slate-900 hover:bg-slate-800 rounded-2xl h-14 px-8 font-black text-white shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all text-sm">
                            <Printer className="mr-2 h-4 w-4" /> 
                            Imprimer le Diagnostic
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-slate-900 text-white group hover:scale-[1.02] transition-all duration-500">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md group-hover:rotate-6 transition-transform">
                                    <MapPin className="h-7 w-7 text-amber-400" />
                                </div>
                                <Badge variant="secondary" className="bg-white/5 text-slate-400 border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">Localités</Badge>
                            </div>
                            <h3 className="text-4xl font-black tracking-tighter leading-none">{stats.total}</h3>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.1em] mt-2">Localités Couvertes</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-6">
                                {new Set(filteredVillages.map(v => v.region)).size} Régions représentées
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white group hover:scale-[1.02] transition-all duration-500">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="h-14 w-14 rounded-xl bg-blue-500 flex items-center justify-center shadow-xl shadow-blue-200 group-hover:rotate-6 transition-transform">
                                    <Users className="h-7 w-7 text-white" />
                                </div>
                                <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">Démographie</Badge>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{stats.population.toLocaleString()}</h3>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.1em] mt-2">Population Totale</p>
                            <Progress value={100} className="h-1.5 w-full bg-slate-50 mt-6" />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white group hover:scale-[1.02] transition-all duration-500">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="h-14 w-14 rounded-xl bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-200 group-hover:rotate-6 transition-transform">
                                    <Zap className="h-7 w-7 text-white" />
                                </div>
                                <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">Énergie</Badge>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{stats.electricity.toFixed(1)}%</h3>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.1em] mt-2">Électrification</p>
                            <Progress value={stats.electricity} className="h-1.5 w-full bg-slate-50 mt-6" />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white group hover:scale-[1.02] transition-all duration-500">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="h-14 w-14 rounded-xl bg-cyan-500 flex items-center justify-center shadow-xl shadow-cyan-200 group-hover:rotate-6 transition-transform">
                                    <Droplets className="h-7 w-7 text-white" />
                                </div>
                                <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">Hydraulique</Badge>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{stats.water.toFixed(1)}%</h3>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.1em] mt-2">Accès Eau Potable</p>
                            <Progress value={stats.water} className="h-1.5 w-full bg-slate-50 mt-6" />
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-900">
                    <Card className="border-none shadow-2xl shadow-slate-200/30 rounded-2xl bg-white overflow-hidden group">
                        <CardContent className="p-8 flex justify-between items-center relative">
                            <div className="absolute top-0 right-0 h-32 w-32 -mr-16 -mt-16 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-all" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="h-16 w-16 bg-rose-50 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <Activity className="h-8 w-8 text-rose-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Couverture Santé</p>
                                    <p className="text-4xl font-black tracking-tighter">{stats.health.toFixed(1)}%</p>
                                </div>
                            </div>
                            <div className="text-right relative z-10">
                               <Badge className="bg-rose-50 text-rose-600 border-none px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                   {filteredVillages.filter(v => v.hasHealthCenter).length} centres actifs
                               </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-200/30 rounded-2xl bg-white overflow-hidden group">
                        <CardContent className="p-8 flex justify-between items-center relative">
                            <div className="absolute top-0 right-0 h-32 w-32 -mr-16 -mt-16 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="h-16 w-16 bg-indigo-50 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <School className="h-8 w-8 text-indigo-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Éducation Primaire</p>
                                    <p className="text-4xl font-black tracking-tighter">{stats.school.toFixed(1)}%</p>
                                </div>
                            </div>
                            <div className="text-right relative z-10">
                               <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                   {filteredVillages.filter(v => v.hasSchool).length} établissements
                               </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Table */}
                <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-50 p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-xl bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/20">
                                <Map className="h-8 w-8 text-amber-400" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">État Diagnostic des Localités</CardTitle>
                                <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em] leading-none">Inventaire exhaustif du patrimoine et des services de base</CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 print:hidden">
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                                <Input 
                                    placeholder="Rechercher un village..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-14 h-16 w-[320px] rounded-2xl border-slate-100 bg-slate-50/50 shadow-inner focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-slate-700"
                                />
                            </div>
                            <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
                                {regions.slice(0, 4).map(reg => (
                                    <button
                                        key={reg}
                                        onClick={() => setRegionFilter(reg)}
                                        className={cn(
                                            "px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                            regionFilter === reg 
                                                ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-100" 
                                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                                        )}
                                    >
                                        {reg === "all" ? "TOUS" : reg}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50 backdrop-blur-md sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="py-8 pl-10 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Village</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Administration</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Pop.</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Electricité</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Eau</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Santé</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center pr-10">Ecole</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVillages.map((village) => (
                                    <TableRow key={village.id} className="group hover:bg-slate-50/80 transition-all duration-300 border-b border-slate-50 last:border-0 hover:shadow-inner">
                                        <TableCell className="pl-10 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-black text-slate-900 text-lg tracking-tight leading-none group-hover:text-amber-600 transition-colors uppercase">{village.name}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INS REF: {village.codeINS || 'CONSULTATION'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1.5 font-bold uppercase tracking-tighter">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-slate-200" />
                                                    <span className="text-xs text-slate-900">{village.region}</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-4">
                                                    <span className="text-[10px] text-slate-400">{village.subPrefecture}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="rounded-xl border-slate-200 font-black text-slate-900 shadow-sm px-3 tabular-nums">
                                                {(village.population || 0).toLocaleString()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={cn(
                                                "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all shadow-sm group-hover:scale-110",
                                                village.hasElectricity ? "bg-amber-500 text-white shadow-amber-200 rotate-6" : "bg-slate-50 text-slate-200 border border-slate-100"
                                            )}>
                                                <Zap className={cn("h-5 w-5", village.hasElectricity ? "fill-white" : "")} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={cn(
                                                "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all shadow-sm group-hover:scale-110",
                                                village.hasWater ? "bg-cyan-500 text-white shadow-cyan-200 -rotate-6" : "bg-slate-50 text-slate-200 border border-slate-100"
                                            )}>
                                                <Droplets className="h-5 w-5" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={cn(
                                                "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all shadow-sm group-hover:scale-110",
                                                village.hasHealthCenter ? "bg-rose-500 text-white shadow-rose-200 rotate-12" : "bg-slate-50 text-slate-200 border border-slate-100"
                                            )}>
                                                <Activity className="h-5 w-5" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center pr-10">
                                            <div className={cn(
                                                "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all shadow-sm group-hover:scale-110",
                                                village.hasSchool ? "bg-indigo-500 text-white shadow-indigo-200 -rotate-12" : "bg-slate-50 text-slate-200 border border-slate-100"
                                            )}>
                                                <School className="h-5 w-5" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Print Portal */}
                {isPrinting && orgSettings && (
                    <PrintLayout
                        logos={orgSettings}
                        title="DIAGNOSTIC DE L'OBSERVATOIRE TERRITORIAL"
                        subtitle={`État global des infrastructures rurales - ${new Date().toLocaleDateString('fr-FR')}`}
                        orientation="landscape"
                    >
                        <div className="space-y-8 pt-6">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="border border-slate-900/10 p-3 rounded-lg bg-slate-50">
                                    <p className="text-[10px] font-bold uppercase text-slate-500">Localités</p>
                                    <p className="text-xl font-black">{stats.total}</p>
                                </div>
                                <div className="border border-slate-900/10 p-3 rounded-lg bg-slate-50">
                                    <p className="text-[10px] font-bold uppercase text-slate-500">Électricité</p>
                                    <p className="text-xl font-black">{stats.electricity.toFixed(1)}%</p>
                                </div>
                                <div className="border border-slate-900/10 p-3 rounded-lg bg-slate-50">
                                    <p className="text-[10px] font-bold uppercase text-slate-500">Eau Potable</p>
                                    <p className="text-xl font-black">{stats.water.toFixed(1)}%</p>
                                </div>
                                <div className="border border-slate-900/10 p-3 rounded-lg bg-slate-50">
                                    <p className="text-[10px] font-bold uppercase text-slate-500">Population</p>
                                    <p className="text-xl font-black">{stats.population.toLocaleString()}</p>
                                </div>
                            </div>

                            <table className="w-full text-[10px] border-collapse border border-slate-200 mt-4">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="border border-slate-200 p-2 text-left">Village</th>
                                        <th className="border border-slate-200 p-2 text-left">Région</th>
                                        <th className="border border-slate-200 p-2 text-left">S-Préf.</th>
                                        <th className="border border-slate-200 p-2 text-center">Pop.</th>
                                        <th className="border border-slate-200 p-2 text-center">Elec.</th>
                                        <th className="border border-slate-200 p-2 text-center">Eau</th>
                                        <th className="border border-slate-200 p-2 text-center">Santé</th>
                                        <th className="border border-slate-200 p-2 text-center">Ecole</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredVillages.map(v => (
                                        <tr key={v.id}>
                                            <td className="border border-slate-200 p-2 font-bold">{v.name}</td>
                                            <td className="border border-slate-200 p-2">{v.region}</td>
                                            <td className="border border-slate-200 p-2">{v.subPrefecture}</td>
                                            <td className="border border-slate-200 p-2 text-center">{v.population || 0}</td>
                                            <td className="border border-slate-200 p-2 text-center">{v.hasElectricity ? 'OUI' : 'NON'}</td>
                                            <td className="border border-slate-200 p-2 text-center">{v.hasWater ? 'OUI' : 'NON'}</td>
                                            <td className="border border-slate-200 p-2 text-center">{v.hasHealthCenter ? 'OUI' : 'NON'}</td>
                                            <td className="border border-slate-200 p-2 text-center">{v.hasSchool ? 'OUI' : 'NON'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            <div className="pt-10 flex justify-between">
                                <div className="w-[200px] border-t border-slate-900 pt-2 text-center text-[10px] font-bold">
                                    Le Service des Études
                                </div>
                                <div className="w-[200px] border-t border-slate-900 pt-2 text-center text-[10px] font-bold">
                                    Le Directeur du Patrimoine
                                </div>
                            </div>
                        </div>
                    </PrintLayout>
                )}

                {/* Back to top effect to ensure Print portal closes correctly */}
                {isPrinting && (
                    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center print:hidden">
                        <div className="text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-amber-600 mx-auto" />
                            <p className="mt-4 font-black uppercase text-xs tracking-widest text-slate-400">Préparation de l'impression...</p>
                            <Button onClick={() => setIsPrinting(false)} variant="ghost" className="mt-8 text-slate-500 font-bold hover:text-slate-900">
                                Fermer cet aperçu
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </PermissionGuard>
    );
}
