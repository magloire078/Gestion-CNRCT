"use client";

import React from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Calculator, 
    Calendar, 
    MapPin, 
    Users, 
    CreditCard,
    TrendingDown,
    FileText,
    ShieldCheck,
    Wallet
} from "lucide-react";
import { Mission, OrganizationSettings } from "@/types/common";
import { cn } from "@/lib/utils";
import { InstitutionalFooter } from "./institutional-footer";

interface MissionsOfficialReportProps {
    missions: Mission[];
    organizationSettings: OrganizationSettings | null;
    periodText: string;
    fiscalYear: string;
    totalBudget: number;
}

export function MissionsOfficialReport({ 
    missions, 
    organizationSettings, 
    periodText,
    fiscalYear,
    totalBudget
}: MissionsOfficialReportProps) {
    if (!organizationSettings) return null;

    const formatCurrency = (value: number) => {
        return value.toLocaleString('fr-FR') + ' FCFA';
    };

    const calculateMissionCost = (mission: Mission): number => {
        return mission.participants.reduce((total, p) => {
            return total + (p.totalIndemnites || 0) + (p.coutTransport || 0) + (p.coutHebergement || 0);
        }, 0);
    };

    const totalParticipants = missions.reduce((acc, m) => acc + (m.participants?.length || 0), 0);
    const completedMissions = missions.filter(m => m.status === 'Terminée').length;
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
                        <div className="inline-block px-8 py-3 bg-slate-900 text-white font-black uppercase tracking-[0.4em] text-xs rounded-lg mb-4 shadow-2xl">
                            Administration & Finances
                        </div>
                        <h1 className="text-6xl font-black uppercase tracking-tighter text-slate-900 leading-[0.9] italic">
                            RAPPORT D'ORDONNANCEMENT<br />DES MISSIONS & DÉPLACEMENTS
                        </h1>
                        <p className="text-2xl font-bold text-slate-500 tracking-[0.2em] uppercase mt-4">
                            EXERCICE FISCAL {fiscalYear}
                        </p>
                        <div className="h-2 w-64 bg-[#006039] mx-auto rounded-full mt-4"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-12 mt-12 w-full max-w-4xl px-12">
                        <div className="p-12 border-4 border-slate-100 rounded-[3rem] bg-slate-50/50 space-y-4 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Période de Référence</span>
                            <p className="text-3xl font-black text-slate-900 uppercase italic leading-tight">
                                {periodText}
                            </p>
                        </div>
                        <div className="p-12 border-4 border-slate-100 rounded-[3rem] bg-slate-50/50 space-y-4 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Code d'Archivage</span>
                            <p className="text-3xl font-black text-slate-900 font-mono tracking-tighter lowercase">
                                <span className="uppercase">ord</span>-{fiscalYear}-{Math.floor(Math.random() * 90000) + 10000}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-20 justify-center mt-20">
                        <div className="text-center group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Engagements</p>
                            <p className="text-5xl font-black text-slate-900">{missions.length}</p>
                        </div>
                        <div className="text-center group border-x-2 border-slate-100 px-20">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Budget Mobilisé</p>
                            <p className="text-5xl font-black text-rose-600 tracking-tighter">{formatCurrency(totalBudget)}</p>
                        </div>
                        <div className="text-center group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Agents Pris en Charge</p>
                            <p className="text-5xl font-black text-slate-900">{totalParticipants}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-10 text-center border-t-2 border-slate-900">
                    <p className="font-black text-2xl uppercase tracking-[0.2em] text-[#006039]">Secrétariat Général / Services Financiers</p>
                </div>
            </div>

            {/* --- PAGES DÉTAILLÉES (PAYSAGE) --- */}
            <div className="landscape-section min-h-screen p-12 relative print:p-8">
                <header className="flex justify-between items-end mb-12 pb-6 border-b-8 border-slate-900">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[#006039] rounded-2xl flex items-center justify-center text-white -rotate-2 shadow-xl">
                            <Wallet className="h-10 w-10" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">
                                Grand Livre des Déplacements
                            </h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">
                                Situation financière arrêtée au {todayStr}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="space-y-12">
                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b-4 border-slate-100 pb-2">
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                Détail des <span className="text-[#006039] underline decoration-4 underline-offset-8">Ordonnancements</span>
                            </h3>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full border border-slate-100">
                                {missions.length} Missions répertoiriées
                            </div>
                        </div>
                        
                        <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                            <thead>
                                <tr className="bg-slate-900 text-white uppercase font-black">
                                    <th className="p-4 w-[100px] text-center border-r border-slate-700">Réf. Mission</th>
                                    <th className="p-4 text-left border-r border-slate-700">Objet de la Mission & Localité</th>
                                    <th className="p-4 w-[120px] text-center border-r border-slate-700">Calendrier</th>
                                    <th className="p-4 w-[80px] text-center border-r border-slate-700">Effectif</th>
                                    <th className="p-4 w-[150px] text-right">Impact Financier</th>
                                </tr>
                            </thead>
                            <tbody>
                                {missions.sort((a, b) => b.startDate.localeCompare(a.startDate)).map((mission, idx) => (
                                    <tr key={mission.id} className="border-b border-slate-300 hover:bg-slate-50/50 align-top">
                                        <td className="p-4 text-center font-bold text-slate-900 border-r border-slate-100 tabular-nums">
                                            {mission.numeroMission || `#${mission.id.substring(0, 6).toUpperCase()}`}
                                        </td>
                                        <td className="p-4 border-r border-slate-100">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black uppercase text-slate-900 leading-tight">{mission.title}</span>
                                                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[9px] tracking-widest italic">
                                                    <MapPin className="h-2 w-2" />
                                                    {mission.lieuMission || "National / Côte d'Ivoire"}
                                                </div>
                                                <p className="mt-2 text-slate-500 italic text-[9px] line-clamp-2">
                                                    {mission.description}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center border-r border-slate-100 font-mono font-bold text-slate-600">
                                            <div className="flex flex-col">
                                                <span>{format(parseISO(mission.startDate), 'dd/MM/yy')}</span>
                                                <span className="text-[8px] text-slate-300 my-1">au</span>
                                                <span>{format(parseISO(mission.endDate), 'dd/MM/yy')}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 border-r border-slate-100 text-center font-black text-slate-900 text-base">
                                            {mission.participants?.length || 0}
                                        </td>
                                        <td className="p-4 text-right bg-slate-50/50">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black text-[#006039]">{formatCurrency(calculateMissionCost(mission))}</span>
                                                <div className="flex gap-2 mt-1">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-[4px] font-black text-[8px] uppercase tracking-tighter border shadow-sm",
                                                        mission.status === 'Terminée' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                        mission.status === 'En cours' ? "bg-blue-50 text-blue-700 border-blue-200" : 
                                                        "bg-rose-50 text-rose-700 border-rose-200"
                                                    )}>
                                                        {mission.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-900 text-white font-black text-sm">
                                    <td colSpan={4} className="p-6 text-right uppercase tracking-[.2em]">Total Engagements sur la Période :</td>
                                    <td className="p-6 text-right text-xl tracking-tighter decoration-double underline decoration-[#006039] decoration-4 underline-offset-8">
                                        {formatCurrency(totalBudget)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-24">
                    <div className="grid grid-cols-2 gap-24">
                        <div className="text-center space-y-16">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] underline underline-offset-8 decoration-2 decoration-rose-600">Le Secrétaire Général</p>
                            <div className="h-px w-full bg-slate-300" />
                        </div>
                        <div className="text-center space-y-16">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] underline underline-offset-8 decoration-2 decoration-[#006039]">Le Contrôleur Financier</p>
                            <div className="h-px w-full bg-slate-300" />
                        </div>
                    </div>
                </div>

                <footer className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    <span>CNRCT Digital Audit v2.5</span>
                    <span>Document certifié conforme par le système d'information</span>
                    <span>{todayStr} • {format(new Date(), "HH:mm")}</span>
                </footer>
            </div>
        </div>
    );
}
