"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe2, MapPin, ShieldAlert, CheckCircle2, AlertCircle, TrendingUp, Flame, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { subscribeToConflicts } from "@/services/conflict-service";
import type { Conflict } from "@/lib/data";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { cn } from "@/lib/utils";
import { differenceInDays, parseISO, isValid } from "date-fns";

type RegionStats = {
    region: string;
    total: number;
    open: number;
    mediation: number;
    resolved: number;
    closed: number;
    resolutionRate: number;
    topType: string;
    topTypeCount: number;
    topVillage: string;
    topVillageCount: number;
    topMediator: string;
    topMediatorCount: number;
    overdueCount: number;
    avgResolutionDays: number | null;
};

function computeStats(conflicts: Conflict[]): RegionStats[] {
    const byRegion = new Map<string, Conflict[]>();
    IVORIAN_REGIONS.forEach(r => byRegion.set(r, []));
    conflicts.forEach(c => {
        const r = c.region || "Non renseignée";
        if (!byRegion.has(r)) byRegion.set(r, []);
        byRegion.get(r)!.push(c);
    });

    const today = new Date();

    return Array.from(byRegion.entries())
        .map(([region, items]) => {
            const total = items.length;
            const open = items.filter(c => c.status === 'Ouvert' || !c.status).length;
            const mediation = items.filter(c => c.status === 'En médiation').length;
            const resolved = items.filter(c => c.status === 'Résolu').length;
            const closed = items.filter(c => c.status === 'Classé sans suite').length;
            const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

            const typeCounts = items.reduce<Record<string, number>>((acc, c) => {
                acc[c.type] = (acc[c.type] || 0) + 1;
                return acc;
            }, {});
            const [topType, topTypeCount] = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0] || ["—", 0];

            const villageCounts = items.reduce<Record<string, number>>((acc, c) => {
                acc[c.village] = (acc[c.village] || 0) + 1;
                return acc;
            }, {});
            const [topVillage, topVillageCount] = Object.entries(villageCounts).sort((a, b) => b[1] - a[1])[0] || ["—", 0];

            const mediatorCounts = items.reduce<Record<string, number>>((acc, c) => {
                if (c.mediatorName) acc[c.mediatorName] = (acc[c.mediatorName] || 0) + 1;
                return acc;
            }, {});
            const [topMediator, topMediatorCount] = Object.entries(mediatorCounts).sort((a, b) => b[1] - a[1])[0] || ["—", 0];

            const overdueCount = items.filter(c => {
                const s = c.status || 'Ouvert';
                if (s === 'Résolu' || s === 'Classé sans suite' || !c.reportedDate) return false;
                const d = parseISO(c.reportedDate);
                return isValid(d) && differenceInDays(today, d) >= 30;
            }).length;

            const resolutionTimes = items
                .filter(c => c.status === 'Résolu' && c.resolutionDate && c.reportedDate)
                .map(c => {
                    const r = parseISO(c.reportedDate);
                    const res = parseISO(c.resolutionDate!);
                    return isValid(r) && isValid(res) ? differenceInDays(res, r) : null;
                })
                .filter((n): n is number => n !== null && n >= 0);
            const avgResolutionDays = resolutionTimes.length > 0
                ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
                : null;

            return {
                region, total, open, mediation, resolved, closed, resolutionRate,
                topType, topTypeCount, topVillage, topVillageCount,
                topMediator, topMediatorCount, overdueCount, avgResolutionDays
            };
        })
        .sort((a, b) => b.total - a.total);
}

export default function ConflictsRegionsPage() {
    const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const unsub = subscribeToConflicts(
            (data) => setConflicts(data),
            () => setConflicts([])
        );
        return () => unsub && unsub();
    }, []);

    const stats = useMemo(() => conflicts ? computeStats(conflicts) : [], [conflicts]);
    const filtered = useMemo(() => stats.filter(s => s.region.toLowerCase().includes(search.toLowerCase())), [stats, search]);

    const nationalSummary = useMemo(() => {
        if (!conflicts) return null;
        const total = conflicts.length;
        const resolved = conflicts.filter(c => c.status === 'Résolu').length;
        const overdueCount = stats.reduce((sum, s) => sum + s.overdueCount, 0);
        const activeRegions = stats.filter(s => s.total > 0).length;
        return { total, resolved, overdueCount, activeRegions, resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0 };
    }, [conflicts, stats]);

    const loading = conflicts === null;

    return (
        <PermissionGuard permission="page:conflicts:view">
            <div className="flex flex-col gap-8 p-2">
                <div className="flex items-center justify-between gap-6 flex-wrap">
                    <div className="space-y-1">
                        <Link href="/conflicts" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 inline-flex items-center gap-1.5">
                            <ArrowLeft className="h-3 w-3" /> Retour au registre
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic flex items-center gap-3 mt-2">
                            Tableaux de Bord Régionaux <Globe2 className="h-8 w-8 text-primary" />
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl text-sm leading-relaxed border-l-2 border-slate-100 pl-4">
                            Cartographie comparative de la situation conflictuelle par région.
                        </p>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher une région..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 h-12 rounded-2xl font-bold text-xs uppercase tracking-widest"
                        />
                    </div>
                </div>

                {/* National summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-none shadow-lg rounded-2xl bg-gradient-to-br from-slate-50 to-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Régions actives</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tabular-nums">{loading ? <Skeleton className="h-8 w-12" /> : `${nationalSummary?.activeRegions || 0}`}<span className="text-sm text-slate-400">/{IVORIAN_REGIONS.length}</span></div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-lg rounded-2xl bg-gradient-to-br from-blue-50 to-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-500">Dossiers totaux</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tabular-nums">{loading ? <Skeleton className="h-8 w-12" /> : (nationalSummary?.total || 0)}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-lg rounded-2xl bg-gradient-to-br from-emerald-50 to-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Taux de résolution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tabular-nums">{loading ? <Skeleton className="h-8 w-12" /> : `${nationalSummary?.resolutionRate || 0}%`}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-lg rounded-2xl bg-gradient-to-br from-rose-50 to-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-1">
                                <Flame className="h-3 w-3" /> En retard (≥ 30j)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tabular-nums text-rose-600">{loading ? <Skeleton className="h-8 w-12" /> : (nationalSummary?.overdueCount || 0)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Region cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-3xl" />)
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full text-center py-16 text-slate-400">
                            <Globe2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="font-bold text-sm uppercase tracking-widest">Aucune région ne correspond.</p>
                        </div>
                    ) : (
                        filtered.map(s => {
                            const isEmpty = s.total === 0;
                            const isHot = s.overdueCount >= 3 || (s.total > 0 && s.resolutionRate < 30);
                            return (
                                <Link
                                    key={s.region}
                                    href={`/conflicts?region=${encodeURIComponent(s.region)}`}
                                    className="group"
                                >
                                    <Card className={cn(
                                        "border-none shadow-xl shadow-slate-100/50 rounded-3xl overflow-hidden bg-white h-full transition-all hover:shadow-2xl hover:-translate-y-0.5",
                                        isHot && "ring-2 ring-rose-200",
                                        isEmpty && "opacity-50"
                                    )}>
                                        <CardHeader className={cn(
                                            "pb-4 border-b border-slate-100",
                                            isHot ? "bg-rose-50/30" : "bg-slate-50/50"
                                        )}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className={cn("h-4 w-4", isHot ? "text-rose-500" : "text-slate-400")} />
                                                    <CardTitle className="text-base font-black text-slate-900 tracking-tight">{s.region}</CardTitle>
                                                </div>
                                                {isHot && (
                                                    <Badge className="bg-rose-600 text-white border-none font-black text-[9px] uppercase tracking-widest">
                                                        <Flame className="h-2.5 w-2.5 mr-1" /> Foyer chaud
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-5 space-y-4">
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</p>
                                                    <p className="text-2xl font-black tabular-nums text-slate-900">{s.total}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Résolus</p>
                                                    <p className="text-2xl font-black tabular-nums text-emerald-700">{s.resolved}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">Ouverts</p>
                                                    <p className="text-2xl font-black tabular-nums text-rose-700">{s.open + s.mediation}</p>
                                                </div>
                                            </div>

                                            {/* Resolution rate bar */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                                        <TrendingUp className="h-2.5 w-2.5" /> Résolution
                                                    </p>
                                                    <p className="text-xs font-black tabular-nums">{s.resolutionRate}%</p>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={cn(
                                                        "h-full rounded-full transition-all",
                                                        s.resolutionRate >= 70 ? "bg-emerald-500" :
                                                        s.resolutionRate >= 40 ? "bg-amber-500" : "bg-rose-500"
                                                    )} style={{ width: `${s.resolutionRate}%` }} />
                                                </div>
                                            </div>

                                            {!isEmpty && (
                                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                                            <ShieldAlert className="h-2.5 w-2.5" /> Type dominant
                                                        </span>
                                                        <span className="text-[11px] font-black text-slate-700 truncate">{s.topType} <span className="text-slate-400">({s.topTypeCount})</span></span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                                            <MapPin className="h-2.5 w-2.5" /> Foyer principal
                                                        </span>
                                                        <span className="text-[11px] font-black text-slate-700 truncate">{s.topVillage} <span className="text-slate-400">({s.topVillageCount})</span></span>
                                                    </div>
                                                    {s.topMediator !== '—' && (
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Médiateur top</span>
                                                            <span className="text-[11px] font-black text-slate-700 truncate">{s.topMediator} <span className="text-slate-400">({s.topMediatorCount})</span></span>
                                                        </div>
                                                    )}
                                                    {s.avgResolutionDays !== null && (
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                                                <CheckCircle2 className="h-2.5 w-2.5" /> Délai moyen
                                                            </span>
                                                            <span className="text-[11px] font-black text-emerald-700">{s.avgResolutionDays} j</span>
                                                        </div>
                                                    )}
                                                    {s.overdueCount > 0 && (
                                                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-rose-100">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 flex items-center gap-1">
                                                                <AlertCircle className="h-2.5 w-2.5" /> En retard
                                                            </span>
                                                            <span className="text-[11px] font-black text-rose-600">{s.overdueCount}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {isEmpty && (
                                                <p className="text-[10px] italic text-slate-400 text-center py-4 uppercase tracking-widest font-bold">Aucun dossier enregistré</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
