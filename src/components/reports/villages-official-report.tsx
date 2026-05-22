"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    MapPin, 
    Users, 
    Zap, 
    Droplets, 
    School, 
    Activity,
    ShoppingBag,
    Church,
    Search
} from "lucide-react";
import { Village, VillageEntry } from "@/types/village";
import { OrganizationSettings } from "@/types/common";
import { cn } from "@/lib/utils";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalCover } from "./institutional-cover";

import { InstitutionalReportWrapper } from "./institutional-report-wrapper";

interface VillagesOfficialReportProps {
    villages: VillageEntry[];
    organizationSettings: OrganizationSettings | null;
    subtitle?: string;
    isPrinting?: boolean;
    onAfterPrint?: () => void;
    stats: {
        total: number;
        occupied: number;
        vacant: number;
        electricity: number;
        water: number;
        school: number;
        health: number;
        market: number;
        spiritual: number;
    };
}

export function VillagesOfficialReport({ 
    villages, 
    organizationSettings, 
    subtitle,
    isPrinting,
    onAfterPrint,
    stats 
}: VillagesOfficialReportProps) {
    if (!organizationSettings) return null;

    // Group villages by Region
    const villagesByRegion = villages.reduce((acc, village) => {
        const region = village.village.region || "Non définie";
        if (!acc[region]) acc[region] = [];
        acc[region].push(village);
        return acc;
    }, {} as Record<string, VillageEntry[]>);

    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });
    const equipmentIndex = ((stats.electricity + stats.water + stats.school + stats.health + stats.market + stats.spiritual) / 6).toFixed(0);

    return (
        <InstitutionalReportWrapper 
            isPrinting={!!isPrinting} 
            onAfterPrint={onAfterPrint}
            orientation="landscape"
        >
            <div id="print-section" className="bg-white text-black w-full min-h-screen font-sans">
                <InstitutionalCover 
                    title="ÉTAT DES LIEUX DES LOCALITÉS ET AUTORITÉS"
                    orientation="landscape"
                    subtitle="Observatoire National de la Chefferie"
                    direction="SG"
                    service="Secrétariat Général / Services Territoriaux"
                    period={subtitle || "Territoire National"}
                    stats={[
                        { label: "Total Localités", value: stats.total, icon: MapPin },
                        { label: "Vacances de Trône", value: stats.vacant, icon: Users },
                        { label: "Taux Équipement", value: `${equipmentIndex}%`, icon: Zap },
                    ]}
                    reference={`LOC-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`}
                    settings={organizationSettings}
                />

                {/* --- PAGES DÉTAILLÉES (PAYSAGE) --- */}
                <div className="landscape-section min-h-screen p-12 relative print:p-8">
                    <InstitutionalHeader 
                        title="Rapport de Synthèse Territoriale"
                        period={`Situation arrêtée au ${todayStr}`}
                        direction="SG"
                        service="Observatoire National de la Chefferie"
                        settings={organizationSettings}
                    />

                    <div className="space-y-12">
                        {Object.entries(villagesByRegion).sort().map(([region, regionVillages]) => (
                            <div key={region} className="space-y-6 break-inside-avoid px-2">
                                <div className="flex justify-between items-end border-b-4 border-slate-100 pb-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                        Région : <span className="text-[#006039] underline decoration-4 underline-offset-8">{region}</span>
                                    </h3>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {regionVillages.length} Localités recensées
                                    </div>
                                </div>
                                
                                <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-900 text-white uppercase font-black print:bg-transparent print:text-slate-900 print:border-b-2 print:border-slate-900">
                                            <th className="p-3 w-[40px] text-center">N°</th>
                                            <th className="p-3 text-left">Localité / Sous-Préfecture</th>
                                            <th className="p-3 text-left">Département</th>
                                            <th className="p-3 text-left">Autorité Traditionnelle & Matricule</th>
                                            <th className="p-3 w-[180px] text-center">Équipements & Infrastructures</th>
                                            <th className="p-3 w-[120px] text-center">Statut Siège</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {regionVillages.sort((a, b) => a.village.name.localeCompare(b.village.name)).map((entry, idx) => (
                                            <tr key={entry.village.id} className="border-b border-slate-300 hover:bg-slate-50/50">
                                                <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black uppercase text-slate-900">{entry.village.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{entry.village.subPrefecture || entry.village.commune}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 font-bold text-slate-700 uppercase tracking-tighter">
                                                    {entry.village.department}
                                                </td>
                                                <td className="p-3">
                                                    {entry.currentChief ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-black text-slate-800 uppercase italic underline underline-offset-2 tracking-tight">
                                                                {entry.currentChief.name}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-500">
                                                                    {entry.currentChief.CNRCTRegistrationNumber}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 font-bold italic uppercase tracking-widest text-[9px]">--- NEANT ---</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex justify-center gap-2">
                                                        <Zap className={cn("h-3.5 w-3.5", entry.village.hasElectricity ? "text-amber-500" : "text-slate-100")} />
                                                        <Droplets className={cn("h-3.5 w-3.5", entry.village.hasWater ? "text-blue-500" : "text-slate-100")} />
                                                        <School className={cn("h-3.5 w-3.5", entry.village.hasSchool ? "text-indigo-500" : "text-slate-100")} />
                                                        <Activity className={cn("h-3.5 w-3.5", entry.village.hasHealthCenter ? "text-emerald-500" : "text-slate-100")} />
                                                        <ShoppingBag className={cn("h-3.5 w-3.5", entry.village.hasMarket ? "text-rose-500" : "text-slate-100")} />
                                                        <Church className={cn("h-3.5 w-3.5", (entry.village.hasMosque || entry.village.hasChurch) ? "text-slate-600" : "text-slate-100")} />
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {entry.currentChief ? (
                                                        <span className="inline-block px-3 py-1 bg-emerald-50 text-[#006039] border border-emerald-200 rounded-sm font-black text-[9px] uppercase tracking-widest">
                                                            Occupé
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-sm font-black text-[9px] uppercase tracking-widest shadow-sm">
                                                            VACANCE
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    <InstitutionalFooter 
                        signatoryName="NANAN AHOUA KOUASSI III"
                        signatoryTitle="Directeur de l'Observatoire National, CNRCT"
                        showCertification={true}
                    />
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
