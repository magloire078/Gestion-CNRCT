"use client";

import React from "react";
import type { Conflict, OrganizationSettings } from "@/lib/data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import { InstitutionalCover } from "./institutional-cover";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";

interface AnnualReportLayoutProps {
    logos: OrganizationSettings;
    conflicts: Conflict[];
    periodLabel: string;
    onAfterPrint?: () => void;
}

export function AnnualReportLayout({ logos, conflicts, periodLabel, onAfterPrint }: AnnualReportLayoutProps) {
    // Group conflicts by year
    const conflictsByYear: Record<string, Conflict[]> = {};
    conflicts.forEach(c => {
        const year = new Date(c.reportedDate).getFullYear().toString();
        if (!conflictsByYear[year]) conflictsByYear[year] = [];
        conflictsByYear[year].push(c);
    });

    const years = Object.keys(conflictsByYear).sort().reverse();
    const totalConflicts = conflicts.length;
    const resolvedConflicts = conflicts.filter(c => c.status === "Résolu").length;
    const resolutionRate = totalConflicts > 0 ? Math.round((resolvedConflicts / totalConflicts) * 100) : 0;

    return (
        <InstitutionalReportWrapper isPrinting={true} orientation="portrait" onAfterPrint={onAfterPrint}>
            {/* Page de Garde */}
            <InstitutionalCover 
                title="RÉCAPITULATIF ET STATISTIQUES DES LITIGES"
                subtitle="ANALYSE DES CONFLITS COMMUNAUTAIRES"
                period={periodLabel}
                direction="SG / CABINET"
                service="Secrétariat Général"
                stats={[
                    { label: "Total Dossiers", value: totalConflicts, icon: FileText },
                    { label: "Localités", value: new Set(conflicts.map(c => c.village)).size, icon: MapPin },
                    { label: "Taux Résolution", value: `${resolutionRate}%`, icon: CheckCircle2 },
                    { label: "Alertes Actives", value: conflicts.filter(c => c.status === "Ouvert").length, icon: AlertTriangle },
                ]}
                reference={`STATS-LIT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`}
                settings={logos}
                orientation="portrait"
            />

            {/* Sommaire */}
            <div className="min-h-[29.7cm] p-12 print:p-16 break-after-page bg-white">
                    <InstitutionalHeader 
                        title="SOMMAIRE DU RAPPORT"
                        period={periodLabel}
                        settings={logos}
                    />
                
                <div className="mt-20 space-y-4">
                    {years.map((year, idx) => (
                        <div key={year} className="flex justify-between items-end border-b-2 border-dotted border-slate-200 pb-2">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white font-black text-sm">
                                    {idx + 1}
                                </span>
                                <span className="font-black uppercase text-lg tracking-tight text-slate-800">
                                    TABLEAU RÉCAPITULATIF DES LITIGES - ANNÉE {year}
                                </span>
                            </div>
                            <span className="font-black text-slate-400 tabular-nums">PAGE {idx + 2}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-auto pt-10 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black italic">
                        Document de Travail Interne - Diffusion Limitée
                    </p>
                </div>
            </div>

            {/* Tableaux par année */}
            {years.map((year, idx) => (
                <div key={year} className="min-h-[29.7cm] p-5 print:p-6 break-after-page bg-white">
                    <InstitutionalHeader 
                        title={`Récapitulatif des Litiges - Exercice ${year}`}
                        period={periodLabel}
                        settings={logos}
                    />

                    <div className="mt-4">
                        <table className="w-full border-collapse border-2 border-slate-900 text-[9px] leading-tight">
                            <thead>
                                <tr className="bg-slate-900 text-white uppercase font-black text-center">
                                    <th className="p-2 w-[30px] border-r border-slate-700">N°</th>
                                    <th className="p-2 w-[110px] border-r border-slate-700 text-left">District / Région</th>
                                    <th className="p-2 w-[90px] border-r border-slate-700 text-left">Localité</th>
                                    <th className="p-2 border-r border-slate-700 text-left">Nature du Litige / Résumé</th>
                                    <th className="p-2 w-[80px]">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conflictsByYear[year].map((conflict, index) => (
                                    <tr key={conflict.id} className="align-top border-b border-slate-200">
                                        <td className="p-2 text-center font-black border-r border-slate-200">{index + 1}</td>
                                        <td className="p-2 border-r border-slate-200 uppercase">
                                            <div className="font-black text-slate-900">{conflict.district || '-'}</div>
                                            <div className="text-slate-400 italic text-[7px] leading-none mt-1">{conflict.region || '-'}</div>
                                        </td>
                                        <td className="p-2 border-r border-slate-200 font-bold">{conflict.village}</td>
                                        <td className="p-2 border-r border-slate-200">
                                            <div className="font-black text-slate-900 uppercase mb-1">{conflict.type}</div>
                                            <div className="text-slate-600 italic line-clamp-3 leading-tight">{conflict.description}</div>
                                        </td>
                                        <td className="p-2 text-center uppercase">
                                            <span className={`px-2 py-1 rounded-sm font-black text-[7px] ${
                                                conflict.status === 'Résolu' ? 'bg-emerald-100 text-emerald-800' : 
                                                conflict.status === 'En médiation' ? 'bg-amber-100 text-amber-800' : 
                                                'bg-slate-100 text-slate-800'
                                            }`}>
                                                {conflict.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-auto pt-8 flex justify-between items-end border-t border-slate-100 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Chambre Nationale des Rois et Chefs Traditionnels</span>
                        <span>Page {idx + 2} / {years.length + 1}</span>
                    </div>
                </div>
            ))}
        </InstitutionalReportWrapper>
    );
}
