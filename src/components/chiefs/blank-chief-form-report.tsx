"use client";

import React from "react";
import { InstitutionalHeader } from "../reports/institutional-header";
import { InstitutionalFooter } from "../reports/institutional-footer";
import { InstitutionalReportWrapper } from "../reports/institutional-report-wrapper";
import { OrganizationSettings } from "@/types/common";

interface BlankChiefFormReportProps {
    organizationSettings: OrganizationSettings | null;
    isPrinting: boolean;
    onAfterPrint: () => void;
}

export function BlankChiefFormReport({ 
    organizationSettings, 
    isPrinting, 
    onAfterPrint 
}: BlankChiefFormReportProps) {
    
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
                        title="FICHE D'ENREGISTREMENT"
                        period="AUTORITÉ COUTUMIÈRE / CHEF"
                        service="Direction de l'Administration Civile et du Territoire"
                        direction="DACT"
                        settings={organizationSettings}
                    />

                    {/* Sub-Header Banner */}
                    <div className="border-2 border-black bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center break-inside-avoid">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                                Répertoire National des Rois et Chefs Traditionnels
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                                Chambre Nationale des Rois et Chefs Traditionnels (CNRCT)
                            </p>
                        </div>
                        <div className="text-right border-l-2 border-slate-300 pl-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                N° Registre CNRCT
                            </span>
                            <span className="text-sm font-bold font-mono tracking-widest text-slate-900">
                                REG-CHF-2026-____
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6 text-xs">
                        {/* Section I : Identité Coutumière et Civile */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>I. IDENTITÉ CIVILE ET COUTUMIÈRE</span>
                                <span className="text-[8px] font-medium italic lowercase">Remplir lisiblement</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-end gap-2 col-span-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Nom civil Complet :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2 col-span-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Titre Coutumier (ex: Nanan) :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Date de Naissance :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Lieu de Naissance :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Groupe Ethnique :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-center gap-6 pl-2">
                                        <span className="font-bold text-slate-700 shrink-0">Sexe :</span>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" className="h-4.5 w-4.5" /> M</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" className="h-4.5 w-4.5" /> F</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section II : Rôle, Dignité et Affiliation */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>II. RÔLE COUTUMIER ET AFFILIATION INSTITUTIONNELLE</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-4">
                                <div>
                                    <span className="font-bold text-slate-700 block mb-2">Rôle coutumier (Cocher la case) :</span>
                                    <div className="grid grid-cols-5 gap-2">
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Roi</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Chef Province</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Chef Canton</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Chef Tribu</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Chef Village</label>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-4">
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-36 shrink-0">Mode de Désignation :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-36 shrink-0">Date d'intronisation :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 pt-3">
                                    <span className="font-bold text-slate-700 block mb-2">Affiliation au sein de la Chambre (CNRCT) :</span>
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> [ ] Membre du Directoire</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> [ ] Membre du Comité Régional</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> [ ] Autre / Sans Affiliation spécifique</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section III : Localisation Territoriale */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>III. RESSORT TERRITORIAL ET LOCALISATION</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 p-4 border border-slate-200 rounded-xl mt-2 bg-white">
                                <div className="flex items-end gap-2">
                                    <span className="font-bold text-slate-700 w-28 shrink-0">Village :</span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="font-bold text-slate-700 w-28 shrink-0">Sous-Préfecture :</span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="font-bold text-slate-700 w-28 shrink-0">Département :</span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="font-bold text-slate-700 w-28 shrink-0">Région :</span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Section IV : Coordonnées de contact */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>IV. COORDONNÉES DE CONTACT</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Téléphone Principal :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Téléphone Secondaire :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                    <div className="flex items-end gap-2 col-span-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Adresse Email :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section V : Documents administratifs et civils */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>V. DOCUMENTS LÉGAUX ET CIVIL</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-44 shrink-0">Numéro d'Arrêté de Nomination :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-44 shrink-0">Date d'établissement de l'Arrêté :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-44 shrink-0">Nom du Signataire de l'Arrêté :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                    <div className="flex items-center gap-6 pl-2">
                                        <span className="font-bold text-slate-700 shrink-0">Titre du Signataire :</span>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Préfet de Région</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Préfet Hors Grade</label>
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
                                L'AUTORITÉ COUTUMIÈRE DÉCLARANTE
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                                Lu et approuvé, signature manuscrite
                            </p>
                            <div className="h-16 border border-slate-200 bg-slate-50/50 rounded-lg p-2 flex flex-col justify-between">
                                <span className="text-[9px] text-slate-400">Date : ____/____/20____</span>
                                <span className="text-[9px] text-slate-400 text-right">Signature</span>
                            </div>
                        </div>
                        <div className="space-y-4 text-right">
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider leading-none">
                                LE RESPONSABLE DE L'ENREGISTREMENT CNRCT
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                                Cachet et signature de réception
                            </p>
                            <div className="h-16 border border-slate-200 bg-slate-50/50 rounded-lg p-2 flex flex-col justify-between text-left">
                                <span className="text-[9px] text-slate-400">Nom de l'Agent : _____________________</span>
                                <span className="text-[9px] text-slate-400 text-right">Visa / Cachet</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <InstitutionalFooter 
                            signatoryName="SECRÉTARIAT GÉNÉRAL"
                            signatoryTitle="Directeur DACT, CNRCT"
                            showCertification={false}
                            showSignatures={false}
                        />
                    </div>
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
