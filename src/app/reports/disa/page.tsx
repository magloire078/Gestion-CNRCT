
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateDisaReport, type DisaReportState } from "./actions";
import { Month } from "@/types/common";

const initialState: DisaReportState = {
    reportData: null,
    grandTotal: null,
    organizationLogos: null,
    year: null,
    error: null,
};

export default function DisaReportPage() {
    const [state, setState] = useState<DisaReportState>(initialState);
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());
    const [isPrinting, setIsPrinting] = useState(false);
    const [loading, setLoading] = useState(false);

    const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
    const monthLabels: Month[] = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    const formatCurrency = (value: number) => value === 0 ? '-' : Math.round(value).toLocaleString('fr-FR');

    const handlePrint = () => {
        setIsPrinting(true);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await generateDisaReport(year);
            setState(result);
        } catch (error) {
            setState(prev => ({ ...prev, error: "Une erreur inattendue est survenue." }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isPrinting) {
            const style = document.createElement('style');
            style.innerHTML = `@media print { @page { size: landscape; margin: 3mm 3mm 15mm 6mm; } }`;
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
                        <form onSubmit={handleGenerate}>
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
                                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                    Générer le rapport
                                </Button>
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
                                            <TableHead className="sticky left-0 z-10 w-10 px-2 bg-card">N°</TableHead>
                                            <TableHead className="sticky left-10 z-10 w-24 px-2 bg-card">Matricule</TableHead>
                                            <TableHead className="sticky left-[136px] z-10 min-w-[150px] px-2 bg-card">Nom et Prénoms</TableHead>
                                            {monthLabels.map((m, i) => <TableHead key={`header-month-${i}`} className="text-right px-2">{m}</TableHead>)}
                                            <TableHead className="text-right font-bold px-2 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300">Gratification</TableHead>
                                            <TableHead className="text-right font-bold px-2">Total Brut</TableHead>
                                            <TableHead className="text-right font-bold px-2">Total CNPS</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {state.reportData.map((row, index) => (
                                            <TableRow key={row.matricule}>
                                                <TableCell className="sticky left-0 px-2 bg-card">{index + 1}</TableCell>
                                                <TableCell className="sticky left-10 px-2 bg-card">{row.matricule}</TableCell>
                                                <TableCell className="font-medium whitespace-nowrap sticky left-[136px] px-2 bg-card">{row.name}</TableCell>
                                                {row.monthlySalaries.map((salary, i) => (
                                                    <TableCell key={`${row.matricule}-month-${i}`} className="text-right font-mono text-xs px-2">{formatCurrency(salary)}</TableCell>
                                                ))}
                                                <TableCell className="text-right font-mono font-bold px-2 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300">{formatCurrency(row.gratification)}</TableCell>
                                                <TableCell className="text-right font-mono font-bold px-2">{formatCurrency(row.totalBrut)}</TableCell>
                                                <TableCell className="text-right font-mono font-bold px-2">{formatCurrency(row.totalCNPS)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {state.grandTotal && (
                                            <TableRow className="font-bold bg-muted hover:bg-muted">
                                                <TableCell colSpan={3} className="text-right sticky left-0 px-2 bg-muted">TOTAUX</TableCell>
                                                {state.grandTotal.monthly.map((total, index) => (
                                                    <TableCell key={`total-month-${index}`} className="text-right font-mono text-xs px-2">{formatCurrency(total)}</TableCell>
                                                ))}
                                                <TableCell className="text-right font-mono px-2 bg-blue-100/50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">{formatCurrency(state.grandTotal.gratification)}</TableCell>
                                                <TableCell className="text-right font-mono px-2">{formatCurrency(state.grandTotal.brut)}</TableCell>
                                                <TableCell className="text-right font-mono px-2">{formatCurrency(state.grandTotal.cnps)}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!state.reportData && !loading && (
                    <Card className="flex items-center justify-center min-h-[300px]">
                        <div className="text-center text-muted-foreground">
                            <FileText className="mx-auto h-12 w-12" />
                            <p className="mt-4">Veuillez sélectionner une année et générer un rapport.</p>
                        </div>
                    </Card>
                )}
            </div>

            {isPrinting && state.reportData && state.organizationLogos && state.grandTotal && (
                <div id="print-section" className="bg-white text-black p-1 font-sans">
                    <header className="flex justify-between items-start mb-2">
                        <div className="w-1/4 text-center flex flex-col justify-center items-center h-16">
                            <p className="font-bold text-sm leading-tight text-blue-900">Chambre Nationale des Rois et Chefs Traditionnels</p>
                            {state.organizationLogos.mainLogoUrl && <img src={state.organizationLogos.mainLogoUrl} alt="Logo Principal" className="max-h-12 max-w-full h-auto w-auto mt-1" />}
                        </div>
                        <div className="w-2/4 text-center pt-2">
                            {/* Empty space as requested */}
                        </div>
                        <div className="w-1/4 text-center flex flex-col justify-center items-center h-16">
                            <p className="font-bold text-sm leading-tight">République de Côte d'Ivoire</p>
                            {state.organizationLogos.secondaryLogoUrl && <img src={state.organizationLogos.secondaryLogoUrl} alt="Logo Secondaire" className="max-h-10 max-w-full h-auto w-auto my-0.5" />}
                            <p className="border-t border-black px-2 text-[8px] mt-0.5">Union - Discipline - Travail</p>
                        </div>
                    </header>
                    <div className="text-center my-1">
                        <h1 className="text-base font-bold underline">DÉCLARATION INDIVIDUELLE DES SALAIRES ET APPOINTEMENTS (DISA) - ANNEE {state.year}</h1>
                    </div>
                    <table className="w-auto text-[5px] border-collapse border border-gray-600 ml-1">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-600 p-[1px] w-[15px] font-medium text-center">N°</th>
                                <th className="border border-gray-600 p-[1px] w-[35px] font-medium text-center">Mat.</th>
                                <th className="border border-gray-600 p-[1px] w-[100px] text-left pl-1 font-medium">Nom et Prénoms</th>
                                {monthLabels.map((m, i) => (
                                    <th key={`header-print-month-${i}`} className="border border-gray-600 p-[1px] w-[32px] font-medium text-center">
                                        {m.substring(0, 3)}.
                                    </th>
                                ))}
                                <th className="border border-gray-600 p-[1px] w-[35px] font-medium text-center">Gratif.</th>
                                <th className="border border-gray-600 p-[1px] w-[40px] font-medium text-center">Tot Brut</th>
                                <th className="border border-gray-600 p-[1px] w-[40px] font-medium text-center">Tot CNPS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {state.reportData.map((row, index) => (
                                <tr key={`print-row-${row.matricule}`}>
                                    <td className="border border-gray-600 p-[1px] text-center">{index + 1}</td>
                                    <td className="border border-gray-600 p-[1px] text-center">{row.matricule}</td>
                                    <td className="border border-gray-600 p-[1px] whitespace-nowrap pl-1">{row.name}</td>
                                    {row.monthlySalaries.map((salary, i) => (
                                        <td key={`print-cell-${row.matricule}-month-${i}`} className="border border-gray-600 p-[1px] text-right pr-1 tracking-tighter">
                                            {salary === 0 ? '-' : Math.round(salary).toLocaleString('fr-FR')}
                                        </td>
                                    ))}
                                    <td className="border border-gray-600 p-[1px] text-right pr-1 font-medium">{formatCurrency(row.gratification)}</td>
                                    <td className="border border-gray-600 p-[1px] text-right pr-1 font-medium">{formatCurrency(row.totalBrut)}</td>
                                    <td className="border border-gray-600 p-[1px] text-right pr-1 font-medium">{formatCurrency(row.totalCNPS)}</td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-gray-50">
                                <td colSpan={3} className="border border-gray-600 p-[1px] text-right pr-2">TOTAL</td>
                                {state.grandTotal.monthly.map((total, index) => (
                                    <td key={`print-total-month-${index}`} className="border border-gray-600 p-[1px] text-right pr-1 text-[5px]">
                                        {formatCurrency(total)}
                                    </td>
                                ))}
                                <td className="border border-gray-600 p-[1px] text-right pr-1 text-[5px]">{formatCurrency(state.grandTotal.gratification)}</td>
                                <td className="border border-gray-600 p-[1px] text-right pr-1 text-[5px]">{formatCurrency(state.grandTotal.brut)}</td>
                                <td className="border border-gray-600 p-[1px] text-right pr-1 text-[5px]">{formatCurrency(state.grandTotal.cnps)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <footer className="mt-4 text-[8px]">
                        <div className="flex justify-between items-end">
                            <div></div>
                            <div className="text-center leading-tight opacity-70">
                                <p className="font-bold uppercase">Chambre Nationale de Rois et Chefs Traditionnels (CNRCT)</p>
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
