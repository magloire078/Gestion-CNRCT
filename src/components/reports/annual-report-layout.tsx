"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Conflict, OrganizationSettings } from "@/lib/data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AnnualReportLayoutProps {
    logos: OrganizationSettings;
    conflicts: Conflict[];
    periodLabel: string;
}

export function AnnualReportLayout({ logos, conflicts, periodLabel }: AnnualReportLayoutProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Portrait mode for this specific report
        document.body.classList.add('print-portrait');
        return () => {
            setMounted(false);
            document.body.classList.remove('print-portrait');
        };
    }, []);

    if (!mounted) return null;

    // Group conflicts by year
    const conflictsByYear: Record<string, Conflict[]> = {};
    conflicts.forEach(c => {
        const year = new Date(c.reportedDate).getFullYear().toString();
        if (!conflictsByYear[year]) conflictsByYear[year] = [];
        conflictsByYear[year].push(c);
    });

    const years = Object.keys(conflictsByYear).sort().reverse();

    return createPortal(
        <div id="print-section" className="bg-white text-black w-full print:shadow-none print:border-none">
            {/* Page de Garde */}
            <div className="print-page h-screen flex flex-col p-12 border-b-2 border-slate-100 break-inside-avoid">
                <header className="flex justify-between items-start mb-20 min-h-[140px] break-inside-avoid">
                    <div className="w-1/3 text-center flex flex-col justify-center items-center break-inside-avoid">
                        <p className="font-bold text-[10px] items-center text-slate-800 leading-tight">Chambre Nationale des Rois<br />et Chefs Traditionnels</p>
                        {logos.mainLogoUrl && <img src={logos.mainLogoUrl} alt="Logo" className="max-h-24 mt-2" loading="eager" />}
                    </div>
                    <div className="w-1/3"></div>
                    <div className="w-1/3 text-center flex flex-col justify-center items-center break-inside-avoid">
                        <p className="font-bold text-[10px] leading-tight text-slate-800">République de Côte d'Ivoire</p>
                        {logos.secondaryLogoUrl && <img src={logos.secondaryLogoUrl} alt="Logo" className="max-h-20 my-2" loading="eager" />}
                        <p className="text-[10px] italic">Union - Discipline - Travail</p>
                    </div>
                </header>

                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-12">
                    <div className="space-y-4">
                        <h1 className="text-3xl font-black uppercase tracking-widest text-slate-800">
                            RÉCAPITULATIF ET STATISTIQUES DES LITIGES
                        </h1>
                        <div className="h-1.5 w-48 bg-primary mx-auto"></div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-600 bg-slate-50 px-8 py-4 rounded-full border border-slate-100 italic">
                        Soumis à la Chambre Nationale des Rois<br />et Chefs Traditionnels
                    </h2>

                    <div className="mt-12 p-8 border-4 border-double border-slate-200 rounded-lg">
                        <p className="text-2xl font-bold uppercase underline">PÉRIODE : {periodLabel}</p>
                    </div>
                </div>

                <footer className="mt-auto pt-10 text-center border-t border-slate-100">
                    <p className="font-bold text-lg uppercase tracking-widest">Secrétariat Général / Cabinet</p>
                    <p className="text-sm text-slate-500 mt-2 italic">Document généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
                </footer>
            </div>

            {/* Sommaire */}
            <div className="print-page min-h-screen p-12 break-after-page">
                <h2 className="text-2xl font-bold uppercase underline mb-8">SOMMAIRE</h2>
                <div className="space-y-6 text-lg mt-12">
                    {years.map((year, idx) => (
                        <div key={year} className="flex justify-between border-b-2 border-dotted border-slate-200 pb-2">
                            <span className="font-semibold uppercase text-slate-700">
                                {idx + 1} - TABLEAU RÉCAPITULATIF DES LITIGES AU COURS DE L’ANNÉE {year}
                            </span>
                            <span className="font-bold text-primary">PAGE {idx + 2}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tableaux par année */}
            {years.map((year, idx) => (
                <div key={year} className="print-page min-h-screen p-8 break-after-page">
                    <div className="mb-6 flex justify-between items-center bg-slate-50 p-4 border border-slate-200">
                         <h3 className="text-lg font-bold uppercase tracking-tight">
                            {idx + 1} - TABLEAU RÉCAPITULATIF DES LITIGES AU COURS DE L’ANNÉE {year}
                        </h3>
                        <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded">ANNÉE {year}</span>
                    </div>

                    <table className="w-full border-collapse border border-black text-[9px] leading-tight">
                        <thead>
                            <tr className="bg-slate-200 text-black uppercase font-bold text-center">
                                <th className="border border-black p-2 w-[35px]">N°</th>
                                <th className="border border-black p-2 w-[120px]">DISTRICT / RÉGION</th>
                                <th className="border border-black p-2 w-[100px]">VILLAGE / COMMUNE</th>
                                <th className="border border-black p-2 w-[150px]">PARTIES EN CONFLIT</th>
                                <th className="border border-black p-2">NATURE DU LITIGE / RÉSUMÉ DES FAITS</th>
                                <th className="border border-black p-2 w-[100px]">ETAT DE LA PROCÉDURE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conflictsByYear[year].map((conflict, index) => (
                                <tr key={conflict.id} className="align-top">
                                    <td className="border border-black p-2 text-center font-bold">{index + 1}</td>
                                    <td className="border border-black p-2 uppercase">
                                        <div className="font-bold text-slate-900">{conflict.district || '-'}</div>
                                        <div className="text-slate-500 italic mt-1 text-[8px]">{conflict.region || '-'}</div>
                                    </td>
                                    <td className="border border-black p-2 font-semibold">{conflict.village}</td>
                                    <td className="border border-black p-2">{conflict.parties || '-'}</td>
                                    <td className="border border-black p-2">
                                        <div className="font-bold text-primary italic underline mb-1">{conflict.type}</div>
                                        <div className="leading-normal">{conflict.description}</div>
                                        {conflict.impact && (
                                            <div className="mt-2 pt-2 border-t border-slate-100 text-slate-500 italic">
                                                <span className="font-bold text-[8px]">IMPACT:</span> {conflict.impact}
                                            </div>
                                        )}
                                    </td>
                                    <td className="border border-black p-2 font-bold uppercase text-center text-[8px]">{conflict.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <footer className="mt-8 pt-4 border-t border-slate-200 flex justify-between text-[10px] text-slate-400 italic">
                        <p>Document CNRCT - Système de Gestion Intégré</p>
                        <p>Page {idx + 2}</p>
                    </footer>
                </div>
            ))}

            <footer className="print-only fixed bottom-0 left-0 right-0 p-4 text-center text-[9px] text-slate-400">
                 Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63 | info@cnrct.ci
            </footer>
        </div>,
        document.body
    );
}
