"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    MapPin, 
    Zap, 
    Droplets, 
    Activity, 
    School,
    Users,
    Building2,
    Globe
} from "lucide-react";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalCover } from "./institutional-cover";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";
import { Village, VillageEntry } from "@/types/village";
import { OrganizationSettings } from "@/types/common";
import { cn } from "@/lib/utils";

interface TerritoryOfficialReportProps {
    villages: Village[];
    organizationSettings: OrganizationSettings | null;
    subtitle?: string;
    isPrinting: boolean;
    onAfterPrint?: () => void;
    stats: {
        total: number;
        population: number;
        electricity: number;
        water: number;
        health: number;
        school: number;
    };
}

export function TerritoryOfficialReport({ 
    villages, 
    organizationSettings, 
    subtitle,
    isPrinting,
    onAfterPrint,
    stats 
}: TerritoryOfficialReportProps) {
    if (!organizationSettings && isPrinting) return null;

    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });

    // Group villages by Region
    const villagesByRegion = villages.reduce((acc, v) => {
        const region = v.region || "Non définie";
        if (!acc[region]) acc[region] = [];
        acc[region].push(v);
        return acc;
    }, {} as Record<string, Village[]>);

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting} 
            onAfterPrint={onAfterPrint}
            orientation="landscape"
        >
            <div className="bg-white text-black w-full font-sans">
                {/* --- PAGE DE GARDE --- */}
                <InstitutionalCover 
                    title="DIAGNOSTIC NATIONAL DES INFRASTRUCTURES RURALES"
                    subtitle={subtitle || "Observatoire Territorial du CNRCT"}
                    direction="DFP / DR"
                    service="Direction du Patrimoine et des Relations Extérieures"
                    stats={[
                        { label: "Localités Diagnostiquées", value: stats.total, icon: MapPin },
                        { label: "Électrification", value: `${stats.electricity.toFixed(1)}%`, icon: Zap },
                        { label: "Accès Eau Potable", value: `${stats.water.toFixed(1)}%`, icon: Droplets },
                        { label: "Couverture Scolaire", value: `${stats.school.toFixed(1)}%`, icon: School },
                    ]}
                    reference={`DIAG-TER-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`}
                    settings={organizationSettings}
                    orientation="landscape"
                />

                {/* --- PAGES DÉTAILLÉES (PAYSAGE) --- */}
                <div className="print-page min-h-screen p-12 bg-white">
                    <InstitutionalHeader 
                        title="État de l'Inventaire des Services de Base"
                        period={`Situation consolidée au ${todayStr}`}
                        settings={organizationSettings}
                    />

                    <div className="space-y-6">
                        {Object.entries(villagesByRegion).sort().map(([region, regionVillages]) => (
                            <div key={region} className="space-y-6 break-inside-avoid">
                                <div className="flex justify-between items-end border-b-4 border-slate-100 pb-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                        Territoire : <span className="text-amber-600 underline decoration-4 underline-offset-8">{region}</span>
                                    </h3>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full border border-slate-100">
                                        {regionVillages.length} Localités auditées
                                    </div>
                                </div>
                                
                                <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-900 text-white uppercase font-black text-center print:bg-transparent print:text-slate-900 print:border-b-2 print:border-slate-900">
                                            <th className="p-3 text-left border-r border-slate-700">Nom de la Localité</th>
                                            <th className="p-3 text-left border-r border-slate-700">S-Préfecture / Département</th>
                                            <th className="p-3 w-[80px] border-r border-slate-700">Population</th>
                                            <th className="p-3 w-[70px] border-r border-slate-700 text-amber-400"><Zap className="h-4 w-4 mx-auto" /></th>
                                            <th className="p-3 w-[70px] border-r border-slate-700 text-cyan-400"><Droplets className="h-4 w-4 mx-auto" /></th>
                                            <th className="p-3 w-[70px] border-r border-slate-700 text-rose-400"><Activity className="h-4 w-4 mx-auto" /></th>
                                            <th className="p-3 w-[70px] text-indigo-400"><School className="h-4 w-4 mx-auto" /></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {regionVillages.sort((a, b) => a.name.localeCompare(b.name)).map((v) => (
                                            <tr key={v.id} className="border-b border-slate-200 align-top hover:bg-slate-50/50">
                                                <td className="p-3 font-black text-slate-900 border-r border-slate-200 uppercase">
                                                    {v.name}
                                                </td>
                                                <td className="p-3 border-r border-slate-200 uppercase text-slate-500 font-bold">
                                                    {v.subPrefecture} / {v.department}
                                                </td>
                                                <td className="p-3 border-r border-slate-200 text-center font-black tabular-nums">
                                                    {(v.population || 0).toLocaleString()}
                                                </td>
                                                <td className="p-3 border-r border-slate-200 text-center">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded font-black text-[8px] uppercase",
                                                        v.hasElectricity ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        {v.hasElectricity ? "OUI" : "NON"}
                                                    </span>
                                                </td>
                                                <td className="p-3 border-r border-slate-200 text-center">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded font-black text-[8px] uppercase",
                                                        v.hasWater ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        {v.hasWater ? "OUI" : "NON"}
                                                    </span>
                                                </td>
                                                <td className="p-3 border-r border-slate-200 text-center">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded font-black text-[8px] uppercase",
                                                        v.hasHealthCenter ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        {v.hasHealthCenter ? "OUI" : "NON"}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded font-black text-[8px] uppercase",
                                                        v.hasSchool ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        {v.hasSchool ? "OUI" : "NON"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    <InstitutionalFooter 
                        signatoryTitle="Directeur du Patrimoine, CNRCT"
                        showSignatures={true}
                        leftSignatureTitle="LE RESPONSABLE DES ÉTUDES"
                        rightSignatureTitle="LE DIRECTEUR DU PATRIMOINE"
                    />
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
