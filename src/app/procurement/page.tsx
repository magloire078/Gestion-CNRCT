"use client";

import { useState, useMemo, useEffect } from "react";
import { 
    Users, Briefcase, HandshakeIcon, TrendingUp, 
    CheckCircle2, Clock, AlertTriangle, ArrowRight,
    Plus, DollarSign, PieChart as PieIcon, BarChart2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { subscribeToProviders, subscribeToContracts } from "@/services/procurement-service";
import type { Provider, Contract } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
    Tooltip, PieChart, Pie, Cell, Legend 
} from "recharts";
import { PermissionGuard } from "@/components/auth/permission-guard";

const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ProcurementDashboard() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubProviders = subscribeToProviders(setProviders, console.error);
        const unsubContracts = subscribeToContracts((data) => {
            setContracts(data);
            setLoading(false);
        }, console.error);

        return () => {
            unsubProviders();
            unsubContracts();
        };
    }, []);

    const stats = useMemo(() => {
        const totalEngaged = contracts.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
        const totalPaid = contracts.reduce((acc, c) => acc + (c.amountPaid || 0), 0);
        const activeContracts = contracts.filter(c => c.status === 'En cours').length;
        const pendingContracts = contracts.filter(c => c.status === 'Passation').length;
        
        return { totalEngaged, totalPaid, activeContracts, pendingContracts };
    }, [contracts]);

    const chartData = useMemo(() => {
        const byStatus = [
            { name: 'En cours', value: contracts.filter(c => c.status === 'En cours').length },
            { name: 'Passation', value: contracts.filter(c => c.status === 'Passation').length },
            { name: 'Terminés', value: contracts.filter(c => c.status === 'Terminé').length },
            { name: 'Résiliés', value: contracts.filter(c => c.status === 'Résilié').length },
        ].filter(d => d.value > 0);

        return { byStatus };
    }, [contracts]);

    return (
        <PermissionGuard permission="page:procurement:view">
            <div className="container mx-auto py-10 px-4 md:px-6">
                <div className="flex flex-col gap-8 pb-20">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                                <HandshakeIcon className="h-8 w-8 text-primary" /> Passation des Marchés
                            </h1>
                            <p className="text-muted-foreground mt-1">Gestion des prestataires et suivi des contrats publics.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button asChild variant="outline" className="rounded-xl h-11">
                                <Link href="/procurement/providers"><Users className="mr-2 h-4 w-4" /> Prestataires</Link>
                            </Button>
                            <Button asChild className="bg-slate-900 rounded-xl h-11">
                                <Link href="/procurement/contracts"><Briefcase className="mr-2 h-4 w-4" /> Gérer les Marchés</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-white/10 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-slate-400 font-black uppercase text-[10px] tracking-widest">MONTANT TOTAL ENGAGÉ</CardDescription>
                                <CardTitle className="text-2xl font-black">{formatCurrency(stats.totalEngaged)}</CardTitle>
                            </CardHeader>
                            <div className="absolute bottom-0 right-0 p-4 opacity-10"><TrendingUp className="h-12 w-12" /></div>
                        </Card>

                        <Card className="border-white/10 shadow-xl bg-emerald-600 text-white relative overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-emerald-100 font-black opacity-80 uppercase text-[10px] tracking-widest">TOTAL PAYÉ</CardDescription>
                                <CardTitle className="text-2xl font-black">{formatCurrency(stats.totalPaid)}</CardTitle>
                            </CardHeader>
                            <div className="absolute bottom-0 right-0 p-4 opacity-10"><CheckCircle2 className="h-12 w-12" /></div>
                        </Card>

                        <Card className="border-white/10 shadow-xl bg-card transition-all hover:shadow-2xl">
                            <CardHeader className="pb-2">
                                <CardDescription className="font-black uppercase text-[10px] tracking-widest">MARCHÉS EN COURS</CardDescription>
                                <CardTitle className="text-2xl font-black flex items-center gap-2">
                                    {stats.activeContracts}
                                    <Clock className="h-5 w-5 text-blue-500" />
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <Card className="border-white/10 shadow-xl bg-card transition-all hover:shadow-2xl">
                            <CardHeader className="pb-2">
                                <CardDescription className="font-black uppercase text-[10px] tracking-widest">EN PASSATION</CardDescription>
                                <CardTitle className="text-2xl font-black flex items-center gap-2">
                                    {stats.pendingContracts}
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Status Chart */}
                        <Card className="lg:col-span-1 border-white/10 shadow-xl bg-card/40 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Répartition par Statut</CardTitle>
                                <CardDescription>Nombre de marchés par étape.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[250px] flex items-center justify-center">
                                {chartData.byStatus.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData.byStatus}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.byStatus.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-muted-foreground italic">Aucune donnée</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Contracts */}
                        <Card className="lg:col-span-2 border-white/10 shadow-xl bg-card/40 backdrop-blur-md">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold">Derniers Marchés Engagés</CardTitle>
                                    <CardDescription>Aperçu des contrats récents.</CardDescription>
                                </div>
                                <Button variant="ghost" asChild size="sm" className="rounded-lg">
                                    <Link href="/procurement/contracts">Voir tout <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {contracts.slice(0, 5).map(contract => (
                                        <div key={contract.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-slate-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate-100">
                                                    <Briefcase className="h-5 w-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{contract.title}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">{contract.providerName} • {contract.reference}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-900">{formatCurrency(contract.totalAmount)}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{contract.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {contracts.length === 0 && (
                                        <div className="text-center py-10 text-muted-foreground italic">
                                            Aucun marché enregistré pour le moment.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Access */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="group hover:border-primary/50 transition-all cursor-pointer bg-slate-50/50 border-dashed border-2" onClick={() => {}}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-slate-600">
                                        <Plus className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Nouveau Prestataire</h3>
                                        <p className="text-xs text-muted-foreground">Enregistrer un nouveau partenaire commercial.</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 group-hover:text-primary transition-all" />
                            </CardContent>
                        </Card>

                        <Card className="group hover:border-primary/50 transition-all cursor-pointer bg-slate-50/50 border-dashed border-2" onClick={() => {}}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-slate-600">
                                        <Briefcase className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Passer un Marché</h3>
                                        <p className="text-xs text-muted-foreground">Lier un contrat à une ligne budgétaire.</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 group-hover:text-primary transition-all" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PermissionGuard>
    );
}
