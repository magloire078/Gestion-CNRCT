"use client";

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { Printer, TrendingUp, MapPin, AlertCircle, BarChart3, Download } from "lucide-react";
import html2canvas from "html2canvas";
import type { PressConflict } from "@/types/press-conflict";

interface PressConflictSynthesisReportProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: PressConflict[];
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316'];
const STATUS_COLORS: Record<string, string> = {
  "En cours": "#f59e0b",
  "En cours / Sous contrôle": "#f59e0b",
  "À suivre": "#3b82f6",
  "Résolu / Accord trouvé": "#10b981",
  "Clos (Sans suite)": "#64748b"
};

import { InstitutionalReportWrapper } from "../reports/institutional-report-wrapper";

export function PressConflictSynthesisReport({ isOpen, onClose, conflicts }: PressConflictSynthesisReportProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Data for charts
  const cleanRegionForChart = (name: string) => {
    return name
      .replace(/^District Autonome (d'|de )/i, "")
      .replace(/^Région (du |de la |des |de l'|de l’|d')/i, "")
      .replace(/^A vérifier.*/i, "Non précisée")
      .trim();
  };

  const statsByRegion = useMemo(() => {
    const counts: Record<string, number> = {};
    conflicts.forEach(c => {
      const region = cleanRegionForChart(c.region || "Non précisée");
      counts[region] = (counts[region] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [conflicts]);

  const resolvedRegionData = useMemo(() => {
      const counts: Record<string, number> = {};
      conflicts.forEach(c => {
          if (c.status?.toLowerCase().includes('résolu')) {
              const r = cleanRegionForChart(c.region || 'Non précisée');
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
    conflicts.forEach(c => types.add(c.conflictType || 'Non spécifié'));
    return Array.from(types).sort();
  }, [conflicts]);

  const crossTabData = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    conflicts.forEach(c => {
        const r = cleanRegionForChart(c.region || 'Non précisée');
        const t = c.conflictType || 'Non spécifié';
        if (!data[r]) data[r] = {};
        data[r][t] = (data[r][t] || 0) + 1;
    });
    return data;
  }, [conflicts]);

  const statsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    conflicts.forEach(c => {
      const type = c.conflictType || "Autre";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [conflicts]);

  const statsByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    conflicts.forEach(c => {
      const status = c.status || "Inconnu";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [conflicts]);

  const handlePrint = () => {
    setIsPrinting(true);
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
      const total = conflicts.length;
      if (total === 0) return "Aucun fait signalé n'a été enregistré pour cette période.";
      
      const topRegion = statsByRegion[0] ? `${statsByRegion[0].name} (${statsByRegion[0].value} cas)` : 'N/A';
      const topType = statsByType[0] ? `${statsByType[0].name} avec ${statsByType[0].value} cas (${((statsByType[0].value / total) * 100).toFixed(0)}%)` : 'N/A';
      
      const resolvedCount = statsByStatus.find(s => s.name.includes("Résolu"))?.value || 0;
      const inProgressCount = statsByStatus.find(s => s.name.includes("En cours"))?.value || 0;
      const resolutionRate = total > 0 ? ((resolvedCount / total) * 100).toFixed(0) : '0';

      return `Sur la période analysée, le tableau de bord a recensé un total de ${total} faits signalés dans la presse. La typologie dominante est "${topType}". La région la plus touchée est la région ${topRegion}. Concernant l'état d'avancement, ${resolvedCount} faits ont été résolus (soit un taux de ${resolutionRate}%) et ${inProgressCount} sont actuellement en cours de traitement.`;
  }, [conflicts.length, statsByRegion, statsByType, statsByStatus]);

  const chartsContent = (
    <div className="grid-content space-y-6">
      {/* Narrative Summary UI */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-700 leading-relaxed text-justify shadow-sm">
        <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-sm">Résumé Analytique</h3>
        <p>{narrativeSummary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase">Total Conflits</p>
              <p className="text-3xl font-bold text-slate-900">{conflicts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase">En Cours</p>
              <p className="text-3xl font-bold text-slate-900">
                {statsByStatus.find(s => s.name.includes("En cours"))?.value || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase">Résolus</p>
              <p className="text-3xl font-bold text-slate-900">
                {statsByStatus.find(s => s.name.includes("Résolu"))?.value || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase">Régions touchées</p>
              <p className="text-3xl font-bold text-slate-900">{statsByRegion.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-1 gap-6 print:gap-12">
        {/* Chart: Typology */}
        <Card id="press-type-chart" className="shadow-sm border-slate-200 break-inside-avoid">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-800">Typologie des Faits Signalés</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 print:hidden" onClick={() => handleDownloadChart("press-type-chart", "press-repartition-types.png")} title="Télécharger l'image">
                <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="h-[400px] print:h-[550px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="65%"
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={false}
                  fontSize={14}
                  fontWeight="bold"
                  label={({ name, value, percent }) => `${name} : ${value} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ strokeWidth: 2 }}
                >
                  {statsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => [`${value} faits`, "Total"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart: Status */}
        <Card id="press-status-chart" className="shadow-sm border-slate-200 break-inside-avoid">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-800">Répartition par Statut</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 print:hidden" onClick={() => handleDownloadChart("press-status-chart", "press-repartition-statuts.png")} title="Télécharger l'image">
                <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="h-[400px] print:h-[550px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="65%"
                  dataKey="value"
                  isAnimationActive={false}
                  fontSize={14}
                  fontWeight="bold"
                  label={({ name, value, percent }) => `${name} : ${value} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ strokeWidth: 2 }}
                >
                  {statsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => [`${value} faits`, "Total"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart: Regions */}
        <Card id="press-region-chart" className="shadow-sm border-slate-200 break-inside-avoid">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-800">Top 10 des Régions les plus signalées</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 print:hidden" onClick={() => handleDownloadChart("press-region-chart", "press-top-regions.png")} title="Télécharger l'image">
                <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="h-[400px] print:h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByRegion} layout="vertical" margin={{ top: 5, right: 60, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 13, fill: '#334155' }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 13, fill: '#334155' }} />
                <RechartsTooltip formatter={(value: number) => [`${value} faits`, "Total"]} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: 'right', fill: '#0f172a', fontSize: 13, fontWeight: 'bold' }}>
                  {statsByRegion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart: Resolved Regions */}
        <Card id="press-resolved-chart" className="shadow-sm border-slate-200 break-inside-avoid">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-800">Top 10 Régions (Faits Résolus)</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 print:hidden" onClick={() => handleDownloadChart("press-resolved-chart", "press-regions-resolus.png")} title="Télécharger l'image">
                <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="h-[400px] print:h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resolvedRegionData} layout="vertical" margin={{ top: 5, right: 60, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 13, fill: '#334155' }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 13, fill: '#334155' }} />
                <RechartsTooltip formatter={(value: number) => [`${value} faits`, "Total"]} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: 'right', fill: '#0f172a', fontSize: 13, fontWeight: 'bold' }}>
                  {resolvedRegionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cross-tab Table */}
      <Card className="shadow-sm border-slate-200 mt-6 break-inside-avoid">
        <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-800 text-center uppercase">Détail des Faits par Région et par Typologie</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 flex flex-col bg-slate-50/50 overflow-hidden">
          <DialogHeader className="px-6 py-4 bg-white border-b border-slate-100 shrink-0 flex-row justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Rapport de Synthèse Statistique
              </DialogTitle>
              <DialogDescription>
                Analyse visuelle et répartition des {conflicts.length} faits signalés actuellement filtrés.
              </DialogDescription>
            </div>
            <Button onClick={handlePrint} className="gap-2 shadow-sm rounded-xl">
              <Printer className="h-4 w-4" />
              Imprimer la synthèse
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {chartsContent}
          </div>
        </DialogContent>
      </Dialog>

      <InstitutionalReportWrapper isPrinting={isPrinting} onAfterPrint={() => setIsPrinting(false)} orientation="landscape">
        <div className="p-8">
          <h1 className="text-2xl font-bold uppercase mb-2">Rapport de Synthèse - Faits Signalés</h1>
          <p className="text-sm text-slate-600 mb-6">Basé sur {conflicts.length} enregistrements</p>
          {chartsContent}
        </div>
      </InstitutionalReportWrapper>
    </>
  );
}
