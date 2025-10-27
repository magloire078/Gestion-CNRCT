
"use client";

import { useState, useEffect } from "react";
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
import { Loader2, FileText, Printer } from "lucide-react";
import { getEmployees } from "@/services/employee-service";
import { getPayslipDetails, type PayslipDetails } from "@/services/payslip-details-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, isValid, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/lib/data";

interface DisaRow {
  matricule: string;
  name: string;
  cnpsStatus: boolean;
  monthlySalaries: number[];
  totalBrut: number;
  totalCNPS: number;
}

export default function DisaReportPage() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<DisaRow[] | null>(null);
  const [organizationLogos, setOrganizationLogos] = useState<OrganizationSettings | null>(null);
  
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const monthLabels = Array.from({ length: 12 }, (_, i) => fr.localize?.month(i, { width: 'short' }).toUpperCase() || `M${i+1}`);

  const calculateAnnualData = async (payslipPromises: Promise<PayslipDetails>[]): Promise<{ monthlySalaries: number[], totalBrut: number, totalCNPS: number }> => {
    const monthlyDetails = await Promise.all(payslipPromises);
    const monthlySalaries = monthlyDetails.map(details => Math.round(details.totals.brutImposable));
    const totalBrut = monthlySalaries.reduce((sum, current) => sum + current, 0);
    const totalCNPS = monthlyDetails.reduce((sum, details) => sum + (details.deductions.find(d => d.label === 'CNPS')?.amount || 0), 0);
    
    return {
        monthlySalaries,
        totalBrut: Math.round(totalBrut),
        totalCNPS: Math.round(totalCNPS),
    };
  };
  
  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    const reportYear = parseInt(year);

    try {
      const allEmployees = await getEmployees();
      
      const employeesForYear = allEmployees.filter(e => {
        if (!e.matricule || !e.CNPS) return false;
        
        const hireDate = e.dateEmbauche ? parseISO(e.dateEmbauche) : null;
        if (!hireDate || !isValid(hireDate)) return false;

        let departureDate: Date | null = null;
        if (e.Date_Depart && isValid(parseISO(e.Date_Depart))) {
            departureDate = parseISO(e.Date_Depart);
        } else if (e.status === 'Actif' && e.Date_Naissance && isValid(parseISO(e.Date_Naissance))) {
            // Pour les employés actifs, on calcule une date de retraite théorique à 60 ans
            departureDate = addYears(parseISO(e.Date_Naissance), 60);
        }

        const hiredInTime = hireDate.getFullYear() <= reportYear;
        const notLeftTooEarly = !departureDate || departureDate.getFullYear() >= reportYear;

        return hiredInTime && notLeftTooEarly;
      });

      const logos = await getOrganizationSettings();
      setOrganizationLogos(logos);

      const reportRows: DisaRow[] = [];
      const matriculeSet = new Set<string>();

      for (const employee of employeesForYear) {
          if (matriculeSet.has(employee.matricule)) continue; // Ensure unique matricule per report
          matriculeSet.add(employee.matricule);

          const monthlyPayslipPromises: Promise<PayslipDetails>[] = [];
          for (let month = 0; month < 12; month++) {
              const date = new Date(reportYear, month, 15);
              const payslipDate = date.toISOString().split('T')[0];
              monthlyPayslipPromises.push(getPayslipDetails(employee, payslipDate));
          }
          const annualTotals = await calculateAnnualData(monthlyPayslipPromises);
          
          reportRows.push({
              matricule: employee.matricule,
              name: `${(employee.lastName || '').toUpperCase()} ${employee.firstName || ''}`.trim(),
              cnpsStatus: employee.CNPS || false,
              monthlySalaries: annualTotals.monthlySalaries,
              totalBrut: annualTotals.totalBrut,
              totalCNPS: annualTotals.totalCNPS,
          });
      }
      setReportData(reportRows);

    } catch (err) {
      console.error(err);
      setError("Impossible de générer le rapport. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => value === 0 ? '-' : Math.round(value).toLocaleString('fr-FR');
  
  const handlePrint = () => {
    setIsPrinting(true);
  };
  
 useEffect(() => {
    if (isPrinting) {
      const style = document.createElement('style');
      style.innerHTML = `@media print { @page { size: landscape; margin: 1cm; } }`;
      document.head.appendChild(style);
      
      setTimeout(() => {
        window.print();
        document.head.removeChild(style);
        setIsPrinting(false);
      }, 500);
    }
  }, [isPrinting]);
  
  const grandTotal = reportData?.reduce((acc, row) => {
    acc.brut += row.totalBrut;
    acc.cnps += row.totalCNPS;
    row.monthlySalaries.forEach((salary, index) => {
        acc.monthly[index] = (acc.monthly[index] || 0) + salary;
    });
    return acc;
  }, { brut: 0, cnps: 0, monthly: Array(12).fill(0) });

  return (
    <>
    <div className={`flex flex-col gap-6 ${isPrinting ? 'print-hidden' : ''}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rapport DISA (Déclaration des Salaires)</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Générateur de Rapport DISA Annuel</CardTitle>
          <CardDescription>
            Sélectionnez une année pour générer la déclaration individuelle des salaires pour tous les employés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end mb-6 p-4 border rounded-lg max-w-md">
            <div className="grid gap-2 flex-1 w-full">
              <Label htmlFor="year">Année de la déclaration</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
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
      
      {loading && (
          <div className="flex justify-center items-center h-64">
             <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
      )}

      {reportData && (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Rapport DISA pour {year}</CardTitle>
                        <CardDescription>Total de {reportData.length} employé(s) listé(s).</CardDescription>
                    </div>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-card z-10 w-16">N°</TableHead>
                                <TableHead className="sticky left-16 bg-card z-10 w-32">Matricule</TableHead>
                                <TableHead className="sticky left-48 bg-card z-10 min-w-[200px]">Nom et Prénoms</TableHead>
                                {monthLabels.map((m, i) => <TableHead key={`header-month-${i}`} className="text-right">{m}</TableHead>)}
                                <TableHead className="text-right font-bold">Total Brut</TableHead>
                                <TableHead className="text-right font-bold">Total CNPS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.map((row, index) => (
                                <TableRow key={row.matricule}>
                                    <TableCell className="sticky left-0 bg-card z-10">{index + 1}</TableCell>
                                    <TableCell className="sticky left-16 bg-card z-10">{row.matricule}</TableCell>
                                    <TableCell className="font-medium whitespace-nowrap sticky left-48 bg-card z-10">{row.name}</TableCell>
                                    {row.monthlySalaries.map((salary, i) => (
                                        <TableCell key={`${row.matricule}-month-${i}`} className="text-right font-mono text-xs">{formatCurrency(salary)}</TableCell>
                                    ))}
                                    <TableCell className="text-right font-mono font-bold">{formatCurrency(row.totalBrut)}</TableCell>
                                    <TableCell className="text-right font-mono font-bold">{formatCurrency(row.totalCNPS)}</TableCell>
                                </TableRow>
                            ))}
                            {grandTotal && (
                                <TableRow className="font-bold bg-muted hover:bg-muted">
                                    <TableCell colSpan={3} className="text-right sticky left-0 bg-muted z-10">TOTAUX</TableCell>
                                    {grandTotal.monthly.map((total, index) => (
                                        <TableCell key={`total-month-${index}`} className="text-right font-mono text-xs">{formatCurrency(total)}</TableCell>
                                    ))}
                                    <TableCell className="text-right font-mono">{formatCurrency(grandTotal.brut)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(grandTotal.cnps)}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}

      {!reportData && !loading && (
        <Card className="flex items-center justify-center min-h-[300px]">
            <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12" />
                <p className="mt-4">Veuillez sélectionner une année et générer un rapport.</p>
            </div>
        </Card>
      )}
    </div>
    
     {isPrinting && reportData && organizationLogos && grandTotal && (
        <div id="print-section" className="bg-white text-black p-8 font-sans">
             <header className="flex justify-between items-start mb-8">
                <div className="w-1/4 text-center flex flex-col justify-center items-center h-24">
                   <p className="font-bold text-base">Chambre Nationale des Rois et Chefs Traditionnels</p>
                   {organizationLogos.mainLogoUrl && <img src={organizationLogos.mainLogoUrl} alt="Logo Principal" className="max-h-20 max-w-full h-auto w-auto mt-1" />}
                </div>
                <div className="w-2/4 text-center pt-2">
                    {/* Empty space as requested */}
                </div>
                <div className="w-1/4 text-center flex flex-col justify-center items-center h-24">
                    <p className="font-bold text-base">République de Côte d'Ivoire</p>
                    {organizationLogos.secondaryLogoUrl && <img src={organizationLogos.secondaryLogoUrl} alt="Logo Secondaire" className="max-h-16 max-w-full h-auto w-auto my-1" />}
                    <p className="text-sm">Union - Discipline - Travail</p>
                </div>
            </header>
            <div className="text-center my-4">
                <h1 className="text-xl font-bold underline">DÉCLARATION INDIVIDUELLE DES SALAIRES ET APPOINTEMENTS (DISA) - ANNEE {year}</h1>
            </div>
            <table className="w-full text-[8px] border-collapse border border-black">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="border border-black p-1">N°</th>
                        <th className="border border-black p-1">Mat.</th>
                        <th className="border border-black p-1">Nom et Prénoms</th>
                        {monthLabels.map((m, i) => <th key={`header-print-month-${i}`} className="border border-black p-1">{m}</th>)}
                        <th className="border border-black p-1">Total Brut</th>
                        <th className="border border-black p-1">Total CNPS</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.map((row, index) => (
                        <tr key={`print-row-${row.matricule}`}>
                            <td className="border border-black p-1 text-center">{index + 1}</td>
                            <td className="border border-black p-1">{row.matricule}</td>
                            <td className="border border-black p-1 whitespace-nowrap">{row.name}</td>
                            {row.monthlySalaries.map((salary, i) => (
                                <td key={`print-cell-${row.matricule}-month-${i}`} className="border border-black p-1 text-right">{formatCurrency(salary)}</td>
                            ))}
                            <td className="border border-black p-1 text-right font-bold">{formatCurrency(row.totalBrut)}</td>
                            <td className="border border-black p-1 text-right font-bold">{formatCurrency(row.totalCNPS)}</td>
                        </tr>
                    ))}
                    <tr className="font-bold bg-gray-100">
                        <td colSpan={3} className="border border-black p-1 text-right">TOTAL</td>
                        {grandTotal.monthly.map((total, index) => (
                           <td key={`print-total-month-${index}`} className="border border-black p-1 text-right">{formatCurrency(total)}</td>
                        ))}
                        <td className="border border-black p-1 text-right">{formatCurrency(grandTotal.brut)}</td>
                        <td className="border border-black p-1 text-right">{formatCurrency(grandTotal.cnps)}</td>
                    </tr>
                </tbody>
            </table>
            <footer className="mt-8 text-xs">
                 <div className="flex justify-between items-end">
                    <div></div>
                    <div className="text-center leading-tight">
                        <p className="font-bold">Chambre Nationale de Rois et Chefs Traditionnels (CNRCT)</p>
                        <p>Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63</p>
                        <p>www.cnrct.ci - Email : info@cnrct.ci</p>
                    </div>
                    <div><p className="page-number"></p></div>
                 </div>
            </footer>
        </div>
    )}
    </>
  );
}
