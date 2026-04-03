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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-amber-600 font-bold uppercase tracking-widest text-[10px]">
                            <Globe className="h-3 w-3" />
                            Diagnostic Territorial
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Observatoire <span className="text-amber-600">Territorial</span></h1>
                        <p className="text-slate-500 font-medium">Analyse et suivi des infrastructures de base en milieu rural.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleExportCsv} className="rounded-xl h-12 border-slate-200">
                            <Download className="mr-2 h-4 w-4" /> CSV
                        </Button>
                        <Button onClick={() => setIsPrinting(true)} className="rounded-xl h-12 bg-slate-900 border-none shadow-xl shadow-slate-200">
                            <Printer className="mr-2 h-4 w-4" /> Imprimer le Diagnostic
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative group">
                        <div className="absolute -right-4 -top-4 bg-white/5 p-8 rounded-full group-hover:scale-110 transition-transform">
                            <MapPin className="h-12 w-12 text-white/10" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Localités Couvertes</CardDescription>
                            <CardTitle className="text-3xl font-black">{stats.total}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                                {new Set(filteredVillages.map(v => v.region)).size} Régions représentées
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative group">
                        <div className="absolute -right-4 -top-4 bg-white/5 p-8 rounded-full group-hover:scale-110 transition-transform">
                            <Users className="h-12 w-12 text-white/10" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-blue-100 font-bold text-[10px] uppercase tracking-widest">Population Totale</CardDescription>
                            <CardTitle className="text-3xl font-black">{stats.population.toLocaleString()}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-blue-100 uppercase font-bold tracking-tighter">
                                Estimation basée sur les derniers recensements
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden relative group">
                        <div className="absolute -right-4 -top-4 bg-white/5 p-8 rounded-full group-hover:scale-110 transition-transform">
                            <Zap className="h-12 w-12 text-white/10" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest">Électrification</CardDescription>
                            <CardTitle className="text-3xl font-black">{stats.electricity.toFixed(1)}%</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Progress value={stats.electricity} className="h-1.5 bg-white/20" indicatorClassName="bg-white" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-amber-500 text-white overflow-hidden relative group">
                        <div className="absolute -right-4 -top-4 bg-white/5 p-8 rounded-full group-hover:scale-110 transition-transform">
                            <Droplets className="h-12 w-12 text-white/10" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-amber-500 font-bold text-[10px] uppercase tracking-widest text-white">Accès Eau Potable</CardDescription>
                            <CardTitle className="text-3xl font-black">{stats.water.toFixed(1)}%</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Progress value={stats.water} className="h-1.5 bg-white/20" indicatorClassName="bg-white" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm border border-slate-100">
                        <CardContent className="pt-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-50 rounded-2xl">
                                    <Activity className="h-6 w-6 text-rose-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Couverture Santé</p>
                                    <p className="text-2xl font-black text-slate-900">{stats.health.toFixed(1)}%</p>
                                </div>
                            </div>
                            <div className="text-right">
                               <Badge className="bg-rose-50 text-rose-600 border-none px-3 py-1 font-bold">
                                   {filteredVillages.filter(v => v.hasHealthCenter).length} centres
                               </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm border border-slate-100">
                        <CardContent className="pt-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 rounded-2xl">
                                    <School className="h-6 w-6 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Éducation Primaire</p>
                                    <p className="text-2xl font-black text-slate-900">{stats.school.toFixed(1)}%</p>
                                </div>
                            </div>
                            <div className="text-right">
                               <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 font-bold">
                                   {filteredVillages.filter(v => v.hasSchool).length} écoles
                               </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Table */}
                <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-white border border-slate-100">
                    <CardHeader className="border-b border-slate-50 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <CardTitle className="text-xl font-black">État Diagnostic des Localités</CardTitle>
                            <CardDescription>Détail complet des infrastructures par village répertorié.</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Rechercher un village..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-12 w-64 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-100">
                                {regions.slice(0, 4).map(reg => (
                                    <button
                                        key={reg}
                                        onClick={() => setRegionFilter(reg)}
                                        className={cn(
                                            "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                            regionFilter === reg ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
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
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="font-bold text-slate-900 h-14 pl-8 uppercase text-[10px] tracking-widest">Village</TableHead>
                                    <TableHead className="font-bold text-slate-900 h-14 uppercase text-[10px] tracking-widest">Administration</TableHead>
                                    <TableHead className="font-bold text-slate-900 h-14 text-center uppercase text-[10px] tracking-widest">Pop.</TableHead>
                                    <TableHead className="font-bold text-slate-900 h-14 text-center uppercase text-[10px] tracking-widest">Electricité</TableHead>
                                    <TableHead className="font-bold text-slate-900 h-14 text-center uppercase text-[10px] tracking-widest">Eau</TableHead>
                                    <TableHead className="font-bold text-slate-900 h-14 text-center uppercase text-[10px] tracking-widest">Santé</TableHead>
                                    <TableHead className="font-bold text-slate-900 h-14 text-center uppercase text-[10px] tracking-widest pr-8">Ecole</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVillages.map((village) => (
                                    <TableRow key={village.id} className="group hover:bg-slate-50/50 border-slate-50 transition-colors">
                                        <TableCell className="pl-8 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900">{village.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Code: {village.codeINS || '—'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{village.region}</span>
                                                <span className="text-[10px] font-medium text-slate-500">{village.subPrefecture}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            <span className="font-mono text-xs text-slate-600">{(village.population || 0).toLocaleString()}</span>
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            {village.hasElectricity ? 
                                                <div className="inline-flex p-1.5 bg-emerald-50 rounded-full"><Zap className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" /></div> :
                                                <div className="inline-flex p-1.5 bg-slate-50 rounded-full"><Zap className="h-3.5 w-3.5 text-slate-300" /></div>
                                            }
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            {village.hasWater ? 
                                                <div className="inline-flex p-1.5 bg-blue-50 rounded-full"><Droplets className="h-3.5 w-3.5 text-blue-600" /></div> :
                                                <div className="inline-flex p-1.5 bg-slate-50 rounded-full"><Droplets className="h-3.5 w-3.5 text-slate-300" /></div>
                                            }
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            {village.hasHealthCenter ? 
                                                <div className="inline-flex p-1.5 bg-rose-50 rounded-full"><Activity className="h-3.5 w-3.5 text-rose-600" /></div> :
                                                <div className="inline-flex p-1.5 bg-slate-50 rounded-full"><Activity className="h-3.5 w-3.5 text-slate-300" /></div>
                                            }
                                        </TableCell>
                                        <TableCell className="text-center py-4 pr-8">
                                            {village.hasSchool ? 
                                                <div className="inline-flex p-1.5 bg-indigo-50 rounded-full"><School className="h-3.5 w-3.5 text-indigo-600" /></div> :
                                                <div className="inline-flex p-1.5 bg-slate-50 rounded-full"><School className="h-3.5 w-3.5 text-slate-300" /></div>
                                            }
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
