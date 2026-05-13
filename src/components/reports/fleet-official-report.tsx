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
    Gauge,
    FileText
} from "lucide-react";
import { Fleet } from "@/types/asset";
import { OrganizationSettings } from "@/types/common";
import { cn } from "@/lib/utils";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalCover } from "./institutional-cover";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";

interface FleetOfficialReportProps {
    vehicles: Fleet[];
    organizationSettings: OrganizationSettings | null;
    isPrinting?: boolean;
    onAfterPrint?: () => void;
}

export function FleetOfficialReport({ 
    vehicles, 
    organizationSettings,
    isPrinting,
    onAfterPrint
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
        <InstitutionalReportWrapper 
            isPrinting={isPrinting || false} 
            orientation="landscape"
            onAfterPrint={onAfterPrint}
        >
            <div id="print-section" className="bg-white text-black w-full min-h-screen font-sans">
                <InstitutionalCover 
                    title="INVENTAIRE ET ÉTAT DE SITUATION DU PARC AUTOMOBILE"
                    subtitle={`Situation arrêtée au ${todayStr}`}
                    direction="DMG"
                    service="Direction des Moyens Généraux / Division Transport"
                    stats={[
                        { label: "Unités Totales", value: totalVehicles, icon: Car },
                        { label: "Taux Disponibilité", value: `${availabilityRate.toFixed(1)}%`, icon: CheckCircle2 },
                        { label: "En Mission", value: inMissionVehicles, icon: MapPin },
                        { label: "Maintenance", value: inMaintenanceVehicles + outOfServiceVehicles, icon: Wrench },
                    ]}
                    reference={`FLT-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`}
                    settings={organizationSettings}
                    orientation="landscape"
                />

                {/* --- PAGES DÉTAILLÉES (PAYSAGE) --- */}
                <div className="landscape-section min-h-screen p-12 relative print:p-8">
                    <InstitutionalHeader 
                        title="Registre Matricule des Véhicules"
                        period={`Journal technique de bord certifié au ${todayStr}`}
                        direction="DMG"
                        service="Direction des Moyens Généraux"
                        settings={organizationSettings}
                    />

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

                    <InstitutionalFooter 
                        showSignatures={true}
                        leftSignatureTitle="LE GESTIONNAIRE DE PARC"
                        rightSignatureTitle="LE DIRECTEUR TECHNIQUE"
                    />
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}

