"use client";

import React from "react";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import type { Employe, OrganizationSettings } from "@/lib/data";

interface NominativeOfficialReportProps {
    reportData: {
        employee: Employe;
        startYear: number;
        endYear: number;
        annualSalaries: { 
            year: number; 
            months: { month: string; gross: number }[]; 
            total: number 
        }[];
        grandTotal: number;
    };
    organizationSettings: OrganizationSettings | null;
    isPrinting: boolean;
    onAfterPrint?: () => void;
}

export function NominativeOfficialReport({
    reportData,
    organizationSettings,
    isPrinting,
    onAfterPrint
}: NominativeOfficialReportProps) {
    if (!reportData) return null;

    const formatCurrency = (value: number) => 
        value === 0 ? '-' : new Intl.NumberFormat('fr-FR').format(value);

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting} 
            onAfterPrint={onAfterPrint}
            orientation="landscape"
        >
            <div className="bg-white text-black font-sans p-1 w-full min-h-screen">
                <InstitutionalHeader 
                    settings={organizationSettings}
                    title="TABLEAU NOMINATIF DES SALAIRES BRUTS"
                    period={`PÉRIODE DU ${reportData.startYear} AU ${reportData.endYear}`}
                />

                {/* Employee Info Box */}
                <div className="mb-4 p-6 bg-slate-50 border-2 border-slate-900 rounded-2xl flex justify-between items-center shadow-sm">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Agent Bénéficiaire</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                            {reportData.employee.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg tracking-widest uppercase">
                                Mat: {reportData.employee.matricule}
                            </span>
                            <span className="text-slate-500 font-bold text-xs italic">
                                {reportData.employee.poste || "Agent CNRCT"}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Date d'Immatriculation</p>
                        <p className="text-sm font-black text-slate-900">{reportData.employee.dateEmbauche ? new Date(reportData.employee.dateEmbauche).toLocaleDateString('fr-FR') : "N/A"}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="border-2 border-slate-900 rounded-xl overflow-hidden shadow-2xl print:shadow-none">
                    <table className="w-full text-[9px] border-collapse bg-white table-fixed">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="w-[80px] font-black text-center uppercase border-r border-slate-800 p-3">Année</th>
                                {reportData.annualSalaries[0]?.months.map((m, i) => (
                                    <th key={i} className="font-black text-center uppercase border-r border-slate-800 p-1 text-[8px]">
                                        {m.month.substring(0, 3)}.
                                    </th>
                                ))}
                                <th className="w-[100px] font-black text-center uppercase p-3 bg-slate-800">Total Annuel</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.annualSalaries.map((yearData, idx) => (
                                <tr key={idx} className="text-slate-900 even:bg-slate-50/50 border-b border-slate-100 last:border-0">
                                    <td className="text-center font-black border-r border-slate-100 p-2 text-sm italic text-slate-900">
                                        {yearData.year}
                                    </td>
                                    {yearData.months.map((m, i) => (
                                        <td key={i} className="text-right font-mono border-r border-slate-100 tracking-tighter tabular-nums p-2 text-[8px] text-slate-600">
                                            {formatCurrency(m.gross)}
                                        </td>
                                    ))}
                                    <td className="text-right font-black font-mono tracking-tighter tabular-nums p-2 bg-slate-50/80 text-slate-900">
                                        {formatCurrency(yearData.total)}
                                    </td>
                                </tr>
                            ))}
                            
                            {/* Grand Total Line */}
                            <tr className="font-black bg-slate-900 text-white">
                                <td colSpan={13} className="py-4 px-6 text-right border-r border-slate-800 text-[11px] uppercase tracking-[0.2em] italic">
                                    Total Général Cumulé
                                </td>
                                <td className="py-4 px-2 text-right font-black text-[11px] tracking-tighter tabular-nums text-white bg-slate-800">
                                    {formatCurrency(reportData.grandTotal)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Certification Note */}
                <div className="mt-4 p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-[9px] text-amber-900/70 italic leading-relaxed">
                    <strong>Note importante :</strong> Le présent tableau nominatif récapitule les salaires bruts imposables déclarés pour l'agent susmentionné. 
                    Toute altération de ce document le rend caduc. L'exactitude de ces données peut être vérifiée auprès du Secrétariat Général de la CNRCT.
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
                        .bg-slate-50 { background-color: #f8fafc !important; }
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
