"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ClipboardList, Hourglass, TrendingUp, Users } from "lucide-react";
import type { Conflict } from "@/lib/data";
import { cn } from "@/lib/utils";

interface ConflictStatsCardsProps {
    conflicts: Conflict[];
}

export function ConflictStatsCards({ conflicts }: ConflictStatsCardsProps) {
    const stats = useMemo(() => {
        const total = conflicts.length;
        const open = conflicts.filter(c => c.status === 'Ouvert' || !c.status).length;
        const mediating = conflicts.filter(c => c.status === 'En médiation').length;
        const resolved = conflicts.filter(c => c.status === 'Résolu').length;
        const closed = conflicts.filter(c => c.status === 'Classé sans suite').length;

        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        const regions: Record<string, number> = {};
        conflicts.forEach(c => {
            if (c.region) regions[c.region] = (regions[c.region] || 0) + 1;
        });
        const topRegion = Object.entries(regions).sort((a,b) => b[1] - a[1])[0]?.[0] || "Aucune";

        return { total, open, mediating, resolved, closed, resolutionRate, topRegion };
    }, [conflicts]);

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="border-none shadow-xl shadow-blue-500/5 bg-gradient-to-br from-blue-50/50 to-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ClipboardList className="h-16 w-16 -mr-4 -mt-4 text-blue-600" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Registre Global
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{stats.total}</div>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        Dossiers Enregistrés
                    </p>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-amber-500/5 bg-gradient-to-br from-amber-50/50 to-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Hourglass className="h-16 w-16 -mr-4 -mt-4 text-amber-600" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Traitement Actif
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{stats.open + stats.mediating}</div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200/50">
                            {stats.open} Ouverts
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200/50">
                            {stats.mediating} Médiation
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-emerald-500/5 bg-gradient-to-br from-emerald-50/50 to-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CheckCircle2 className="h-16 w-16 -mr-4 -mt-4 text-emerald-600" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{stats.resolutionRate}<span className="text-lg ml-0.5 opacity-40">%</span></div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200/50">
                            {stats.resolved} Résolus
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/50">
                            {stats.closed} Classés
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-indigo-500/5 bg-gradient-to-br from-indigo-50/50 to-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <AlertCircle className="h-16 w-16 -mr-4 -mt-4 text-indigo-600" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Foyer de Tension
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-black text-slate-900 tracking-tight truncate leading-none pt-2">{stats.topRegion}</div>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                        Région à haute intensité
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
