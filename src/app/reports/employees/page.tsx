"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Users, TrendingUp, UserCheck, UserX, 
    Download, Printer, Filter, Search,
    FileSpreadsheet, FileJson, BarChart3,
    PieChart, Briefcase, MapPin, Calendar
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
import { useToast } from "@/hooks/use-toast";
import type { Employe } from "@/lib/data";
import { subscribeToEmployees } from "@/services/employee-service";
import { Badge } from "@/components/ui/badge";
import Papa from "papaparse";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Progress } from "@/components/ui/progress";

export default function EmployeeReportsPage() {
    const [employees, setEmployees] = useState<Employe[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = subscribeToEmployees(
            (data) => {
                setEmployees(data);
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
        const active = employees.filter(e => e.status === 'Actif' || e.bActif).length;
        const inactive = employees.length - active;
        const depts = employees.reduce((acc, e) => {
            const dept = e.department || 'Non spécifié';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: employees.length,
            active,
            inactive,
            depts
        };
    }, [employees]);

    const filteredEmployees = useMemo(() => {
        return employees.filter(e => 
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.poste || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);

    const handleExportCsv = () => {
        const csv = Papa.unparse(employees.map(e => ({
            Nom: e.name,
            Sexe: e.sexe,
            Email: e.email,
            Téléphone: e.mobile,
            Département: e.department,
            Poste: e.poste,
            Status: e.status || (e.bActif ? 'Actif' : 'Inactif'),
            Date_Embauche: e.dateEmbauche
        })));
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `rapport_personnel_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    const handlePrint = () => {
        window.print();
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
        <PermissionGuard permission="page:directory:view">
            <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 print:hidden">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] shadow-sm">
                        <Users className="h-3.5 w-3.5" />
                        Intelligence RH
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900 md:text-6xl leading-none">
                        Personnel <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Analytics</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xl text-lg leading-relaxed">
                        Analyse structurelle des ressources humaines, suivi des mouvements d'effectifs et audit du capital humain.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handlePrint} variant="outline" className="rounded-2xl h-14 px-6 border-slate-200 bg-white/50 backdrop-blur-sm shadow-xl shadow-slate-200/20 font-black text-slate-600 hover:bg-white transition-all text-sm">
                        <Printer className="mr-2 h-4 w-4 text-indigo-500" />
                        Imprimer
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-slate-900 hover:bg-slate-800 rounded-2xl h-14 px-8 font-black text-white shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all text-sm">
                                <Download className="mr-2 h-4 w-4" />
                                Exporter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-[1.5rem] shadow-2xl border-none">
                            <DropdownMenuLabel className="px-3 py-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">Format de sortie</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-50" />
                            <DropdownMenuItem onClick={handleExportCsv} className="gap-3 p-3 cursor-pointer rounded-xl hover:bg-indigo-50 transition-colors">
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                </div>
                                <span className="font-bold text-slate-700">Données CSV</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-3 p-3 cursor-pointer rounded-xl hover:bg-indigo-50 transition-colors">
                                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <FileJson className="h-4 w-4 text-amber-600" />
                                </div>
                                <span className="font-bold text-slate-700">Structure JSON</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Effectif Total", value: stats.total, icon: Users, color: "text-indigo-600", bg: "bg-indigo-500", shadow: "shadow-indigo-200", progress: 100 },
                    { label: "Membres Actifs", value: stats.active, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-500", shadow: "shadow-emerald-200", progress: (stats.active / stats.total) * 100 },
                    { label: "Sorties / Absents", value: stats.inactive, icon: UserX, color: "text-rose-600", bg: "bg-rose-500", shadow: "shadow-rose-200", progress: (stats.inactive / stats.total) * 100 },
                    { label: "Opérationnalité", value: `${((stats.active / stats.total) * 100).toFixed(1)}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-500", shadow: "shadow-amber-200", progress: (stats.active / stats.total) * 100 }
                ].map((kpi, i) => (
                    <Card key={i} className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all duration-500 bg-white">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform", kpi.bg, kpi.shadow)}>
                                    <kpi.icon className="h-7 w-7 text-white" />
                                </div>
                                <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">KPI</Badge>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{kpi.value}</h3>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.1em] mt-2">{kpi.label}</p>
                            <Progress value={kpi.progress} className="h-1.5 w-full bg-slate-50 mt-6" indicatorClassName={kpi.bg} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Data View */}
            <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[3rem] overflow-hidden bg-white">
                <CardHeader className="p-10 border-b border-slate-50">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-900/20 group-hover:rotate-6 transition-transform">
                                <BarChart3 className="h-8 w-8 text-indigo-400" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">Registre Nominatif</CardTitle>
                                <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em] leading-none">Extraction consolidée du personnel en temps réel</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 print:hidden">
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <Input 
                                    placeholder="Rechercher par nom, poste ou département..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-14 w-[380px] h-16 rounded-2xl border-slate-100 bg-slate-50/50 shadow-inner focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur-md">
                                <TableRow className="border-b border-slate-100">
                                    <TableHead className="py-8 pl-10 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Collaborateur</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Affectation</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right pr-10">Intégration</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-6 max-w-sm mx-auto">
                                                <div className="h-20 w-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                                                    <Users className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-black text-slate-900 tracking-tight text-lg">Aucun collaborateur trouvé</p>
                                                    <p className="text-sm font-medium text-slate-400">Essayez d'ajuster vos critères de recherche.</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredEmployees.map((employee) => {
                                        const isActive = employee.status === 'Actif' || employee.bActif;
                                        return (
                                            <TableRow key={employee.id} className="group hover:bg-slate-50/80 transition-all duration-300 border-b border-slate-50 last:border-0 hover:shadow-inner">
                                                <TableCell className="py-6 pl-10">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-400 overflow-hidden group-hover:scale-110 transition-all duration-500 shadow-xl shadow-slate-100 group-hover:rotate-3">
                                                            {employee.photoUrl || employee.Photo ? (
                                                                <img src={employee.photoUrl || employee.Photo} alt={employee.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-base">
                                                                    {employee.name.substring(0, 2).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1.5">{employee.name}</p>
                                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{employee.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                                                            <span className="text-sm font-black text-slate-700">{employee.department || 'Non affecté'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 pl-5">
                                                            <Briefcase className="h-3 w-3 text-slate-300" />
                                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{employee.poste || 'Sans titre'}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500 group-hover:scale-105 shadow-sm",
                                                        isActive 
                                                            ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-100/50" 
                                                            : "bg-rose-50 border-rose-100 text-rose-600 shadow-rose-100/50"
                                                    )}>
                                                        <div className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{isActive ? "En Service" : "Inactif"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-10">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-2 text-slate-700">
                                                            <Calendar className="h-3.5 w-3.5 text-slate-300" />
                                                            <span className="text-sm font-black tabular-nums">{employee.dateEmbauche || '—'}</span>
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Date de recrutement</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
        </PermissionGuard>
    );
}
