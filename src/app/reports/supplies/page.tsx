"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Package, ArrowUpRight, ArrowDownLeft, AlertTriangle,
    Download, Printer, Search, Filter,
    FileSpreadsheet, FileJson, BarChart3,
    ShoppingCart, History, Tag, Box
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
import { getSupplies, getSupplyTransactions } from "@/services/supply-service";
import type { Supply, SupplyTransaction } from "@/lib/data";
import Papa from "papaparse";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { PermissionGuard } from "@/components/auth/permission-guard";

export default function SupplyReportsPage() {
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [transactions, setTransactions] = useState<SupplyTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sData, tData] = await Promise.all([
                    getSupplies(),
                    getSupplyTransactions()
                ]);
                setSupplies(sData);
                setTransactions(tData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const stats = useMemo(() => {
        const lowStock = supplies.filter(s => s.quantity <= s.reorderLevel).length;
        const totalItems = supplies.reduce((acc, s) => acc + s.quantity, 0);
        const thisMonthTrans = transactions.filter(t => {
            const date = new Date(t.timestamp || t.date);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });
        const distributions = thisMonthTrans.filter(t => t.type === 'distribution').length;

        return {
            totalTypes: supplies.length,
            totalItems,
            lowStock,
            distributions
        };
    }, [supplies, transactions]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => 
            (t.supplyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.recipientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.performedBy || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [transactions, searchTerm]);

    const handleExportCsv = () => {
        const csv = Papa.unparse(transactions.map(t => ({
            Article: t.supplyName,
            Type: t.type === 'restock' ? 'Réapprovisionnement' : 'Distribution',
            Quantité: t.quantity,
            Bénéficiaire: t.recipientName,
            Date: format(new Date(t.timestamp || t.date), "dd/MM/yyyy HH:mm"),
            Effectué_Par: t.performedBy
        })));
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `rapport_mouvements_stocks_${new Date().toISOString().split('T')[0]}.csv`);
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
        <PermissionGuard permission="page:reports:view">
            <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Rapports Logistique</h1>
                        <p className="text-muted-foreground mt-2 font-medium">Suivi des stocks et historique des mouvements de fournitures.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => window.print()} variant="outline" className="rounded-xl h-12 shadow-sm border-slate-200 font-bold">
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimer
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-6 font-bold shadow-xl shadow-indigo-600/20 border-none">
                                    <Download className="mr-2 h-4 w-4" />
                                    Exporter
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl">
                                <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-400">Historique Movements</DropdownMenuLabel>
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
                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <Package className="h-6 w-6 text-blue-600" />
                                </div>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-bold">Catalogue</Badge>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">{stats.totalTypes}</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Articles référencés</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6 text-rose-600" />
                                </div>
                                <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-none font-bold">Attention</Badge>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">{stats.lowStock}</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Stocks Critiques</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                    <History className="h-6 w-6 text-amber-600" />
                                </div>
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-none font-bold">Mois</Badge>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">{stats.distributions}</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Sorties validées</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                    <Box className="h-6 w-6 text-emerald-600" />
                                </div>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none font-bold">Total</Badge>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">{stats.totalItems}</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Unités en stock</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <ShoppingCart className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-slate-900">Mouvements de Stocks</CardTitle>
                                    <CardDescription className="font-bold text-slate-500 uppercase text-[10px] tracking-widest leading-none mt-1">Journal complet des entrées et sorties de fournitures</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 print:hidden">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Libellé ou bénéficiaire..." 
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
                                    <TableHead className="py-6 pl-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Article</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Type</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quantité</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bénéficiaire / Motif</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-8">Date & Heure</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((t) => {
                                    const isRestock = t.type === 'restock';
                                    const dateObj = new Date(t.timestamp || t.date);
                                    return (
                                        <TableRow key={t.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                        <Tag className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 leading-none">{t.supplyName}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">ID: {t.supplyId.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-tighter border-none flex w-fit items-center gap-1.5",
                                                    isRestock ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                                                )}>
                                                    {isRestock ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                                    {isRestock ? "ENTRÉE" : "SORTIE"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "text-lg font-black",
                                                    isRestock ? "text-emerald-600" : "text-blue-600"
                                                )}>
                                                    {isRestock ? '+' : '-'}{t.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-bold text-slate-700">{t.recipientName}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase">Par: {t.performedBy}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex flex-col items-end gap-1">
                                                    <p className="text-xs font-black text-slate-900">{format(dateObj, "dd/MM/yyyy")}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{format(dateObj, "HH:mm")}</p>
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
