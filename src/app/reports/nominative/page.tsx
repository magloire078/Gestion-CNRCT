
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { getEmployees } from "@/services/employee-service";
import { getPayslipDetails } from "@/services/payslip-details-service";
import type { Employe, OrganizationSettings } from "@/lib/data";
import { Loader2, FileText, Check, ChevronsUpDown, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { parseISO, differenceInCalendarYears, getYear, format, startOfYear, endOfYear, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getOrganizationSettings } from "@/services/organization-service";
import { PrintLayout } from "@/components/reports/print-layout";


interface ReportData {
  employee: Employe;
  startYear: number;
  endYear: number;
  annualSalaries: { year: number; months: { month: string; gross: number }[]; total: number }[];
  grandTotal: number;
}

export default function NominativeReportPage() {
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [startYear, setStartYear] = useState<string>((new Date().getFullYear() - 2).toString());
  const [endYear, setEndYear] = useState<string>(new Date().getFullYear().toString());
  
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [organizationLogos, setOrganizationLogos] = useState<OrganizationSettings | null>(null);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [data, settings] = await Promise.all([
          getEmployees(),
          getOrganizationSettings(),
        ]);
        setEmployees(data);
        setOrganizationLogos(settings);
      } catch (err) {
        setError("Impossible de charger les données initiales.");
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, []);
  
  const yearOptions = useMemo(() => {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());
  }, []);


  const generateReport = async () => {
    if (!selectedEmployeeId) {
      setError("Veuillez sélectionner un employé.");
      return;
    }
     const start = parseInt(startYear);
     const end = parseInt(endYear);

    if (start > end) {
        setError("L'année de début ne peut pas être postérieure à l'année de fin.");
        return;
    }

    setIsGenerating(true);
    setError(null);
    setReportData(null);

    try {
      const employee = employees.find(e => e.id === selectedEmployeeId);
      if (!employee || !employee.dateEmbauche) {
        throw new Error("L'employé sélectionné n'a pas de date d'embauche valide.");
      }
      
      const hireDate = parseISO(employee.dateEmbauche);
      
      const annualSalaries = [];
      let grandTotal = 0;

      for (let year = start; year <= end; year++) {
          const monthlyData = [];
          let yearTotal = 0;
          for (let month = 0; month < 12; month++) {
              const payslipDate = new Date(year, month, 15);
              
              if (isAfter(payslipDate, hireDate)) {
                  try {
                    const details = await getPayslipDetails(employee, payslipDate.toISOString().split('T')[0]);
                    const grossSalary = details.totals.brutImposable;
                    monthlyData.push({ month: fr.localize?.month(month, { width: 'short' }) || '', gross: grossSalary });
                    yearTotal += grossSalary;
                  } catch (e) {
                      // It's normal to have errors for months where employee wasn't active, so we push 0
                      monthlyData.push({ month: fr.localize?.month(month, { width: 'short' }) || '', gross: 0 });
                  }
              } else {
                  monthlyData.push({ month: fr.localize?.month(month, { width: 'short' }) || '', gross: 0 });
              }
          }
          annualSalaries.push({ year, months: monthlyData, total: yearTotal });
          grandTotal += yearTotal;
      }
      
      setReportData({ employee, startYear: start, endYear: end, annualSalaries, grandTotal });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue lors de la génération du rapport.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  useEffect(() => {
    if (isPrinting) {
      const style = document.createElement('style');
      style.id = 'print-landscape-style';
      style.innerHTML = `@media print { @page { size: landscape; margin: 1cm; } }`;
      document.head.appendChild(style);
      
      setTimeout(() => {
        window.print();
        const styleElement = document.getElementById('print-landscape-style');
        if (styleElement) {
            document.head.removeChild(styleElement);
        }
        setIsPrinting(false);
      }, 500); // Delay to ensure styles are applied
    }
  }, [isPrinting]);
  
  const handlePrint = () => {
    setIsPrinting(true);
  };
  
  const formatCurrency = (value: number) => value === 0 ? '-' : value.toLocaleString('fr-FR') + ' FCFA';

  return (
    <>
    <div className={`flex flex-col gap-6 ${isPrinting ? 'print-hidden' : ''}`}>
      <h1 className="text-3xl font-bold tracking-tight">Rapport Nominatif des Salaires</h1>
      <Card>
        <CardHeader>
          <CardTitle>Générateur de Rapport</CardTitle>
          <CardDescription>
            Sélectionnez un employé et une période pour générer le tableau récapitulatif de ses salaires bruts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end mb-6 p-4 border rounded-lg max-w-2xl">
            <div className="grid gap-2 flex-1 w-full">
              <Label htmlFor="employee">Employé</Label>
               <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={isComboboxOpen} className="w-full justify-between font-normal">
                        {selectedEmployeeId ? employees.find(e => e.id === selectedEmployeeId)?.name : "Sélectionnez un employé..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Rechercher..." />
                        <CommandList><CommandEmpty>Aucun employé trouvé.</CommandEmpty><CommandGroup>
                            {employees.map(emp => (
                                <CommandItem key={emp.id} value={emp.name} onSelect={() => { setSelectedEmployeeId(emp.id); setIsComboboxOpen(false); }}>
                                    <Check className={cn("mr-2 h-4 w-4", selectedEmployeeId === emp.id ? "opacity-100" : "opacity-0")} />
                                    {emp.name}
                                </CommandItem>
                            ))}
                        </CommandGroup></CommandList>
                    </Command>
                </PopoverContent>
               </Popover>
            </div>
             <div className="grid gap-2 flex-1 w-full">
              <Label htmlFor="startYear">Année de début</Label>
              <Select value={startYear} onValueChange={setStartYear}>
                <SelectTrigger id="startYear"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 flex-1 w-full">
              <Label htmlFor="endYear">Année de fin</Label>
              <Select value={endYear} onValueChange={setEndYear}>
                <SelectTrigger id="endYear"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateReport} disabled={isGenerating || loading} className="w-full sm:w-auto">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Générer
            </Button>
          </div>
          {error && <Alert variant="destructive"><AlertTitle>Erreur</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        </CardContent>
      </Card>
      
      {reportData && (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Tableau Nominatif pour {reportData.employee.name}</CardTitle>
                        <CardDescription>Période du {reportData.startYear} au {reportData.endYear}</CardDescription>
                    </div>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimer
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold">Année</TableHead>
                                {reportData.annualSalaries[0]?.months.map(m => <TableHead key={m.month} className="text-right">{m.month}</TableHead>)}
                                <TableHead className="text-right font-bold">Total Annuel</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.annualSalaries.map(yearData => (
                                <TableRow key={yearData.year}>
                                    <TableCell className="font-bold">{yearData.year}</TableCell>
                                    {yearData.months.map((m, i) => <TableCell key={i} className="text-right font-mono text-xs">{formatCurrency(m.gross)}</TableCell>)}
                                    <TableCell className="text-right font-bold font-mono">{formatCurrency(yearData.total)}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-muted hover:bg-muted font-bold">
                                <TableCell colSpan={13} className="text-right">Total Général</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(reportData.grandTotal)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}

      {!reportData && !isGenerating && (
        <Card className="flex items-center justify-center min-h-[300px]">
            <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12" />
                <p className="mt-4">Veuillez sélectionner un employé et générer un rapport.</p>
            </div>
        </Card>
      )}
    </div>

     {isPrinting && reportData && organizationLogos && (
        <PrintLayout
            logos={organizationLogos}
            title="TABLEAU NOMINATIF DES SALAIRES BRUTS"
            subtitle={`Période du ${reportData.startYear} au ${reportData.endYear} pour ${reportData.employee.name} (Mle: ${reportData.employee.matricule})`}
            columns={[
                { header: "Année", key: "year" },
                ...(reportData.annualSalaries[0]?.months.map(m => ({ header: m.month.toUpperCase(), key: m.month, align: 'right' as const })) || []),
                { header: "Total Annuel", key: "total", align: 'right' as const },
            ]}
            data={[
                ...reportData.annualSalaries.map(yearData => {
                    const row: Record<string, any> = { year: yearData.year };
                    yearData.months.forEach(m => {
                        row[m.month] = yearData.total > 0 ? m.gross.toLocaleString('fr-FR') : '-';
                    });
                    row.total = yearData.total > 0 ? yearData.total.toLocaleString('fr-FR') : '-';
                    return row;
                }),
                // Add the total row
                (() => {
                    const totalRow: Record<string, any> = { year: "TOTAL GÉNÉRAL" };
                     // Calculate monthly totals
                    reportData.annualSalaries[0]?.months.forEach((_, monthIndex) => {
                        const monthKey = reportData.annualSalaries[0].months[monthIndex].month;
                        const monthlyTotal = reportData.annualSalaries.reduce((acc, yearData) => acc + yearData.months[monthIndex].gross, 0);
                        totalRow[monthKey] = monthlyTotal > 0 ? monthlyTotal.toLocaleString('fr-FR') : '-';
                    });
                    totalRow.total = reportData.grandTotal > 0 ? reportData.grandTotal.toLocaleString('fr-FR') : '-';
                    return totalRow;
                })()
            ]}
        />
     )}
    </>
  );
}
