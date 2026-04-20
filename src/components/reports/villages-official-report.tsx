"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    MapPin, 
    Users, 
    Shield, 
    Zap, 
    Droplets, 
    School, 
    Activity,
    Tent,
    Search
} from "lucide-react";
import { VillageEntry } from "@/app/villages/page";
import { OrganizationSettings } from "@/types/common";
import { cn } from "@/lib/utils";
import { InstitutionalFooter } from "./institutional-footer";

interface VillagesOfficialReportProps {
    villages: VillageEntry[];
    organizationSettings: OrganizationSettings | null;
    subtitle?: string;
    stats: {
        total: number;
        occupied: number;
        vacant: number;
        electricity: number;
        water: number;
        school: number;
        health: number;
    };
}

export function VillagesOfficialReport({ 
    villages, 
    organizationSettings, 
    subtitle,
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
    const equipmentIndex = ((stats.electricity + stats.water + stats.school + stats.health) / 4).toFixed(0);

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
                        <div className="inline-block px-8 py-3 bg-slate-900 text-white font-black uppercase tracking-[0.4em] text-xs rounded-lg mb-4 shadow-2xl">
                            Administration du Territoire
                        </div>
                        <h1 className="text-6xl font-black uppercase tracking-tighter text-slate-900 leading-[0.9] italic">
                            ÉTAT DES LIEUX DES<br />LOCALITÉS ET AUTORITÉS
                        </h1>
                        <p className="text-2xl font-bold text-slate-500 tracking-[0.2em] uppercase mt-4">
                            OBSERVATOIRE NATIONAL DE LA CHEFFERIE
                        </p>
                        <div className="h-2 w-64 bg-[#006039] mx-auto rounded-full mt-4"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-12 mt-12 w-full max-w-4xl px-12">
                        <div className="p-12 border-4 border-slate-100 rounded-[3rem] bg-slate-50/50 space-y-4 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Périmètre de l'Audit</span>
                            <p className="text-3xl font-black text-slate-900 uppercase italic leading-tight">
                                {subtitle || "Territoire National"}
                            </p>
                        </div>
                        <div className="p-12 border-4 border-slate-100 rounded-[3rem] bg-slate-50/50 space-y-4 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Code d'Archivage</span>
                            <p className="text-3xl font-black text-slate-900 font-mono tracking-tighter lowercase">
                                <span className="uppercase">loc</span>-{new Date().getFullYear()}-{Math.floor(Math.random() * 90000) + 10000}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-20 justify-center mt-20">
                        <div className="text-center group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Total Localités</p>
                            <p className="text-5xl font-black text-slate-900">{stats.total}</p>
                        </div>
                        <div className="text-center group border-x-2 border-slate-100 px-20">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Vacances de Trône</p>
                            <p className="text-5xl font-black text-rose-600 tracking-tighter">{stats.vacant}</p>
                        </div>
                        <div className="text-center group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Taux d'Équipement</p>
                            <p className="text-5xl font-black text-slate-900">{equipmentIndex}%</p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-10 text-center border-t-2 border-slate-900">
                    <p className="font-black text-2xl uppercase tracking-[0.2em] text-[#006039]">Secrétariat Général / Services Territoriaux</p>
                </div>
            </div>

            {/* --- PAGES DÉTAILLÉES (PAYSAGE) --- */}
            <div className="landscape-section min-h-screen p-12 relative print:p-8">
                <header className="flex justify-between items-end mb-12 pb-6 border-b-8 border-slate-900">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[#006039] rounded-2xl flex items-center justify-center text-white rotate-3 shadow-xl">
                            <MapPin className="h-10 w-10" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">
                                Rapport de Synthèse Territoriale
                            </h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">
                                Situation arrêtée au {todayStr}
                            </p>
                        </div>
                    </div>
                    {organizationSettings.mainLogoUrl && (
                        <img src={organizationSettings.mainLogoUrl} alt="Logo" className="h-20 grayscale opacity-20" />
                    )}
                </header>

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
                                    <tr className="bg-slate-900 text-white uppercase font-black">
                                        <th className="p-3 w-[40px] text-center">N°</th>
                                        <th className="p-3 text-left">Localité / Sous-Préfecture</th>
                                        <th className="p-3 text-left">Département</th>
                                        <th className="p-3 text-left">Autorité Traditionnelle & Matricule</th>
                                        <th className="p-3 w-[150px] text-center">Infrastructures de Base</th>
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
                                                <div className="flex justify-center gap-3">
                                                    <Zap className={cn("h-4 w-4", entry.village.hasElectricity ? "text-amber-500" : "text-slate-100")} />
                                                    <Droplets className={cn("h-4 w-4", entry.village.hasWater ? "text-blue-500" : "text-slate-100")} />
                                                    <School className={cn("h-4 w-4", entry.village.hasSchool ? "text-indigo-500" : "text-slate-100")} />
                                                    <Activity className={cn("h-4 w-4", entry.village.hasHealthCenter ? "text-emerald-500" : "text-slate-100")} />
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
    );
}
