"use client";

import { useMemo, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, X } from "lucide-react";
import html2canvas from 'html2canvas';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import type { Conflict } from "@/types/common";
import { InstitutionalReportWrapper } from "../reports/institutional-report-wrapper";
import { getOfficialRegion } from "@/lib/normalization-utils";

interface ConflictSynthesisReportProps {
    isOpen: boolean;
    onClose: () => void;
    conflicts: Conflict[];
    periodLabel?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c'];

const STATUS_COLORS: Record<string, string> = {
    'Ouvert': '#ef4444', // Rose
    'En médiation': '#3b82f6', // Blue
    'Résolu': '#10b981', // Emerald
    'Classé sans suite': '#64748b', // Slate
    'Escaladé à la justice': '#a855f7', // Purple
    'En appel': '#f59e0b', // Amber
};

export function ConflictSynthesisReport({ isOpen, onClose, conflicts, periodLabel }: ConflictSynthesisReportProps) {
    const [isPrinting, setIsPrinting] = useState(false);

    // 1. Data Processing
    const { total, open, mediation, resolved, other } = useMemo(() => {
        let open = 0, mediation = 0, resolved = 0, other = 0;
        conflicts.forEach(c => {
            const s = c.status?.toLowerCase() || '';
            if (s === 'ouvert') open++;
            else if (s === 'en médiation') mediation++;
            else if (s === 'résolu') resolved++;
            else other++;
        });
        return { total: conflicts.length, open, mediation, resolved, other };
    }, [conflicts]);

    const typeData = useMemo(() => {
        const counts: Record<string, number> = {};
        conflicts.forEach(c => {
            const t = c.type || 'Non spécifié';
            counts[t] = (counts[t] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [conflicts]);

    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        conflicts.forEach(c => {
            const s = c.status || 'Non spécifié';
            counts[s] = (counts[s] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [conflicts]);

    const cleanRegionForChart = (name: string) => {
        return name
            .replace(/^District Autonome (d'|de )/i, "")
            .replace(/^Région (du |de la |des |de l'|de l’|d')/i, "")
            .replace(/^A vérifier.*/i, "Non précisée")
            .trim();
    };

    const regionData = useMemo(() => {
        const counts: Record<string, number> = {};
        conflicts.forEach(c => {
            const r = cleanRegionForChart(getOfficialRegion(c.region || 'Non précisée'));
            counts[r] = (counts[r] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 regions
    }, [conflicts]);

    const resolvedRegionData = useMemo(() => {
        const counts: Record<string, number> = {};
        conflicts.forEach(c => {
            if (c.status?.toLowerCase() === 'résolu') {
                const r = cleanRegionForChart(getOfficialRegion(c.region || 'Non précisée'));
                counts[r] = (counts[r] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [conflicts]);

    const typeList = useMemo(() => {
        const types = new Set<string>();
        conflicts.forEach(c => types.add(c.type || 'Non spécifié'));
        return Array.from(types).sort();
    }, [conflicts]);

    const crossTabData = useMemo(() => {
        const data: Record<string, Record<string, number>> = {};
        conflicts.forEach(c => {
            const r = cleanRegionForChart(getOfficialRegion(c.region || 'Non précisée'));
            const t = c.type || 'Non spécifié';
            if (!data[r]) data[r] = {};
            data[r][t] = (data[r][t] || 0) + 1;
        });
        return data;
    }, [conflicts]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg">
                    <p className="font-bold text-slate-800 text-sm mb-1">{payload[0].name}</p>
                    <p className="text-primary font-medium text-sm">
                        {payload[0].value} conflit{payload[0].value > 1 ? 's' : ''} 
                        <span className="text-slate-400 ml-2 text-xs">
                            ({((payload[0].value / total) * 100).toFixed(1)}%)
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 1000); // Give time for charts to render in print wrapper
    };

    const handleDownloadChart = async (elementId: string, filename: string) => {
        const element = document.getElementById(elementId);
        if (element) {
            try {
                const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
                const url = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = filename;
                link.href = url;
                link.click();
            } catch (err) {
                console.error("Erreur lors de la génération de l'image", err);
            }
        }
    };

    const narrativeSummary = useMemo(() => {
        if (total === 0) return "Aucune donnée n'a été enregistrée pour cette période.";
        
        const topRegion = regionData[0] ? `${regionData[0].name} (${regionData[0].value} cas)` : 'N/A';
        const topType = typeData[0] ? `${typeData[0].name} avec ${typeData[0].value} cas (${((typeData[0].value / total) * 100).toFixed(0)}%)` : 'N/A';
        const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(0) : '0';

        return `Sur la période analysée, le CNRCT a enregistré un total de ${total} conflits. La typologie dominante est "${topType}". La région la plus touchée est la région ${topRegion}. Concernant le traitement, ${resolved} conflits ont été résolus (soit un taux de résolution de ${resolutionRate}%) et ${mediation} sont actuellement en cours de médiation.`;
    }, [total, regionData, typeData, resolved, mediation]);

    const todayDate = format(new Date(), "dd MMMM yyyy", { locale: fr });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[1200px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl print:max-w-none print:w-full print:p-0 print:m-0 print:border-none print:shadow-none">
                <DialogTitle className="sr-only">Rapport de Synthèse des Conflits</DialogTitle>
                
                {/* Print Wrapper */}
                <div id="print-section" className={isPrinting ? "block print:block" : "hidden print:hidden"}>
                    <InstitutionalReportWrapper isPrinting={isPrinting}>
                        <div className="space-y-8">
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-slate-900">RAPPORT DE SYNTHÈSE DES CONFLITS</h1>
                                <p className="text-slate-500">{periodLabel ? `Période : ${periodLabel}` : `Date d'édition : ${todayDate}`}</p>
                            </div>
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Total</p>
                                    <p className="text-3xl font-black text-slate-800">{total}</p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                                    <p className="text-emerald-700 text-sm font-bold uppercase tracking-wider mb-1">Résolus</p>
                                    <p className="text-3xl font-black text-emerald-600">{resolved}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                    <p className="text-blue-700 text-sm font-bold uppercase tracking-wider mb-1">En Médiation</p>
                                    <p className="text-3xl font-black text-blue-600">{mediation}</p>
                                </div>
                                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-center">
                                    <p className="text-rose-700 text-sm font-bold uppercase tracking-wider mb-1">Ouverts</p>
                                    <p className="text-3xl font-black text-rose-600">{open}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 text-slate-700 leading-relaxed text-justify">
                                <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-sm">Résumé Analytique</h3>
                                <p>{narrativeSummary}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-12 break-inside-avoid">
                                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                                    <h3 className="text-center font-bold text-slate-800 mb-4 uppercase tracking-wider text-sm">Répartition par Type de Conflit</h3>
                                    <div className="h-[400px] print:h-[550px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={typeData} cx="50%" cy="50%" innerRadius="40%" outerRadius="65%" paddingAngle={2} dataKey="value" isAnimationActive={false} label={({name, value, percent}) => `${name} : ${value} (${(percent * 100).toFixed(0)}%)`} labelLine={{ strokeWidth: 2 }}>
                                                    {typeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                                    <h3 className="text-center font-bold text-slate-800 mb-4 uppercase tracking-wider text-sm">Répartition par Statut</h3>
                                    <div className="h-[400px] print:h-[550px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={statusData} cx="50%" cy="50%" innerRadius="40%" outerRadius="65%" paddingAngle={2} dataKey="value" isAnimationActive={false} label={({name, value, percent}) => `${name} : ${value} (${(percent * 100).toFixed(0)}%)`} labelLine={{ strokeWidth: 2 }}>
                                                    {statusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-12 mt-12 break-inside-avoid">
                                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                                    <h3 className="text-center font-bold text-slate-800 mb-6 uppercase tracking-wider text-sm">Top 10 Régions les plus touchées</h3>
                                    <div className="h-[400px] print:h-[500px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={regionData} margin={{ top: 30, right: 30, left: 0, bottom: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{fontSize: 13, fill: '#334155'}} />
                                                <YAxis tick={{fontSize: 13, fill: '#334155'}} />
                                                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} isAnimationActive={false} label={{ position: 'top', fill: '#0f172a', fontSize: 13, fontWeight: 'bold' }}>
                                                    {regionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                                    <h3 className="text-center font-bold text-slate-800 mb-6 uppercase tracking-wider text-sm">Top 10 Régions (Conflits Résolus)</h3>
                                    <div className="h-[400px] print:h-[500px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={resolvedRegionData} margin={{ top: 30, right: 30, left: 0, bottom: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{fontSize: 13, fill: '#334155'}} />
                                                <YAxis tick={{fontSize: 13, fill: '#334155'}} />
                                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} label={{ position: 'top', fill: '#0f172a', fontSize: 13, fontWeight: 'bold' }}>
                                                    {resolvedRegionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Cross-tab Table */}
                            <div className="border border-slate-200 rounded-xl p-4 bg-white mt-8 break-inside-avoid">
                                <h3 className="text-center font-bold text-slate-800 mb-4 uppercase tracking-wider text-sm">Détail des Conflits par Région et par Type</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-slate-600 border border-slate-200">
                                        <thead className="text-[11px] text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-3 py-2 font-bold border-r border-slate-200">Région</th>
                                                {typeList.map(type => (
                                                    <th key={type} className="px-3 py-2 font-semibold text-center border-r border-slate-200">{type}</th>
                                                ))}
                                                <th className="px-3 py-2 font-bold text-center bg-slate-100">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.keys(crossTabData).sort().map(region => {
                                                const rowTotal = typeList.reduce((sum, t) => sum + (crossTabData[region][t] || 0), 0);
                                                return (
                                                    <tr key={region} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <td className="px-3 py-1.5 font-bold text-[13px] text-slate-900 border-r border-slate-200">{region}</td>
                                                        {typeList.map(type => (
                                                            <td key={type} className="px-3 py-1.5 text-center border-r border-slate-200">
                                                                {crossTabData[region][type] || '-'}
                                                            </td>
                                                        ))}
                                                        <td className="px-3 py-1.5 font-bold text-center bg-slate-50 text-slate-800">
                                                            {rowTotal}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="font-bold bg-slate-100 border-t border-slate-300">
                                            <tr>
                                                <td className="px-3 py-2 text-slate-800 border-r border-slate-200">Total Général</td>
                                                {typeList.map(type => {
                                                    const colTotal = Object.keys(crossTabData).reduce((sum, r) => sum + (crossTabData[r][type] || 0), 0);
                                                    return (
                                                        <td key={type} className="px-3 py-2 text-center border-r border-slate-200 text-slate-800">
                                                            {colTotal}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-3 py-2 text-center text-slate-800 font-black">
                                                    {conflicts.length}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </InstitutionalReportWrapper>
                </div>

                {/* UI Wrapper (Modal View) */}
                <div className={isPrinting ? "hidden print:hidden" : "block print:hidden"}>
                    <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Rapport de Synthèse Statistique</h2>
                            <p className="text-sm text-slate-500">
                                {periodLabel ? `Période : ${periodLabel} • ` : ''}Base de {total} conflits • Généré le {todayDate}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold rounded-xl shadow-sm">
                                <Printer className="h-4 w-4" />
                                Imprimer PDF
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 hover:bg-slate-100 text-slate-500">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 min-h-[500px]">
                        {total === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                                <PieChart className="h-16 w-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium">Aucune donnée disponible pour cette période</p>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-6xl mx-auto">
                                {/* KPIs */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Conflits</span>
                                        <span className="text-4xl font-black text-slate-800">{total}</span>
                                    </div>
                                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center">
                                        <span className="text-emerald-700 text-xs font-bold uppercase tracking-widest mb-2">Résolus</span>
                                        <span className="text-4xl font-black text-emerald-600">{resolved}</span>
                                    </div>
                                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center">
                                        <span className="text-blue-700 text-xs font-bold uppercase tracking-widest mb-2">En Médiation</span>
                                        <span className="text-4xl font-black text-blue-600">{mediation}</span>
                                    </div>
                                    <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center justify-center">
                                        <span className="text-rose-700 text-xs font-bold uppercase tracking-widest mb-2">Ouverts</span>
                                        <span className="text-4xl font-black text-rose-600">{open}</span>
                                    </div>
                                </div>

                                {/* Narrative Summary UI */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-700 leading-relaxed text-justify shadow-sm">
                                    <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-sm">Résumé Analytique</h3>
                                    <p>{narrativeSummary}</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Types */}
                                    <div id="ui-type-chart" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Répartition par Type</h3>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 print:hidden" onClick={() => handleDownloadChart("ui-type-chart", "repartition-types.png")} title="Télécharger l'image">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="h-[350px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={typeData} cx="50%" cy="50%" innerRadius="40%" outerRadius="65%" paddingAngle={3} dataKey="value" stroke="none" isAnimationActive={false} label={({name, value, percent}) => `${name} : ${value} (${(percent * 100).toFixed(0)}%)`}>
                                                        {typeData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip content={<CustomTooltip />} />
                                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Statuses */}
                                    <div id="ui-status-chart" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Répartition par Statut</h3>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 print:hidden" onClick={() => handleDownloadChart("ui-status-chart", "repartition-statuts.png")} title="Télécharger l'image">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="h-[350px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius="40%" outerRadius="65%" paddingAngle={3} dataKey="value" stroke="none" isAnimationActive={false} label={({name, value, percent}) => `${name} : ${value} (${(percent * 100).toFixed(0)}%)`}>
                                                        {statusData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip content={<CustomTooltip />} />
                                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Cross-tab Table */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6 lg:col-span-2">
                                        <h3 className="text-center font-bold text-slate-800 mb-6 uppercase tracking-wider text-sm">Détail des Conflits par Région et par Type</h3>
                                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                                            <table className="w-full text-sm text-left text-slate-600">
                                                <thead className="text-[11px] text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-3 py-2 font-bold border-r border-slate-200">Région</th>
                                                        {typeList.map(type => (
                                                            <th key={type} className="px-3 py-2 font-semibold text-center border-r border-slate-200 whitespace-nowrap">{type}</th>
                                                        ))}
                                                        <th className="px-3 py-2 font-bold text-center bg-slate-100">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.keys(crossTabData).sort().map((region, idx) => {
                                                        const rowTotal = typeList.reduce((sum, t) => sum + (crossTabData[region][t] || 0), 0);
                                                        return (
                                                            <tr key={region} className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                                                <td className="px-3 py-1.5 font-bold text-[13px] text-slate-900 border-r border-slate-200 whitespace-nowrap">{region}</td>
                                                                {typeList.map(type => (
                                                                    <td key={type} className="px-3 py-1.5 text-center border-r border-slate-200">
                                                                        {crossTabData[region][type] ? (
                                                                            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 bg-slate-100 text-slate-700 rounded text-[13px] font-semibold">
                                                                                {crossTabData[region][type]}
                                                                            </span>
                                                                        ) : <span className="text-slate-300">-</span>}
                                                                    </td>
                                                                ))}
                                                                <td className="px-3 py-1.5 font-bold text-center bg-slate-50 text-slate-800">
                                                                    {rowTotal}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="font-bold bg-slate-100 border-t border-slate-300 shadow-[0_-1px_0_0_rgba(0,0,0,0.05)]">
                                                    <tr>
                                                        <td className="px-3 py-2 text-slate-800 border-r border-slate-200 uppercase text-[11px] tracking-wider">Total Général</td>
                                                        {typeList.map(type => {
                                                            const colTotal = Object.keys(crossTabData).reduce((sum, r) => sum + (crossTabData[r][type] || 0), 0);
                                                            return (
                                                                <td key={type} className="px-3 py-2 text-center border-r border-slate-200 text-slate-800 text-sm">
                                                                    {colTotal}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="px-3 py-3 text-center text-slate-900 text-base font-black">
                                                            {conflicts.length}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Regions */}
                                <div id="ui-region-chart" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-primary"></div>
                                            Top 10 Régions (Volume de Conflits)
                                        </h3>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 print:hidden" onClick={() => handleDownloadChart("ui-region-chart", "top-regions.png")} title="Télécharger l'image">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="h-[450px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={regionData} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} tick={{fontSize: 11, fill: '#64748b'}} tickMargin={10} />
                                                <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                                <RechartsTooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
                                                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60} isAnimationActive={false} label={{ position: 'top', fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}>
                                                    {regionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
