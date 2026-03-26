
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { conflictTypes, conflictStatuses } from "@/lib/data";
import { Loader2, Printer, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrintLayout } from "@/components/reports/print-layout";
import { useAuth } from "@/hooks/use-auth";

import { AnnualReportLayout } from "@/components/reports/annual-report-layout";

interface ReportData {
  conflicts: Conflict[];
}

export default function ConflictReportPage() {
  const { settings } = useAuth();
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [reportTemplate, setReportTemplate] = useState<"standard" | "official">("standard");
  const [statusFilter, setStatusFilter] = useState<"all" | Conflict['status']>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ConflictType>("all");
  
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { value: "all", label: "Toute l'année" },
    ...Array.from({ length: 12 }, (_, i) => ({ 
        value: (i + 1).toString(), 
        label: format(new Date(2000, i, 1), 'MMMM', { locale: fr }) 
    }))
  ];
  
  const selectedPeriodText = month === "all" 
    ? `Année ${year}` 
    : `${months.find(m => m.value === month)?.label || ''} ${year}`;

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    const selectedYear = parseInt(year);

    try {
      const allConflicts = await getConflicts();

      let periodStart: Date;
      let periodEnd: Date;

      if (month === "all") {
        periodStart = new Date(selectedYear, 0, 1);
        periodEnd = new Date(selectedYear, 11, 31, 23, 59, 59);
      } else {
        const selectedMonth = parseInt(month) - 1;
        periodStart = startOfMonth(new Date(selectedYear, selectedMonth));
        periodEnd = endOfMonth(new Date(selectedYear, selectedMonth));
      }

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
      
      startTransition(() => {
        setReportData({
          conflicts: filteredConflicts,
        });
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
      }, 1500);
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
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end p-4 border rounded-lg bg-slate-50/50">
              <div className="grid gap-2 flex-1 w-full">
                <Label htmlFor="year">Année</Label>
                <Select value={year} onValueChange={(val) => startTransition(() => setYear(val))}>
                  <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 flex-1 w-full">
                <Label htmlFor="month">Période</Label>
                <Select value={month} onValueChange={(val) => startTransition(() => setMonth(val))}>
                  <SelectTrigger id="month"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 flex-1 w-full">
                  <Label htmlFor="template">Modèle de Rapport</Label>
                   <Select value={reportTemplate} onValueChange={(val: any) => startTransition(() => setReportTemplate(val))}>
                  <SelectTrigger id="template"><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="standard">Standard (Tableau)</SelectItem>
                      <SelectItem value="official">Officiel (CNRCT)</SelectItem>
                  </SelectContent>
                  </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end p-4 border rounded-lg">
               <div className="grid gap-2 flex-1 w-full">
                  <Label htmlFor="typeFilter">Type de Conflit</Label>
                   <Select value={typeFilter} onValueChange={(val: any) => startTransition(() => setTypeFilter(val))}>
                  <SelectTrigger id="typeFilter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {conflictTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                  </Select>
              </div>
               <div className="grid gap-2 flex-1 w-full">
                  <Label htmlFor="statusFilter">Statut</Label>
                   <Select value={statusFilter} onValueChange={(val: any) => startTransition(() => setStatusFilter(val))}>
                  <SelectTrigger id="statusFilter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      {conflictStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                  </Select>
              </div>
              <Button onClick={generateReport} disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Générer les données
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
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
                        <CardTitle>Aperçu du Rapport : {selectedPeriodText}</CardTitle>
                        <CardDescription>
                            {reportData.conflicts.length} conflit(s) trouvé(s). 
                            Modèle sélectionné : <span className="font-bold text-primary">{reportTemplate === 'standard' ? 'Standard' : 'Officiel CNRCT'}</span>
                        </CardDescription>
                    </div>
                    <Button variant="default" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer le rapport
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>N°</TableHead>
                            <TableHead>Lieu</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Parties / Impact</TableHead>
                            <TableHead>Statut</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {reportData.conflicts.length > 0 ? (
                            reportData.conflicts.map((conflict, index) => (
                                <TableRow key={conflict.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="font-bold">{conflict.village}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase">{conflict.district} - {conflict.region}</div>
                                    </TableCell>
                                    <TableCell>{conflict.type}</TableCell>
                                    <TableCell>{format(parseISO(conflict.reportedDate), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="max-w-xs">
                                        <div className="truncate font-medium">{conflict.parties || 'N/A'}</div>
                                        <div className="text-[10px] truncate italic">{conflict.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{conflict.status}</Badge>
                                    </TableCell>
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
        <Card className="flex items-center justify-center h-64 border-dashed">
            <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 opacity-20" />
                <p className="mt-4">Veuillez sélectionner les critères et cliquer sur "Générer les données".</p>
            </div>
        </Card>
      )}

    </div>
    
    {isPrinting && reportData && settings && (
         reportTemplate === "standard" ? (
             <PrintLayout
                logos={settings}
                title="RAPPORT DES CONFLITS"
                subtitle={`Période : ${selectedPeriodText}`}
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
         ) : (
            <AnnualReportLayout 
                logos={settings}
                conflicts={reportData.conflicts}
                periodLabel={selectedPeriodText}
            />
         )
    )}
    </>
  );
}
