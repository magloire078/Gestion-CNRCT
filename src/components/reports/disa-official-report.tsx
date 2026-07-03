"use client";

import React from "react";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import type { DisaRow } from "@/app/reports/disa/actions";
import type { OrganizationSettings } from "@/types/common";

interface DisaOfficialReportProps {
    reportData: DisaRow[];
    grandTotal: {
        brut: number;
        cnps: number;
        gratification: number;
        monthly: number[];
    };
    organizationSettings: OrganizationSettings | null;
    year: string;
    isPrinting: boolean;
    onAfterPrint?: () => void;
}

const shortMonthLabels = [
    "Jan.", "Fév.", "Mar.", "Avr.", "Mai", "Jun.",
    "Jul.", "Aoû.", "Sep.", "Oct.", "Nov.", "Déc."
];

const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "0";
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(amount));
};

export function DisaOfficialReport({
    reportData,
    grandTotal,
    organizationSettings,
    year,
    isPrinting,
    onAfterPrint
}: DisaOfficialReportProps) {
    if (!reportData || reportData.length === 0) return null;

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting} 
            onAfterPrint={onAfterPrint}
            orientation="landscape"
        >
            <div className="bg-white text-black font-sans p-1 w-full min-h-screen">
                {/* Unified Institutional Header with DISA specific title */}
                <InstitutionalHeader 
                    settings={organizationSettings}
                    service="Direction des Finances et du Patrimoine"
                    direction="DFP"
                    showDivider={false}
                >
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center gap-4">
                            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none italic text-slate-900">
                                D.I.S.A
                            </h2>
                            <div className="px-4 py-1.5 border-4 border-slate-900 rounded-2xl bg-slate-900 text-white shadow-xl transform -rotate-2">
                                <p className="text-2xl font-black">{year}</p>
                            </div>
                        </div>
                        <p className="text-[11px] font-black mt-4 uppercase tracking-[0.3em] text-slate-500">
                            Déclaration Individuelle des Salaires Annuels
                        </p>
                        <div className="mt-4 flex items-center gap-4">
                            <span className="h-px w-10 bg-slate-200" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                                CNPS - SÉCURITÉ SOCIALE
                            </p>
                            <span className="h-px w-10 bg-slate-200" />
                        </div>
                    </div>
                </InstitutionalHeader>

                {/* Table DISA */}
                <div className="mt-4 border border-slate-300 rounded-lg overflow-hidden shadow-sm print:shadow-none">
                    <table className="w-full text-[8px] border-collapse bg-white table-fixed">
                        <thead>
                            <tr className="bg-slate-50 text-slate-800 border-b border-slate-350">
                                <th className="w-[35px] font-bold text-center uppercase border-r border-slate-200 p-2 text-slate-800">N°</th>
                                <th className="w-[45px] font-bold text-center uppercase border-r border-slate-200 p-2 text-slate-800">Mat.</th>
                                <th className="w-[200px] text-left pl-4 font-bold uppercase border-r border-slate-200 p-2 text-slate-800">Nom et Prénoms</th>
                                {shortMonthLabels.map((m, i) => (
                                    <th key={`header-print-month-${i}`} className="font-bold text-center uppercase border-r border-slate-200 p-1 text-[7.5px] text-slate-700">
                                        {m}
                                    </th>
                                ))}
                                <th className="w-[50px] font-bold text-center uppercase border-r border-slate-200 p-2 text-slate-800">Gratif.</th>
                                <th className="w-[60px] font-bold text-center uppercase border-r border-slate-200 p-2 text-slate-800 bg-slate-100/50">Tot Brut</th>
                                <th className="w-[55px] font-bold text-center uppercase p-2 text-slate-800 bg-slate-100/50">CNPS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((row, index) => (
                                <tr key={`print-row-${row.matricule}`} className="text-slate-900 even:bg-slate-50/30 border-b border-slate-200 last:border-0">
                                    <td className="text-center font-bold border-r border-slate-200 p-2">{index + 1}</td>
                                    <td className="text-center font-mono border-r border-slate-200 p-2 text-slate-500 text-[7.5px]">{row.matricule}</td>
                                    <td className="whitespace-nowrap text-left pl-4 font-semibold border-r border-slate-200 overflow-hidden text-clip p-2">{row.name}</td>
                                    {row.monthlySalaries.map((salary, i) => (
                                        <td key={`print-cell-${row.matricule}-month-${i}`} className="text-right font-mono border-r border-slate-200 tracking-tighter tabular-nums px-1 py-2 text-[7.5px] text-slate-650">
                                            {formatCurrency(salary)}
                                        </td>
                                    ))}
                                    <td className="text-right font-mono border-r border-slate-200 tracking-tighter tabular-nums px-1 py-2 text-[7.5px] text-slate-650">{formatCurrency(row.gratification)}</td>
                                    <td className="text-right font-semibold font-mono border-r border-slate-200 tracking-tighter tabular-nums px-2 py-2 bg-slate-50/50 text-slate-800 text-[7.5px]">{formatCurrency(row.totalBrut)}</td>
                                    <td className="text-right font-semibold font-mono tracking-tighter tabular-nums px-2 py-2 text-slate-800 bg-slate-50/50 text-[7.5px]">{formatCurrency(row.totalCNPS)}</td>
                                </tr>
                            ))}
                            
                            {/* Total Line */}
                            <tr className="font-bold bg-slate-100 text-slate-900 border-t-2 border-slate-350 border-b-2 border-slate-350">
                                <td colSpan={3} className="py-3 px-4 text-right border-r border-slate-200 text-[8px] uppercase tracking-wider italic font-bold text-slate-800">Totalisation Générale</td>
                                {grandTotal.monthly.map((total, index) => (
                                    <td key={`print-total-month-${index}`} className="py-3 px-1 text-right font-bold border-r border-slate-200 text-[7.5px] tracking-tighter tabular-nums text-slate-850">
                                        {formatCurrency(total)}
                                    </td>
                                ))}
                                <td className="py-3 px-1 text-right font-bold border-r border-slate-200 text-[7.5px] tracking-tighter tabular-nums text-slate-850">{formatCurrency(grandTotal.gratification)}</td>
                                <td className="py-3 px-2 text-right font-bold border-r border-slate-200 text-[7.5px] tracking-tighter tabular-nums text-slate-900 bg-slate-200/50">{formatCurrency(grandTotal.brut)}</td>
                                <td className="py-3 px-2 text-right font-bold text-[7.5px] tracking-tighter tabular-nums text-slate-900 bg-slate-200/50">{formatCurrency(grandTotal.cnps)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Unified Institutional Footer */}
                <InstitutionalFooter 
                    showSignatures={false}
                    showVisa={false}
                    signatoryTitle="LE DIRECTEUR DES FINANCES ET DU PATRIMOINE"
                    signatoryName="KASSI Lucien De la Roch N'Douba"
                    signatorySubtitle="Signature et Cachet"
                    showCertification={true}
                />

                <style jsx>{`
                    table {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    @media print {
                        .bg-slate-900 { background-color: #0f172a !important; }
                        .bg-slate-800 { background-color: #1e293b !important; }
                        .bg-slate-700 { background-color: #334155 !important; }
                        .text-white { color: white !important; }
                        .text-slate-400 { color: #94a3b8 !important; }
                        .text-slate-500 { color: #64748b !important; }
                        .text-slate-600 { color: #475569 !important; }
                    }
                `}</style>
            </div>
        </InstitutionalReportWrapper>
    );
}
