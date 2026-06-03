"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    MapPin, 
    Users, 
    Wallet,
    Calendar,
    Briefcase,
    CheckCircle2
} from "lucide-react";
import { Mission, OrganizationSettings } from "@/types/common";
import { cn } from "@/lib/utils";
import { InstitutionalCover } from "./institutional-cover";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";

interface MissionsOfficialReportProps {
    missions: Mission[];
    organizationSettings: OrganizationSettings | null;
    periodText: string;
    fiscalYear: string;
    totalBudget: number;
    isPrinting?: boolean;
    onAfterPrint?: () => void;
}

export function MissionsOfficialReport({ 
    missions, 
    organizationSettings, 
    periodText,
    fiscalYear,
    totalBudget,
    isPrinting = true,
    onAfterPrint
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
        <InstitutionalReportWrapper isPrinting={isPrinting} orientation="landscape" onAfterPrint={onAfterPrint}>
            {/* --- PAGE DE GARDE --- */}
                <InstitutionalCover 
                    title="RAPPORT D'ORDONNANCEMENT DES MISSIONS & DÉPLACEMENTS"
                    subtitle={`EXERCICE FISCAL ${fiscalYear}`}
                    period={periodText}
                    direction="DFP / SG"
                    service="Secrétariat Général / Services Financiers"
                    reference={`ORD-${fiscalYear}-${Math.floor(Math.random() * 90000) + 10000}`}
                    stats={[
                        { label: "Engagements", value: missions.length, icon: Briefcase },
                        { label: "Budget Mobilisé", value: formatCurrency(totalBudget), icon: Wallet },
                        { label: "Agents Pris en Charge", value: totalParticipants, icon: Users },
                        { label: "Missions Terminées", value: completedMissions, icon: CheckCircle2 }
                    ]}
                    settings={organizationSettings}
                    orientation="landscape"
                />

            {/* --- PAGES DÉTAILLÉES (PAYSAGE) --- */}
            <div className="min-h-screen p-12 print:p-5 bg-white">
                    <InstitutionalHeader 
                        title="Grand Livre des Déplacements"
                        period={`Situation financière au ${todayStr}`}
                        direction="DFP"
                        service="Direction des Finances et du Patrimoine"
                        settings={organizationSettings}
                    />

                    <div className="space-y-6">
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
                                    <tr className="bg-slate-900 text-white uppercase font-black text-center">
                                        <th className="p-4 w-[100px] border-r border-slate-700">Réf. Mission</th>
                                        <th className="p-4 text-left border-r border-slate-700">Objet de la Mission & Localité</th>
                                        <th className="p-4 w-[120px] border-r border-slate-700">Calendrier</th>
                                        <th className="p-4 w-[80px] border-r border-slate-700">Effectif</th>
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

                    {/* Standardized Institutional Footer with Dual Signatures */}
                    <InstitutionalFooter 
                        showSignatures={true}
                        leftSignatureTitle="LE SECRÉTAIRE GÉNÉRAL"
                        rightSignatureTitle="LE CONTRÔLEUR FINANCIER"
                        place="Yamoussoukro"
                    />
            </div>
        </InstitutionalReportWrapper>
    );
}
