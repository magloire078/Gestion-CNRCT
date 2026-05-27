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
import { GlobalSynthesisTable, RegionSynthesisTable } from "./synthesis-tables";

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
                    compact={true}
                />

                <GlobalSynthesisTable villages={villages} />

                {/* --- PAGES DÉTAILLÉES (PAYSAGE) --- */}
                <div className="landscape-section min-h-screen p-12 relative print:p-8 pt-0 print:pt-0">
                    <div className="space-y-12 mt-8">
                        {Object.entries(villagesByRegion).sort().map(([region, regionVillages]) => {
                            const uniqueDepts = new Set(regionVillages.map(v => (v.village.department || '').trim().toUpperCase()).filter(Boolean));
                            const uniqueSPs = new Set(regionVillages.map(v => (v.village.subPrefecture || v.village.commune || '').trim().toUpperCase()).filter(Boolean));
                            const uniqueVillages = new Set(regionVillages.map(v => (v.village.name || '').trim().toUpperCase()).filter(Boolean));
                            
                            const commonDept = uniqueDepts.size === 1 ? Array.from(uniqueDepts)[0] : null;
                            const commonSP = uniqueSPs.size === 1 ? Array.from(uniqueSPs)[0] : null;
                            const commonVillage = uniqueVillages.size === 1 ? Array.from(uniqueVillages)[0] : null;

                            return (
                                <div key={region} className="space-y-6 px-2">
                                    <div className="flex justify-between items-end border-b-4 border-slate-100 pb-2">
                                        <div className="flex items-end flex-wrap gap-x-4 gap-y-2">
                                            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                                Région : <span className="text-[#006039] underline decoration-4 underline-offset-8">{region}</span>
                                                {!commonDept && <span className="text-[13px] text-slate-400 ml-3 no-underline font-bold">({uniqueDepts.size} Départements)</span>}
                                            </h3>
                                            {(commonDept || commonSP || commonVillage) && (
                                                <div className="flex items-center gap-4 text-sm font-black uppercase tracking-widest pb-0.5">
                                                    {commonDept && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-300">|</span>
                                                            <span className="text-slate-500">Dép:</span>
                                                            <span className="text-slate-800 underline decoration-2 underline-offset-4">{commonDept}</span>
                                                            {!commonSP && <span className="text-[11px] text-slate-400 ml-1 no-underline font-bold">({uniqueSPs.size} Sous-préfectures)</span>}
                                                        </div>
                                                    )}
                                                    {commonSP && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-300">|</span>
                                                            <span className="text-slate-500">S/P:</span>
                                                            <span className="text-slate-800 underline decoration-2 underline-offset-4">{commonSP}</span>
                                                            {!commonVillage && <span className="text-[11px] text-slate-400 ml-1 no-underline font-bold">({uniqueVillages.size} Localités)</span>}
                                                        </div>
                                                    )}
                                                    {commonVillage && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-300">|</span>
                                                            <span className="text-slate-500">Village:</span>
                                                            <span className="text-slate-800 underline decoration-2 underline-offset-4">{commonVillage}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {regionVillages.length} Localités recensées
                                        </div>
                                    </div>
                                    
                                    <RegionSynthesisTable region={region} villages={regionVillages} />
                                    
                                    <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-900 text-white uppercase font-black print:bg-transparent print:text-slate-900 print:border-b-2 print:border-slate-900">
                                            <th className="p-3 w-[40px] text-center">N°</th>
                                            {!commonDept && <th className="p-3 text-left">Département</th>}
                                            {!commonSP && <th className="p-3 text-left">Sous-Préfecture</th>}
                                            <th className="p-3 text-left">Localité</th>
                                            <th className="p-3 text-left">Autorité Traditionnelle & Matricule</th>
                                            <th className="p-3 text-left whitespace-nowrap">Contacts</th>
                                            <th className="p-3 text-center whitespace-nowrap">Statut Siège</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const sortedVillages = [...regionVillages].sort((a, b) => {
                                                const deptCompare = (a.village.department || '').localeCompare(b.village.department || '');
                                                if (deptCompare !== 0) return deptCompare;
                                                const spCompare = (a.village.subPrefecture || a.village.commune || '').localeCompare(b.village.subPrefecture || b.village.commune || '');
                                                if (spCompare !== 0) return spCompare;
                                                return (a.village.name || '').localeCompare(b.village.name || '');
                                            });

                                            const deptSpans: Record<number, number> = {};
                                            const spSpans: Record<number, number> = {};

                                            sortedVillages.forEach((entry, idx) => {
                                                const dept = entry.village.department || '';
                                                const sp = entry.village.subPrefecture || entry.village.commune || '';
                                                
                                                if (idx === 0 || (sortedVillages[idx - 1].village.department || '') !== dept) {
                                                    let span = 1;
                                                    for (let i = idx + 1; i < sortedVillages.length; i++) {
                                                        if ((sortedVillages[i].village.department || '') === dept) span++;
                                                        else break;
                                                    }
                                                    deptSpans[idx] = span;
                                                }

                                                const prevDept = idx > 0 ? (sortedVillages[idx - 1].village.department || '') : null;
                                                const prevSP = idx > 0 ? (sortedVillages[idx - 1].village.subPrefecture || sortedVillages[idx - 1].village.commune || '') : null;
                                                
                                                if (idx === 0 || prevDept !== dept || prevSP !== sp) {
                                                    let span = 1;
                                                    for (let i = idx + 1; i < sortedVillages.length; i++) {
                                                        const nextDept = sortedVillages[i].village.department || '';
                                                        const nextSP = sortedVillages[i].village.subPrefecture || sortedVillages[i].village.commune || '';
                                                        if (nextDept === dept && nextSP === sp) span++;
                                                        else break;
                                                    }
                                                    spSpans[idx] = span;
                                                }
                                            });

                                            return sortedVillages.map((entry, idx) => {
                                                const renderDept = !commonDept && deptSpans[idx] !== undefined;
                                                const renderSP = !commonSP && spSpans[idx] !== undefined;

                                                return (
                                                    <tr key={entry.village.id} className="border-b border-slate-300 hover:bg-slate-50/50">
                                                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                                        {renderDept && (
                                                            <td rowSpan={deptSpans[idx]} className="p-3 font-bold text-slate-700 uppercase tracking-tighter align-middle text-center bg-slate-50/50 border-r border-slate-200">
                                                                <div className="rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                                                    {entry.village.department}
                                                                </div>
                                                            </td>
                                                        )}
                                                        {renderSP && (
                                                            <td rowSpan={spSpans[idx]} className="p-3 font-bold text-slate-600 uppercase align-middle text-center bg-slate-50/30 border-r border-slate-200">
                                                                <div className="rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                                                    {entry.village.subPrefecture || entry.village.commune}
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="p-3">
                                                    <span className="text-[11px] italic uppercase text-slate-800">{entry.village.name}</span>
                                                </td>
                                                <td className="p-3">
                                                    {entry.currentChief ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-black text-slate-800 uppercase italic underline underline-offset-2 tracking-tight">
                                                                {entry.currentChief.name}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-500">
                                                                    {entry.currentChief.CNRCTRegistrationNumber || 'SANS MATRICULE'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 font-bold italic uppercase tracking-widest text-[9px]">--- NEANT ---</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {entry.currentChief && (entry.currentChief.phone || entry.currentChief.contact) ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-bold text-slate-700 tracking-wider whitespace-nowrap">
                                                                {entry.currentChief.phone || entry.currentChief.contact}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 font-bold italic text-[9px]">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center whitespace-nowrap">
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
                                        );
                                    })})()}
                                    </tbody>
                                </table>
                            </div>
                        )})}
                    </div>

                    <InstitutionalFooter 
                        signatoryName={organizationSettings?.globalSignatoryName || "NANAN AHOUA KOUASSI III"}
                        signatoryTitle={organizationSettings?.globalSignatoryTitle || "Directeur de l'Observatoire National, CNRCT"}
                        showCertification={true}
                    />
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
