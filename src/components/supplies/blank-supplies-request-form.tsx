"use client";

import React from "react";
import { InstitutionalHeader } from "../reports/institutional-header";
import { InstitutionalFooter } from "../reports/institutional-footer";
import { InstitutionalReportWrapper } from "../reports/institutional-report-wrapper";
import { OrganizationSettings } from "@/types/common";

interface BlankSuppliesRequestFormProps {
    organizationSettings: OrganizationSettings | null;
    isPrinting: boolean;
    onAfterPrint: () => void;
}

export function BlankSuppliesRequestForm({ 
    organizationSettings, 
    isPrinting, 
    onAfterPrint 
}: BlankSuppliesRequestFormProps) {
    
    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting} 
            orientation="portrait"
            onAfterPrint={onAfterPrint}
        >
            <div className="bg-white p-5 print:p-4 text-slate-900 font-sans max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between">
                <div>
                    {/* Official Header */}
                    <InstitutionalHeader 
                        title="DEMANDE DE FOURNITURES"
                        period="BON DE COMMANDE DE CONSOMMABLES"
                        service="Direction des Ressources Humaines et des Affaires Sociales"
                        direction="DRHAS"
                        settings={organizationSettings}
                    />

                    {/* Sub-Header Banner */}
                    <div className="border-2 border-black bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center break-inside-avoid">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                                Demande de Fournitures de Bureau & Consommables IT
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                                Chambre Nationale des Rois et Chefs Traditionnels (CNRCT)
                            </p>
                        </div>
                        <div className="text-right border-l-2 border-slate-300 pl-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                Réf. Bon Fourniture
                            </span>
                            <span className="text-sm font-bold font-mono tracking-widest text-slate-900">
                                RH-CON-2026-____
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6 text-xs">
                        {/* Section I : Informations sur le Service Demandeur */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>I. SERVICE / DÉPARTEMENT DEMANDEUR</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-end gap-2 col-span-2">
                                        <span className="font-bold text-slate-700 w-44 shrink-0">Nom & Prénom(s) du demandeur :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-44 shrink-0">Service d'Affectation :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-44 shrink-0">Date de la demande :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section II : Détail des Fournitures et Consommables Demandés */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>II. DÉTAIL DES ARTICLES SOUHAITÉS</span>
                            </h3>
                            <div className="mt-2 overflow-x-auto">
                                <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-900 text-white uppercase font-black">
                                            <th className="border border-slate-700 p-2 w-[40px] text-center">N°</th>
                                            <th className="border border-slate-700 p-2 text-left">Désignation de l'Article (Fournitures, Cartouches, etc.)</th>
                                            <th className="border border-slate-700 p-2 w-[120px] text-center">Quantité Demandée</th>
                                            <th className="border border-slate-700 p-2 w-[120px] text-center">Quantité Servie</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 6 }).map((_, idx) => (
                                            <tr key={idx} className="border-b border-slate-300 align-middle h-8">
                                                <td className="border border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                                                <td className="border border-slate-200 px-2"></td>
                                                <td className="border border-slate-200 text-center text-slate-300 font-mono"></td>
                                                <td className="border border-slate-200 text-center bg-slate-50/50"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <span className="text-[9px] text-slate-400 italic block mt-1">
                                * La colonne « Quantité Servie » est réservée exclusivement au gestionnaire de stock du magasin.
                            </span>
                        </div>

                        {/* Section III : Circuit d'Approbation */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>III. DESCRIPTIF / AFFECTATION SPÉCIFIQUE (Si nécessaire)</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white flex items-end gap-2 h-14">
                                <span className="font-bold text-slate-700 shrink-0">Motif ou destination du matériel (ex. imprimante d'accueil) :</span>
                                <div className="border-b border-slate-400 flex-1 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footers and Signatures */}
                <div className="break-inside-avoid mt-4 space-y-6">
                    <div className="grid grid-cols-3 gap-6 text-[10px] bg-slate-50 p-4 border border-slate-200 rounded-xl">
                        <div className="space-y-3">
                            <p className="font-bold text-slate-800 uppercase leading-none">
                                1. L'AGENT DEMANDEUR
                            </p>
                            <p className="text-[8px] text-slate-400 italic">Initiateur du bon</p>
                            <div className="h-10 border-b border-slate-300 pt-2 text-[9px] text-slate-500">
                                Signature :
                            </div>
                        </div>
                        <div className="space-y-3 border-l border-slate-200 pl-4">
                            <p className="font-bold text-slate-800 uppercase leading-none">
                                2. LE CHEF DE SERVICE / DIR.
                            </p>
                            <p className="text-[8px] text-slate-400 italic">Validation de la demande</p>
                            <div className="h-10 border-b border-slate-300 pt-2 text-[9px] text-slate-500">
                                Signature :
                            </div>
                        </div>
                        <div className="space-y-3 border-l border-slate-200 pl-4">
                            <p className="font-bold text-slate-800 uppercase leading-none">
                                3. LA MAGASINIER / DRHAS
                            </p>
                            <p className="text-[8px] text-slate-400 italic">Autorisation de sortie</p>
                            <div className="h-10 border-b border-slate-300 pt-2 text-[9px] text-slate-500">
                                Visa Magasin :
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider leading-none">
                                ACCUSÉ DE RÉCEPTION (Décharge)
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                                Reconnait avoir reçu la quantité d'articles mentionnée dans la colonne « Quantité Servie ».
                            </p>
                            <div className="flex justify-between items-end pt-2 text-[9px] text-slate-500">
                                <span>Date : ____/____/20____</span>
                                <span>Signature du Récipiendaire</span>
                            </div>
                        </div>
                        <div className="space-y-2 text-right">
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider leading-none">
                                LE DIRECTEUR DRHAS / CNRCT
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                                Cachet officiel de servitude du stock
                            </p>
                            <div className="pt-2 text-[9px] text-slate-500">
                                Visa Directeur
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4">
                        <InstitutionalFooter 
                            signatoryName="SECRÉTARIAT GÉNÉRAL"
                            signatoryTitle="Directeur DRHAS, CNRCT"
                            showCertification={false}
                            showSignatures={false}
                        />
                    </div>
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
