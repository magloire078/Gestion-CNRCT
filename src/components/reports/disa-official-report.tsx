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

const monthLabels = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
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
                <div className="mt-4 border-2 border-slate-900 rounded-xl overflow-hidden shadow-2xl print:shadow-none">
                    <table className="w-full text-[8.5px] border-collapse bg-white table-fixed">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="w-[35px] font-black text-center uppercase border-r border-slate-800 p-3">N°</th>
                                <th className="w-[55px] font-black text-center uppercase border-r border-slate-800 p-3">Mat.</th>
                                <th className="w-[220px] text-left pl-4 font-black uppercase border-r border-slate-800 p-3">Nom et Prénoms</th>
                                {monthLabels.map((m, i) => (
                                    <th key={`header-print-month-${i}`} className="font-black text-center uppercase border-r border-slate-800 p-1 text-[8px]">
                                        {m.substring(0, 3)}.
                                    </th>
                                ))}
                                <th className="w-[70px] font-black text-center uppercase border-r border-slate-800 p-3">Gratif.</th>
                                <th className="w-[85px] font-black text-center uppercase border-r border-slate-800 p-3 bg-slate-800">Tot Brut</th>
                                <th className="w-[80px] font-black text-center uppercase p-3 bg-slate-700">CNPS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((row, index) => (
                                <tr key={`print-row-${row.matricule}`} className="text-slate-900 even:bg-slate-50/50 border-b border-slate-100 last:border-0">
                                    <td className="text-center font-bold border-r border-slate-100 p-2">{index + 1}</td>
                                    <td className="text-center font-mono border-r border-slate-100 p-2 text-slate-500 text-[8px]">{row.matricule}</td>
                                    <td className="whitespace-nowrap text-left pl-4 font-bold border-r border-slate-100 overflow-hidden text-clip p-2">{row.name}</td>
                                    {row.monthlySalaries.map((salary, i) => (
                                        <td key={`print-cell-${row.matricule}-month-${i}`} className="text-right font-mono border-r border-slate-100 tracking-tighter tabular-nums p-2 text-[8px] text-slate-600">
                                            {formatCurrency(salary)}
                                        </td>
                                    ))}
                                    <td className="text-right font-mono border-r border-slate-100 tracking-tighter tabular-nums p-2">{formatCurrency(row.gratification)}</td>
                                    <td className="text-right font-black font-mono border-r border-slate-100 tracking-tighter tabular-nums p-2 bg-slate-50/80 text-slate-900">{formatCurrency(row.totalBrut)}</td>
                                    <td className="text-right font-black font-mono tracking-tighter tabular-nums p-2 text-slate-900 bg-slate-100/50">{formatCurrency(row.totalCNPS)}</td>
                                </tr>
                            ))}
                            
                            {/* Total Line */}
                            <tr className="font-black bg-slate-900 text-white">
                                <td colSpan={3} className="py-4 px-6 text-right border-r border-slate-800 text-[11px] uppercase tracking-[0.2em] italic">Totalisation Générale</td>
                                {grandTotal.monthly.map((total, index) => (
                                    <td key={`print-total-month-${index}`} className="py-4 px-1 text-right font-black border-r border-slate-800 text-[8px] tracking-tighter tabular-nums text-slate-400">
                                        {formatCurrency(total)}
                                    </td>
                                ))}
                                <td className="py-4 px-1 text-right font-black border-r border-slate-800 text-[8px] tracking-tighter tabular-nums text-slate-400">{formatCurrency(grandTotal.gratification)}</td>
                                <td className="py-4 px-2 text-right font-black border-r border-slate-800 text-[10px] tracking-tighter tabular-nums text-white bg-slate-800">{formatCurrency(grandTotal.brut)}</td>
                                <td className="py-4 px-2 text-right font-black text-[11px] tracking-tighter tabular-nums text-white bg-slate-700">{formatCurrency(grandTotal.cnps)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Unified Institutional Footer */}
                <InstitutionalFooter 
                    signatoryTitle="LE SECRÉTAIRE GÉNÉRAL"
                    signatoryName="KOUASSI KOUAME"
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
