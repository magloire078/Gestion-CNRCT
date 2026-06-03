"use client";

import React from "react";
import { InstitutionalHeader } from "../reports/institutional-header";
import { InstitutionalFooter } from "../reports/institutional-footer";
import { InstitutionalReportWrapper } from "../reports/institutional-report-wrapper";
import { OrganizationSettings } from "@/types/common";

interface BlankMaterialRequestFormProps {
    organizationSettings: OrganizationSettings | null;
    isPrinting: boolean;
    onAfterPrint: () => void;
}

export function BlankMaterialRequestForm({ 
    organizationSettings, 
    isPrinting, 
    onAfterPrint 
}: BlankMaterialRequestFormProps) {
    
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
                        title="DEMANDE DE MATÉRIEL IT"
                        period="ADMINISTRATION DES SYSTÈMES ET DU PARC"
                        service="Direction de l'Informatique, du Numérique et des Télécoms"
                        direction="DINT"
                        settings={organizationSettings}
                    />

                    {/* Sub-Header Banner */}
                    <div className="border-2 border-black bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center break-inside-avoid">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                                Demande d'Attribution ou de Renouvellement de Matériel IT
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                                Chambre Nationale des Rois et Chefs Traditionnels (CNRCT)
                            </p>
                        </div>
                        <div className="text-right border-l-2 border-slate-300 pl-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                Réf. Demande Parc
                            </span>
                            <span className="text-sm font-bold font-mono tracking-widest text-slate-900">
                                DINT-AST-2026-____
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6 text-xs">
                        {/* Section I : Identification du Demandeur */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>I. IDENTIFICATION DE L'AGENT DEMANDEUR</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-end gap-2 col-span-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Nom & Prénom(s) :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Poste / Fonction :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Direction / Service :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2 col-span-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Contact (Tél & Email) :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section II : Type de Matériel Demandé */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>II. NATURE DU MATÉRIEL DEMANDÉ (Plusieurs choix possibles)</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white grid grid-cols-3 gap-3">
                                <label className="flex items-center gap-1.5"><input type="checkbox" /> Ordinateur Portable</label>
                                <label className="flex items-center gap-1.5"><input type="checkbox" /> Ordinateur Bureau (Desktop)</label>
                                <label className="flex items-center gap-1.5"><input type="checkbox" /> Écran / Moniteur</label>
                                <label className="flex items-center gap-1.5"><input type="checkbox" /> Imprimante / Scanner</label>
                                <label className="flex items-center gap-1.5"><input type="checkbox" /> Équipement Réseau</label>
                                <label className="flex items-center gap-1.5"><input type="checkbox" /> Logiciel / Licence spécifique</label>
                                <label className="flex items-center gap-1.5 col-span-3"><input type="checkbox" /> Accessoires (Clavier, Souris, Sacoche, Chargeur...) : ________________________</label>
                            </div>
                        </div>

                        {/* Section III : Motif et Justification */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>III. MOTIF DE LA DEMANDE ET JUSTIFICATION DES BESOINS</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-4">
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Première attribution</label>
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Remplacement (Panne / Obsolescence)</label>
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Extension / Équipement additionnel</label>
                                </div>
                                <div className="border-t border-slate-100 pt-3">
                                    <span className="font-bold text-slate-700 block mb-2">Description détaillée du besoin ou justificatif métier :</span>
                                    <div className="min-h-[100px]">
                                        {dottedLines(3)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section IV : Validation et Approbations */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>IV. CIRCUIT DE VALIDATION HIÉRARCHIQUE ET TECHNIQUE</span>
                            </h3>
                            <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl mt-2 space-y-4">
                                <div className="grid grid-cols-2 gap-6 text-[10px]">
                                    <div className="space-y-2 border-r border-slate-200 pr-4">
                                        <p className="font-bold text-slate-800 uppercase leading-none">
                                            1. SUPÉRIEUR HIÉRARCHIQUE DIRECT
                                        </p>
                                        <div className="flex gap-4 py-1">
                                            <label className="flex items-center gap-1.5"><input type="checkbox" /> Favorable</label>
                                            <label className="flex items-center gap-1.5"><input type="checkbox" /> Défavorable</label>
                                        </div>
                                        <div className="pt-4 flex justify-between text-[9px] text-slate-400">
                                            <span>Date : ____/____/20____</span>
                                            <span>Signature</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pl-4">
                                        <p className="font-bold text-slate-800 uppercase leading-none">
                                            2. AVIS DE LA DIRECTION INFORMATIQUE (DINT)
                                        </p>
                                        <div className="flex gap-4 py-1">
                                            <label className="flex items-center gap-1.5"><input type="checkbox" /> Accordé</label>
                                            <label className="flex items-center gap-1.5"><input type="checkbox" /> Rejeté</label>
                                        </div>
                                        <div className="pt-4 flex justify-between text-[9px] text-slate-400">
                                            <span>Date : ____/____/20____</span>
                                            <span>Visa Technique / Cachet</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footers and Signatures */}
                <div className="break-inside-avoid mt-4">
                    <div className="grid grid-cols-2 gap-6 border-t-2 border-slate-900 pt-6">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider leading-none">
                                RÉCÉPISSÉ DE DÉCHARGE DU MATÉRIEL (À la livraison)
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                                Reconnait avoir reçu le matériel désigné ci-dessus en parfait état de marche.
                            </p>
                            <div className="h-16 border border-slate-200 bg-slate-50/50 rounded-lg p-2 flex flex-col justify-between">
                                <span className="text-[9px] text-slate-400">Tag Matériel : INV-__________________</span>
                                <span className="text-[9px] text-slate-400 text-right">Signature du Récipiendaire</span>
                            </div>
                        </div>
                        <div className="space-y-4 text-right">
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider leading-none">
                                LE DIRECTEUR INFORMATIQUE DINT / CNRCT
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                                Validation de la sortie du parc et affectation
                            </p>
                            <div className="h-16 border border-slate-200 bg-slate-50/50 rounded-lg p-2 flex flex-col justify-between text-left">
                                <span className="text-[9px] text-slate-400">Date de Livraison : ____/____/20____</span>
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
