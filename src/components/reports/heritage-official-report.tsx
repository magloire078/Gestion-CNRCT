"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Landmark, 
    Globe, 
    Users2, 
    Sparkles,
    History,
    MapPin,
    ScrollText,
    Library
} from "lucide-react";
import { HeritageItem, HeritageCategory, heritageCategoryLabels } from "@/types/heritage";
import { OrganizationSettings } from "@/types/common";
import { cn } from "@/lib/utils";

interface HeritageOfficialReportProps {
    items: HeritageItem[];
    organizationSettings: OrganizationSettings | null;
}

export function HeritageOfficialReport({ 
    items, 
    organizationSettings
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
                        <div className="inline-block px-8 py-3 bg-[#a16207] text-white font-black uppercase tracking-[0.4em] text-xs rounded-lg mb-4 shadow-2xl">
                            Direction de la Culture & du Patrimoine
                        </div>
                        <h1 className="text-6xl font-black uppercase tracking-tighter text-slate-900 leading-[0.9] italic">
                            INVENTAIRE NATIONAL DU<br />PATRIMOINE IMMATÉRIEL
                        </h1>
                        <p className="text-2xl font-bold text-slate-500 tracking-[0.2em] uppercase mt-4">
                            REGISTRE CONSOLIDÉ - ÉDICION {format(new Date(), "yyyy")}
                        </p>
                        <div className="h-2 w-64 bg-[#a16207] mx-auto rounded-full mt-4"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-12 mt-12 w-full max-w-4xl px-12">
                        <div className="p-12 border-4 border-amber-50 rounded-[3rem] bg-amber-50/30 space-y-4 shadow-sm">
                            <span className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em]">Richesse Documentée</span>
                            <p className="text-5xl font-black text-slate-900 italic leading-tight">
                                {totalItems} Archives
                            </p>
                        </div>
                        <div className="p-12 border-4 border-emerald-50 rounded-[3rem] bg-emerald-50/30 space-y-4 shadow-sm">
                            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em]">Référence Archive</span>
                            <p className="text-3xl font-black text-slate-900 font-mono tracking-tighter uppercase">
                                PAT-{format(new Date(), "yyyy")}-{Math.floor(Math.random() * 9000) + 1000}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-20 justify-center mt-20">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 text-blue-600">Couverture Territoriale</p>
                            <p className="text-5xl font-black text-slate-900">{regionsCovered} Régions</p>
                        </div>
                        <div className="text-center border-x-2 border-slate-100 px-20 text-orange-600">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Groupes Ethniques</p>
                            <p className="text-5xl font-black text-slate-900 tracking-tighter">{groupsRepresented}</p>
                        </div>
                        <div className="text-center group text-amber-600">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 text-amber-600">Statut Documentaire</p>
                            <p className="text-5xl font-black text-slate-900 uppercase">Certifié</p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-10 text-center border-t-2 border-slate-900">
                    <p className="font-black text-2xl uppercase tracking-[0.2em] text-[#a16207]">Direction Générale / Division Archives & Traditions</p>
                </div>
            </div>

            {/* --- PAGES DÉTAILLÉES (PAYSAGE) --- */}
            <div className="landscape-section min-h-screen p-12 relative print:p-8">
                <header className="flex justify-between items-end mb-12 pb-6 border-b-8 border-amber-800">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[#a16207] rounded-full flex items-center justify-center text-white -rotate-6 shadow-xl">
                            <Library className="h-10 w-10" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">
                                Grand Livre du Patrimoine National
                            </h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">
                                Journal officiel de conservation culturelle certifié au {todayStr}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="space-y-16">
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
                                                    <div className="flex items-center gap-1.5 text-amber-600 font-bold uppercase text-[8px] tracking-widest italic">
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

                <div className="mt-24">
                    <div className="grid grid-cols-3 gap-16">
                        <div className="text-center space-y-16">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] underline underline-offset-8 decoration-2 decoration-blue-600">L'Archiviste National</p>
                            <div className="h-px w-full bg-slate-300" />
                        </div>
                        <div className="text-center space-y-16">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] underline underline-offset-8 decoration-2 decoration-[#a16207]">Le Directeur du Patrimoine</p>
                            <div className="h-px w-full bg-slate-300" />
                        </div>
                        <div className="text-center space-y-16">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] underline underline-offset-8 decoration-2 decoration-slate-950">Le Secrétaire Général</p>
                            <div className="h-px w-full bg-slate-300" />
                        </div>
                    </div>
                </div>

                <footer className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    <span>CNRCT Patrimoine v1.0</span>
                    <span>Inventaire exhaustif - Propriété de l'État</span>
                    <span>{todayStr} • {format(new Date(), "HH:mm")}</span>
                </footer>
            </div>
        </div>
    );
}
