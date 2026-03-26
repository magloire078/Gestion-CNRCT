
"use client";

import * as React from "react";
import { memo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Pie,
    PieChart,
    Cell,
    Tooltip,
    Legend,
    LabelList
} from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import type { Conflict } from "@/types/common";

/**
 * Composant de définitions SVG pour les effets 3D
 * Contient les filtres et dégradés réutilisés par tous les graphiques
 */
export const Chart3DEffects = () => (
    <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
        <defs>
            {/* Ombre portée douce pour l'effet de profondeur */}
            <filter id="3d-shadow" x="-20%" y="-20%" width="150%" height="150%">
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.15" />
            </filter>
            
            {/* Effet de relief / biseau */}
            <filter id="3d-bevel">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.75" specularExponent="20" lightingColor="#ffffff" result="specOut">
                    <fePointLight x="-5000" y="-10000" z="20000" />
                </feSpecularLighting>
                <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
                <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
            </filter>

            {/* Dégradés pour les barres */}
            <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
            </linearGradient>

            {/* Dégradés par index pour les camemberts (approximation 3D) */}
            {[1, 2, 3, 4, 5].map(i => (
                <radialGradient key={`grad-${i}`} id={`grad-3d-${i}`} cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                    <stop offset="0%" stopColor={`hsl(var(--chart-${i}))`} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={`hsl(var(--chart-${i}))`} />
                </radialGradient>
            ))}
        </defs>
    </svg>
);

interface ConflictAnalyticsProps {
    conflicts: Conflict[];
}

const typeConfig = {
    "Succession": { label: "Succession", color: "hsl(var(--chart-1))" },
    "Foncier": { label: "Foncier", color: "hsl(var(--chart-2))" },
    "Affaires civiles": { label: "Affaires civiles", color: "hsl(var(--chart-3))" },
    "Intercommunautaire": { label: "Intercommunautaire", color: "hsl(var(--chart-4))" },
    "Politique": { label: "Politique", color: "hsl(var(--chart-5))" },
    "Autre": { label: "Autre", color: "hsl(var(--muted))" },
} satisfies ChartConfig;

const statusConfig = {
    "Résolu": { label: "Résolu", color: "#10b981" }, // Emerald 500
    "En cours": { label: "En cours", color: "#f59e0b" }, // Amber 500
    "En médiation": { label: "En médiation", color: "#3b82f6" }, // Blue 500
} satisfies ChartConfig;

export const ConflictTypeChart = memo(function ConflictTypeChart({ conflicts }: ConflictAnalyticsProps) {
    const data = React.useMemo(() => {
        const counts: Record<string, number> = {};
        conflicts.forEach(c => {
            counts[c.type] = (counts[c.type] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({
            name,
            value,
            fill: (typeConfig as any)[name]?.color || "hsl(var(--muted))"
        })).sort((a, b) => b.value - a.value);
    }, [conflicts]);

    return (
        <ChartContainer config={typeConfig} className="h-[300px] w-full">
            <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    label={({ name, value }) => `${name}: ${value}`}
                    stroke="none"
                >
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#grad-3d-${(index % 5) + 1})`}
                            filter="url(#3d-bevel)"
                            style={{ 
                                filter: 'drop-shadow(0px 8px 12px rgba(0,0,0,0.15))',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        />
                    ))}
                </Pie>
                <Legend layout="horizontal" align="center" verticalAlign="bottom" />
            </PieChart>
        </ChartContainer>
    );
});

export const ConflictHistoryChart = memo(function ConflictHistoryChart({ conflicts }: ConflictAnalyticsProps) {
    const data = React.useMemo(() => {
        const counts: Record<string, number> = {};
        conflicts.forEach(c => {
            const year = c.reportedDate.split('-')[0];
            if (year && year.length === 4) {
                counts[year] = (counts[year] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([year, count]) => ({ year, count }))
            .sort((a, b) => a.year.localeCompare(b.year));
    }, [conflicts]);

    return (
        <ChartContainer config={{ count: { label: "Nombre de Conflits", color: "hsl(var(--primary))" } }} className="h-[300px] w-full">
            <BarChart data={data} margin={{ top: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.2)" />
                <XAxis 
                    dataKey="year" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                    dataKey="count" 
                    fill="url(#bar-gradient)" 
                    radius={[6, 6, 0, 0]} 
                    barSize={45}
                    style={{ filter: 'url(#3d-shadow)' }}
                >
                    <LabelList 
                        dataKey="count" 
                        position="top" 
                        style={{ 
                            fontSize: '14px', 
                            fontWeight: '900', 
                            fill: 'hsl(var(--primary))',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }} 
                    />
                </Bar>
            </BarChart>
        </ChartContainer>
    );
});

export const ConflictRegionChart = memo(function ConflictRegionChart({ conflicts }: ConflictAnalyticsProps) {
    const data = React.useMemo(() => {
        const counts: Record<string, number> = {};
        conflicts.forEach(c => {
            if (c.region) {
                counts[c.region] = (counts[c.region] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([region, count]) => ({ region, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [conflicts]);

    return (
        <ChartContainer config={{ count: { label: "Conflits", color: "hsl(var(--chart-2))" } }} className="h-[400px] w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 60 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted)/0.2)" />
                <XAxis type="number" hide />
                <YAxis
                    dataKey="region"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: "bold", fill: 'hsl(var(--muted-foreground))' }}
                    width={140}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                    dataKey="count" 
                    fill="hsl(var(--chart-2))" 
                    radius={[0, 6, 6, 0]} 
                    barSize={20}
                    style={{ filter: 'url(#3d-shadow)' }}
                >
                    <LabelList dataKey="count" position="right" style={{ fontSize: '10px', fontWeight: 'bold', fill: 'hsl(var(--chart-2))' }} />
                </Bar>
            </BarChart>
        </ChartContainer>
    );
});

export const ConflictStatusChart = memo(function ConflictStatusChart({ conflicts }: ConflictAnalyticsProps) {
    const data = React.useMemo(() => {
        const counts: Record<string, number> = {};
        conflicts.forEach(c => {
            counts[c.status] = (counts[c.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({
            name,
            value,
            fill: (statusConfig as any)[name]?.color || "hsl(var(--muted))"
        }));
    }, [conflicts]);

    return (
        <ChartContainer config={statusConfig} className="h-[300px] w-full">
            <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={0}
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={2}
                >
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.fill}
                            filter="url(#3d-bevel)"
                            style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.1))' }}
                        />
                    ))}
                </Pie>
                <Legend verticalAlign="bottom" />
            </PieChart>
        </ChartContainer>
    );
});

export const ResolutionTimeChart = memo(function ResolutionTimeChart({ conflicts }: ConflictAnalyticsProps) {
    const data = React.useMemo(() => {
        const resolved = conflicts.filter(c => c.status === "Résolu" && c.reportedDate && c.resolutionDate);
        if (resolved.length === 0) return [];

        const delais = resolved.map(c => {
            const start = new Date(c.reportedDate);
            const end = new Date(c.resolutionDate!);
            return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        });

        // Group by ranges: < 30 days, 30-90, 90-180, 180+
        const ranges = {
            "< 1 mois": delais.filter(d => d < 30).length,
            "1-3 mois": delais.filter(d => d >= 30 && d < 90).length,
            "3-6 mois": delais.filter(d => d >= 90 && d < 180).length,
            "> 6 mois": delais.filter(d => d >= 180).length,
        };

        return Object.entries(ranges).map(([name, value]) => ({ name, value }));
    }, [conflicts]);

    const config = {
        value: { label: "Dossiers", color: "hsl(var(--chart-3))" }
    } satisfies ChartConfig;

    return (
        <ChartContainer config={config} className="h-[300px] w-full">
            <BarChart data={data} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.2)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                    dataKey="value" 
                    fill="hsl(var(--chart-3))" 
                    radius={[6, 6, 0, 0]} 
                    barSize={50}
                    style={{ filter: 'url(#3d-shadow)' }}
                >
                    <LabelList dataKey="value" position="top" style={{ fontSize: '12px', fontWeight: 'bold', fill: 'hsl(var(--chart-3))' }} />
                </Bar>
            </BarChart>
        </ChartContainer>
    );
});

export const ImpactThematicChart = memo(function ImpactThematicChart({ conflicts }: ConflictAnalyticsProps) {
    const data = React.useMemo(() => {
        const themes = [
            { label: "Socio-politique", keywords: ["socio-politique", "pouvoir", "traditionnel", "autorité", "politique"] },
            { label: "Économique", keywords: ["économique", "production", "agricole", "baisse", "revenus", "argent"] },
            { label: "Foncier/Terre", keywords: ["foncier", "terre", "parcelle", "domaine", "limite", "plantations"] },
            { label: "Social/Génération", keywords: ["génération", "social", "cohésion", "jeunes", "vieux", "famille"] },
            { label: "Violence/Ménace", keywords: ["ménace", "violence", "troubles", "ordre", "paix"] },
        ];

        const results = themes.map(theme => {
            const count = conflicts.filter(c => {
                const text = `${c.impact} ${c.description}`.toLowerCase();
                return theme.keywords.some(k => text.includes(k));
            }).length;
            return { name: theme.label, count };
        });

        return results.sort((a, b) => b.count - a.count);
    }, [conflicts]);

    const config = {
        count: { label: "Occurrences", color: "hsl(var(--chart-4))" }
    } satisfies ChartConfig;

    return (
        <ChartContainer config={config} className="h-[350px] w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted)/0.2)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={200} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                    dataKey="count" 
                    fill="hsl(var(--chart-4))" 
                    radius={[0, 6, 6, 0]} 
                    barSize={20}
                    style={{ filter: 'url(#3d-shadow)' }}
                >
                    <LabelList dataKey="count" position="right" style={{ fontSize: '10px', fontWeight: 'bold', fill: 'hsl(var(--chart-4))' }} />
                </Bar>
            </BarChart>
        </ChartContainer>
    );
});

export const RiskScoreByTypeChart = memo(function RiskScoreByTypeChart({ conflicts }: ConflictAnalyticsProps) {
    const data = React.useMemo(() => {
        const types: Record<string, { total: number, count: number }> = {};
        conflicts.forEach(c => {
            if (c.riskScore) {
                if (!types[c.type]) types[c.type] = { total: 0, count: 0 };
                types[c.type].total += c.riskScore;
                types[c.type].count += 1;
            }
        });

        return Object.entries(types)
            .map(([name, data]) => ({
                name,
                score: parseFloat((data.total / data.count).toFixed(1))
            }))
            .sort((a, b) => b.score - a.score);
    }, [conflicts]);

    const config = {
        score: { label: "Score de Risque Moyen", color: "hsl(var(--chart-5))" }
    } satisfies ChartConfig;

    return (
        <ChartContainer config={config} className="h-[300px] w-full">
            <BarChart data={data} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.2)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                    dataKey="score" 
                    fill="hsl(var(--chart-5))" 
                    radius={[6, 6, 0, 0]} 
                    barSize={30}
                    style={{ filter: 'url(#3d-shadow)' }}
                >
                    <LabelList dataKey="score" position="top" style={{ fontSize: '12px', fontWeight: '900', fill: 'hsl(var(--chart-5))' }} />
                </Bar>
            </BarChart>
        </ChartContainer>
    );
});
