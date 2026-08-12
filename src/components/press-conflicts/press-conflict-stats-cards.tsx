"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Newspaper, 
    AlertTriangle, 
    Clock, 
    CheckCircle2, 
    MapPin, 
    Flame,
    Pickaxe,
    Crown
} from "lucide-react";
import type { PressConflict } from "@/types/press-conflict";

interface PressConflictStatsCardsProps {
    conflicts: PressConflict[];
}

export function PressConflictStatsCards({ conflicts }: PressConflictStatsCardsProps) {
    const stats = useMemo(() => {
        const total = conflicts.length;
        const enCours = conflicts.filter(c => c.status?.includes("En cours")).length;
        const aSuivre = conflicts.filter(c => c.status?.includes("À suivre")).length;
        const resolus = conflicts.filter(c => c.status?.toLowerCase().includes("résolu")).length;
        const clos = conflicts.filter(c => c.status?.toLowerCase().includes("clos")).length;

        // Count by type
        const typeCounts = conflicts.reduce((acc, c) => {
            const type = c.conflictType || "Autre";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0] || ["Aucun", 0];

        // Count by region
        const regionCounts = conflicts.reduce((acc, c) => {
            const region = c.region || "Non précisée";
            acc[region] = (acc[region] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0] || ["Aucune", 0];

        return {
            total,
            enCours,
            aSuivre,
            resolus,
            clos,
            topType,
            topRegion
        };
    }, [conflicts]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Total Faits Signalés
                        </p>
                        <h3 className="text-2xl font-bold mt-1 text-primary">
                            {stats.total}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Revue presse & alertes
                        </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Newspaper className="h-6 w-6" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            En cours de suivi
                        </p>
                        <h3 className="text-2xl font-bold mt-1 text-amber-600">
                            {stats.enCours}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            + {stats.aSuivre} dossiers à suivre
                        </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <Clock className="h-6 w-6" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Thématique dominante
                        </p>
                        <h3 className="text-lg font-bold mt-1 text-rose-600 truncate max-w-[180px]">
                            {stats.topType[0]}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {stats.topType[1]} cas ({stats.total > 0 ? Math.round((stats.topType[1] / stats.total) * 100) : 0}%)
                        </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Résolus / Apaisés
                        </p>
                        <h3 className="text-2xl font-bold mt-1 text-emerald-600">
                            {stats.resolus}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {stats.clos} dossiers clos / jugés
                        </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
