"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Users, 
    Shield, 
    Briefcase, 
    MapPin, 
    UserCheck,
    BarChart3
} from "lucide-react";
import { Employe, OrganizationSettings } from "@/lib/data";
import { cn } from "@/lib/utils";
import { InstitutionalFooter } from "./institutional-footer";

interface EmployeeOfficialReportProps {
    employees: Employe[];
    logos: OrganizationSettings | null;
    unitLabel: string;
    stats: {
        total: number;
        active: number;
        men: number;
        women: number;
    };
}

export function EmployeeOfficialReport({ 
    employees, 
    logos, 
    unitLabel,
    stats 
}: EmployeeOfficialReportProps) {
    if (!logos) return null;

    const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: fr });

    return (
        <div className="bg-white text-black w-full min-h-screen">
            {/* --- PAGE DE GARDE --- */}
            <div className="print-page h-[280mm] flex flex-col p-16 break-after-page relative overflow-hidden">
                <header className="flex justify-between items-start mb-24 min-h-[140px] relative z-10">
                    <div className="w-1/3 text-center flex flex-col justify-center items-center">
                        <p className="font-bold text-[11px] items-center text-slate-800 leading-tight uppercase">
                            Chambre Nationale des Rois<br />et Chefs Traditionnels
                        </p>
                        {logos.mainLogoUrl && <img src={logos.mainLogoUrl} alt="Logo" className="max-h-24 mt-6 drop-shadow-sm" />}
                        <div className="w-12 h-0.5 bg-[#006039] mt-4 rounded-full" />
                    </div>
                    <div className="w-1/3"></div>
                    <div className="w-1/3 text-center flex flex-col justify-center items-center">
                        <p className="font-bold text-[11px] leading-tight text-slate-800 uppercase tracking-widest">
                            République de Côte d'Ivoire
                        </p>
                        {logos.secondaryLogoUrl && <img src={logos.secondaryLogoUrl} alt="Logo" className="max-h-20 my-6 drop-shadow-sm" />}
                        <p className="text-[10px] italic font-black border-t-2 border-slate-900 mt-2 pt-2 px-6 uppercase tracking-tighter">Union - Discipline - Travail</p>
                    </div>
                </header>

                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-16 relative z-10">
                    <div className="space-y-8">
                        <div className="inline-block px-6 py-2 border-2 border-[#006039] text-[#006039] font-black uppercase tracking-[0.3em] text-sm rounded-full mb-4">
                            Document RH Officiel
                        </div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-[0.95] italic">
                            ÉTAT NOMINATIF DU PERSONNEL<br />ET DES EFFECTIFS REURÉSENTÉS
                        </h1>
                        <div className="h-2 w-48 bg-[#006039] mx-auto rounded-full mt-4"></div>
                    </div>
                    
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-700 bg-white shadow-xl px-12 py-8 rounded-2xl border-2 border-slate-100 italic inline-block">
                             Secrétariat Général / Service des Ressources Humaines
                        </h2>
                        <div className="flex flex-col gap-1 uppercase tracking-[0.2em] font-black text-slate-400">
                            <p className="text-sm">Division de la Gestion Administrative</p>
                            <div className="h-px w-12 bg-slate-200 mx-auto" />
                            <p className="text-[10px]">Unité Suivi des Carrières</p>
                        </div>
                    </div>

                    <div className="mt-20 p-12 border-[8px] border-double border-slate-200 rounded-2xl bg-slate-50/50 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 border border-slate-200 rounded-full font-black text-[10px] uppercase tracking-widest text-slate-400">
                            Référence : CNRCT-RH-{new Date().getFullYear()}
                        </div>
                        <p className="text-3xl font-black uppercase underline decoration-[#006039] decoration-8 underline-offset-[12px]">
                            PERIMÈTRE : {unitLabel}
                        </p>
                        <div className="flex gap-12 justify-center mt-10 text-slate-900">
                             <div className="flex flex-col items-center">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Agents</span>
                                 <p className="text-xl font-black uppercase italic">{stats.total}</p>
                             </div>
                             <div className="flex flex-col items-center">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Actifs</span>
                                 <p className="text-xl font-black text-[#006039] uppercase italic">{stats.active}</p>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-10 text-center border-t-2 border-slate-900">
                    <p className="font-black text-2xl uppercase tracking-[0.2em] text-[#006039]">Secrétariat Général</p>
                </div>
            </div>

            {/* --- PAGE DE DÉTAIL --- */}
            <div className="print-page min-h-screen p-12 break-before-page relative">
                <div className="flex justify-between items-center mb-8 pb-4 border-b-4 border-[#006039]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#006039] rounded-xl flex items-center justify-center text-white">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">
                                Liste Nominative du Personnel
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Situation arrêtée au {todayStr}</p>
                        </div>
                    </div>
                </div>

                {/* Synthesis Header Table */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                     <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase text-slate-400 leading-tight">Effectif</p>
                            <p className="text-lg font-black">{stats.total}</p>
                        </div>
                     </div>
                     <div className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-100 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                            <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase text-emerald-600 leading-tight">Actifs</p>
                            <p className="text-lg font-black">{stats.active}</p>
                        </div>
                     </div>
                     <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-100 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase text-blue-600 leading-tight">Hommes</p>
                            <p className="text-lg font-black">{stats.men}</p>
                        </div>
                     </div>
                     <div className="bg-rose-50 p-4 rounded-xl border-2 border-rose-100 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase text-rose-600 leading-tight">Femmes</p>
                            <p className="text-lg font-black">{stats.women}</p>
                        </div>
                     </div>
                </div>

                <table className="w-full border-collapse border-2 border-slate-900 text-[9px] leading-tight">
                    <thead>
                        <tr className="bg-slate-900 text-white uppercase font-black text-center">
                            <th className="p-3 w-[30px]">N°</th>
                            <th className="p-3 w-[80px]">Matricule</th>
                            <th className="p-3 text-left">Nom & Prénoms</th>
                            <th className="p-3 text-left">Fonction / Poste</th>
                            <th className="p-3 text-left">Unité / Service</th>
                            <th className="p-3 w-[80px]">Sexe</th>
                            <th className="p-3 w-[80px]">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp, idx) => (
                            <tr key={emp.id} className="border-b border-slate-300">
                                <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="p-3 text-center font-mono font-bold text-slate-600">{emp.matricule || '---'}</td>
                                <td className="p-3 font-black uppercase text-slate-900">{emp.lastName} {emp.firstName}</td>
                                <td className="p-3 font-bold text-slate-700 italic">{emp.poste}</td>
                                <td className="p-3 font-medium text-slate-500 uppercase tracking-tight">{emp.department || 'Non Défini'}</td>
                                <td className="p-3 text-center">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full font-black uppercase text-[8px]",
                                        emp.sexe === 'Homme' ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
                                    )}>
                                        {emp.sexe || '---'}
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full font-black uppercase text-[8px]",
                                        emp.status === 'Actif' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                                    )}>
                                        {emp.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* --- VALIDATION & FOOTER --- */}
                <InstitutionalFooter 
                    signatoryName="KOUASSI N'D Dri"
                    signatoryTitle="Secrétaire Général, CNRCT"
                    showCertification={true}
                />
            </div>
        </div>
    );
}
