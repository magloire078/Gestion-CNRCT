"use client";

import React from "react";
import { InstitutionalHeader } from "../reports/institutional-header";
import { InstitutionalFooter } from "../reports/institutional-footer";
import { InstitutionalReportWrapper } from "../reports/institutional-report-wrapper";
import { OrganizationSettings } from "@/types/common";

interface BlankEmployeeFormReportProps {
    organizationSettings: OrganizationSettings | null;
    isPrinting: boolean;
    onAfterPrint: () => void;
}

export function BlankEmployeeFormReport({ 
    organizationSettings, 
    isPrinting, 
    onAfterPrint 
}: BlankEmployeeFormReportProps) {
    
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
                        title="FICHE DE COLLECTE"
                        period="NOUVEL EMPLOYÉ / AGENT"
                        service="Direction des Ressources Humaines et des Affaires Sociales"
                        direction="DRHAS"
                        settings={organizationSettings}
                    />

                    {/* Sub-Header Banner */}
                    <div className="border-2 border-black bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center break-inside-avoid">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                                Répertoire des Ressources Humaines de la CNRCT
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                                Chambre Nationale des Rois et Chefs Traditionnels (CNRCT)
                            </p>
                        </div>
                        <div className="text-right border-l-2 border-slate-300 pl-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                Réf. RH Interne
                            </span>
                            <span className="text-sm font-bold font-mono tracking-widest text-slate-900">
                                RH-AGT-2026-____
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6 text-xs">
                        {/* Section I : Identité Civile de l'Employé */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>I. ÉTAT CIVIL ET IDENTITÉ DE L'AGENT</span>
                                <span className="text-[8px] font-medium italic lowercase">Remplir en lettres majuscules</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-24 shrink-0">Nom :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-24 shrink-0">Prénom(s) :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-24 shrink-0">Date Naissance :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-24 shrink-0">Lieu de Naissance :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-center gap-6 pl-2 col-span-2">
                                        <span className="font-bold text-slate-700 shrink-0">Sexe :</span>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Masculin</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Féminin</label>
                                        <span className="font-bold text-slate-700 shrink-0 ml-8">Nationalité :</span>
                                        <div className="border-b border-slate-400 w-44 h-5" />
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 pt-3">
                                    <span className="font-bold text-slate-700 block mb-2">Pièce d'Identité Officielle (Fournir une copie) :</span>
                                    <div className="grid grid-cols-3 gap-3">
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> CNI Ivoirienne</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Passeport</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Autre / Attestation</label>
                                    </div>
                                    <div className="flex items-end gap-2 mt-3">
                                        <span className="font-semibold text-slate-600">Numéro de la Pièce d'Identité :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section II : Coordonnées de l'employé */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>II. COORDONNÉES PERSONNELLES</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-28 shrink-0">Téléphone Mobile :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-28 shrink-0">Téléphone Domicile :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                    <div className="flex items-end gap-2 col-span-2">
                                        <span className="font-bold text-slate-700 w-28 shrink-0">Adresse Email :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                    <div className="flex items-end gap-2 col-span-2">
                                        <span className="font-bold text-slate-700 w-28 shrink-0">Adresse Géographique :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section III : Situation Professionnelle */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>III. AFFECTATION PROFESSIONNELLE</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-end gap-2 col-span-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Poste / Fonction :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Direction / Service :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Région d'affectation :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-32 shrink-0">Date de prise de fonction :</span>
                                        <div className="border-b border-slate-400 flex-1 h-5" />
                                    </div>
                                    <div className="flex items-center gap-6 pl-2">
                                        <span className="font-bold text-slate-700 shrink-0">Type de Contrat :</span>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> CDD</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> CDI</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" /> Stage</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section IV : Personne à contacter en cas d'urgence */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>IV. PERSONNE À CONTACTER EN CAS D'URGENCE</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-end gap-2 col-span-2">
                                        <span className="font-bold text-slate-700 w-36 shrink-0">Nom civil complet :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-36 shrink-0">Lien de parenté :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="font-bold text-slate-700 w-36 shrink-0">Numéro de Téléphone :</span>
                                        <div className="border-b border-slate-300 flex-1 h-4" />
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
                                L'EMPLOYÉ DÉCLARANT
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                                Certifie sur l'honneur l'exactitude des données
                            </p>
                            <div className="h-16 border border-slate-200 bg-slate-50/50 rounded-lg p-2 flex flex-col justify-between">
                                <span className="text-[9px] text-slate-400">Date : ____/____/20____</span>
                                <span className="text-[9px] text-slate-400 text-right">Signature de l'Agent</span>
                            </div>
                        </div>
                        <div className="space-y-4 text-right">
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider leading-none">
                                LA DIRECTION DES RESSOURCES HUMAINES
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                                Cachet et visa d'approbation administrative
                            </p>
                            <div className="h-16 border border-slate-200 bg-slate-50/50 rounded-lg p-2 flex flex-col justify-between text-left">
                                <span className="text-[9px] text-slate-400">Nom du Responsable : _________________</span>
                                <span className="text-[9px] text-slate-400 text-right">Visa / Cachet</span>
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
