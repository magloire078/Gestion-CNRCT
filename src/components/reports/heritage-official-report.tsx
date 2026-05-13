"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Library,
    MapPin,
    Users2,
    Globe,
    Sparkles
} from "lucide-react";
import { HeritageItem, HeritageCategory, heritageCategoryLabels } from "@/types/heritage";
import { OrganizationSettings } from "@/types/common";
import { cn } from "@/lib/utils";
import { InstitutionalCover } from "./institutional-cover";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";

interface HeritageOfficialReportProps {
    items: HeritageItem[];
    organizationSettings: OrganizationSettings | null;
    isPrinting: boolean;
    onAfterPrint?: () => void;
}

export function HeritageOfficialReport({ 
    items, 
    organizationSettings,
    isPrinting,
    onAfterPrint
}: HeritageOfficialReportProps) {
    if (!organizationSettings) return null;

    const totalItems = items.length;
    const regionsCovered = new Set(items.map(i => i.region).filter(Boolean)).size;
    const groupsRepresented = new Set(items.map(i => i.ethnicGroup).filter(Boolean)).size;
    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });

    // Group by category for better organization in the report
    const groupedItems: Record<string, HeritageItem[]> = {};
    items.forEach(item => {
        const cat = heritageCategoryLabels[item.category as HeritageCategory] || item.category;
        if (!groupedItems[cat]) groupedItems[cat] = [];
        groupedItems[cat].push(item);
    });

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting} 
            onAfterPrint={onAfterPrint}
            orientation="landscape"
        >
            <div className="bg-white text-black w-full min-h-screen font-sans">
                <InstitutionalCover 
                    title="INVENTAIRE NATIONAL DU PATRIMOINE IMMATÉRIEL"
                    subtitle="Conservation de la Culture et des Traditions"
                    direction="DCP"
                    service="Direction de la Culture & du Patrimoine"
                    period={`ÉDITION ${format(new Date(), "yyyy")}`}
                    stats={[
                        { label: "Archives", value: totalItems, icon: Library },
                        { label: "Régions", value: regionsCovered, icon: MapPin },
                        { label: "Ethnologies", value: groupsRepresented, icon: Users2 },
                        { label: "Certification", value: "Validé", icon: Globe },
                    ]}
                    reference={`PAT-${format(new Date(), "yyyy")}-${Math.floor(Math.random() * 9000) + 1000}`}
                    settings={organizationSettings}
                    orientation="landscape"
                />

                <div className="landscape-section min-h-screen p-12 relative print:p-8">
                    <InstitutionalHeader 
                        title="Grand Livre du Patrimoine National"
                        period={`Situation archivée au ${todayStr}`}
                        direction="DCP"
                        service="Direction de la Culture et du Patrimoine"
                        settings={organizationSettings}
                    />

                    <div className="space-y-16 mt-8">
                        {Object.entries(groupedItems).map(([category, items], catIdx) => (
                            <div key={category} className="space-y-6 break-inside-avoid">
                                <div className="flex justify-between items-end border-b-4 border-amber-100 pb-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                        Archive : <span className="text-[#a16207] underline decoration-4 underline-offset-8">{category}</span>
                                    </h3>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-amber-50 px-4 py-1 rounded-full border border-amber-100">
                                        {items.length} Éléments Répertoriés
                                    </div>
                                </div>
                                
                                <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-900 text-white uppercase font-black">
                                            <th className="p-4 w-[180px] text-left border-r border-slate-700">Identité de l'Archive</th>
                                            <th className="p-4 w-[140px] text-left border-r border-slate-700">Origine Géographique</th>
                                            <th className="p-4 w-[140px] text-left border-r border-slate-700">Groupe Culturel</th>
                                            <th className="p-4 text-left">Signification & Description Historique</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={item.id} className="border-b border-slate-300 hover:bg-amber-50/30 align-top">
                                                <td className="p-4 border-r border-slate-100 bg-slate-50 shadow-inner">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-sm font-black uppercase text-slate-900 leading-tight">{item.name}</span>
                                                        <div className="flex items-center gap-1.5 text-amber-600 font-bold uppercase text-[9px] tracking-widest italic">
                                                            <Sparkles className="h-2 w-2" />
                                                            Patrimoine Vivant
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 border-r border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-slate-300" />
                                                        <span className="font-bold text-slate-800 uppercase">{item.region || "Indéterminée"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 border-r border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <Users2 className="h-4 w-4 text-slate-300" />
                                                        <span className="font-bold text-slate-800 uppercase">{item.ethnicGroup || "National"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 italic text-slate-600 leading-relaxed text-xs">
                                                    {item.description || "Aucune description archivée pour cet élément."}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    <InstitutionalFooter 
                        showSignatures={true}
                        leftSignatureTitle="L'ARCHIVISTE NATIONAL"
                        rightSignatureTitle="LE DIRECTEUR DU PATRIMOINE"
                    />
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
