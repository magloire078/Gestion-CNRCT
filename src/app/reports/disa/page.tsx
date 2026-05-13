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
import { PermissionGuard } from "@/components/auth/permission-guard";
import { DisaOfficialReport } from "@/components/reports/disa-official-report";

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
    <div className={`${isPrinting ? 'mb-2 pb-2' : 'mb-4 pb-4'} border-b ${isPrinting ? 'border-black' : ''}`}>
        <div className="flex justify-between items-start">
            {/* Left: Organization Info - NOW CENTERED AS REQUESTED */}
            <div className="flex flex-col gap-0.5 items-center min-w-[250px]">
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
                <div className="flex items-center justify-center gap-2">
                    <h2 className={`${isPrinting ? 'text-xl' : 'text-2xl'} font-black uppercase tracking-tight leading-none`}>D.I.S.A</h2>
                    <div className={`${isPrinting ? 'px-2 py-0' : 'px-3 py-0.5'} border-2 border-black rounded bg-white`}>
                        <p className={`${isPrinting ? 'text-lg' : 'text-xl'} font-black italic`}>{year}</p>
                    </div>
                </div>
                <p className={`${isPrinting ? 'text-[9px]' : 'text-[10px]'} font-bold mt-1`}>DÉCLARATION INDIVIDUELLE DES SALAIRES ANNUELS</p>
                <p className={`${isPrinting ? 'text-[9px]' : 'text-[11px]'} font-black uppercase mt-1 border-t-2 border-black/5 pt-0.5 inline-block min-w-[120px]`}>
                    CNPS - SÉCURITÉ SOCIALE
                </p>
            </div>

            {/* Right: National Info (Centered relative to each other) */}
            <div className="flex flex-col gap-0.5 items-center min-w-[200px]">
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
                <p className="text-[9px] italic text-center mt-0.5">Union - Discipline - Travail</p>
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

    // Suppression de l'ancien useEffect d'impression manuelle

    return (
        <PermissionGuard permission="page:disa:view">
            <div className={`flex flex-col gap-10 pb-20 animate-in fade-in duration-1000 ${isPrinting ? 'print-hidden' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-black uppercase tracking-[0.2em] text-[10px] shadow-sm">
                            <FileText className="h-3.5 w-3.5" />
                            Déclaration Sociale (CNPS)
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 md:text-6xl leading-none">
                            D.I.S.A <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Report</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-xl text-lg leading-relaxed">
                            Génération et extraction de la Déclaration Individuelle des Salaires Annuels conforme aux normes CNPS.
                        </p>
                    </div>
                </div>

                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-md group transition-all duration-500">
                    <CardHeader className="p-10 border-b border-slate-50">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 rounded-xl bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-900/20 group-hover:rotate-12 transition-transform">
                                <FileText className="h-7 w-7 text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Paramètres du Rapport</CardTitle>
                                <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest leading-none mt-1">Sélection de l'exercice fiscal</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <form onSubmit={handleGenerate} className="max-w-xl">
                            <div className="space-y-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="year" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Année d'imposition</Label>
                                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                                        <div className="relative flex-1 w-full">
                                            <Select name="year" value={year} onValueChange={(val) => startTransition(() => setYear(val))}>
                                                <SelectTrigger id="year" className="h-16 rounded-xl border-slate-100 bg-slate-50/50 shadow-inner focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-lg font-black text-slate-700 px-6">
                                                    <SelectValue placeholder="Choisir l'année" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                                    {years.map((y: string) => (
                                                        <SelectItem key={y} value={y} className="rounded-xl p-3 font-bold cursor-pointer">{y}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="submit" disabled={loading} className="h-16 px-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto">
                                            {loading ? (
                                                <div className="flex items-center gap-3">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    <span>Calcul en cours...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-5 w-5" />
                                                    <span>Générer le Rapport</span>
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {state.error && (
                            <Alert variant="destructive" className="mt-8 rounded-xl border-none bg-rose-50 text-rose-700 shadow-sm animate-in slide-in-from-top-4">
                                <AlertCircle className="h-5 w-5 text-rose-600" />
                                <AlertTitle className="font-black text-rose-900">Calcul Interrompu</AlertTitle>
                                <AlertDescription className="font-medium">{state.error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {state.reportData && (
                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-md animate-in zoom-in-95 duration-700">
                        <CardHeader className="p-10 border-b border-slate-50">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-200">
                                        <Printer className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Rapport DISA - Exercice {state.year}</CardTitle>
                                        <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest leading-none mt-1">Total de {state.reportData.length} collaborateur(s) assujetti(s)</CardDescription>
                                    </div>
                                </div>
                                <Button onClick={handlePrint} className="h-14 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl border-none">
                                    <Printer className="mr-2 h-5 w-5" />
                                    Imprimer l'Officiel
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-10 bg-slate-50/50">
                                <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/30 border border-slate-100">
                                    <DisaHeader organizationLogos={state.organizationLogos} year={state.year || ""} />
                                    
                                    <div className="overflow-x-auto rounded-xl border border-slate-100 overflow-hidden mt-8 shadow-2xl shadow-slate-200/20">
                                        <table className="w-full border-collapse">
                                            <thead className="bg-[#1e3a8a] text-white">
                                                <tr>
                                                    <th className="w-12 text-center text-[9px] font-black uppercase bg-[#1e3a8a] border-r border-white/20 p-4 text-white/80">N°</th>
                                                    <th className="w-24 text-center text-[9px] font-black uppercase bg-[#1e3a8a] border-r border-white/20 p-4 text-white/80">Matricule</th>
                                                    <th className="min-w-[220px] text-left pl-6 text-[9px] font-black uppercase bg-[#1e3a8a] border-r border-white/20 p-4 text-white/60">Nom & Prénoms</th>
                                                    {monthLabels.map((m: string, i: number) => (
                                                        <th key={`header-month-${i}`} className="text-right text-[8px] font-black uppercase border-r border-white/10 bg-[#1e3a8a] px-3 p-4 text-white/70">
                                                            {m.substring(0, 3)}
                                                        </th>
                                                    ))}
                                                    <th className="text-right font-black text-[9px] uppercase px-4 bg-[#1e3a8a] text-white/90 border-r border-white/20 p-4">Gratif.</th>
                                                    <th className="text-right font-black text-[9px] uppercase px-4 bg-[#1e3a8a] border-r border-white/20 p-4 text-white">Total Brut</th>
                                                    <th className="text-right font-black text-[9px] uppercase px-4 bg-[#1e3a8a] p-4 text-blue-300">CNPS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white">
                                                {state.reportData.map((row: any, index: number) => (
                                                    <tr key={row.matricule} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                                        <td className="text-center font-bold border-r border-slate-50 text-[10px] text-slate-400 p-3">{index + 1}</td>
                                                        <td className="text-center font-mono font-black border-r border-slate-50 text-[11px] text-slate-700 p-3 bg-slate-50/30 group-hover:bg-slate-100 transition-colors">{row.matricule}</td>
                                                        <td className="font-black whitespace-nowrap pl-6 border-r border-slate-50 text-sm text-slate-900 p-3">{row.name}</td>
                                                        {row.monthlySalaries.map((salary: number, i: number) => (
                                                            <td key={`${row.matricule}-month-${i}`} className="text-right font-mono text-[10px] border-r border-slate-50 px-3 tracking-tighter text-slate-600 tabular-nums p-3">
                                                                {formatCurrency(salary)}
                                                            </td>
                                                        ))}
                                                        <td className="text-right font-mono font-bold text-[10px] px-4 border-r border-slate-50 tracking-tighter text-slate-800 p-3">{formatCurrency(row.gratification)}</td>
                                                        <td className="text-right font-mono font-black text-[11px] px-4 border-r border-slate-50 tracking-tighter text-slate-900 bg-slate-50/50 p-3">{formatCurrency(row.totalBrut)}</td>
                                                        <td className="text-right font-mono font-black text-[12px] px-4 tracking-tighter text-blue-600 p-3">{formatCurrency(row.totalCNPS)}</td>
                                                    </tr>
                                                ))}
                                                {state.grandTotal && (
                                                    <tr className="font-black bg-slate-900 text-white">
                                                        <td colSpan={3} className="text-right font-black text-[10px] uppercase pr-6 p-5 tracking-widest text-slate-400">TOTALISATION GÉNÉRALE</td>
                                                        {state.grandTotal.monthly.map((total: number, index: number) => (
                                                            <td key={`total-month-${index}`} className="text-right font-mono text-[9px] font-bold border-r border-white/5 px-3 tracking-tighter p-5 text-slate-300">{formatCurrency(total)}</td>
                                                        ))}
                                                        <td className="text-right font-mono text-[10px] font-black px-4 border-r border-white/5 tracking-tighter p-5">{formatCurrency(state.grandTotal.gratification)}</td>
                                                        <td className="text-right font-mono text-[11px] font-black px-4 border-r border-white/5 tracking-tighter p-5">{formatCurrency(state.grandTotal.brut)}</td>
                                                        <td className="text-right font-mono text-[13px] font-black px-4 tracking-tighter p-5 text-blue-400">{formatCurrency(state.grandTotal.cnps)}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!state.reportData && !loading && (
                    <div className="flex flex-col items-center justify-center min-h-[400px] border-[3px] border-dashed border-slate-200 rounded-2xl bg-slate-50/30 group hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-700">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-[60px] opacity-20 scale-150 rotate-12" />
                            <div className="h-24 w-24 rounded-2xl bg-white shadow-2xl flex items-center justify-center relative z-10 transition-transform group-hover:scale-110 duration-700">
                                <FileText className="h-10 w-10 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                        <h3 className="mt-8 text-2xl font-black text-slate-900 tracking-tight">En attente de génération</h3>
                        <p className="mt-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sélectionnez une année pour initialiser le calcul DISA</p>
                    </div>
                )}
            </div>

            {state.reportData && state.grandTotal && (
                <DisaOfficialReport 
                    reportData={state.reportData}
                    grandTotal={state.grandTotal}
                    organizationSettings={state.organizationLogos}
                    year={state.year || year}
                    isPrinting={isPrinting}
                    onAfterPrint={() => setIsPrinting(false)}
                />
            )}
        </PermissionGuard>
    );
}
