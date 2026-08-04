"use client";

import { useState, useTransition, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { getLeaves } from "@/services/leave-service";
import { getEmployees } from "@/services/employee-service";
import type { Leave, Employe } from "@/lib/data";
import { Loader2, Printer, FileText, Calendar, User, Clock, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, eachDayOfInterval, getDay, startOfMonth, endOfMonth, max, min } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LeaveOfficialReport } from "@/components/reports/leave-official-report";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/lib/data";

interface ReportData {
  leaves: Leave[];
  totalDaysInPeriod: number;
  periodStart: Date;
  periodEnd: Date;
}

export default function LeaveReportPage() {
  const [reportType, setReportType] = useState<"Mensuel" | "Annuel" | "Période">("Mensuel");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Approuvé" | "Rejeté" | "En attente">("all");
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [organizationLogos, setOrganizationLogos] = useState<OrganizationSettings | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getOrganizationSettings().then(setOrganizationLogos);
    getEmployees().then(setEmployees).catch(console.error);
  }, []);
  
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: format(new Date(2000, i, 1), 'MMMM', { locale: fr }) }));
  
  let selectedPeriodText = "";
  if (reportType === "Mensuel") {
    selectedPeriodText = `${months.find(m => m.value === month)?.label || ''} ${year}`;
  } else if (reportType === "Annuel") {
    selectedPeriodText = `Année ${year}`;
  } else {
    if (customStartDate && customEndDate) {
      try {
        selectedPeriodText = `du ${format(parseISO(customStartDate), 'dd/MM/yyyy')} au ${format(parseISO(customEndDate), 'dd/MM/yyyy')}`;
      } catch {
        selectedPeriodText = "Période personnalisée";
      }
    } else {
      selectedPeriodText = "Période personnalisée";
    }
  }

  const selectedEmployeeName = selectedEmployeeId !== "all" 
    ? employees.find(e => e.id === selectedEmployeeId)?.name || "Employé"
    : "";

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

    let periodStart: Date;
    let periodEnd: Date;

    if (reportType === "Mensuel") {
      const selectedYear = parseInt(year);
      const selectedMonth = parseInt(month) - 1;
      periodStart = startOfMonth(new Date(selectedYear, selectedMonth));
      periodEnd = endOfMonth(new Date(selectedYear, selectedMonth));
    } else if (reportType === "Annuel") {
      const selectedYear = parseInt(year);
      periodStart = new Date(selectedYear, 0, 1);
      periodEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
    } else {
      if (!customStartDate || !customEndDate) {
        setError("Veuillez sélectionner les dates de début et de fin de la période.");
        setLoading(false);
        return;
      }
      periodStart = parseISO(customStartDate);
      periodEnd = parseISO(customEndDate);
      if (periodStart > periodEnd) {
        setError("La date de début doit être antérieure à la date de fin.");
        setLoading(false);
        return;
      }
    }

    try {
      const allLeaves = await getLeaves();

      const filteredLeaves = allLeaves.filter(l => {
        try {
            const leaveStart = parseISO(l.startDate);
            const leaveEnd = parseISO(l.endDate);
            const overlaps = leaveStart <= periodEnd && leaveEnd >= periodStart;
            const matchesStatus = statusFilter === "all" || l.status === statusFilter;
            
            const targetEmployee = employees.find(e => e.id === selectedEmployeeId);
            const matchesEmployee = selectedEmployeeId === "all" || 
                                    l.employeeId === selectedEmployeeId || 
                                    (targetEmployee && l.employee === targetEmployee.name);
                                    
            return overlaps && matchesStatus && matchesEmployee;
        } catch (e) {
            console.error("Invalid date format for leave:", l);
            return false;
        }
      });
      
      const totalDaysInPeriod = filteredLeaves.reduce((acc, leave) => acc + calculateWorkingDaysInPeriod(leave, periodStart, periodEnd), 0);

      setReportData({
        leaves: filteredLeaves,
        totalDaysInPeriod: totalDaysInPeriod,
        periodStart,
        periodEnd
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
  };

  const selectedEmployeeDetails = selectedEmployeeId !== "all" ? employees.find(e => e.id === selectedEmployeeId) : null;

  return (
    <>
    <div className={`flex flex-col gap-6 ${isPrinting ? 'print-hidden' : ''}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rapport des Congés</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Générateur de Rapport de Congés</CardTitle>
          <CardDescription>
            Configurez et générez des rapports de congés par employé, par période personnalisée ou par année.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6 p-4 border rounded-lg bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="grid gap-2 w-full">
                <Label htmlFor="reportType">Type de rapport</Label>
                <Select value={reportType} onValueChange={(val: any) => startTransition(() => setReportType(val))}>
                  <SelectTrigger id="reportType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensuel">Mensuel</SelectItem>
                    <SelectItem value="Annuel">Annuel</SelectItem>
                    <SelectItem value="Période">Période personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 w-full">
                <Label htmlFor="employee">Employé</Label>
                <Select value={selectedEmployeeId} onValueChange={(val) => startTransition(() => setSelectedEmployeeId(val))}>
                  <SelectTrigger id="employee"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les employés</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.lastName && emp.firstName ? `${emp.lastName.toUpperCase()} ${emp.firstName}` : emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 w-full">
                <Label htmlFor="statusFilter">Statut</Label>
                <Select value={statusFilter} onValueChange={(val: any) => startTransition(() => setStatusFilter(val))}>
                  <SelectTrigger id="statusFilter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Approuvé">Approuvé</SelectItem>
                    <SelectItem value="En attente">En attente</SelectItem>
                    <SelectItem value="Rejeté">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportType === "Mensuel" && (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="grid gap-2">
                    <Label htmlFor="month">Mois</Label>
                    <Select value={month} onValueChange={(val) => startTransition(() => setMonth(val))}>
                      <SelectTrigger id="month"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="year">Année</Label>
                    <Select value={year} onValueChange={(val) => startTransition(() => setYear(val))}>
                      <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {reportType === "Annuel" && (
                <div className="grid gap-2 w-full">
                  <Label htmlFor="year">Année</Label>
                  <Select value={year} onValueChange={(val) => startTransition(() => setYear(val))}>
                    <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {reportType === "Période" && (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Début</Label>
                    <Input id="startDate" type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">Fin</Label>
                    <Input id="endDate" type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t mt-4">
              <Button onClick={generateReport} disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Générer le rapport
              </Button>
            </div>
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
                        <CardTitle>
                          Rapport {selectedEmployeeId !== "all" ? `de ${selectedEmployeeName}` : "Général"} - {selectedPeriodText}
                        </CardTitle>
                        <CardDescription>
                          {selectedEmployeeDetails && (
                            <span className="font-bold text-emerald-700 block mb-1">
                              Solde de congés restants : {selectedEmployeeDetails.solde_conges ?? 30} jour(s)
                            </span>
                          )}
                          Total de {reportData.leaves.length} demande(s) pour {reportData.totalDaysInPeriod} jour(s) de congé dans la période.
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
                                const daysInPeriod = calculateWorkingDaysInPeriod(leave, reportData.periodStart, reportData.periodEnd);
                                return (
                                <TableRow key={leave.id}>
                                    <TableCell className="font-medium">{leave.employee}</TableCell>
                                    <TableCell>{leave.type}</TableCell>
                                    <TableCell>{format(parseISO(leave.startDate), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>{format(parseISO(leave.endDate), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-center font-bold">{daysInPeriod}</TableCell>
                                    <TableCell>{leave.status}</TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                                Aucune donnée de congé pour les critères sélectionnés.
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
                <p className="mt-4">Veuillez configurer les filtres et générer un rapport.</p>
            </div>
        </Card>
      )}

    </div>
    
    {reportData && (
        <LeaveOfficialReport 
            leaves={reportData.leaves}
            logos={organizationLogos}
            selectedPeriodText={selectedPeriodText}
            totalDaysInPeriod={reportData.totalDaysInPeriod}
            isPrinting={isPrinting}
            onAfterPrint={() => setIsPrinting(false)}
            calculateWorkingDaysInPeriod={(l) => calculateWorkingDaysInPeriod(
                l, 
                reportData.periodStart, 
                reportData.periodEnd
            )}
            employeeName={selectedEmployeeId !== "all" ? selectedEmployeeName : undefined}
            employeeBalance={selectedEmployeeId !== "all" ? (selectedEmployeeDetails?.solde_conges ?? 30) : undefined}
        />
    )}
    </>
  );
}
