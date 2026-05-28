"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus, ShieldAlert, CheckCircle2, ArrowRightLeft } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subscribeToConflicts } from "@/services/conflict-service";
import type { Conflict } from "@/lib/data";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { cn } from "@/lib/utils";

function getYear(c: Conflict) {
    return c.reportedDate?.split("-")[0] || "";
}

function buildYearStats(conflicts: Conflict[], year: string) {
    const items = conflicts.filter(c => getYear(c) === year);
    const total = items.length;
    const resolved = items.filter(c => c.status === 'Résolu').length;
    const open = items.filter(c => c.status === 'Ouvert' || !c.status).length;
    const mediation = items.filter(c => c.status === 'En médiation').length;
    const closed = items.filter(c => c.status === 'Classé sans suite').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const byType = items.reduce<Record<string, number>>((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
    }, {});

    const byRegion = items.reduce<Record<string, number>>((acc, c) => {
        const r = c.region || "Non renseignée";
        acc[r] = (acc[r] || 0) + 1;
        return acc;
    }, {});

    return { total, resolved, open, mediation, closed, resolutionRate, byType, byRegion };
}

function variation(current: number, prev: number) {
    if (prev === 0) return current === 0 ? 0 : 100;
    return Math.round(((current - prev) / prev) * 100);
}

function VariationBadge({ value }: { value: number }) {
    if (value === 0) return <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-400"><Minus className="h-2.5 w-2.5" /> 0%</span>;
    const positive = value > 0;
    return (
        <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded",
            positive ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
        )}>
            {positive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {positive ? '+' : ''}{value}%
        </span>
    );
}

export default function ConflictsComparativePage() {
    const [conflicts, setConflicts] = useState<Conflict[] | null>(null);

    useEffect(() => {
        const unsub = subscribeToConflicts(
            (data) => setConflicts(data),
            () => setConflicts([])
        );
        return () => unsub && unsub();
    }, []);

    const availableYears = useMemo(() => {
        if (!conflicts) return [];
        const set = new Set<string>();
        conflicts.forEach(c => { const y = getYear(c); if (y) set.add(y); });
        return Array.from(set).sort((a, b) => b.localeCompare(a));
    }, [conflicts]);

    const currentYear = String(new Date().getFullYear());
    const [yearA, setYearA] = useState<string>(currentYear);
    const [yearB, setYearB] = useState<string>(String(Number(currentYear) - 1));

    useEffect(() => {
        if (availableYears.length >= 2) {
            if (!availableYears.includes(yearA)) setYearA(availableYears[0]);
            if (!availableYears.includes(yearB)) setYearB(availableYears[1]);
        } else if (availableYears.length === 1) {
            setYearA(availableYears[0]);
            setYearB(availableYears[0]);
        }
    }, [availableYears]);

    const statsA = useMemo(() => conflicts ? buildYearStats(conflicts, yearA) : null, [conflicts, yearA]);
    const statsB = useMemo(() => conflicts ? buildYearStats(conflicts, yearB) : null, [conflicts, yearB]);

    const evolution = useMemo(() => {
        if (!conflicts) return [];
        const yearMap = new Map<string, { year: string; total: number; resolved: number }>();
        conflicts.forEach(c => {
            const y = getYear(c);
            if (!y) return;
            const entry = yearMap.get(y) || { year: y, total: 0, resolved: 0 };
            entry.total += 1;
            if (c.status === 'Résolu') entry.resolved += 1;
            yearMap.set(y, entry);
        });
        return Array.from(yearMap.values()).sort((a, b) => a.year.localeCompare(b.year));
    }, [conflicts]);

    const typeComparison = useMemo(() => {
        if (!statsA || !statsB) return [];
        const types = new Set([...Object.keys(statsA.byType), ...Object.keys(statsB.byType)]);
        return Array.from(types).map(t => ({
            type: t,
            [yearA]: statsA.byType[t] || 0,
            [yearB]: statsB.byType[t] || 0,
        })).sort((a, b) => (b[yearA] as number) + (b[yearB] as number) - ((a[yearA] as number) + (a[yearB] as number))).slice(0, 8);
    }, [statsA, statsB, yearA, yearB]);

    const regionComparison = useMemo(() => {
        if (!statsA || !statsB) return [];
        const regions = new Set([...Object.keys(statsA.byRegion), ...Object.keys(statsB.byRegion)]);
        return Array.from(regions).map(r => ({
            region: r,
            [yearA]: statsA.byRegion[r] || 0,
            [yearB]: statsB.byRegion[r] || 0,
        })).sort((a, b) => (b[yearA] as number) + (b[yearB] as number) - ((a[yearA] as number) + (a[yearB] as number))).slice(0, 10);
    }, [statsA, statsB, yearA, yearB]);

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
                            Rapport Comparatif Annuel <BarChart3 className="h-8 w-8 text-primary" />
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl text-sm leading-relaxed border-l-2 border-slate-100 pl-4">
                            Comparez l'évolution des conflits entre deux périodes annuelles.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Année A</span>
                            <Select value={yearA} onValueChange={setYearA}>
                                <SelectTrigger className="w-32 h-11 rounded-xl font-black"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => <SelectItem key={y} value={y} className="font-bold">{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <ArrowRightLeft className="h-5 w-5 text-slate-400 mt-5" />
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Année B</span>
                            <Select value={yearB} onValueChange={setYearB}>
                                <SelectTrigger className="w-32 h-11 rounded-xl font-black"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => <SelectItem key={y} value={y} className="font-bold">{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* KPI Comparison */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
                    ) : (
                        <>
                            <KpiCompareCard label="Dossiers totaux" current={statsA?.total || 0} previous={statsB?.total || 0} yearA={yearA} yearB={yearB} negativeIsGood />
                            <KpiCompareCard label="Résolus" current={statsA?.resolved || 0} previous={statsB?.resolved || 0} yearA={yearA} yearB={yearB} icon={<CheckCircle2 className="h-3 w-3" />} />
                            <KpiCompareCard label="Taux de résolution" current={statsA?.resolutionRate || 0} previous={statsB?.resolutionRate || 0} yearA={yearA} yearB={yearB} suffix="%" />
                            <KpiCompareCard label="Ouverts + En médiation" current={(statsA?.open || 0) + (statsA?.mediation || 0)} previous={(statsB?.open || 0) + (statsB?.mediation || 0)} yearA={yearA} yearB={yearB} negativeIsGood icon={<ShieldAlert className="h-3 w-3" />} />
                        </>
                    )}
                </div>

                {/* Evolution chart */}
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-black tracking-tight">Évolution multi-annuelle</CardTitle>
                        <CardDescription className="text-xs font-bold text-slate-400">Tous les signalements et résolutions, année par année.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                        {loading ? <Skeleton className="h-full w-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={evolution}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fontWeight: 700 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                                    <Line type="monotone" dataKey="total" stroke="#0f172a" strokeWidth={3} name="Signalements" dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} name="Résolus" dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Type comparison */}
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-black tracking-tight">Comparaison par nature de conflit</CardTitle>
                        <CardDescription className="text-xs font-bold text-slate-400">{yearA} vs {yearB}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                        {loading ? <Skeleton className="h-full w-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={typeComparison}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="type" tick={{ fontSize: 10, fontWeight: 700 }} angle={-15} textAnchor="end" height={70} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                                    <Bar dataKey={yearA} fill="#6366f1" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey={yearB} fill="#94a3b8" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Region comparison */}
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-black tracking-tight">Comparaison par région</CardTitle>
                        <CardDescription className="text-xs font-bold text-slate-400">Top 10 régions — {yearA} vs {yearB}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-96">
                        {loading ? <Skeleton className="h-full w-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={regionComparison} layout="vertical" margin={{ left: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis dataKey="region" type="category" tick={{ fontSize: 10, fontWeight: 700 }} width={100} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                                    <Bar dataKey={yearA} fill="#6366f1" radius={[0, 6, 6, 0]} />
                                    <Bar dataKey={yearB} fill="#94a3b8" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}

function KpiCompareCard({
    label, current, previous, yearA, yearB, suffix = "", negativeIsGood = false, icon
}: {
    label: string;
    current: number;
    previous: number;
    yearA: string;
    yearB: string;
    suffix?: string;
    negativeIsGood?: boolean;
    icon?: React.ReactNode;
}) {
    const v = variation(current, previous);
    const displayValue = negativeIsGood ? -v : v;

    return (
        <Card className="border-none shadow-lg rounded-2xl bg-white">
            <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    {icon} {label}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between gap-2">
                    <div>
                        <p className="text-3xl font-black tabular-nums text-slate-900">{current}{suffix}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">
                            <span className="text-slate-600">{yearA}</span> vs <span className="text-slate-400">{yearB}: {previous}{suffix}</span>
                        </p>
                    </div>
                    <VariationBadge value={displayValue} />
                </div>
            </CardContent>
        </Card>
    );
}
