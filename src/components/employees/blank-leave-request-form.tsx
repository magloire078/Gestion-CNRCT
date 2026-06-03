"use client";

import React from "react";
import { InstitutionalHeader } from "../reports/institutional-header";
import { InstitutionalFooter } from "../reports/institutional-footer";
import { InstitutionalReportWrapper } from "../reports/institutional-report-wrapper";
import { OrganizationSettings } from "@/types/common";

interface BlankLeaveRequestFormProps {
    organizationSettings: OrganizationSettings | null;
    isPrinting: boolean;
    onAfterPrint: () => void;
}

export function BlankLeaveRequestForm({ 
    organizationSettings, 
    isPrinting, 
    onAfterPrint 
}: BlankLeaveRequestFormProps) {
    
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
                        title="DEMANDE DE CONGÉ / ABSENCE"
                        period="ADMINISTRATION DES RESSOURCES HUMAINES"
                        service="Direction des Ressources Humaines et des Affaires Sociales"
                        direction="DRHAS"
                        settings={organizationSettings}
                    />

                    {/* Sub-Header Banner */}
                    <div className="border-2 border-black bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center break-inside-avoid">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                                Demande de Congé ou d'Autorisation d'Absence
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                                Chambre Nationale des Rois et Chefs Traditionnels (CNRCT)
                            </p>
                        </div>
                        <div className="text-right border-l-2 border-slate-300 pl-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                Réf. Formulaire
                            </span>
                            <span className="text-sm font-bold font-mono tracking-widest text-slate-900">
                                RH-ABS-2026-____
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6 text-xs">
                        {/* Section I : Identification de l'Agent */}
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
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Matricule :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Contact Téléphonique :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section II : Nature de la Demande */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>II. NATURE DE LA DEMANDE (Cocher la case correspondante)</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Congé Annuel</label>
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Congé de Maladie (Certificat obligatoire)</label>
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Congé de Maternité / Paternité</label>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Congé Exceptionnel (Événement familial)</label>
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Autorisation d'Absence Exceptionnelle</label>
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Autre Motif (Préciser) : _________________</label>
                                </div>
                            </div>
                        </div>

                        {/* Section III : Période et Durée de l'Absence */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>III. PÉRIODE ET DURÉE SOUHAITÉE</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-700 shrink-0">Date de début de l'absence :</span>
                                        <span className="font-mono text-slate-400">__ / __ / ____</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-700 shrink-0">Date de fin de l'absence :</span>
                                        <span className="font-mono text-slate-400">__ / __ / ____</span>
                                    </div>
                                    <div className="flex items-end gap-2 col-span-2 pt-2">
                                        <span className="font-bold text-slate-700 shrink-0">Durée totale demandée :</span>
                                        <span className="font-mono text-slate-400">_________ jours ouvrables / _________ heures</span>
                                    </div>
                                    <div className="flex items-center gap-3 col-span-2 pt-2 border-t border-slate-100">
                                        <span className="font-bold text-slate-700 shrink-0">Date de reprise effective du service :</span>
                                        <span className="font-mono text-slate-400">__ / __ / ____</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section IV : Motif et Justification */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>IV. MOTIFS ET PIÈCES JOINTES</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-3">
                                <div className="min-h-[80px]">
                                    {dottedLines(2)}
                                </div>
                                <div className="border-t border-slate-100 pt-3 flex items-center gap-6">
                                    <span className="font-bold text-slate-700 shrink-0">Pièce(s) jointe(s) justificative(s) :</span>
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Oui</label>
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Non</label>
                                    <span className="text-slate-400 italic">(Certificat médical, convocation officielle, acte d'état civil, etc.)</span>
                                </div>
                            </div>
                        </div>

                        {/* Section V : Intérim de Service */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>V. INTÉRIM DE SERVICE (Le cas échéant)</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white grid grid-cols-2 gap-6">
                                <div className="flex flex-col justify-between h-16">
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 shrink-0">Nom civil de l'intérimaire :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                    <span className="text-[9px] text-slate-400 italic">Doit appartenir au même service/direction</span>
                                </div>
                                <div className="border border-slate-200 bg-slate-50 rounded-lg p-2 flex flex-col justify-between text-right">
                                    <span className="text-[9px] text-slate-400 text-left">Signature pour accord de l'intérimaire</span>
                                    <span className="text-[9px] text-slate-400">Signature</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Circuit de Validation */}
                <div className="break-inside-avoid mt-4">
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
                        <span className="font-black text-slate-800 uppercase text-[9px] tracking-widest block border-b pb-1 border-slate-200">
                            VI. CIRCUIT D'APPROBATION ET DÉCISIONS
                        </span>
                        <div className="grid grid-cols-2 gap-4 text-[11px]">
                            <div className="space-y-2 border-r border-slate-200 pr-4">
                                <p className="font-bold text-slate-800 uppercase leading-none">
                                    1. AVIS DU SUPÉRIEUR HIÉRARCHIQUE DIRECT
                                </p>
                                <div className="flex gap-4 py-2">
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Favorable</label>
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Défavorable</label>
                                </div>
                                <p className="text-[9px] text-slate-400">Motif si défavorable : ______________________________</p>
                                <div className="pt-4 flex justify-between text-[9px] text-slate-500">
                                    <span>Date : ____/____/20____</span>
                                    <span>Signature</span>
                                </div>
                            </div>
                            <div className="space-y-2 pl-4">
                                <p className="font-bold text-slate-800 uppercase leading-none">
                                    2. AVIS DE LA DIRECTION DES RESSOURCES HUMAINES
                                </p>
                                <div className="flex gap-4 py-2">
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Favorable</label>
                                    <label className="flex items-center gap-1.5"><input type="checkbox" /> Défavorable</label>
                                </div>
                                <p className="text-[9px] text-slate-400">Observations : _____________________________________</p>
                                <div className="pt-4 flex justify-between text-[9px] text-slate-500">
                                    <span>Date : ____/____/20____</span>
                                    <span>Visa / Cachet</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
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
