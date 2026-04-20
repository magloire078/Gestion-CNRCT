
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getMissions } from "@/services/mission-service";
import type { Mission } from "@/lib/data";
import { Loader2, Printer, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MissionsOfficialReport } from "@/components/reports/missions-official-report";
import { useSettings } from "@/hooks/use-settings";

interface ReportData {
  missions: Mission[];
  totalCost: number;
}

export default function MissionReportPage() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const { settings } = useSettings();
  
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: format(new Date(2000, i, 1), 'MMMM', { locale: fr }) }));
  
  const selectedPeriodText = `${months.find(m => m.value === month)?.label || ''} ${year}`;

  const calculateMissionCost = (mission: Mission): number => {
    return mission.participants.reduce((total, p) => {
        return total + (p.totalIndemnites || 0) + (p.coutTransport || 0) + (p.coutHebergement || 0);
    }, 0);
  }

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    const selectedYear = parseInt(year);
    const selectedMonth = parseInt(month) - 1;

    try {
      const allMissions = await getMissions();

      const periodStart = startOfMonth(new Date(selectedYear, selectedMonth));
      const periodEnd = endOfMonth(new Date(selectedYear, selectedMonth));

      const filteredMissions = allMissions.filter(m => {
          try {
            const missionStart = parseISO(m.startDate);
            const missionEnd = parseISO(m.endDate);
            // Check if mission interval overlaps with the selected month
            return missionStart <= periodEnd && missionEnd >= periodStart;
          } catch (e) {
            console.error("Invalid date format for mission:", m);
            return false;
          }
      });
      
      const totalCost = filteredMissions.reduce((acc, mission) => acc + calculateMissionCost(mission), 0);

      setReportData({
        missions: filteredMissions,
        totalCost: totalCost,
      });

    } catch (err) {
      console.error(err);
      setError("Impossible de générer le rapport. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
        window.print();
        setIsPrinting(false);
    }, 300);
  };
  
  const formatCurrency = (value: number) => {
    if (value === 0) return '-';
    return value.toLocaleString('fr-FR') + ' FCFA';
  }

  return (
    <div className="min-h-screen bg-transparent pb-24">
      {/* Header Institutionnel Glass */}
      <div className={`sticky top-0 z-30 w-full bg-white/40 backdrop-blur-xl border-b border-white/10 pb-6 pt-8 ${isPrinting ? 'hidden' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                Rapports Opérationnels
              </h1>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-lg shadow-lg shadow-slate-900/10">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Missions & Mobilité</span>
                </div>
                <span className="h-4 w-px bg-slate-200" />
                <span className="text-slate-500 font-bold uppercase text-[11px] tracking-widest flex items-center gap-2">
                  <Printer className="h-3.5 w-3.5" /> Centre d'Impression
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`container mx-auto px-4 py-8 space-y-8 ${isPrinting ? 'p-0' : ''}`}>
        {/* Filtres Premium */}
        <div className={isPrinting ? 'hidden' : ''}>
          <Card className="border-none bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white/20 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Configuration du Rapport</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="grid gap-3 flex-1 w-full">
                  <Label htmlFor="year" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Année Fiscale</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger id="year" className="h-12 rounded-2xl border-slate-200 bg-white/50 shadow-sm focus:ring-2 focus:ring-slate-900 transition-all font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                      {years.map(y => <SelectItem key={y} value={y} className="focus:bg-slate-900 focus:text-white rounded-xl mx-1 my-0.5">{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 flex-1 w-full">
                  <Label htmlFor="month" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Période Mensuelle</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger id="month" className="h-12 rounded-2xl border-slate-200 bg-white/50 shadow-sm focus:ring-2 focus:ring-slate-900 transition-all font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                      {months.map(m => <SelectItem key={m.value} value={m.value} className="focus:bg-slate-900 focus:text-white rounded-xl mx-1 my-0.5 uppercase text-[10px] font-black tracking-widest">{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={generateReport} 
                  disabled={loading} 
                  className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-400" /> : <FileText className="mr-2 h-4 w-4 text-emerald-400" />}
                  Générer Rapport
                </Button>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mt-6 rounded-2xl border-rose-100 bg-rose-50/50">
                  <AlertTitle className="font-black uppercase text-[10px] tracking-widest">Erreur Système</AlertTitle>
                  <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
        
        {reportData && (
          <Card className={`border-none bg-white rounded-[2.5rem] shadow-2xl overflow-hidden ${isPrinting ? 'shadow-none' : ''}`}>
            <CardHeader className="p-8 border-b border-slate-50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                            <FileText className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">Synthèse Globale - {selectedPeriodText}</CardTitle>
                        </div>
                        <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {reportData.missions.length} mission(s) identifiée(s) pour cette période administrative.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end mr-4">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Impact Budgétaire</span>
                        <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(reportData.totalCost)}</span>
                      </div>
                      {!isPrinting && (
                        <Button 
                          variant="outline" 
                          onClick={handlePrint}
                          className="h-12 px-6 rounded-2xl border-slate-200 bg-white shadow-sm font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                        >
                            <Printer className="mr-2 h-4 w-4 text-blue-500" /> Imprimer
                        </Button>
                      )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-b border-slate-100 hover:bg-transparent">
                              <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[9px] text-slate-500">N° Mission</TableHead>
                              <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[9px] text-slate-500">Désignation</TableHead>
                              <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[9px] text-slate-500 text-center">Période</TableHead>
                              <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[9px] text-slate-500 text-center">Agents</TableHead>
                              <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[9px] text-slate-500 text-right">Coût Previsionnel</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {reportData.missions.length > 0 ? (
                            reportData.missions.map(mission => (
                                <TableRow key={mission.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                    <TableCell className="py-5 px-8 font-black text-xs text-slate-900">{mission.numeroMission}</TableCell>
                                    <TableCell className="py-5 px-8">
                                      <div className="flex flex-col">
                                        <span className="font-bold text-sm text-slate-700 uppercase tracking-tight">{mission.title}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{mission.lieuMission || "National"}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-5 px-8 text-center">
                                      <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                                        <Calendar className="h-3 w-3" />
                                        {format(parseISO(mission.startDate), 'dd/MM/yy')} - {format(parseISO(mission.endDate), 'dd/MM/yy')}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-5 px-8 text-center text-sm font-black text-slate-900">{mission.participants.length}</TableCell>
                                    <TableCell className="py-5 px-8 text-right font-black text-slate-900">{formatCurrency(calculateMissionCost(mission))}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-20 bg-slate-50/30">
                                <div className="flex flex-col items-center gap-2">
                                  <FileText className="h-10 w-10 text-slate-200" />
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Aucun enregistrement pour cette période.</p>
                                </div>
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
          </Card>
        )}

        {!reportData && !loading && !isPrinting && (
          <div className="bg-white/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-200 h-96 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
              <div className="h-20 w-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-200 mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="h-10 w-10" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 max-w-[240px] text-center leading-loose">
                  Sélectionnez une période et <br /> lancez la génération du rapport
              </p>
          </div>
        )}
      </div>
      
      {isPrinting && reportData && (
          <MissionsOfficialReport 
            missions={reportData.missions} 
            organizationSettings={settings} 
            fiscalYear={year} 
            periodText={selectedPeriodText} 
            totalBudget={reportData.totalCost} 
          />
      )}
    </div>
  );
}

function Calendar({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" x2="16" y1="2" y2="6"/>
            <line x1="8" x2="8" y1="2" y2="6"/>
            <line x1="3" x2="21" y1="10" y2="10"/>
        </svg>
    );
}
