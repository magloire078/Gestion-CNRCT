"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Printer, Loader2, FileText, AlertCircle } from "lucide-react";
import { generateDisaReport, type DisaReportState as DisaReportResult } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

// Helper for formatting currency in CFA
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
};

// Year labels for headers
const monthLabels = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const DisaHeader = ({ organizationLogos, year, isPrinting = false }: { organizationLogos?: any, year: string, isPrinting?: boolean }) => (
    <div className={`mb-4 border-b pb-4 ${isPrinting ? 'border-black' : ''}`}>
        <div className="flex justify-between items-start">
            {/* Left: Organization Info - NOW CENTERED AS REQUESTED */}
            <div className="flex flex-col gap-1 items-center min-w-[250px]">
                <div className="text-center mb-1 leading-tight">
                    <p className="font-bold text-[10px] uppercase tracking-tight">Chambre Nationale de Rois</p>
                    <p className="font-bold text-[10px] uppercase tracking-tight">Et des Chefs Traditionnels</p>
                </div>
                {organizationLogos?.mainLogoUrl && (
                    <div className="relative h-16 w-40">
                        <Image
                            src={organizationLogos.mainLogoUrl}
                            alt="Logo Principal"
                            fill
                            className="object-contain object-center"
                            unoptimized
                        />
                    </div>
                )}
            </div>
            
            {/* Center: Report Title, Year and CNPS */}
            <div className="text-center flex-1">
                <div className="flex items-center justify-center gap-3">
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none">D.I.S.A</h2>
                    <div className="px-3 py-0.5 border-2 border-black rounded bg-white">
                        <p className="text-xl font-black italic">{year}</p>
                    </div>
                </div>
                <p className="text-[10px] font-bold mt-1">DÉCLARATION INDIVIDUELLE DES SALAIRES ANNUELS</p>
                <p className="text-[11px] font-black uppercase mt-2 border-t-2 border-black/5 pt-1 inline-block min-w-[150px]">
                    CNPS - SÉCURITÉ SOCIALE
                </p>
            </div>

            {/* Right: National Info (Centered relative to each other) */}
            <div className="flex flex-col gap-1 items-center min-w-[200px]">
                <p className="font-bold text-[10px] uppercase leading-tight mb-1 text-center">République de Côte d'Ivoire</p>
                {organizationLogos?.secondaryLogoUrl && (
                    <div className="relative h-14 w-14">
                        <Image
                            src={organizationLogos.secondaryLogoUrl}
                            alt="Logo Secondaire"
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                )}
                <p className="text-[9px] italic text-center mt-1">Union - Discipline - Travail</p>
            </div>
        </div>
    </div>
);

export default function DisaPage() {
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [state, setState] = useState<DisaReportResult>({
        reportData: null,
        grandTotal: null,
        organizationLogos: null,
        year: null,
        error: null
    });

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

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
            setState((prev: DisaReportResult) => ({ ...prev, error: "Une erreur inattendue est survenue lors de la génération du rapport." }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isPrinting) {
            const style = document.createElement('style');
            style.innerHTML = `
                @media print { 
                    @page { 
                        size: landscape; 
                        margin: 10mm 5mm 15mm 5mm; 
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        color: black !important;
                        visibility: hidden;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    #print-section {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 1080px !important; /* Expanded width to use full landscape space */
                        margin: 0 !important;
                        padding: 0 !important;
                        background: transparent !important;
                    }
                    #print-section * {
                        visibility: visible;
                    }
                    /* HEADER BLEU PRINT CORRECTION - EXTRA STRONG BORDERS */
                    #print-section thead tr th {
                        background-color: #1e3a8a !important;
                        color: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-weight: 900 !important;
                        border: 1px solid white !important; 
                        font-size: 9px !important;
                        white-space: nowrap !important;
                    }
                    thead { display: table-header-group !important; }
                    tfoot { display: table-footer-group !important; }
                    tr { page-break-inside: avoid !important; }
                    .print-hidden { display: none !important; }
                    
                    /* Reset cleanup rules that was overriding background colors */
                    #print-section table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                        font-family: sans-serif !important;
                        border: 1px solid #1e3a8a !important; 
                        table-layout: fixed !important; /* Fixed layout to prevent cell growth */
                    }
                    #print-section td {
                        padding: 1px 2px !important;
                        border: 0.8px solid #475569 !important;
                        /* Supprimé background: white !important; pour permettre l'effet striped */
                        font-size: 8.5px !important; 
                        overflow: hidden !important;
                        text-overflow: clip !important;
                        white-space: nowrap !important;
                        word-break: keep-all !important;
                        letter-spacing: -0.025em !important; /* trackers-tighter equivalent */
                    }
                    
                    /* Pagination */
                    body { counter-reset: page; }
                    .page-number::after {
                        counter-increment: page;
                        content: "Page " counter(page);
                    }
                    .footer-print {
                        position: fixed;
                        bottom: 0px;
                        right: 0px;
                        padding: 2px;
                        font-size: 8px;
                        color: #64748b;
                        background: transparent !important;
                    }

                    /* Zebra stripping for print */
                    #print-section tbody tr:nth-child(even) {
                        background-color: #f1f5f9 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `;
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
                                    <Select name="year" value={year} onValueChange={(val) => startTransition(() => setYear(val))}>
                                        <SelectTrigger id="year">
                                            <SelectValue placeholder="Choisir l'année" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((y: string) => (
                                                <SelectItem key={y} value={y}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Génération...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Générer le rapport
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>

                        {state.error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
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
                                <Button variant="outline" onClick={handlePrint} disabled={loading}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Imprimer
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <DisaHeader organizationLogos={state.organizationLogos} year={state.year || ""} />
                            
                            <div className="overflow-x-auto border rounded-xl overflow-hidden mt-6 shadow-sm">
                                <table className="w-full border-collapse">
                                    <thead className="bg-[#1e3a8a] text-white">
                                        <tr>
                                            <th className="w-12 text-center text-[10px] font-black uppercase bg-[#1e3a8a] border-[1px] border-white/40 p-2 text-white">N°</th>
                                            <th className="w-24 text-center text-[10px] font-black uppercase bg-[#1e3a8a] border-[1px] border-white/40 p-2 text-white">Mat.</th>
                                            <th className="min-w-[200px] text-left pl-4 text-[10px] font-black uppercase bg-[#1e3a8a] border-[1px] border-white/40 p-2 text-white">Nom et Prénoms</th>
                                            {monthLabels.map((m: string, i: number) => (
                                                <th key={`header-month-${i}`} className="text-right text-[10px] font-black uppercase border-[1px] border-white/40 bg-[#1e3a8a] px-2 p-2 text-white">
                                                    {m.substring(0, 3)}.
                                                </th>
                                            ))}
                                            <th className="text-right font-black text-[10px] uppercase px-3 bg-[#1e3a8a] text-white border-[1px] border-white/40 p-2">Gratif.</th>
                                            <th className="text-right font-black text-[10px] uppercase px-3 bg-[#1e3a8a] border-[1px] border-white/40 p-2 text-white">Tot Brut</th>
                                            <th className="text-right font-black text-[10px] uppercase px-3 bg-[#1e3a8a] border-[1px] border-white/40 p-2 text-white">CNPS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {state.reportData.map((row: any, index: number) => (
                                            <tr key={row.matricule} className="border-b border-slate-100 hover:bg-slate-50/80 even:bg-slate-50/40 transition-colors">
                                                <td className="text-center font-bold border-[0.5px] border-slate-200 text-[11px] p-2">{index + 1}</td>
                                                <td className="text-center font-mono font-bold border-[0.5px] border-slate-200 text-[11px] p-2">{row.matricule}</td>
                                                <td className="font-bold whitespace-nowrap pl-4 border-[0.5px] border-slate-200 text-[12px] p-2">{row.name}</td>
                                                {row.monthlySalaries.map((salary: number, i: number) => (
                                                    <td key={`${row.matricule}-month-${i}`} className="text-right font-mono text-[11px] border-[0.5px] border-slate-200 px-2 tracking-tighter p-2">
                                                        {formatCurrency(salary)}
                                                    </td>
                                                ))}
                                                <td className="text-right font-mono font-black text-[11px] px-2 border-[0.5px] border-slate-200 tracking-tighter p-2">{formatCurrency(row.gratification)}</td>
                                                <td className="text-right font-mono font-black text-[11px] px-2 border-[0.5px] border-slate-200 tracking-tighter p-2">{formatCurrency(row.totalBrut)}</td>
                                                <td className="text-right font-mono font-black text-[11px] px-2 border-[0.5px] border-slate-200 tracking-tighter p-2 text-primary">{formatCurrency(row.totalCNPS)}</td>
                                            </tr>
                                        ))}
                                        {state.grandTotal && (
                                            <tr className="font-bold bg-slate-50">
                                                <td colSpan={3} className="text-right font-black text-[11px] uppercase pr-4 border-[0.5px] border-slate-200 p-2">TOTAUX GÉNÉRAUX</td>
                                                {state.grandTotal.monthly.map((total: number, index: number) => (
                                                    <td key={`total-month-${index}`} className="text-right font-mono text-[11px] font-black border-[0.5px] border-slate-200 px-2 tracking-tighter p-2">{formatCurrency(total)}</td>
                                                ))}
                                                <td className="text-right font-mono text-[11px] font-black px-2 border-[0.5px] border-slate-200 tracking-tighter p-2">{formatCurrency(state.grandTotal.gratification)}</td>
                                                <td className="text-right font-mono text-[11px] font-black px-2 border-[0.5px] border-slate-200 tracking-tighter p-2">{formatCurrency(state.grandTotal.brut)}</td>
                                                <td className="text-right font-mono text-[11px] font-black px-2 border-[0.5px] border-slate-200 tracking-tighter p-2 text-primary">{formatCurrency(state.grandTotal.cnps)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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

            {isPrinting && state.reportData && state.grandTotal && (
                <div id="print-section" className="bg-white text-black font-sans p-1">
                    <DisaHeader organizationLogos={state.organizationLogos} year={state.year || ""} isPrinting={true} />
                    
                    <table className="w-[1080px] text-[8.5px] border-collapse bg-white table-fixed">
                        <thead>
                                <tr className="bg-[#1e3a8a] text-white">
                                    <th className="p-1 w-[25px] font-black text-center uppercase border border-white">N°</th>
                                    <th className="p-1 w-[40px] font-black text-center uppercase border border-white">Mat.</th>
                                    <th className="p-1 w-[150px] text-left pl-1 font-black uppercase border border-white">Nom et Prénoms</th>
                                    {monthLabels.map((m: string, i: number) => (
                                        <th key={`header-print-month-${i}`} className="p-1 w-[58px] font-black text-center uppercase border border-white">
                                            {m.substring(0, 3)}.
                                        </th>
                                    ))}
                                    <th className="p-1 w-[55px] font-black text-center uppercase border border-white">Gratif.</th>
                                    <th className="p-1 w-[55px] font-black text-center uppercase border border-white">Tot Brut</th>
                                    <th className="p-1 w-[55px] font-black text-center uppercase border border-white">CNPS</th>
                                </tr>
                            </thead>
                        <tbody>
                             {state.reportData.map((row: any, index: number) => (
                                <tr key={`print-row-${row.matricule}`} className="text-black even:bg-slate-100/50">
                                    <td className="py-1 px-1 text-center font-bold border border-slate-600">{index + 1}</td>
                                    <td className="py-1 px-1 text-center font-mono border border-slate-600">{row.matricule}</td>
                                    <td className="py-1 px-1 whitespace-nowrap text-left pl-1 font-bold border border-slate-600 overflow-hidden text-clip">{row.name}</td>
                                    {row.monthlySalaries.map((salary: number, i: number) => (
                                        <td key={`print-cell-${row.matricule}-month-${i}`} className="py-1 px-0.5 text-right font-mono border border-slate-600 tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {formatCurrency(salary)}
                                        </td>
                                    ))}
                                    <td className="py-1 px-0.5 text-right font-mono border border-slate-600 tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(row.gratification)}</td>
                                    <td className="py-1 px-0.5 text-right font-bold font-mono border border-slate-600 tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(row.totalBrut)}</td>
                                    <td className="py-1 px-0.5 text-right font-mono border border-slate-600 tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(row.totalCNPS)}</td>
                                </tr>
                            ))}
                            <tr className="font-black bg-slate-100 text-black">
                                <td colSpan={3} className="py-1.5 px-1 text-right pr-4 border border-slate-700 text-[10px]">TOTAL GÉNÉRAL</td>
                                {state.grandTotal.monthly.map((total: number, index: number) => (
                                    <td key={`print-total-month-${index}`} className="py-1.5 px-0.5 text-right font-black border border-slate-700 text-[8px] tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {formatCurrency(total)}
                                    </td>
                                ))}
                                <td className="py-1.5 px-0.5 text-right font-black border border-slate-700 text-[8px] tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(state.grandTotal.gratification)}</td>
                                <td className="py-1.5 px-0.5 text-right font-black border border-slate-700 text-[8px] tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(state.grandTotal.brut)}</td>
                                <td className="py-1.5 px-0.5 text-right font-black border border-slate-700 text-[8px] tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(state.grandTotal.cnps)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <footer className="mt-4 text-[8px]">
                        <div className="flex justify-between items-end">
                            <div className="text-[7.5px] italic leading-tight max-w-[300px]">
                                Document généré automatiquement par le système de gestion de la CNRCT le {new Date().toLocaleDateString('fr-FR')}. Page certifiée conforme aux données de l'exercice fiscal {state.year}.
                            </div>
                            <div className="text-center leading-tight opacity-70">
                                <p className="font-bold uppercase">Chambre Nationale de Rois et Chefs Traditionnels (CNRCT)</p>
                                <p>Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63</p>
                            </div>
                            <div className="min-w-[180px] border-t-2 border-black pt-1 text-center font-black uppercase text-[9px]">
                                Signature et Cachet
                            </div>
                        </div>
                    </footer>

                    {/* Pagination fixe */}
                    <div className="hidden print:block footer-print opacity-70">
                        <span className="page-number"></span>
                    </div>
                </div>
            )}
        </>
    );
}
