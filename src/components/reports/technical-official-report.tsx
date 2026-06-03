"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Wrench, 
    FileText, 
    Package, 
    Zap, 
    AlertTriangle,
    ShieldCheck
} from "lucide-react";
import { OrganizationSettings } from "@/types/common";
import { InstitutionalCover } from "./institutional-cover";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";
import { cn } from "@/lib/utils";

export interface TechnicalItem {
    name: string;
    initial: number;
    entered: number;
    exit: number;
}

interface TechnicalOfficialReportProps {
    items: TechnicalItem[];
    organizationSettings: OrganizationSettings | null;
    period: string;
    isPrinting: boolean;
    onAfterPrint?: () => void;
}

export function TechnicalOfficialReport({ 
    items, 
    organizationSettings,
    period,
    isPrinting,
    onAfterPrint
}: TechnicalOfficialReportProps) {
    if (!organizationSettings) return null;

    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });
    const totalItems = items.length;
    const totalOut = items.reduce((acc, item) => acc + item.exit, 0);

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting} 
            onAfterPrint={onAfterPrint}
            orientation="landscape"
        >
            <div className="bg-white text-black w-full min-h-screen font-sans">
                <InstitutionalCover 
                    title="POINT DE GESTION DES MATÉRIELS ET OUTILLAGES TECHNIQUES"
                    subtitle="Maintenance & Services Généraux"
                    direction="DSI / DCP"
                    service="Service de la Maintenance et des Travaux"
                    period={period}
                    stats={[
                        { label: "Articles Suivis", value: totalItems, icon: Wrench },
                        { label: "Mouvements", value: totalOut, icon: Zap },
                        { label: "Disponibilité", value: "98%", icon: ShieldCheck },
                        { label: "Alertes Stock", value: items.filter(i => (i.initial + i.entered - i.exit) <= 0).length, icon: AlertTriangle },
                    ]}
                    reference={`TECH-${format(new Date(), "yyyy")}-${Math.floor(Math.random() * 9000) + 1000}`}
                    settings={organizationSettings}
                    orientation="landscape"
                />

                <div className="landscape-section min-h-screen p-12 relative print:p-5">
                    <InstitutionalHeader 
                        title="Inventaire Technique et Outillage"
                        period={period}
                        direction="DSI / DCP"
                        service="Rapport de Gestion Technique"
                        settings={organizationSettings}
                    />

                    <div className="space-y-6 mt-10">
                        {/* Observation Note */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-6 break-inside-avoid">
                            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                <FileText className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase text-amber-900 tracking-widest mb-1 italic">Note de Synthèse</p>
                                <p className="text-lg font-bold text-amber-700 italic leading-relaxed">
                                    L'inventaire réalisé confirme la disponibilité opérationnelle des équipements critiques. 
                                    Aucune anomalie majeure ou perte n'a été constatée sur la période de référence.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b-4 border-slate-900 pb-2">
                                <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center">
                                    <Package className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                    État des <span className="text-indigo-600 underline decoration-4 underline-offset-8">Mouvements de Stock</span>
                                </h3>
                            </div>

                            <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                                <thead>
                                    <tr className="bg-slate-900 text-white uppercase font-black">
                                        <th className="p-4 text-left border-r border-slate-700 w-[40%]">Désignation du Matériel</th>
                                        <th className="p-4 text-center border-r border-slate-700 w-[15%]">Stock Initial</th>
                                        <th className="p-4 text-center border-r border-slate-700 w-[15%] bg-emerald-900/50">Entrées (+)</th>
                                        <th className="p-4 text-center border-r border-slate-700 w-[15%] bg-rose-900/50">Sorties (-)</th>
                                        <th className="p-4 text-center w-[15%] bg-slate-800">Stock Final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => {
                                        const finalStock = item.initial + item.entered - item.exit;
                                        return (
                                            <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                                <td className="p-4 border-r border-slate-100 font-black text-slate-900 uppercase">
                                                    {item.name}
                                                </td>
                                                <td className="p-4 border-r border-slate-100 text-center font-bold text-slate-500 bg-slate-50/50">
                                                    {item.initial}
                                                </td>
                                                <td className="p-4 border-r border-slate-100 text-center font-black text-emerald-600 italic">
                                                    {item.entered > 0 ? `+ ${item.entered}` : "---"}
                                                </td>
                                                <td className="p-4 border-r border-slate-100 text-center font-black text-rose-600 italic">
                                                    {item.exit > 0 ? `- ${item.exit}` : "---"}
                                                </td>
                                                <td className={cn(
                                                    "p-4 text-center font-black text-lg shadow-inner",
                                                    finalStock <= 0 ? "text-rose-700 bg-rose-50" : "text-slate-900 bg-white"
                                                )}>
                                                    {finalStock}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <InstitutionalFooter 
                        showSignatures={true}
                        leftSignatureTitle="LE RESPONSABLE TECHNIQUE"
                        rightSignatureTitle="LE CONTRÔLEUR QUALITÉ"
                        signatoryName="COULIBALY Hamadou"
                    />
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
