
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
    <>
    <div className={`flex flex-col gap-6 ${isPrinting ? 'print-hidden' : ''}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rapport des Missions</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Générateur de Rapport</CardTitle>
          <CardDescription>
            Filtrez et générez un rapport détaillé sur les missions et leurs coûts pour une période spécifique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end mb-6 p-4 border rounded-lg max-w-md">
            <div className="grid gap-2 flex-1 w-full">
              <Label htmlFor="year">Année</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 flex-1 w-full">
              <Label htmlFor="month">Mois</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger id="month"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateReport} disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Générer le rapport
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {reportData && (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Rapport pour {selectedPeriodText}</CardTitle>
                        <CardDescription>
                            Total de {reportData.missions.length} mission(s) pour un coût global de {formatCurrency(reportData.totalCost)}.
                        </CardDescription>
                    </div>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>N° Mission</TableHead>
                            <TableHead>Titre</TableHead>
                            <TableHead>Période</TableHead>
                            <TableHead className="text-center">Participants</TableHead>
                            <TableHead className="text-right">Coût Total</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {reportData.missions.length > 0 ? (
                            reportData.missions.map(mission => (
                                <TableRow key={mission.id}>
                                    <TableCell className="font-mono">{mission.numeroMission}</TableCell>
                                    <TableCell className="font-medium">{mission.title}</TableCell>
                                    <TableCell>{format(parseISO(mission.startDate), 'dd/MM/yyyy')} - {format(parseISO(mission.endDate), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-center">{mission.participants.length}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(calculateMissionCost(mission))}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                Aucune mission pour la période sélectionnée.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}

      {!reportData && !loading && (
        <Card className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12" />
                <p className="mt-4">Veuillez sélectionner une période et générer un rapport.</p>
            </div>
        </Card>
      )}
    </div>
    
    {isPrinting && reportData && (
        <div id="print-section" className="bg-white text-black p-8 font-sans">
             <div className="text-center mb-8">
                <h1 className="text-xl font-bold">RAPPORT MENSUEL DES MISSIONS</h1>
                <h2 className="text-lg">Période de {selectedPeriodText}</h2>
            </div>
            <table className="w-full text-xs border-collapse border border-black">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="border border-black p-2 text-left">N° Mission</th>
                        <th className="border border-black p-2 text-left">Titre</th>
                        <th className="border border-black p-2 text-left">Période</th>
                        <th className="border border-black p-2 text-center">Participants</th>
                        <th className="border border-black p-2 text-right">Coût Total</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.missions.map(mission => (
                        <tr key={mission.id}>
                            <td className="border border-black p-1">{mission.numeroMission}</td>
                            <td className="border border-black p-1">{mission.title}</td>
                            <td className="border border-black p-1">{format(parseISO(mission.startDate), 'dd/MM/yy')} - {format(parseISO(mission.endDate), 'dd/MM/yy')}</td>
                            <td className="border border-black p-1 text-center">{mission.participants.length}</td>
                            <td className="border border-black p-1 text-right">{formatCurrency(calculateMissionCost(mission))}</td>
                        </tr>
                    ))}
                    <tr className="font-bold bg-gray-100">
                        <td colSpan={4} className="text-right p-2 border border-black">TOTAL GÉNÉRAL :</td>
                        <td className="text-right p-2 border border-black">{formatCurrency(reportData.totalCost)}</td>
                    </tr>
                </tbody>
            </table>
            <footer className="mt-12 text-center text-xs text-gray-500">
                <p>Rapport généré le {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                 <div className="mt-4"><p className="page-number"></p></div>
            </footer>
        </div>
    )}
    </>
  );
}
