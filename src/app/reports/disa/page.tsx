
"use client";

import { useState, useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fr } from 'date-fns/locale';
import type { OrganizationSettings } from "@/lib/data";
import { generateDisaReportAction, type DisaReportState } from "./actions";

const initialState: DisaReportState = {
    reportData: null,
    grandTotal: null,
    organizationLogos: null,
    year: null,
    error: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Générer le rapport
        </Button>
    )
}

export default function DisaReportPage() {
  const [state, formAction] = useActionState(generateDisaReportAction, initialState);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [isPrinting, setIsPrinting] = useState(false);
  
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const monthLabels = Array.from({ length: 12 }, (_, i) => {
    const monthName = fr.localize?.month(i, { width: 'short' }) || `M${i+1}`;
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  });

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
          <form action={formAction}>
            <div className="flex flex-col sm:flex-row gap-4 items-end mb-6 p-4 border rounded-lg max-w-md">
                <div className="grid gap-2 flex-1 w-full">
                <Label htmlFor="year">Année de la déclaration</Label>
                <Select name="year" value={year} onValueChange={setYear}>
                    <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                    <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
                </div>
                <SubmitButton />
            </div>
          </form>
           {state.error && (
            <Alert variant="destructive">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {state.reportData && (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Rapport DISA pour {state.year}</CardTitle>
                        <CardDescription>Total de {state.reportData.length} employé(s) listé(s).</CardDescription>
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
                                <TableHead className="sticky left-0 z-10 w-10 px-0.5">N°</TableHead>
                                <TableHead className="sticky left-[40px] z-10 w-24 px-0.5">Matricule</TableHead>
                                <TableHead className="sticky left-[136px] z-10 min-w-[150px] px-0.5">Nom et Prénoms</TableHead>
                                {monthLabels.map((m, i) => <TableHead key={`header-month-${i}`} className="text-right px-0.5">{m}</TableHead>)}
                                <TableHead className="text-right font-bold px-0.5">Total Brut</TableHead>
                                <TableHead className="text-right font-bold px-0.5">Total CNPS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {state.reportData.map((row, index) => (
                                <TableRow key={row.matricule}>
                                    <TableCell className="sticky left-0 px-0.5">{index + 1}</TableCell>
                                    <TableCell className="sticky left-[40px] px-0.5">{row.matricule}</TableCell>
                                    <TableCell className="font-medium whitespace-nowrap sticky left-[136px] px-0.5">{row.name}</TableCell>
                                    {row.monthlySalaries.map((salary, i) => (
                                        <TableCell key={`${row.matricule}-month-${i}`} className="text-right font-mono text-xs px-0.5">{formatCurrency(salary)}</TableCell>
                                    ))}
                                    <TableCell className="text-right font-mono font-bold px-0.5">{formatCurrency(row.totalBrut)}</TableCell>
                                    <TableCell className="text-right font-mono font-bold px-0.5">{formatCurrency(row.totalCNPS)}</TableCell>
                                </TableRow>
                            ))}
                            {state.grandTotal && (
                                <TableRow className="font-bold bg-muted hover:bg-muted">
                                    <TableCell colSpan={3} className="text-right sticky left-0 px-0.5">TOTAUX</TableCell>
                                    {state.grandTotal.monthly.map((total, index) => (
                                        <TableCell key={`total-month-${index}`} className="text-right font-mono text-xs px-0.5">{formatCurrency(total)}</TableCell>
                                    ))}
                                    <TableCell className="text-right font-mono px-0.5">{formatCurrency(state.grandTotal.brut)}</TableCell>
                                    <TableCell className="text-right font-mono px-0.5">{formatCurrency(state.grandTotal.cnps)}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}

      {!state.reportData && !useFormStatus().pending && (
        <Card className="flex items-center justify-center min-h-[300px]">
            <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12" />
                <p className="mt-4">Veuillez sélectionner une année et générer un rapport.</p>
            </div>
        </Card>
      )}
    </div>
    
     {isPrinting && state.reportData && state.organizationLogos && state.grandTotal && (
        <div id="print-section" className="bg-white text-black p-8 font-sans">
             <header className="flex justify-between items-start mb-8">
                <div className="w-1/4 text-center flex flex-col justify-center items-center h-24">
                   <p className="font-bold text-base">Chambre Nationale des Rois et Chefs Traditionnels</p>
                   {state.organizationLogos.mainLogoUrl && <img src={state.organizationLogos.mainLogoUrl} alt="Logo Principal" className="max-h-20 max-w-full h-auto w-auto mt-1" />}
                </div>
                <div className="w-2/4 text-center pt-2">
                    {/* Empty space as requested */}
                </div>
                <div className="w-1/4 text-center flex flex-col justify-center items-center h-24">
                    <p className="font-bold text-base">République de Côte d'Ivoire</p>
                    {state.organizationLogos.secondaryLogoUrl && <img src={state.organizationLogos.secondaryLogoUrl} alt="Logo Secondaire" className="max-h-16 max-w-full h-auto w-auto my-1" />}
                    <p className="text-sm">Union - Discipline - Travail</p>
                </div>
            </header>
            <div className="text-center my-4">
                <h1 className="text-xl font-bold underline">DÉCLARATION INDIVIDUELLE DES SALAIRES ET APPOINTEMENTS (DISA) - ANNEE {state.year}</h1>
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
                    {state.reportData.map((row, index) => (
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
                        {state.grandTotal.monthly.map((total, index) => (
                           <td key={`print-total-month-${index}`} className="border border-black p-1 text-right">{formatCurrency(total)}</td>
                        ))}
                        <td className="border border-black p-1 text-right">{formatCurrency(state.grandTotal.brut)}</td>
                        <td className="border border-black p-1 text-right">{formatCurrency(state.grandTotal.cnps)}</td>
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
