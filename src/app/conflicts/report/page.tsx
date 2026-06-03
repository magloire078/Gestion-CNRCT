
"use client";

import { useState, useTransition, useMemo } from "react";
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
import type { Conflict, ConflictType } from "@/lib/data";
import { conflictTypes, conflictStatuses } from "@/lib/data";
import { Loader2, Printer, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from "@/hooks/use-auth";
import { ConflictsOfficialReport } from "@/components/reports/conflicts-official-report";

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

  const stats = useMemo(() => {
    if (!reportData) return null;
    
    const conflicts = reportData.conflicts;
    const total = conflicts.length;
    const resolved = conflicts.filter(c => c.status === 'Résolu').length;
    const mediation = conflicts.filter(c => c.status === 'En médiation').length;
    const open = conflicts.filter(c => c.status === 'Ouvert').length;
    
    const typeCounts = conflicts.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    let topType = "Aucun";
    let maxCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
        if (count > maxCount) {
            maxCount = count;
            topType = type;
        }
    });

    return {
        total,
        resolved,
        mediation,
        open,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        topType
    };
  }, [reportData]);
  
  const handlePrint = () => {
    if (reportData && settings) {
      setIsPrinting(true);
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
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
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
        <ConflictsOfficialReport 
          conflicts={reportData.conflicts as any}
          organizationSettings={settings as any}
          subtitle={`Période : ${selectedPeriodText}`}
          isPrinting={isPrinting}
          onAfterPrint={() => setIsPrinting(false)}
          stats={stats || { 
            total: 0, 
            resolved: 0, 
            mediation: 0, 
            open: 0, 
            resolutionRate: 0, 
            topType: "N/A" 
          }}
        />
      )}
    </>
  );
}
