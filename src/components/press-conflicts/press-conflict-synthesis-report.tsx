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
import { Printer, TrendingUp, MapPin, AlertCircle, BarChart3 } from "lucide-react";
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
  const statsByRegion = useMemo(() => {
    const counts: Record<string, number> = {};
    conflicts.forEach(c => {
      const region = c.region || "Inconnue";
      counts[region] = (counts[region] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
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

  const chartsContent = (
    <div className="grid-content space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart: Typology */}
        <Card className="shadow-sm border-slate-200 break-inside-avoid">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Typologie des Faits Signalés</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
        <Card className="shadow-sm border-slate-200 break-inside-avoid">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Répartition par Statut</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
        <Card className="shadow-sm border-slate-200 lg:col-span-2 break-inside-avoid">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Top 10 des Régions les plus signalées</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByRegion} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
                <RechartsTooltip formatter={(value: number) => [`${value} faits`, "Total"]} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                  {statsByRegion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
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
