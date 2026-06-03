"use client";

import React from "react";
import { InstitutionalHeader } from "../reports/institutional-header";
import { InstitutionalFooter } from "../reports/institutional-footer";
import { InstitutionalReportWrapper } from "../reports/institutional-report-wrapper";
import { OrganizationSettings } from "@/types/common";

interface BlankAssetFormReportProps {
    organizationSettings: OrganizationSettings | null;
    isPrinting: boolean;
    onAfterPrint: () => void;
}

export function BlankAssetFormReport({ 
    organizationSettings, 
    isPrinting, 
    onAfterPrint 
}: BlankAssetFormReportProps) {
    
    const dottedLines = (count: number) => {
        return Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="border-b border-dashed border-slate-300 h-8 w-full" />
        ));
    };

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
                        title="FICHE D'INVENTAIRE ET D'AFFECTATION"
                        period="MATÉRIEL IT / ACTIF"
                        service="Direction de l'Informatique, du Numérique et des Télécoms"
                        direction="DINT"
                        settings={organizationSettings}
                    />

                    {/* Sub-Header Banner */}
                    <div className="border-2 border-black bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center break-inside-avoid">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                                Inventaire National des Actifs Informatiques
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                                Chambre Nationale des Rois et Chefs Traditionnels (CNRCT)
                            </p>
                        </div>
                        <div className="text-right border-l-2 border-slate-300 pl-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                Réf. Inventaire DINT
                            </span>
                            <span className="text-sm font-bold font-mono tracking-widest text-slate-900">
                                INV-AST-2026-____
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6 text-xs">
                        {/* Section I : Identification du Matériel */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>I. IDENTIFICATION DU MATÉRIEL</span>
                                <span className="text-[8px] font-medium italic lowercase">Compléter les caractéristiques physiques</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-end gap-2 col-span-2">
                                        <span className="font-bold text-slate-700 w-48 shrink-0">N° d'Inventaire / Code-barres (Tag) :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-48 shrink-0">Numéro de Série Constructeur (S/N) :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-48 shrink-0">Adresse IP assignée :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 pt-3">
                                    <span className="font-bold text-slate-700 block mb-2">Type d'Actif / Catégorie (Cocher la case correspondante) :</span>
                                    <div className="grid grid-cols-4 gap-2">
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Portable</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> De Bureau</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Serveur</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Imprimante</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Écran / Moniteur</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Routeur / Switch</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Licence Logiciel</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Autre</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section II : Spécifications techniques et Modèle */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>II. SPÉCIFICATIONS TECHNIQUES</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 p-4 border border-slate-200 rounded-xl mt-2 bg-white">
                                <div className="flex items-end gap-2">
                                    <span className="font-bold text-slate-700 w-28 shrink-0">Constructeur / Marque :</span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="font-bold text-slate-700 w-28 shrink-0">Modèle exact :</span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
                                </div>
                                <div className="flex items-end gap-2 col-span-2">
                                    <span className="font-bold text-slate-700 w-28 shrink-0">Identifiants / MDP Admin :</span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Section III : Affectation et Statut d'exploitation */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>III. STATUS D'EXPLOITATION ET AFFECTATION</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-36 shrink-0">Assigné / Remis à (Nom) :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-36 shrink-0">Bureau / Localisation :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 pt-3">
                                    <span className="font-bold text-slate-700 block mb-2">Statut initial (Cocher la case correspondante) :</span>
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> [ ] En stock (Disponible)</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> [ ] En utilisation (Opérationnel)</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> [ ] En réparation / Maintenance</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section IV : Commentaires et descriptif d'état */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>IV. OBSERVATIONS ET ACCESSOIRES DU PACK INVENTAIRE</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white min-h-[160px]">
                                {dottedLines(5)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footers and Signatures */}
                <div className="break-inside-avoid mt-4">
                    <div className="grid grid-cols-2 gap-6 border-t-2 border-slate-900 pt-6">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider leading-none">
                                LE COLLABORATEUR DÉPOSITAIRE
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                                Reconnait avoir reçu le matériel en bon état
                            </p>
                            <div className="h-16 border border-slate-200 bg-slate-50/50 rounded-lg p-2 flex flex-col justify-between">
                                <span className="text-[9px] text-slate-400">Date : ____/____/20____</span>
                                <span className="text-[9px] text-slate-400 text-right">Signature de décharge</span>
                            </div>
                        </div>
                        <div className="space-y-4 text-right">
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider leading-none">
                                LE RESPONSABLE INVENTAIRE DINT
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                                Visa et validation de l'enregistrement de l'actif
                            </p>
                            <div className="h-16 border border-slate-200 bg-slate-50/50 rounded-lg p-2 flex flex-col justify-between text-left">
                                <span className="text-[9px] text-slate-400">Nom du Technicien : _________________</span>
                                <span className="text-[9px] text-slate-400 text-right">Visa / Cachet</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <InstitutionalFooter 
                            signatoryName="SECRÉTARIAT GÉNÉRAL"
                            signatoryTitle="Directeur DINT, CNRCT"
                            showCertification={false}
                            showSignatures={false}
                        />
                    </div>
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
