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
        
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
        
        // Find most active region
        const regions: Record<string, number> = {};
        conflicts.forEach(c => {
            if (c.region) regions[c.region] = (regions[c.region] || 0) + 1;
        });
        const topRegion = Object.entries(regions).sort((a,b) => b[1] - a[1])[0]?.[0] || "Aucune";

        return { total, open, mediating, resolved, resolutionRate, topRegion };
    }, [conflicts]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white dark:from-slate-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-600">Total Dossiers</CardTitle>
                    <ClipboardList className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Dossiers enregistrés
                    </p>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-white dark:from-slate-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-amber-600">En Cours</CardTitle>
                    <Hourglass className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.open + stats.mediating}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                            {stats.open} Ouverts
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                            {stats.mediating} Médiation
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white dark:from-slate-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-600">Taux de Résolution</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.resolutionRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.resolved} dossiers résolus
                    </p>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-white dark:from-slate-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-600">Zone Active</CardTitle>
                    <AlertCircle className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold truncate">{stats.topRegion}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Région avec plus de cas
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
