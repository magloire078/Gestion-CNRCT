"use client";

import React from "react";
import { InstitutionalCover } from "@/components/reports/institutional-cover";
import { InstitutionalHeader } from "@/components/reports/institutional-header";
import { InstitutionalReportWrapper } from "@/components/reports/institutional-report-wrapper";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Users, Shield, Network } from "lucide-react";
import { TribuData } from "./tribu-card";

interface PrintTribusListProps {
    tribus: TribuData[];
    subtitle?: string;
}

export function PrintTribusList({ tribus, subtitle }: PrintTribusListProps) {
    // Group tribus by Region
    const tribusByRegion = tribus.reduce((acc, tribu) => {
        const region = tribu.region || "Non définie";
        if (!acc[region]) acc[region] = [];
        acc[region].push(tribu);
        return acc;
    }, {} as Record<string, TribuData[]>);

    const totalTribus = tribus.length;
    const tribusWithChiefs = tribus.filter(t => !!t.tribuChief).length;
    const vacancyRate = totalTribus > 0 ? Math.round(((totalTribus - tribusWithChiefs) / totalTribus) * 100) : 0;
    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });

    return (
        <InstitutionalReportWrapper isPrinting={true} orientation="landscape">
            {/* --- PAGE DE GARDE --- */}
            <InstitutionalCover 
                title="RÉPERTOIRE NATIONAL DES TRIBUS"
                subtitle={subtitle || "BASE DE DONNÉES DES SOUS-ENSEMBLES COUTUMIERS"}
                direction="DFP / DR"
                service="Direction du Patrimoine et des Relations Extérieures"
                stats={[
                    { label: "Tribus Inscrites", value: totalTribus, icon: Network },
                    { label: "Chefs de Tribu", value: tribusWithChiefs, icon: Users },
                    { label: "Taux de Vacance", value: `${vacancyRate}%`, icon: Shield },
                    { label: "Régions Couvertes", value: Object.keys(tribusByRegion).length, icon: MapPin },
                ]}
                reference={`REP-TRB-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`}
            />

            {/* --- PAGES DÉTAILLÉES --- */}
            <div className="min-h-screen p-12 print:p-5 bg-white">
                <InstitutionalHeader 
                    title="État Civil des Tribus et Chefferies Tribales"
                    period={`Situation consolidée au ${todayStr}`}
                />

                <div className="space-y-6">
                    {Object.entries(tribusByRegion).sort().map(([region, regionTribus]) => (
                        <div key={region} className="space-y-6 break-inside-avoid">
                            <div className="flex justify-between items-end border-b-4 border-slate-100 pb-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                    Région : <span className="text-emerald-700 underline decoration-4 underline-offset-8">{region}</span>
                                </h3>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full border border-slate-100">
                                    {regionTribus.length} Tribus répertoriées
                                </div>
                            </div>
                            
                            <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                                <thead>
                                    <tr className="bg-slate-900 text-white uppercase font-black print:bg-transparent print:text-slate-900 print:border-b-2 print:border-slate-900">
                                        <th className="p-3 text-left border-r border-slate-700 print:border-slate-300">Tribu</th>
                                        <th className="p-3 text-left border-r border-slate-700 print:border-slate-300">Département / Sous-Préfecture</th>
                                        <th className="p-3 text-left border-r border-slate-700 print:border-slate-300">Canton Rattaché</th>
                                        <th className="p-3 text-center border-r border-slate-700 print:border-slate-300">Localités Rattachées</th>
                                        <th className="p-3 text-left border-r border-slate-700 print:border-slate-300">Chef de Tribu Actif</th>
                                        <th className="p-3 w-[120px] text-center">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {regionTribus.sort((a, b) => a.name.localeCompare(b.name)).map((tribu, idx) => (
                                        <tr key={idx} className="border-b border-slate-200 align-top">
                                            <td className="p-3 font-black text-slate-900 border-r border-slate-200">
                                                {tribu.name}
                                            </td>
                                            <td className="p-3 border-r border-slate-200 uppercase text-slate-600 font-medium">
                                                {tribu.department} / {tribu.subPrefecture}
                                            </td>
                                            <td className="p-3 border-r border-slate-200 font-medium">
                                                {tribu.canton || "---"}
                                            </td>
                                            <td className="p-3 border-r border-slate-200 text-center font-bold">
                                                {tribu.villages.length}
                                            </td>
                                            <td className="p-3 border-r border-slate-200 font-bold">
                                                {tribu.tribuChief ? (
                                                    <span className="text-slate-900">{tribu.tribuChief.name}</span>
                                                ) : (
                                                    <span className="text-rose-500 italic">NON RENSEIGNÉ / VACANT</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                                                    tribu.tribuChief 
                                                        ? "bg-emerald-100 text-emerald-800" 
                                                        : "bg-rose-100 text-rose-800"
                                                }`}>
                                                    {tribu.tribuChief ? "Pourvu" : "Vacant"}
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
