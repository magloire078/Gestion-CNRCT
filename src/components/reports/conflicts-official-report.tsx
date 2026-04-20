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
import { Conflict, OrganizationSettings } from "@/types/common";
import { cn } from "@/lib/utils";
import { InstitutionalFooter } from "./institutional-footer";

interface ConflictsOfficialReportProps {
    conflicts: Conflict[];
    organizationSettings: OrganizationSettings | null;
    subtitle?: string;
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
        <div className="bg-white text-black w-full min-h-screen font-sans">
            {/* --- PAGE DE GARDE --- */}
            <div className="print-page h-[280mm] flex flex-col p-16 break-after-page relative overflow-hidden">
                <header className="flex justify-between items-start mb-24 min-h-[140px] relative z-10">
                    <div className="w-1/3 text-center flex flex-col justify-center items-center">
                        <p className="font-bold text-[11px] items-center text-slate-800 leading-tight uppercase">
                            Chambre Nationale des Rois<br />et Chefs Traditionnels
                        </p>
                        {organizationSettings.mainLogoUrl && (
                            <img src={organizationSettings.mainLogoUrl} alt="Logo" className="max-h-24 mt-6 drop-shadow-sm" />
                        )}
                        <div className="w-12 h-0.5 bg-[#006039] mt-4 rounded-full" />
                    </div>
                    <div className="w-1/3"></div>
                    <div className="w-1/3 text-center flex flex-col justify-center items-center">
                        <p className="font-bold text-[11px] leading-tight text-slate-800 uppercase tracking-widest">
                            République de Côte d'Ivoire
                        </p>
                        {organizationSettings.secondaryLogoUrl && (
                            <img src={organizationSettings.secondaryLogoUrl} alt="Logo" className="max-h-20 my-6 drop-shadow-sm" />
                        )}
                        <p className="text-[10px] italic font-black border-t-2 border-slate-900 mt-2 pt-2 px-6 uppercase tracking-tighter">Union - Discipline - Travail</p>
                    </div>
                </header>

                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-16 relative z-10">
                    <div className="space-y-8">
                        <div className="inline-block px-6 py-2 border-2 border-rose-600 text-rose-600 font-black uppercase tracking-[0.3em] text-sm rounded-full mb-4">
                            Document Confidential - Audit
                        </div>
                        <h1 className="text-6xl font-black uppercase tracking-tighter text-slate-900 leading-[0.9] italic">
                            RAPPORT NATIONAL DE MÉDIATION<br />ET DES LITIGES COMMUNAUTAIRES
                        </h1>
                        <p className="text-xl font-bold text-slate-500 tracking-widest uppercase mt-4">
                            Comité des Systèmes d'Information et de Médiation
                        </p>
                        <div className="h-2 w-48 bg-rose-600 mx-auto rounded-full mt-4"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-12 mt-12 w-full max-w-4xl px-12">
                        <div className="p-10 border-4 border-slate-100 rounded-3xl bg-slate-50/50 space-y-4">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Périmètre d'Analyse</span>
                            <p className="text-2xl font-black text-slate-900 uppercase italic leading-tight">
                                {subtitle || "National"}
                            </p>
                        </div>
                        <div className="p-10 border-4 border-slate-100 rounded-3xl bg-slate-50/50 space-y-4">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Identifiant Rapport</span>
                            <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                                LIT-CNRCT-{new Date().getFullYear()}-{Math.floor(Math.random() * 9000) + 1000}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-16 justify-center mt-20">
                        <div className="text-center group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Total Dossiers</p>
                            <p className="text-5xl font-black text-slate-900">{stats.total}</p>
                        </div>
                        <div className="text-center group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Taux Résolution</p>
                            <p className="text-5xl font-black text-emerald-600 tracking-tighter">{stats.resolutionRate}%</p>
                        </div>
                        <div className="text-center group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Dossiers Actifs</p>
                            <p className="text-5xl font-black text-amber-600">{stats.mediation + stats.open}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-10 text-center border-t-2 border-slate-900">
                    <p className="font-black text-2xl uppercase tracking-[0.2em] text-[#006039]">Secrétariat Général</p>
                </div>
            </div>

            {/* --- PAGES DÉTAILLÉES (PAYSAGE) --- */}
            <div className="landscape-section min-h-screen p-12 relative print:p-8">
                <header className="flex justify-between items-end mb-12 pb-6 border-b-8 border-slate-900">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white rotate-3 shadow-xl">
                            <ShieldAlert className="h-10 w-10" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">
                                État Récapitulatif des Litiges
                            </h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">
                                Situation arrêtée au {todayStr}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="space-y-12">
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
                    signatoryName="KOUASSI N'D Dri"
                    signatoryTitle="Secrétaire Général, CNRCT"
                    showCertification={true}
                />
            </div>
        </div>
    );
}
