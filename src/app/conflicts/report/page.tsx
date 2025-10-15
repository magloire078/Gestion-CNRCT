
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
import { getConflicts } from "@/services/conflict-service";
import type { Conflict, ConflictType, OrganizationSettings } from "@/lib/data";
import { Loader2, Printer, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrintLayout } from "@/components/reports/print-layout";
import { useAuth } from "@/hooks/use-auth";

interface ReportData {
  conflicts: Conflict[];
}

export default function ConflictReportPage() {
  const { settings } = useAuth();
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [statusFilter, setStatusFilter] = useState<"all" | Conflict['status']>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ConflictType>("all");
  
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: format(new Date(2000, i, 1), 'MMMM', { locale: fr }) }));
  const conflictTypes: ConflictType[] = ["Foncier", "Succession", "Intercommunautaire", "Politique", "Autre"];
  const conflictStatuses: Conflict['status'][] = ["En cours", "Résolu", "En médiation"];
  
  const selectedPeriodText = `${months.find(m => m.value === month)?.label || ''} ${year}`;

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    const selectedYear = parseInt(year);
    const selectedMonth = parseInt(month) - 1;

    try {
      const allConflicts = await getConflicts();

      const periodStart = startOfMonth(new Date(selectedYear, selectedMonth));
      const periodEnd = endOfMonth(new Date(selectedYear, selectedMonth));

      const filteredConflicts = allConflicts.filter(c => {
        try {
            const conflictDate = parseISO(c.reportedDate);
            const isInPeriod = conflictDate >= periodStart && conflictDate <= periodEnd;
            const matchesStatus = statusFilter === "all" || c.status === statusFilter;
            const matchesType = typeFilter === "all" || c.type === typeFilter;
            return isInPeriod && matchesStatus && matchesType;
        } catch (e) {
            console.error("Invalid date format for conflict:", c);
            return false;
        }
      });
      
      setReportData({
        conflicts: filteredConflicts,
      });

    } catch (err) {
      console.error(err);
      setError("Impossible de générer le rapport. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrint = () => {
    if (reportData && settings) {
      setIsPrinting(true);
      setTimeout(() => {
          window.print();
          setIsPrinting(false);
      }, 300);
    }
  };

  return (
    <>
    <div className={`flex flex-col gap-6 ${isPrinting ? 'print-hidden' : ''}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rapport des Conflits</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Générateur de Rapport</CardTitle>
          <CardDescription>
            Filtrez et générez un rapport détaillé sur les conflits pour une période spécifique.
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
                  {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="grid gap-2 flex-1 w-full">
                <Label htmlFor="typeFilter">Type</Label>
                <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
                <SelectTrigger id="typeFilter"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {conflictTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
                </Select>
            </div>
             <div className="grid gap-2 flex-1 w-full">
                <Label htmlFor="statusFilter">Statut</Label>
                <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger id="statusFilter"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {conflictStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
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
                        <CardDescription>Total de {reportData.conflicts.length} conflit(s) pour la période.</CardDescription>
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
                            <TableHead>N°</TableHead>
                            <TableHead>Village</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Statut</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {reportData.conflicts.length > 0 ? (
                            reportData.conflicts.map((conflict, index) => (
                                <TableRow key={conflict.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium">{conflict.village}</TableCell>
                                    <TableCell>{conflict.type}</TableCell>
                                    <TableCell>{format(parseISO(conflict.reportedDate), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="max-w-xs truncate">{conflict.description}</TableCell>
                                    <TableCell>{conflict.status}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                Aucun conflit pour la période et les filtres sélectionnés.
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
    
    {isPrinting && reportData && settings && (
         <PrintLayout
            logos={settings}
            title="RAPPORT MENSUEL DES CONFLITS"
            subtitle={`Période de ${selectedPeriodText}`}
            columns={[
                { header: 'N°', key: 'index', align: 'center' },
                { header: 'Village', key: 'village' },
                { header: 'Type', key: 'type' },
                { header: 'Date', key: 'date' },
                { header: 'Description', key: 'description' },
                { header: 'Statut', key: 'status' },
            ]}
            data={reportData.conflicts.map((conflict, index) => ({
                index: index + 1,
                village: conflict.village,
                type: conflict.type,
                date: format(parseISO(conflict.reportedDate), 'dd/MM/yyyy'),
                description: conflict.description,
                status: conflict.status,
            }))}
        />
    )}
    </>
  );
}
