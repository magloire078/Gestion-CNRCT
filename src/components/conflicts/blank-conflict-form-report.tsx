"use client";

import React from "react";
import { InstitutionalHeader } from "../reports/institutional-header";
import { InstitutionalFooter } from "../reports/institutional-footer";
import { InstitutionalReportWrapper } from "../reports/institutional-report-wrapper";
import { OrganizationSettings } from "@/types/common";

interface BlankConflictFormReportProps {
    organizationSettings: OrganizationSettings | null;
    isPrinting: boolean;
    onAfterPrint: () => void;
}

export function BlankConflictFormReport({ 
    organizationSettings, 
    isPrinting, 
    onAfterPrint 
}: BlankConflictFormReportProps) {
    
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
                        title="FICHE DE COLLECTE MANUELLE"
                        period="SIGNALEMENT DE CONFLIT"
                        service="Direction de la Médiation et de la Gestion des Conflits"
                        direction="DMGC"
                        settings={organizationSettings}
                    />

                    {/* Form Sub-Header Banner */}
                    <div className="border-2 border-black bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center break-inside-avoid">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                                Registre National des Conflits Communautaires
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                                Chambre Nationale des Rois et Chefs Traditionnels (CNRCT)
                            </p>
                        </div>
                        <div className="text-right border-l-2 border-slate-300 pl-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                Réf. Saisie Manuelle
                            </span>
                            <span className="text-sm font-bold font-mono tracking-widest text-slate-900">
                                LIT-MAN-2026-____
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6 text-xs">
                        {/* Section I : Localisation Géographique */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>I. LOCALISATION DE L'INCIDENT</span>
                                <span className="text-[8px] font-medium italic lowercase">Remplir en lettres majuscules</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 p-4 border border-slate-200 rounded-xl mt-2 bg-white">
                                <div className="flex items-end gap-2">
                                    <span className="font-bold text-slate-700 w-24 shrink-0">Région :</span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="font-bold text-slate-700 w-24 shrink-0">Département :</span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="font-bold text-slate-700 w-24 shrink-0">Sous-Préfecture :</span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="font-bold text-slate-700 w-24 shrink-0">Village / Localité :</span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Section II : Caractéristiques du Litige */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>II. CARACTÉRISTIQUES ET TIMING</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-700 shrink-0">Date de l'incident :</span>
                                        <span className="font-mono text-slate-400">__ / __ / ____</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-700 shrink-0">Date de signalement :</span>
                                        <span className="font-mono text-slate-400">__ / __ / ____</span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-3">
                                    <span className="font-bold text-slate-700 block mb-2">Nature du Litige (Cocher la case correspondante) :</span>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-slate-400 rounded-sm shrink-0" />
                                            <span>Foncier Rural</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-slate-400 rounded-sm shrink-0" />
                                            <span>Foncier Urbain</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-slate-400 rounded-sm shrink-0" />
                                            <span>Chefferie / Successoral</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-slate-400 rounded-sm shrink-0" />
                                            <span>Agriculteurs / Éleveurs</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-slate-400 rounded-sm shrink-0" />
                                            <span>Voisinage / Communautaire</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-slate-400 rounded-sm shrink-0" />
                                            <span>Autre (Préciser) : _________________</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-3">
                                    <span className="font-bold text-slate-700 block mb-2">Niveau de Gravité estimé :</span>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-slate-400 rounded-full shrink-0" />
                                            <span>[ ] Faible</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-slate-400 rounded-full shrink-0" />
                                            <span>[ ] Moyen</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-slate-400 rounded-full shrink-0" />
                                            <span>[ ] Élevé (Tensions)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-slate-400 rounded-full shrink-0" />
                                            <span>[ ] Critique (Affrontements)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section III : Parties Conflits */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>III. IDENTIFICATION DES PARTIES</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-6 mt-2">
                                <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
                                    <span className="font-black text-slate-800 uppercase text-[9px] tracking-widest block border-b pb-1 border-slate-100">
                                        PARTIE PLAINTE / REQUÉRANT (PARTIE A)
                                    </span>
                                    <div className="space-y-2">
                                        <div className="flex items-end gap-2">
                                            <span className="font-semibold text-slate-600">Nom :</span>
                                            <div className="border-b border-slate-300 flex-1 h-4" />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="font-semibold text-slate-600">Qualité :</span>
                                            <div className="border-b border-slate-300 flex-1 h-4" />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="font-semibold text-slate-600">Contact :</span>
                                            <div className="border-b border-slate-300 flex-1 h-4" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
                                    <span className="font-black text-slate-800 uppercase text-[9px] tracking-widest block border-b pb-1 border-slate-100">
                                        PARTIE EN CAUSE / DÉFENDEUR (PARTIE B)
                                    </span>
                                    <div className="space-y-2">
                                        <div className="flex items-end gap-2">
                                            <span className="font-semibold text-slate-600">Nom :</span>
                                            <div className="border-b border-slate-300 flex-1 h-4" />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="font-semibold text-slate-600">Qualité :</span>
                                            <div className="border-b border-slate-300 flex-1 h-4" />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="font-semibold text-slate-600">Contact :</span>
                                            <div className="border-b border-slate-300 flex-1 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section IV : Résumé des faits */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>IV. RÉSUMÉ SYNTHÉTIQUE DES FAITS ET REQUÊTE</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white min-h-[220px]">
                                {dottedLines(7)}
                            </div>
                        </div>

                        {/* Section V : Médiation & Autorités */}
                        <div className="break-inside-avoid">
                            <h3 className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                <span>V. DÉMARCHES INITIALES & AUTORITÉ LOCALE ASSIGNÉE</span>
                            </h3>
                            <div className="p-4 border border-slate-200 rounded-xl mt-2 bg-white space-y-3">
                                <div className="flex items-end gap-2">
                                    <span className="font-bold text-slate-700 w-60 shrink-0">
                                        Médiateur ou Autorité Coutumière assignée :
                                    </span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="font-bold text-slate-700 w-60 shrink-0">
                                        Première action ou recommandation locale :
                                    </span>
                                    <div className="border-b border-slate-400 flex-1 h-5" />
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
                                L'AGENT DE COLLECTE ENQUÊTEUR
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                                Saisir Nom civil, date et apposer la signature
                            </p>
                            <div className="h-16 border border-slate-200 bg-slate-50/50 rounded-lg p-2 flex flex-col justify-between">
                                <span className="text-[9px] text-slate-400">Nom : _____________________</span>
                                <span className="text-[9px] text-slate-400 text-right">Signature</span>
                            </div>
                        </div>
                        <div className="space-y-4 text-right">
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider leading-none">
                                LE DIRECTOIRE / MÉDIATEUR DE ZONE
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                                Cachet et signature officielle de réception
                            </p>
                            <div className="h-16 border border-slate-200 bg-slate-50/50 rounded-lg p-2 flex flex-col justify-between text-left">
                                <span className="text-[9px] text-slate-400">Date : ____/____/20____</span>
                                <span className="text-[9px] text-slate-400 text-right">Visa / Cachet</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <InstitutionalFooter 
                            signatoryName="SECRÉTARIAT GÉNÉRAL"
                            signatoryTitle="Directeur DMGC, CNRCT"
                            showCertification={false}
                            showSignatures={false}
                        />
                    </div>
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
