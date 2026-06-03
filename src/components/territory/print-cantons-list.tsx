"use client";

import React from "react";
import { InstitutionalCover } from "@/components/reports/institutional-cover";
import { InstitutionalHeader } from "@/components/reports/institutional-header";
import { InstitutionalReportWrapper } from "@/components/reports/institutional-report-wrapper";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Users, Shield, Landmark } from "lucide-react";
import { CantonData } from "./canton-card";

interface PrintCantonsListProps {
    cantons: CantonData[];
    subtitle?: string;
}

export function PrintCantonsList({ cantons, subtitle }: PrintCantonsListProps) {
    // Group cantons by Region
    const cantonsByRegion = cantons.reduce((acc, canton) => {
        const region = canton.region || "Non définie";
        if (!acc[region]) acc[region] = [];
        acc[region].push(canton);
        return acc;
    }, {} as Record<string, CantonData[]>);

    const totalCantons = cantons.length;
    const cantonsWithChiefs = cantons.filter(c => !!c.cantonChief).length;
    const vacancyRate = totalCantons > 0 ? Math.round(((totalCantons - cantonsWithChiefs) / totalCantons) * 100) : 0;
    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });

    return (
        <InstitutionalReportWrapper isPrinting={true} orientation="landscape">
            {/* --- PAGE DE GARDE --- */}
            <InstitutionalCover 
                title="RÉPERTOIRE NATIONAL DES CANTONS"
                subtitle={subtitle || "BASE DE DONNÉES DES JURIDICTIONS COUTUMIÈRES"}
                direction="DFP / DR"
                service="Direction du Patrimoine et des Relations Extérieures"
                stats={[
                    { label: "Cantons Inscrits", value: totalCantons, icon: Landmark },
                    { label: "Chefs de Canton", value: cantonsWithChiefs, icon: Users },
                    { label: "Taux de Vacance", value: `${vacancyRate}%`, icon: Shield },
                    { label: "Régions Couvertes", value: Object.keys(cantonsByRegion).length, icon: MapPin },
                ]}
                reference={`REP-CAN-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`}
            />

            {/* --- PAGES DÉTAILLÉES --- */}
            <div className="min-h-screen p-12 print:p-5 bg-white">
                <InstitutionalHeader 
                    title="État Civil des Cantons et Chefferies Cantonales"
                    period={`Situation consolidée au ${todayStr}`}
                />

                <div className="space-y-6">
                    {Object.entries(cantonsByRegion).sort().map(([region, regionCantons]) => (
                        <div key={region} className="space-y-6 break-inside-avoid">
                            <div className="flex justify-between items-end border-b-4 border-slate-100 pb-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                    Région : <span className="text-blue-700 underline decoration-4 underline-offset-8">{region}</span>
                                </h3>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full border border-slate-100">
                                    {regionCantons.length} Cantons répertoriés
                                </div>
                            </div>
                            
                            <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                                <thead>
                                    <tr className="bg-slate-900 text-white uppercase font-black print:bg-transparent print:text-slate-900 print:border-b-2 print:border-slate-900">
                                        <th className="p-3 text-left border-r border-slate-700 print:border-slate-300">Canton</th>
                                        <th className="p-3 text-left border-r border-slate-700 print:border-slate-300">Département / Sous-Préfecture</th>
                                        <th className="p-3 text-center border-r border-slate-700 print:border-slate-300">Localités Rattachées</th>
                                        <th className="p-3 text-left border-r border-slate-700 print:border-slate-300">Chef de Canton Actif</th>
                                        <th className="p-3 w-[120px] text-center">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {regionCantons.sort((a, b) => a.name.localeCompare(b.name)).map((canton, idx) => (
                                        <tr key={idx} className="border-b border-slate-200 align-top">
                                            <td className="p-3 font-black text-slate-900 border-r border-slate-200">
                                                {canton.name}
                                            </td>
                                            <td className="p-3 border-r border-slate-200 uppercase text-slate-600 font-medium">
                                                {canton.department} / {canton.subPrefecture}
                                            </td>
                                            <td className="p-3 border-r border-slate-200 text-center font-bold">
                                                {canton.villages.length}
                                            </td>
                                            <td className="p-3 border-r border-slate-200 font-bold">
                                                {canton.cantonChief ? (
                                                    <span className="text-slate-900">{canton.cantonChief.name}</span>
                                                ) : (
                                                    <span className="text-rose-500 italic">NON RENSEIGNÉ / VACANT</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                                                    canton.cantonChief 
                                                        ? "bg-emerald-100 text-emerald-800" 
                                                        : "bg-rose-100 text-rose-800"
                                                }`}>
                                                    {canton.cantonChief ? "Pourvu" : "Vacant"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                {/* Bloc de Signature Final */}
                <div className="mt-20 pt-12 border-t-4 border-double border-slate-100 grid grid-cols-2 gap-20">
                    <div className="text-center space-y-24">
                        <p className="font-black uppercase tracking-widest text-slate-400 text-xs">Le Responsable des Affaires Régionales</p>
                        <div className="flex flex-col items-center">
                            <div className="w-48 h-px bg-slate-200 mb-2" />
                            <p className="text-[10px] font-bold text-slate-300 italic">Cachet et Signature faisant foi</p>
                        </div>
                    </div>
                    <div className="text-center space-y-24">
                        <p className="font-black uppercase tracking-widest text-slate-400 text-xs">La Direction Générale - CNRCT</p>
                        <div className="flex flex-col items-center">
                            <div className="w-48 h-px bg-slate-200 mb-2" />
                            <p className="text-[10px] font-bold text-slate-300 italic">Visa et Sceau de l'Institution</p>
                        </div>
                    </div>
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
