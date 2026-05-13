"use client";

import type { Leave, OrganizationSettings } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Calendar, UserCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { InstitutionalCover } from "./institutional-cover";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalReportWrapper } from "@/components/reports/institutional-report-wrapper";

interface LeaveOfficialReportProps {
    leaves: Leave[];
    logos: OrganizationSettings | null;
    selectedPeriodText: string;
    totalDaysInPeriod: number;
    isPrinting: boolean;
    onAfterPrint?: () => void;
    calculateWorkingDaysInPeriod: (leave: Leave) => number;
}

export function LeaveOfficialReport({ 
    leaves, 
    logos, 
    selectedPeriodText,
    totalDaysInPeriod,
    isPrinting,
    onAfterPrint,
    calculateWorkingDaysInPeriod
}: LeaveOfficialReportProps) {
    if (!logos && isPrinting) return null;
    
    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting} 
            onAfterPrint={onAfterPrint}
            orientation="portrait"
        >
            <div className="bg-white text-black w-full font-sans">
                {/* --- PAGE DE GARDE --- */}
                <InstitutionalCover 
                    title="RAPPORT MENSUEL DES CONGÉS ET ABSENCES"
                    subtitle={`PÉRIODE : ${selectedPeriodText.toUpperCase()}`}
                    direction="DAARH"
                    service="Direction des Affaires Administratives et des Ressources Humaines"
                    reference={`RH-CONGES-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`}
                    stats={[
                        { label: "Total Demandes", value: leaves.length, icon: FileText },
                        { label: "Total Jours", value: totalDaysInPeriod, icon: Calendar },
                        { label: "Approuvés", value: leaves.filter(l => l.status === 'Approuvé').length, icon: UserCheck },
                        { label: "En attente", value: leaves.filter(l => l.status === 'En attente').length, icon: Clock }
                    ]}
                    settings={logos}
                    orientation="portrait"
                />

                {/* --- PAGE DE DONNÉES --- */}
                <div className="print-page min-h-screen p-12">
                    <InstitutionalHeader 
                        title="Récapitulatif Mensuel des Congés"
                        period={selectedPeriodText}
                        direction="DAARH"
                        service="Direction des Affaires Administratives et des Ressources Humaines"
                        settings={logos}
                    />

                    {/* KPIs */}
                    <div className="grid grid-cols-4 gap-6 mb-12">
                        <div className="border-2 border-slate-100 p-6 rounded-2xl bg-slate-50/30 break-inside-avoid shadow-sm">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <FileText className="h-4 w-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Demandes</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900 leading-none">{leaves.length}</div>
                        </div>
                        <div className="border-2 border-[#006039]/10 p-6 rounded-2xl bg-[#006039]/5 break-inside-avoid shadow-sm">
                            <div className="flex items-center gap-2 text-[#006039] mb-2">
                                <Calendar className="h-4 w-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Jours cumulés</span>
                            </div>
                            <div className="text-3xl font-black text-[#006039] leading-none">{totalDaysInPeriod}</div>
                        </div>
                        <div className="border-2 border-blue-100 p-6 rounded-2xl bg-blue-50/20 break-inside-avoid shadow-sm">
                            <div className="flex items-center gap-2 text-blue-500 mb-2">
                                <UserCheck className="h-4 w-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Approuvés</span>
                            </div>
                            <div className="text-3xl font-black text-blue-700 leading-none">{leaves.filter(l => l.status === 'Approuvé').length}</div>
                        </div>
                        <div className="border-2 border-amber-100 p-6 rounded-2xl bg-amber-50/20 break-inside-avoid shadow-sm">
                            <div className="flex items-center gap-2 text-amber-500 mb-2">
                                <Clock className="h-4 w-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">En attente</span>
                            </div>
                            <div className="text-3xl font-black text-amber-700 leading-none">{leaves.filter(l => l.status === 'En attente').length}</div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <table className="w-full border-collapse border-2 border-slate-900 text-[10px] leading-tight shadow-sm">
                        <thead>
                            <tr className="bg-slate-900 text-white uppercase font-black text-center border-b-2 border-slate-900">
                                <th className="border border-slate-700 p-4 w-[40px]">N°</th>
                                <th className="border border-slate-700 p-4 text-left">Employé</th>
                                <th className="border border-slate-700 p-4">Type de Congé</th>
                                <th className="border border-slate-700 p-4">Date Début</th>
                                <th className="border border-slate-700 p-4">Date Fin</th>
                                <th className="border border-slate-700 p-4 w-[60px]">Jours</th>
                                <th className="border border-slate-700 p-4 w-[100px]">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.map((leave, idx) => (
                                <tr key={leave.id} className="border-b border-slate-300 hover:bg-slate-50 transition-colors">
                                    <td className="border border-slate-300 p-3 text-center">{idx + 1}</td>
                                    <td className="border border-slate-300 p-3 font-black uppercase text-slate-900">{leave.employee}</td>
                                    <td className="border border-slate-300 p-3">{leave.type}</td>
                                    <td className="border border-slate-300 p-3 text-center font-mono">{format(parseISO(leave.startDate), 'dd/MM/yyyy')}</td>
                                    <td className="border border-slate-300 p-3 text-center font-mono">{format(parseISO(leave.endDate), 'dd/MM/yyyy')}</td>
                                    <td className="border border-slate-300 p-3 text-center font-bold">{calculateWorkingDaysInPeriod(leave)}</td>
                                    <td className="border border-slate-300 p-3 text-center">
                                        <span className={cn(
                                            "font-black uppercase text-[8px]",
                                            leave.status === 'Approuvé' ? "text-emerald-700" : 
                                            leave.status === 'En attente' ? "text-amber-700" : "text-rose-700"
                                        )}>
                                            {leave.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {leaves.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="border border-slate-300 p-12 text-center text-slate-400 italic">
                                        Aucune donnée enregistrée pour cette période
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {leaves.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-50 font-black">
                                    <td colSpan={5} className="border border-slate-300 p-4 text-right uppercase tracking-widest">Total jours cumulés</td>
                                    <td className="border border-slate-300 p-4 text-center text-lg">{totalDaysInPeriod}</td>
                                    <td className="border border-slate-300"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>

                    {/* Validation Area */}
                    <InstitutionalFooter 
                        signatoryName="YEO Fatogoma"
                        signatoryTitle="Secrétaire Général de la CNRCT"
                        place="Yamoussoukro"
                    />
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
