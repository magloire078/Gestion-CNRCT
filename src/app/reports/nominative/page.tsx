
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
import { Month } from "@/types/common";


interface ReportData {
  employee: Employe;
  startYear: number;
  endYear: number;
  annualSalaries: { year: number; months: { month: string; gross: number }[]; total: number }[];
  grandTotal: number;
}

import { PermissionGuard } from "@/components/auth/permission-guard";

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

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const monthLabels: Month[] = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
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
              monthlyData.push({ month: monthLabels[month], gross: grossSalary });
              yearTotal += grossSalary;
            } catch (e) {
              // It's normal to have errors for months where employee wasn't active, so we push 0
              monthlyData.push({ month: monthLabels[month], gross: 0 });
            }
          } else {
            monthlyData.push({ month: monthLabels[month], gross: 0 });
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
    <PermissionGuard permission="page:reports:view">
      <>
        <div className={`flex flex-col gap-10 pb-20 animate-in fade-in duration-1000 ${isPrinting ? 'print-hidden' : ''}`}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 print:hidden">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] shadow-sm">
                <FileText className="h-3.5 w-3.5" />
                Rapports Financiers
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-slate-900 md:text-6xl leading-none">
                Nominative <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-amber-600">Report</span>
              </h1>
              <p className="text-slate-500 font-medium max-w-xl text-lg leading-relaxed">
                Génération des relevés nominatifs de salaires bruts par employé pour les déclarations sociales.
              </p>
            </div>
          </div>
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white border border-slate-100/50">
            <CardHeader className="p-10 border-b border-slate-50">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/20">
                  <FileText className="h-8 w-8 text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Générateur de Rapport</CardTitle>
                  <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest leading-none mt-1">Configurez les paramètres de génération</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
                <div className="space-y-3">
                  <Label htmlFor="employee" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Employé</Label>
                  <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={isComboboxOpen} className="w-full h-16 rounded-2xl border-slate-100 bg-slate-50/50 shadow-inner px-6 justify-between font-black text-slate-700 hover:bg-slate-50">
                        {selectedEmployeeId ? employees.find(e => e.id === selectedEmployeeId)?.name : "Sélectionner..."}
                        <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl border-slate-100 overflow-hidden">
                      <Command>
                        <CommandInput placeholder="Rechercher un agent..." className="h-12 border-none focus:ring-0 font-bold" />
                        <CommandList>
                          <CommandEmpty className="p-4 text-xs font-bold text-slate-400 text-center">Aucun employé trouvé.</CommandEmpty>
                          <CommandGroup>
                            {employees.map(emp => (
                              <CommandItem key={emp.id} value={emp.name} onSelect={() => { setSelectedEmployeeId(emp.id); setIsComboboxOpen(false); }} className="p-3 font-bold text-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                                <span className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-[10px]">
                                    {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                  </div>
                                  {emp.name}
                                </span>
                                <Check className={cn("h-4 w-4 text-indigo-600", selectedEmployeeId === emp.id ? "opacity-100" : "opacity-0")} />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="startYear" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Année de début</Label>
                  <Select value={startYear} onValueChange={setStartYear}>
                    <SelectTrigger id="startYear" className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 shadow-inner px-6 font-black text-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl border-slate-100">
                      {yearOptions.map(y => <SelectItem key={y} value={y} className="font-bold">{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="endYear" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Année de fin</Label>
                  <Select value={endYear} onValueChange={setEndYear}>
                    <SelectTrigger id="endYear" className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 shadow-inner px-6 font-black text-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl border-slate-100">
                      {yearOptions.map(y => <SelectItem key={y} value={y} className="font-bold">{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={generateReport} 
                  disabled={isGenerating || loading} 
                  className="h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <FileText className="mr-3 h-5 w-5" />}
                  {isGenerating ? "Génération en cours..." : "Générer le Rapport"}
                </Button>
              </div>
              {error && (
                <Alert variant="destructive" className="mt-8 rounded-2xl bg-rose-50 border-rose-100 text-rose-900 p-6 flex flex-col gap-1">
                  <AlertTitle className="font-black uppercase tracking-widest text-[10px]">Erreur de configuration</AlertTitle>
                  <AlertDescription className="font-bold opacity-80">{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {reportData && (
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] overflow-hidden bg-white animate-in slide-in-from-bottom duration-700">
              <CardHeader className="p-10 border-b border-slate-50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-100">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Tableau Nominatif pour {reportData.employee.name}</CardTitle>
                      <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest leading-none mt-1">Relevé détaillé du {reportData.startYear} au {reportData.endYear}</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handlePrint} className="h-14 rounded-2xl px-6 border-slate-100 bg-slate-50 font-black text-slate-700 shadow-sm hover:bg-white transition-all">
                    <Printer className="mr-3 h-5 w-5" /> Imprimer le Relevé
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100">
                        <TableHead className="py-8 pl-10 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Année</TableHead>
                        {reportData.annualSalaries[0]?.months.map(m => (
                          <TableHead key={m.month} className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right px-4">
                            {m.month.substring(0, 3)}
                          </TableHead>
                        ))}
                        <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right pr-10">Total Annuel</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.annualSalaries.map(yearData => (
                        <TableRow key={yearData.year} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50">
                          <TableCell className="py-6 pl-10">
                            <span className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-slate-900 text-white font-black text-sm tracking-tighter">
                              {yearData.year}
                            </span>
                          </TableCell>
                          {yearData.months.map((m, i) => (
                            <TableCell key={i} className="text-right px-4">
                              <span className={cn(
                                "text-xs font-black tracking-tight",
                                m.gross > 0 ? "text-slate-900" : "text-slate-300"
                              )}>
                                {formatCurrency(m.gross)}
                              </span>
                            </TableCell>
                          ))}
                          <TableCell className="text-right pr-10">
                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
                              {formatCurrency(yearData.total)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-900 hover:bg-slate-900 border-none">
                        <TableCell colSpan={13} className="py-10 text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">TOTAL GÉNÉRAL CUMULÉ</span>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex flex-col items-end">
                            <span className="text-2xl font-black text-white tracking-tighter">
                              {formatCurrency(reportData.grandTotal)}
                            </span>
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1">Salaire Brut Global</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {!reportData && !isGenerating && (
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] overflow-hidden bg-slate-50/50 py-24 border border-slate-100/50">
              <div className="text-center space-y-6 max-w-sm mx-auto">
                <div className="h-24 w-24 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto shadow-inner group">
                  <FileText className="h-10 w-10 text-indigo-300 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Aucun rapport généré</h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    Veuillez sélectionner un employé et définir la période souhaitée dans le configurateur ci-dessus.
                  </p>
                </div>
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
    </PermissionGuard>
  );
}
