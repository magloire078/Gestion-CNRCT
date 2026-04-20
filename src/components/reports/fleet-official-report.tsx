"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Car, 
    ShieldCheck, 
    AlertTriangle, 
    CheckCircle2, 
    Wrench,
    MapPin,
    Calendar,
    BadgeCheck,
    Gauge
} from "lucide-react";
import { Fleet, OrganizationSettings } from "@/lib/data"; // Assuming Fleet type is available here
import { cn } from "@/lib/utils";
import { InstitutionalFooter } from "./institutional-footer";

interface FleetOfficialReportProps {
    vehicles: Fleet[];
    organizationSettings: OrganizationSettings | null;
}

export function FleetOfficialReport({ 
    vehicles, 
    organizationSettings
}: FleetOfficialReportProps) {
    if (!organizationSettings) return null;

    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === 'Disponible').length;
    const inMissionVehicles = vehicles.filter(v => v.status === 'En mission').length;
    const inMaintenanceVehicles = vehicles.filter(v => v.status === 'En maintenance').length;
    const outOfServiceVehicles = vehicles.filter(v => v.status === 'Hors service').length;

    const availabilityRate = totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0;
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
                            Services Techniques & Logistique
                        </div>
                        <h1 className="text-6xl font-black uppercase tracking-tighter text-slate-900 leading-[0.9] italic">
                            INVENTAIRE ET ÉTAT DE SITUATION<br />DU PARC AUTOMOBILE
                        </h1>
                        <p className="text-2xl font-bold text-slate-500 tracking-[0.2em] uppercase mt-4">
                            SITUATION ARRÊTÉE AU {todayStr.toUpperCase()}
                        </p>
                        <div className="h-2 w-64 bg-[#006039] mx-auto rounded-full mt-4"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-12 mt-12 w-full max-w-4xl px-12">
                        <div className="p-12 border-4 border-slate-100 rounded-[3rem] bg-slate-50/50 space-y-4 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Taux de Disponibilité</span>
                            <p className="text-5xl font-black text-[#006039] italic leading-tight">
                                {availabilityRate.toFixed(1)}%
                            </p>
                        </div>
                        <div className="p-12 border-4 border-slate-100 rounded-[3rem] bg-slate-50/50 space-y-4 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Référence Logistique</span>
                            <p className="text-3xl font-black text-slate-900 font-mono tracking-tighter uppercase">
                                FLT-{format(new Date(), "yyyy")}-{Math.floor(Math.random() * 9000) + 1000}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-20 justify-center mt-20">
                        <div className="text-center group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Unités Totales</p>
                            <p className="text-5xl font-black text-slate-900">{totalVehicles}</p>
                        </div>
                        <div className="text-center group border-x-2 border-slate-100 px-20">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">En Mission</p>
                            <p className="text-5xl font-black text-blue-600 tracking-tighter">{inMissionVehicles}</p>
                        </div>
                        <div className="text-center group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Maintenance</p>
                            <p className="text-5xl font-black text-orange-500">{inMaintenanceVehicles + outOfServiceVehicles}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-10 text-center border-t-2 border-slate-900">
                    <p className="font-black text-2xl uppercase tracking-[0.2em] text-[#006039]">Direction des Moyens Généraux / Division Transport</p>
                </div>
            </div>

            {/* --- PAGES DÉTAILLÉES (PAYSAGE) --- */}
            <div className="landscape-section min-h-screen p-12 relative print:p-8">
                <header className="flex justify-between items-end mb-12 pb-6 border-b-8 border-slate-900">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[#006039] rounded-2xl flex items-center justify-center text-white -rotate-2 shadow-xl">
                            <Car className="h-10 w-10" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">
                                Registre Matricule des Véhicules
                            </h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">
                                Journal technique de bord certifié au {todayStr}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="space-y-12">
                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b-4 border-slate-100 pb-2">
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                Inventaire <span className="text-[#006039] underline decoration-4 underline-offset-8">Opérationnel</span>
                            </h3>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full border border-slate-100">
                                {totalVehicles} Unités Recensées
                            </div>
                        </div>
                        
                        <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                            <thead>
                                <tr className="bg-slate-900 text-white uppercase font-black">
                                    <th className="p-4 w-[120px] text-center border-r border-slate-700">Immatriculation</th>
                                    <th className="p-4 text-left border-r border-slate-700">Caractéristiques du Véhicule</th>
                                    <th className="p-4 w-[180px] text-left border-r border-slate-700">Affectation / Utilisateur</th>
                                    <th className="p-4 w-[120px] text-center border-r border-slate-700">État de Service</th>
                                    <th className="p-4 w-[130px] text-right">Maintenance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehicles.map((v, idx) => (
                                    <tr key={v.plate} className="border-b border-slate-300 hover:bg-slate-50/50 align-top">
                                        <td className="p-4 text-center font-black text-slate-900 border-r border-slate-100 text-sm tracking-tight">
                                            {v.plate}
                                        </td>
                                        <td className="p-4 border-r border-slate-100">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black uppercase text-slate-900 leading-tight">{v.makeModel}</span>
                                                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[9px] tracking-widest italic">
                                                    <BadgeCheck className="h-2 w-2" />
                                                    Identification Certifiée CNRCT
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 border-r border-slate-100">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-700 uppercase">{v.assignedTo}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Pôle Administratif</span>
                                            </div>
                                        </td>
                                        <td className="p-4 border-r border-slate-100 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md font-black uppercase text-[9px] tracking-tight bg-slate-50 border border-slate-200">
                                                <span className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    v.status === 'Disponible' ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" :
                                                    v.status === 'En mission' ? "bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" :
                                                    v.status === 'En maintenance' ? "bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]" :
                                                    "bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]"
                                                )} />
                                                {v.status}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right bg-slate-50/50">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-slate-900">{v.maintenanceDue}</span>
                                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter mt-0.5 italic">Contrôle technique</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-24">
                    <div className="grid grid-cols-2 gap-24">
                        <div className="text-center space-y-16">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] underline underline-offset-8 decoration-2 decoration-blue-600">Le Gestionnaire de Parc</p>
                            <div className="h-px w-full bg-slate-300" />
                        </div>
                        <div className="text-center space-y-16">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] underline underline-offset-8 decoration-2 decoration-[#006039]">Le Directeur Technique</p>
                            <div className="h-px w-full bg-slate-300" />
                        </div>
                    </div>
                </div>

                <footer className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    <span>CNRCT Logistique v1.2</span>
                    <span>Document de travail interne - Confidentiel</span>
                    <span>{todayStr} • {format(new Date(), "HH:mm")}</span>
                </footer>
            </div>
        </div>
    );
}
