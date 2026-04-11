"use client";

import React, { useMemo } from "react";
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    XAxis, 
    YAxis, 
    BarChart, 
    Bar, 
    Tooltip, 
    Legend,
    CartesianGrid
} from "recharts";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { 
    Package, 
    TrendingUp, 
    AlertTriangle, 
    CheckCircle2, 
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRight
} from "lucide-react";
import { Supply, SupplyTransaction } from "@/types/supply";
import { cn } from "@/lib/utils";

interface SupplyAnalyticsProps {
    supplies: Supply[];
    transactions: SupplyTransaction[];
}

const COLORS = [
    "hsl(var(--chart-1))", 
    "hsl(var(--chart-2))", 
    "hsl(var(--chart-3))", 
    "hsl(var(--chart-4))", 
    "hsl(var(--chart-5))",
    "#0f172a",
    "#334155"
];

export function SupplyAnalytics({ supplies, transactions }: SupplyAnalyticsProps) {
    
    // 1. Data Processing for Category Distribution
    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        supplies.forEach(s => {
            counts[s.category] = (counts[s.category] || 0) + s.quantity;
        });
        
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [supplies]);

    // 2. Stock Health Data (Top 8 most critical items)
    const stockHealthData = useMemo(() => {
        return supplies
            .map(s => ({
                name: s.name.length > 20 ? s.name.substring(0, 17) + "..." : s.name,
                fullName: s.name,
                quantity: s.quantity,
                reorderLevel: s.reorderLevel,
                health: s.quantity > 0 ? Math.min(100, (s.quantity / (s.reorderLevel * 2)) * 100) : 0
            }))
            .sort((a, b) => a.health - b.health)
            .slice(0, 8);
    }, [supplies]);

    // 3. Activity Summary (Transactions in the last 30 days)
    const activityStats = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        
        const recent = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
        const restocks = recent.filter(t => t.type === 'restock').reduce((sum, t) => sum + t.quantity, 0);
        const distributions = recent.filter(t => t.type === 'distribution').reduce((sum, t) => sum + t.quantity, 0);
        
        return { restocks, distributions, count: recent.length };
    }, [transactions]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* --- Summary Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <Activity className="h-24 w-24" />
                    </div>
                    <CardHeader className="relative z-10">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Flux d'Activité (30j)</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-4xl font-black">{activityStats.count}</p>
                                <p className="text-xs text-slate-400 font-medium italic">Mouvements enregistrés</p>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                                    <ArrowUpRight className="h-3 w-3" /> +{activityStats.restocks} Entreés
                                </div>
                                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                                    <ArrowDownRight className="h-3 w-3" /> -{activityStats.distributions} Sorties
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-50 border-emerald-100 shadow-sm overflow-hidden relative group">
                     <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-600">Santé Globale</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow flex items-center justify-center p-1">
                                <div className="h-full w-full rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-emerald-900">
                                    {Math.round((supplies.filter(s => s.quantity > s.reorderLevel).length / supplies.length) * 100)}%
                                </p>
                                <p className="text-[10px] text-emerald-700 font-black uppercase tracking-tight">Articles en stock optimal</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-100 shadow-sm overflow-hidden relative group">
                     <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-600">Attention Requise</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-amber-900">
                                    {supplies.filter(s => s.quantity <= s.reorderLevel).length}
                                </p>
                                <p className="text-[10px] text-amber-700 font-black uppercase tracking-tight">Points critiques à résoudre</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- Main Charts --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Category Distribution */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-slate-400" />
                            Volume par Catégorie
                        </CardTitle>
                        <CardDescription>Répartition du nombre d'unités total en stock.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        iconType="circle"
                                        formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Stock Health / Critical Items */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-slate-400" />
                            Santé Critique par Article
                        </CardTitle>
                        <CardDescription>Les 8 articles nécessitant une commande urgente.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stockHealthData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={120} 
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                    />
                                    <Tooltip 
                                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                         cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar 
                                        dataKey="quantity" 
                                        fill="#0f172a" 
                                        barSize={20} 
                                        radius={[0, 4, 4, 0]}
                                        name="Quantité"
                                    />
                                    <Bar 
                                        dataKey="reorderLevel" 
                                        fill="#fbbf24" 
                                        barSize={12} 
                                        radius={[0, 4, 4, 0]} 
                                        name="Seuil"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Légende</p>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                    <div className="h-3 w-3 bg-slate-900 rounded shadow-sm" /> Stock Actuel
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                    <div className="h-3 w-3 bg-amber-400 rounded shadow-sm" /> Seuil d'Alerte
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
