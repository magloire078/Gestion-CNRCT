"use client";

import React from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    AlertTriangle, 
    CheckCircle2, 
    ShieldAlert, 
    Users, 
    History,
    TrendingUp,
    MapPin,
    FileText,
    Activity
} from "lucide-react";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalCover } from "./institutional-cover";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";
import { Conflict, OrganizationSettings } from "@/types/common";
import { cn } from "@/lib/utils";

interface ConflictsOfficialReportProps {
    conflicts: Conflict[];
    organizationSettings: OrganizationSettings | null;
    subtitle?: string;
    isPrinting?: boolean;
    onAfterPrint?: () => void;
    stats: {
        total: number;
        resolved: number;
        mediation: number;
        open: number;
        resolutionRate: number;
        topType: string;
    };
}

export function ConflictsOfficialReport({ 
    conflicts, 
    organizationSettings, 
    subtitle,
    isPrinting,
    onAfterPrint,
    stats 
}: ConflictsOfficialReportProps) {
    if (!organizationSettings) return null;

    // Group conflicts by Region
    const conflictsByRegion = conflicts.reduce((acc, conflict) => {
        const region = conflict.region || "Non définie";
        if (!acc[region]) acc[region] = [];
        acc[region].push(conflict);
        return acc;
    }, {} as Record<string, Conflict[]>);

    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting || false} 
            orientation="landscape"
            onAfterPrint={onAfterPrint}
        >
            {/* --- PAGE DE GARDE --- */}
            <InstitutionalCover 
                title="RAPPORT NATIONAL DE MÉDIATION ET DES LITIGES COMMUNAUTAIRES"
                subtitle={subtitle || "Périmètre National"}
                direction="DFP"
                service="Direction des Finances et du Patrimoine"
                stats={[
                    { label: "Total Dossiers", value: stats.total, icon: FileText },
                    { label: "Taux Résolution", value: `${stats.resolutionRate}%`, icon: CheckCircle2 },
                    { label: "En Médiation", value: stats.mediation, icon: Users },
                    { label: "Dossiers Ouverts", value: stats.open, icon: AlertTriangle },
                ]}
                reference={`LIT-CNRCT-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`}
                settings={organizationSettings}
                orientation="landscape"
            />

            {/* --- PAGES DÉTAILLÉES (PAYSAGE) --- */}
            <div className="min-h-screen p-12 print:p-5 bg-white">
                    <InstitutionalHeader 
                        title="État Récapitulatif des Litiges"
                        period={`Situation arrêtée au ${todayStr}`}
                        settings={organizationSettings}
                    />

                    <div className="space-y-6">
                        {Object.entries(conflictsByRegion).sort().map(([region, regionConflicts]) => (
                            <div key={region} className="space-y-6 break-inside-avoid">
                                <div className="flex justify-between items-end border-b-4 border-slate-100 pb-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                        Territoire : <span className="text-rose-600 underline decoration-4 underline-offset-8">{region}</span>
                                    </h3>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full border border-slate-100">
                                        {regionConflicts.length} Dossiers enregistrés
                                    </div>
                                </div>
                                
                                <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-900 text-white uppercase font-black">
                                            <th className="p-3 w-[40px] text-center border-r border-slate-700">N°</th>
                                            <th className="p-3 w-[100px] text-center border-r border-slate-700">Date Sig.</th>
                                            <th className="p-3 text-left border-r border-slate-700">Localité / District</th>
                                            <th className="p-3 text-left border-r border-slate-700">Nature & Description Synthétique</th>
                                            <th className="p-3 text-left border-r border-slate-700">Médiateur Assigné</th>
                                            <th className="p-3 w-[140px] text-center">État d'Avancement</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {regionConflicts.sort((a, b) => b.reportedDate.localeCompare(a.reportedDate)).map((conflict, idx) => (
                                            <tr key={conflict.id} className="border-b border-slate-300 hover:bg-slate-50/50 align-top">
                                                <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-100 tabular-nums">{idx + 1}</td>
                                                <td className="p-3 text-center border-r border-slate-100 font-mono font-bold text-slate-500">
                                                    {isValid(parseISO(conflict.reportedDate)) ? format(parseISO(conflict.reportedDate), 'dd/MM/yyyy') : conflict.reportedDate}
                                                </td>
                                                <td className="p-3 border-r border-slate-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black uppercase text-slate-900">{conflict.village}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase italic">{conflict.district || "-"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 border-r border-slate-100 text-justify">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="inline-block px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase w-fit rounded">
                                                            {conflict.type}
                                                        </span>
                                                        <p className="leading-tight text-slate-700 italic">
                                                            "{conflict.description}"
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="p-3 border-r border-slate-100">
                                                    <span className="font-bold text-slate-600 uppercase text-[9px] tracking-tight">
                                                        {conflict.mediatorName || "--- Non désigné ---"}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex flex-col gap-2 items-center">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-sm font-black text-[9px] uppercase tracking-widest border shadow-sm",
                                                            conflict.status === 'Résolu' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                            conflict.status === 'En médiation' ? "bg-blue-50 text-blue-700 border-blue-200" : 
                                                            "bg-rose-50 text-rose-700 border-rose-200"
                                                        )}>
                                                            {conflict.status}
                                                        </span>
                                                        {conflict.resolutionDate && (
                                                            <span className="text-[8px] font-bold text-emerald-600 font-mono">
                                                                Résolu le {format(parseISO(conflict.resolutionDate), 'dd/MM/yy')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    <InstitutionalFooter 
                        signatoryName="FATOGOMA Yeo"
                        signatoryTitle="Secrétaire Général, CNRCT"
                        showCertification={true}
                    />
                </div>
        </InstitutionalReportWrapper>
    );
}

