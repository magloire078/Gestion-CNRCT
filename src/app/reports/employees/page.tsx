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
            Téléphone: e.phone,
            Département: e.department,
            Poste: e.poste,
            Status: e.status || (e.bActif ? 'Actif' : 'Inactif'),
            Date_Embauche: e.hireDate
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
        <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Rapports du Personnel</h1>
                    <p className="text-muted-foreground mt-2 font-medium">Analyse et statistiques détaillées des ressources humaines.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handlePrint} variant="outline" className="rounded-xl h-12 shadow-sm border-slate-200 font-bold">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-slate-900 hover:bg-slate-800 rounded-xl h-12 px-6 font-bold shadow-xl">
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
                            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-bold">Total</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">{stats.total}</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Collaborateurs</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <UserCheck className="h-6 w-6 text-emerald-600" />
                            </div>
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none font-bold">En Poste</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">{stats.active}</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Actifs</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                                <UserX className="h-6 w-6 text-rose-600" />
                            </div>
                            <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-none font-bold">Inactifs</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">{stats.inactive}</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Sorties / Absents</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-amber-600" />
                            </div>
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-none font-bold">Taux</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">{((stats.active / stats.total) * 100).toFixed(1)}%</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Opérationnalité</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Data View */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                                <BarChart3 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-900">Liste Nominative & Status</CardTitle>
                                <CardDescription className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Registre complet avec indicateurs d'activité</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 print:hidden">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Rechercher un membre..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 w-[300px] h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-slate-900/5"
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
                                <TableHead className="py-6 pl-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Membre</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Département</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Poste</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-8">Date Entrée</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.map((employee) => {
                                const isActive = employee.status === 'Actif' || employee.bActif;
                                return (
                                    <TableRow key={employee.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                        <TableCell className="py-5 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 overflow-hidden">
                                                    {employee.photoUrl || employee.Photo ? (
                                                        <img src={employee.photoUrl || employee.Photo} alt={employee.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        employee.name.substring(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 leading-none">{employee.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{employee.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3 w-3 text-slate-400" />
                                                <span className="text-sm font-bold text-slate-700">{employee.department || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-3 w-3 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-600">{employee.poste || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-tighter border-none",
                                                isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                            )}>
                                                {isActive ? "En Service" : "Inactif"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Calendar className="h-3 w-3" />
                                                    <span className="text-xs font-bold">{employee.hireDate || 'N/A'}</span>
                                                </div>
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
    );
}
