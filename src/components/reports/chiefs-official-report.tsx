"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Crown, 
    MapPin, 
    Phone, 
    Mail,
    Building2,
    Calendar
} from "lucide-react";
import { Chief, OrganizationSettings } from "@/lib/data";
import { cn } from "@/lib/utils";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalCover } from "./institutional-cover";
import { GlobalSynthesisTable, RegionSynthesisTable } from "./synthesis-tables";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";

interface ChiefsOfficialReportProps {
    chiefs: Chief[];
    organizationSettings: OrganizationSettings | null;
    subtitle?: string;
    isPrinting?: boolean;
    onAfterPrint?: () => void;
    orientation?: 'portrait' | 'landscape';
    stats: {
        total: number;
        regions: number;
        villages: number;
    };
    columnsToPrint?: string[];
}

export function ChiefsOfficialReport({ 
    chiefs, 
    organizationSettings, 
    subtitle,
    isPrinting,
    onAfterPrint,
    orientation = 'landscape',
    stats,
    columnsToPrint 
}: ChiefsOfficialReportProps) {
    if (!organizationSettings) return null;

    // Group chiefs by Region
    const chiefsByRegion = chiefs.reduce((acc, chief) => {
        const region = chief.region || "Non définie";
        if (!acc[region]) acc[region] = [];
        acc[region].push(chief);
        return acc;
    }, {} as Record<string, Chief[]>);

    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting || false} 
            orientation={orientation}
            onAfterPrint={onAfterPrint}
        >
            <div className="bg-white text-black w-full min-h-screen font-sans">
                <InstitutionalCover 
                    title="RÉPERTOIRE OFFICIEL DES AUTORITÉS TRADITIONNELLES"
                    orientation={orientation}
                    subtitle="Directoire des Rois et Chefs Traditionnels"
                    direction="DR"
                    service="Direction du Directoire et de la Gouvernance"
                    period={subtitle || "Situation Nationale"}
                    stats={[
                        { label: "Total Autorités", value: stats.total, icon: Crown },
                        { label: "Régions", value: stats.regions, icon: MapPin },
                        { label: "Localités", value: stats.villages, icon: Building2 },
                    ]}
                    reference={`RGT-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`}
                    settings={organizationSettings}
                    compact={true}
                />

                <GlobalSynthesisTable chiefs={chiefs} />

                {/* --- PAGES DÉTAILLÉES (PAYSAGE) --- */}
                <div className="landscape-section min-h-screen p-12 relative print:p-5 pt-0 print:pt-0">
                    <div className="space-y-6 mt-4">
                        {Object.entries(chiefsByRegion).sort().map(([region, regionChiefs]) => {
                            const uniqueDepts = new Set(regionChiefs.map(c => (c.department || '').trim().toUpperCase()).filter(Boolean));
                            const uniqueSPs = new Set(regionChiefs.map(c => (c.subPrefecture || '').trim().toUpperCase()).filter(Boolean));
                            const uniqueVillages = new Set(regionChiefs.map(c => (c.village || '').trim().toUpperCase()).filter(Boolean));
                            
                            const commonDept = uniqueDepts.size === 1 ? Array.from(uniqueDepts)[0] : null;
                            const commonSP = uniqueSPs.size === 1 ? Array.from(uniqueSPs)[0] : null;
                            const commonVillage = uniqueVillages.size === 1 ? Array.from(uniqueVillages)[0] : null;

                            return (
                                <div key={region} className="space-y-6 px-2">
                                    <div className="flex justify-between items-end border-b-4 border-slate-100 pb-2">
                                        <div className="flex items-end flex-wrap gap-x-4 gap-y-2">
                                            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                                Région : <span className="text-[#D4AF37] underline decoration-4 underline-offset-8">{region}</span>
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
                                            {regionChiefs.length} Autorités recensées
                                        </div>
                                    </div>
                                    
                                    <RegionSynthesisTable region={region} chiefs={regionChiefs} />

                                    {/* Espaces pour les représentants institutionnels */}
                                    {organizationSettings?.showRegionalSignatories !== false && (
                                        <div className="mt-4 mb-4 bg-slate-50 border border-slate-200 p-4 rounded-xl break-inside-avoid">
                                            <h4 className="text-[10px] font-black uppercase text-slate-700 tracking-widest mb-3 border-b border-slate-200 pb-2">Représentations Institutionnelles - Région {region}</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase w-64 shrink-0">Membre du Directoire Régional :</span>
                                                    <div className="flex-1 border-b-2 border-dotted border-slate-400 mt-2"></div>
                                                </div>
                                                
                                                <div className="pt-2">
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase block mb-3">Membres des Comités Régionaux (Assemblée Générale) :</span>
                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 pl-4">
                                                        {Array.from(uniqueDepts).sort().map(dept => (
                                                            <div key={dept} className="flex flex-col gap-2">
                                                                <span className="text-[9px] font-black text-slate-500 uppercase">Dép. {dept}</span>
                                                                <div className="flex items-center gap-2 pl-2">
                                                                    <span className="text-[9px] font-bold text-slate-400 shrink-0">1.</span>
                                                                    <div className="flex-1 border-b-2 border-dotted border-slate-400 mt-2"></div>
                                                                </div>
                                                                <div className="flex items-center gap-2 pl-2">
                                                                    <span className="text-[9px] font-bold text-slate-400 shrink-0">2.</span>
                                                                    <div className="flex-1 border-b-2 border-dotted border-slate-400 mt-2"></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-900 text-white uppercase font-black print:bg-transparent print:text-slate-900 print:border-b-2 print:border-slate-900">
                                            <th className="p-3 w-[40px] text-center border-r border-slate-700">N°</th>
                                            {columnsToPrint?.includes('photoUrl') && <th className="p-3 w-[60px] text-center border-r border-slate-700">Photo</th>}
                                            <th className="p-3 text-left border-r border-slate-700">Identité & Titre</th>
                                            {!commonDept && <th className="p-3 text-left border-r border-slate-700">Département</th>}
                                            {!commonSP && <th className="p-3 text-left border-r border-slate-700">Sous-Préfecture</th>}
                                            <th className="p-3 text-left border-r border-slate-700">Localité</th>
                                            <th className="p-3 text-left border-r border-slate-700 whitespace-nowrap">Contacts</th>
                                            <th className="p-3 text-center whitespace-nowrap">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const sortedChiefs = [...regionChiefs].sort((a, b) => {
                                                const deptCompare = (a.department || '').localeCompare(b.department || '');
                                                if (deptCompare !== 0) return deptCompare;
                                                const spCompare = (a.subPrefecture || '').localeCompare(b.subPrefecture || '');
                                                if (spCompare !== 0) return spCompare;
                                                const villageCompare = (a.village || '').localeCompare(b.village || '');
                                                if (villageCompare !== 0) return villageCompare;
                                                return (a.lastName || '').localeCompare(b.lastName || '');
                                            });

                                            return sortedChiefs.map((chief, idx) => {
                                                const dept = chief.department || '';
                                                const sp = chief.subPrefecture || '';

                                                return (
                                                    <tr key={chief.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                                                        <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                                                        {columnsToPrint?.includes('photoUrl') && (
                                                            <td className="p-1 border-r border-slate-200 align-middle text-center">
                                                                {chief.photoUrl ? (
                                                                    <div className="w-10 h-10 mx-auto rounded-full overflow-hidden border border-slate-200 bg-white">
                                                                        <img src={chief.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{chief.lastName?.charAt(0) || ''}{chief.firstName?.charAt(0) || ''}</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )}
                                                        <td className="p-3 border-r border-slate-200">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black uppercase text-slate-900">{chief.lastName} {chief.firstName}</span>
                                                                <span className="text-[9px] font-bold text-[#D4AF37] uppercase italic">{chief.title || 'Chef de Village'}</span>
                                                            </div>
                                                        </td>
                                                        {!commonDept && (
                                                            <td className="p-3 border-r border-slate-200 uppercase font-bold text-slate-700 tracking-tighter align-middle text-left bg-slate-50/50">
                                                                {dept}
                                                            </td>
                                                        )}
                                                        {!commonSP && (
                                                            <td className="p-3 border-r border-slate-200 uppercase font-bold text-slate-600 align-middle text-left bg-slate-50/30">
                                                                {sp}
                                                            </td>
                                                        )}
                                                        <td className="p-3 border-r border-slate-200 uppercase italic text-[11px] text-slate-800">
                                                            {chief.village}
                                                        </td>
                                                <td className="p-3 border-r border-slate-200">
                                                    <div className="flex flex-col gap-1">
                                                        {(chief.phone || chief.contact) && (
                                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                                <Phone className="h-2.5 w-2.5 text-slate-400" />
                                                                <span className="font-bold">{chief.phone || chief.contact}</span>
                                                            </div>
                                                        )}
                                                        {chief.email && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Mail className="h-2.5 w-2.5 text-slate-400" />
                                                                <span className="text-[9px] lowercase">{chief.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                                        chief.status === 'archive' || chief.status === 'décédé' 
                                                            ? "bg-slate-100 text-slate-500 border-slate-200"
                                                            : chief.status === 'intérimaire'
                                                            ? "bg-orange-50 text-orange-600 border-orange-200"
                                                            : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                    )}>
                                                        {chief.status === 'a_vie' ? 'À Vie' : 
                                                         chief.status === 'intérimaire' ? 'Intérimaire' :
                                                         chief.status === 'décédé' ? 'Décédé' :
                                                         chief.status === 'archive' ? 'Archivé' :
                                                         chief.status || 'Actif'}
                                                    </span>
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
