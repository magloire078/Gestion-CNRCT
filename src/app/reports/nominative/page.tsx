
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
import type { Employe } from "@/lib/data";
import { Loader2, FileText, Check, ChevronsUpDown, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { parseISO, differenceInCalendarYears, getYear, format, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';

type PeriodOption = "last3years" | "alltime";

interface ReportData {
  employee: Employe;
  period: PeriodOption;
  annualSalaries: { year: number; months: { month: string; gross: number }[]; total: number }[];
  grandTotal: number;
}

export default function NominativeReportPage() {
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [periodOption, setPeriodOption] = useState<PeriodOption>("last3years");
  
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const data = await getEmployees();
        setEmployees(data.filter(e => e.status === 'Actif'));
      } catch (err) {
        setError("Impossible de charger la liste des employés.");
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  const generateReport = async () => {
    if (!selectedEmployeeId) {
      setError("Veuillez sélectionner un employé.");
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
      const currentYear = getYear(new Date());
      
      let startYear, endYear;
      if (periodOption === 'last3years') {
          startYear = currentYear - 2;
          endYear = currentYear;
      } else {
          startYear = getYear(hireDate);
          endYear = currentYear;
      }

      const annualSalaries = [];
      let grandTotal = 0;

      for (let year = startYear; year <= endYear; year++) {
          const monthlyData = [];
          let yearTotal = 0;
          for (let month = 0; month < 12; month++) {
              const payslipDate = new Date(year, month, 15);
              if (payslipDate < hireDate) {
                  monthlyData.push({ month: fr.localize?.month(month, { width: 'short' }) || '', gross: 0 });
                  continue;
              }

              const details = await getPayslipDetails(employee, payslipDate.toISOString().split('T')[0]);
              const grossSalary = details.totals.brutImposable;
              monthlyData.push({ month: fr.localize?.month(month, { width: 'short' }) || '', gross: grossSalary });
              yearTotal += grossSalary;
          }
          annualSalaries.push({ year, months: monthlyData, total: yearTotal });
          grandTotal += yearTotal;
      }
      
      setReportData({ employee, period: periodOption, annualSalaries, grandTotal });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue lors de la génération du rapport.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  useEffect(() => {
    if (isPrinting) {
      document.body.classList.add('print-landscape');
      setTimeout(() => {
        window.print();
        document.body.classList.remove('print-landscape');
        setIsPrinting(false);
      }, 300);
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
          <div className="flex flex-col sm:flex-row gap-4 items-end mb-6 p-4 border rounded-lg max-w-xl">
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
              <Label htmlFor="period">Période</Label>
              <Select value={periodOption} onValueChange={(v: PeriodOption) => setPeriodOption(v)}>
                <SelectTrigger id="period"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="last3years">3 dernières années</SelectItem>
                  <SelectItem value="alltime">Toute la carrière</SelectItem>
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
                        <CardDescription>Période : {periodOption === 'last3years' ? '3 dernières années' : 'Toute la carrière'}</CardDescription>
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

     {isPrinting && reportData && (
        <div id="print-section" className="bg-white text-black p-8 font-sans">
             <div className="text-center mb-8">
                <h1 className="text-xl font-bold">TABLEAU NOMINATIF DES SALAIRES BRUTS</h1>
                <h2 className="text-lg">Employé : {reportData.employee.name} (Mle: {reportData.employee.matricule})</h2>
            </div>
            <table className="w-full text-xs border-collapse border border-black">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="border border-black p-1">Année</th>
                        {reportData.annualSalaries[0]?.months.map(m => <th key={m.month} className="border border-black p-1">{m.month}</th>)}
                        <th className="border border-black p-1">Total Annuel</th>
                    </tr>
                </thead>
                <tbody>
                     {reportData.annualSalaries.map(yearData => (
                        <tr key={yearData.year}>
                            <td className="border border-black p-1 text-center font-bold">{yearData.year}</td>
                            {yearData.months.map((m, i) => <td key={i} className="border border-black p-1 text-right">{m.gross > 0 ? m.gross.toLocaleString('fr-FR') : '-'}</td>)}
                            <td className="border border-black p-1 text-right font-bold">{yearData.total.toLocaleString('fr-FR')}</td>
                        </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                        <td colSpan={13} className="border border-black p-1 text-right">TOTAL GÉNÉRAL</td>
                        <td className="border border-black p-1 text-right">{reportData.grandTotal.toLocaleString('fr-FR')}</td>
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
