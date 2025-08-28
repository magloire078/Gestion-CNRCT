
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
import { getLeaves } from "@/services/leave-service";
import type { Leave } from "@/lib/data";
import { Loader2, Printer, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, eachDayOfInterval, getDay, startOfMonth, endOfMonth, max, min, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReportData {
  leaves: Leave[];
  totalDaysInPeriod: number;
}

export default function LeaveReportPage() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [statusFilter, setStatusFilter] = useState<"all" | "Approuvé" | "Rejeté" | "En attente">("all");
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: fr.localize?.month(i, { width: 'wide' }) }));
  
  const selectedPeriodText = `${months.find(m => m.value === month)?.label} ${year}`;

  const calculateWorkingDaysInPeriod = (leave: Leave, periodStart: Date, periodEnd: Date): number => {
    try {
      const leaveStart = parseISO(leave.startDate);
      const leaveEnd = parseISO(leave.endDate);

      // Determine the actual interval of the leave that falls within the report period
      const effectiveStart = max([leaveStart, periodStart]);
      const effectiveEnd = min([leaveEnd, periodEnd]);
      
      if (effectiveStart > effectiveEnd) return 0;

      const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
      return days.filter(day => getDay(day) !== 0).length; // Exclude Sundays
    } catch {
      return 0;
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    const selectedYear = parseInt(year);
    const selectedMonth = parseInt(month) - 1;

    try {
      const allLeaves = await getLeaves();

      const periodStart = startOfMonth(new Date(selectedYear, selectedMonth));
      const periodEnd = endOfMonth(new Date(selectedYear, selectedMonth));

      const filteredLeaves = allLeaves.filter(l => {
        try {
            const leaveStart = parseISO(l.startDate);
            const leaveEnd = parseISO(l.endDate);
            const overlaps = leaveStart <= periodEnd && leaveEnd >= periodStart;
            const matchesStatus = statusFilter === "all" || l.status === statusFilter;
            return overlaps && matchesStatus;
        } catch (e) {
            console.error("Invalid date format for leave:", l);
            return false;
        }
      });
      
      const totalDaysInPeriod = filteredLeaves.reduce((acc, leave) => acc + calculateWorkingDaysInPeriod(leave, periodStart, periodEnd), 0);

      setReportData({
        leaves: filteredLeaves,
        totalDaysInPeriod: totalDaysInPeriod,
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

  return (
    <>
    <div className={`flex flex-col gap-6 ${isPrinting ? 'print-hidden' : ''}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rapport des Congés</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Générateur de Rapport</CardTitle>
          <CardDescription>
            Filtrez et générez un rapport détaillé sur les congés des employés pour une période spécifique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end mb-6 p-4 border rounded-lg">
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
                  {months.map(m => <SelectItem key={m.value} value={m.label}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="grid gap-2 flex-1 w-full">
                <Label htmlFor="statusFilter">Statut</Label>
                <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger id="statusFilter"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Approuvé">Approuvé</SelectItem>
                    <SelectItem value="En attente">En attente</SelectItem>
                    <SelectItem value="Rejeté">Rejeté</SelectItem>
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
                        <CardDescription>Total de {reportData.leaves.length} demande(s) pour {reportData.totalDaysInPeriod} jour(s) dans la période.</CardDescription>
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
                            <TableHead>Employé</TableHead>
                            <TableHead>Type de Congé</TableHead>
                            <TableHead>Date de Début</TableHead>
                            <TableHead>Date de Fin</TableHead>
                            <TableHead className="text-center">Jours (période)</TableHead>
                            <TableHead>Statut</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {reportData.leaves.length > 0 ? (
                            reportData.leaves.map(leave => {
                                const daysInPeriod = calculateWorkingDaysInPeriod(leave, startOfMonth(new Date(parseInt(year), parseInt(month) - 1)), endOfMonth(new Date(parseInt(year), parseInt(month) - 1)));
                                return (
                                <TableRow key={leave.id}>
                                    <TableCell className="font-medium">{leave.employee}</TableCell>
                                    <TableCell>{leave.type}</TableCell>
                                    <TableCell>{format(parseISO(leave.startDate), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>{format(parseISO(leave.endDate), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-center">{daysInPeriod}</TableCell>
                                    <TableCell>{leave.status}</TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                Aucune donnée de congé pour la période sélectionnée.
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
                <h1 className="text-xl font-bold">RAPPORT MENSUEL DES CONGÉS</h1>
                <h2 className="text-lg">Période de {selectedPeriodText}</h2>
            </div>
            <table className="w-full text-xs border-collapse border border-black">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="border border-black p-2 text-left">Employé</th>
                        <th className="border border-black p-2 text-left">Type de Congé</th>
                        <th className="border border-black p-2 text-left">Date de Début</th>
                        <th className="border border-black p-2 text-left">Date de Fin</th>
                        <th className="border border-black p-2 text-center">Jours (période)</th>
                        <th className="border border-black p-2 text-left">Statut</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.leaves.map(leave => (
                        <tr key={leave.id}>
                            <td className="border border-black p-2">{leave.employee}</td>
                            <td className="border border-black p-2">{leave.type}</td>
                            <td className="border border-black p-2">{format(parseISO(leave.startDate), 'dd/MM/yyyy')}</td>
                            <td className="border border-black p-2">{format(parseISO(leave.endDate), 'dd/MM/yyyy')}</td>
                            <td className="border border-black p-2 text-center">{calculateWorkingDaysInPeriod(leave, startOfMonth(new Date(parseInt(year), parseInt(month) - 1)), endOfMonth(new Date(parseInt(year), parseInt(month) - 1)))}</td>
                            <td className="border border-black p-2">{leave.status}</td>
                        </tr>
                    ))}
                </tbody>
                 <tfoot>
                    <tr className="font-bold bg-gray-100">
                        <td colSpan={4} className="text-right p-2 border border-black">Total de jours de congé dans la période :</td>
                        <td className="text-center p-2 border border-black">{reportData.totalDaysInPeriod}</td>
                        <td className="border border-black"></td>
                    </tr>
                </tfoot>
            </table>
             <footer className="mt-12 text-center text-xs text-gray-500">
                <p>Rapport généré le {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            </footer>
        </div>
    )}
    </>
  );
}
