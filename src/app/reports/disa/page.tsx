
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
import { Loader2, FileText, Printer } from "lucide-react";
import { getEmployees } from "@/services/employee-service";
import { getPayslipDetails, type PayslipDetails } from "@/services/payslip-details-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/lib/data";

interface DisaRow {
  matricule: string;
  name: string;
  totalBrut: number;
  totalITS: number;
  totalCN: number;
  totalIGR: number;
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

  const calculateAnnualData = async (payslipPromises: Promise<PayslipDetails>[]): Promise<{ totalBrut: number, totalITS: number, totalCN: number, totalIGR: number, totalCNPS: number }> => {
    const monthlyDetails = await Promise.all(payslipPromises);
    return monthlyDetails.reduce((acc, details) => {
        acc.totalBrut += details.totals.brutImposable;
        acc.totalITS += details.deductions.find(d => d.label === 'ITS')?.amount || 0;
        acc.totalCN += details.deductions.find(d => d.label === 'CN')?.amount || 0;
        acc.totalIGR += details.deductions.find(d => d.label === 'IGR')?.amount || 0;
        acc.totalCNPS += details.deductions.find(d => d.label === 'CNPS')?.amount || 0;
        return acc;
    }, { totalBrut: 0, totalITS: 0, totalCN: 0, totalIGR: 0, totalCNPS: 0 });
  };
  
  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const allEmployees = await getEmployees();
      const activeEmployees = allEmployees.filter(e => e.status === 'Actif' && e.CNPS);
      const logos = await getOrganizationSettings();
      setOrganizationLogos(logos);

      const reportRows: DisaRow[] = [];

      for (const employee of activeEmployees) {
          const monthlyPayslipPromises: Promise<PayslipDetails>[] = [];
          for (let month = 0; month < 12; month++) {
              const date = new Date(parseInt(year), month, 15);
              const payslipDate = date.toISOString().split('T')[0];
              monthlyPayslipPromises.push(getPayslipDetails(employee, payslipDate));
          }
          const annualTotals = await calculateAnnualData(monthlyPayslipPromises);
          
          reportRows.push({
              matricule: employee.matricule,
              name: employee.name,
              ...annualTotals
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

  const formatCurrency = (value: number) => value.toLocaleString('fr-FR');
  
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
        window.print();
        setIsPrinting(false);
    }, 300);
  };
  
  const grandTotal = reportData?.reduce((acc, row) => {
    acc.brut += row.totalBrut;
    acc.its += row.totalITS;
    acc.cn += row.totalCN;
    acc.igr += row.totalIGR;
    acc.cnps += row.totalCNPS;
    return acc;
  }, { brut: 0, its: 0, cn: 0, igr: 0, cnps: 0});

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
                        <CardDescription>Total de {reportData.length} employé(s) déclaré(s).</CardDescription>
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
                                <TableHead>Matricule</TableHead>
                                <TableHead>Nom et Prénoms</TableHead>
                                <TableHead className="text-right">Total Brut Annuel</TableHead>
                                <TableHead className="text-right">Total ITS</TableHead>
                                <TableHead className="text-right">Total CN</TableHead>
                                <TableHead className="text-right">Total IGR</TableHead>
                                <TableHead className="text-right">Total CNPS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.map(row => (
                                <TableRow key={row.matricule}>
                                    <TableCell>{row.matricule}</TableCell>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(row.totalBrut)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(row.totalITS)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(row.totalCN)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(row.totalIGR)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(row.totalCNPS)}</TableCell>
                                </TableRow>
                            ))}
                            {grandTotal && (
                                <TableRow className="font-bold bg-muted hover:bg-muted">
                                    <TableCell colSpan={2} className="text-right">TOTAUX</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(grandTotal.brut)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(grandTotal.its)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(grandTotal.cn)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(grandTotal.igr)}</TableCell>
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
                   {organizationLogos.mainLogoUrl && <img src={organizationLogos.mainLogoUrl} alt="Logo Principal" className="max-h-24 max-w-full h-auto w-auto" />}
                </div>
                <div className="w-2/4 text-center pt-2">
                    <h1 className="font-bold text-lg">{organizationLogos.organizationName}</h1>
                </div>
                <div className="w-1/4 text-center flex flex-col justify-center items-center h-24">
                    <p className="font-bold text-base">République de Côte d'Ivoire</p>
                    <p className="text-sm">Union - Discipline - Travail</p>
                    {organizationLogos.secondaryLogoUrl && <img src={organizationLogos.secondaryLogoUrl} alt="Logo Secondaire" className="max-h-16 max-w-full h-auto w-auto mt-1" />}
                </div>
            </header>
            <div className="text-center mb-8">
                <h1 className="text-xl font-bold underline">DÉCLARATION INDIVIDUELLE DES SALAIRES ET APPOINTEMENTS - ANNEE {year}</h1>
            </div>
            <table className="w-full text-xs border-collapse border border-black">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="border border-black p-1">Matricule</th>
                        <th className="border border-black p-1">Nom et Prénoms</th>
                        <th className="border border-black p-1">Brut Annuel</th>
                        <th className="border border-black p-1">ITS</th>
                        <th className="border border-black p-1">CN</th>
                        <th className="border border-black p-1">IGR</th>
                        <th className="border border-black p-1">CNPS</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.map(row => (
                        <tr key={row.matricule}>
                            <td className="border border-black p-1">{row.matricule}</td>
                            <td className="border border-black p-1">{row.name}</td>
                            <td className="border border-black p-1 text-right">{formatCurrency(row.totalBrut)}</td>
                            <td className="border border-black p-1 text-right">{formatCurrency(row.totalITS)}</td>
                            <td className="border border-black p-1 text-right">{formatCurrency(row.totalCN)}</td>
                            <td className="border border-black p-1 text-right">{formatCurrency(row.totalIGR)}</td>
                            <td className="border border-black p-1 text-right">{formatCurrency(row.totalCNPS)}</td>
                        </tr>
                    ))}
                    <tr className="font-bold bg-gray-100">
                        <td colSpan={2} className="border border-black p-1 text-right">TOTAL</td>
                        <td className="border border-black p-1 text-right">{formatCurrency(grandTotal.brut)}</td>
                        <td className="border border-black p-1 text-right">{formatCurrency(grandTotal.its)}</td>
                        <td className="border border-black p-1 text-right">{formatCurrency(grandTotal.cn)}</td>
                        <td className="border border-black p-1 text-right">{formatCurrency(grandTotal.igr)}</td>
                        <td className="border border-black p-1 text-right">{formatCurrency(grandTotal.cnps)}</td>
                    </tr>
                </tbody>
            </table>
            <footer className="mt-12 text-center text-xs text-gray-500">
                <p>Rapport généré le {format(new Date(), 'dd/MM/yyyy HH:mm')} par {organizationLogos.organizationName}</p>
                <div className="mt-4"><p className="page-number"></p></div>
            </footer>
        </div>
    )}
    </>
  );
}
