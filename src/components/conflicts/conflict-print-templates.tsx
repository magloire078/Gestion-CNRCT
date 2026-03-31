"use client";

import { PrintLayout } from "@/components/reports/print-layout";
import { OrganizationSettings, Conflict } from "@/types/common";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface PrintConflictsListProps {
    conflicts: Conflict[];
    organizationSettings: OrganizationSettings | null;
    subtitle?: string;
}

export function PrintConflictsList({ conflicts, organizationSettings, subtitle }: PrintConflictsListProps) {
    return (
        <PrintLayout 
            title="État Récapitulatif des Conflits et Plaintes"
            logos={organizationSettings}
            subtitle={subtitle}
        >
            <div className="space-y-4">
                <table className="w-full text-[10px] border-collapse border border-black">
                    <thead>
                        <tr className="bg-slate-100 text-black uppercase font-bold text-center">
                            <th className="border border-black py-2 px-1 w-8">N°</th>
                            <th className="border border-black py-2 px-1">Date</th>
                            <th className="border border-black py-2 px-1">Localité / Région</th>
                            <th className="border border-black py-2 px-1">Nature du Conflit</th>
                            <th className="border border-black py-2 px-1">Parties Impliquées</th>
                            <th className="border border-black py-2 px-1">Médiateur</th>
                            <th className="border border-black py-2 px-1">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {conflicts.map((conflict, idx) => (
                            <tr key={conflict.id} className="align-top">
                                <td className="border border-black py-1 px-1 text-center font-bold">{idx + 1}</td>
                                <td className="border border-black py-1 px-1 text-center whitespace-nowrap">
                                    {conflict.reportedDate}
                                </td>
                                <td className="border border-black py-1 px-1">
                                    <div className="font-bold">{conflict.village}</div>
                                    <div className="text-[8px] text-slate-500 italic">{conflict.region || "-"}</div>
                                </td>
                                <td className="border border-black py-1 px-1">
                                    <span className="font-bold">[{conflict.type}]</span> {conflict.description}
                                </td>
                                <td className="border border-black py-1 px-1 italic">
                                    {conflict.parties || "-"}
                                </td>
                                <td className="border border-black py-1 px-1 text-center">
                                    {conflict.mediatorName || "Non défini"}
                                </td>
                                <td className="border border-black py-1 px-1 text-center font-bold uppercase">
                                    {conflict.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-12 pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                    <p className="font-bold underline mb-16 uppercase">L'Administrateur du Siège</p>
                    <div className="h-10"></div>
                </div>
                <div>
                    <p className="font-bold underline mb-16 uppercase">Le Secrétaire Général</p>
                    <div className="h-10"></div>
                </div>
            </div>
        </PrintLayout>
    );
}

interface PrintConflictDetailProps {
    conflict: Conflict;
    organizationSettings: OrganizationSettings | null;
}

export function PrintConflictDetail({ conflict, organizationSettings }: PrintConflictDetailProps) {
    return (
        <PrintLayout 
            title={`Fiche de Suivi de Conflit`}
            logos={organizationSettings}
            subtitle={`Référence : #${conflict.id.substring(0, 8).toUpperCase()}`}
            orientation="portrait"
        >
            <div className="space-y-8 text-sm">
                <div className="grid grid-cols-2 gap-8 border-b border-black pb-4">
                    <div className="space-y-1">
                        <p><span className="font-bold uppercase w-32 inline-block">Localité :</span> {conflict.village}</p>
                        <p><span className="font-bold uppercase w-32 inline-block">Région :</span> {conflict.region || "-"}</p>
                    </div>
                    <div className="space-y-1">
                        <p><span className="font-bold uppercase w-32 inline-block">Date Signalement :</span> {conflict.reportedDate}</p>
                        <p><span className="font-bold uppercase w-32 inline-block">Date Incident :</span> {conflict.incidentDate || "Non précisée"}</p>
                        <p><span className="font-bold uppercase w-32 inline-block">Nature :</span> {conflict.type}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="bg-slate-100 p-2 font-black border-l-4 border-black uppercase text-xs">I. Résumé des Faits</h3>
                        <p className="mt-2 text-justify leading-relaxed p-2 border border-slate-200 rounded min-h-[100px]">
                            {conflict.description}
                        </p>
                    </div>

                    <div>
                        <h3 className="bg-slate-100 p-2 font-black border-l-4 border-black uppercase text-xs">II. Parties Impliquées et Impact</h3>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="p-2 border border-slate-200 rounded">
                                <p className="font-bold text-[10px] uppercase text-slate-500 mb-1">Acteurs en Conflit</p>
                                <p className="italic">{conflict.parties || "Non identifiés"}</p>
                            </div>
                            <div className="p-2 border border-slate-200 rounded">
                                <p className="font-bold text-[10px] uppercase text-slate-500 mb-1">Impacts / Conséquences</p>
                                <p>{conflict.impact || "Non précisé"}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="bg-slate-100 p-2 font-black border-l-4 border-black uppercase text-xs">III. Identité du Plaignant</h3>
                        <div className="p-3 border border-slate-200 rounded mt-2">
                            {conflict.isAnonymous ? (
                                <p className="font-bold text-red-600 uppercase tracking-widest text-center">Dossier Anonyme - Identité Protégée (MGP Standard)</p>
                            ) : (
                                <p className="italic text-slate-600">Identité révélée dans les pièces jointes au dossier.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="bg-slate-100 p-2 font-black border-l-4 border-black uppercase text-xs">IV. Suivi et Résolution</h3>
                        <div className="mt-2 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <p><span className="font-bold text-xs uppercase">Médiateur en charge :</span> {conflict.mediatorName || "Non assigné"}</p>
                                <p><span className="font-bold text-xs uppercase">Statut actuel :</span> <span className="underline decoration-double uppercase">{conflict.status}</span></p>
                            </div>
                            
                            {conflict.status === 'Résolu' ? (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="font-bold text-green-900 mb-2 underline uppercase text-xs">Rapport de Résolution au {conflict.resolutionDate || conflict.reportedDate}</p>
                                    <p className="text-sm italic text-green-800 leading-relaxed">
                                        {conflict.resolutionDetails || "Détails non renseignés."}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-10 border border-dashed border-slate-300 rounded text-center text-slate-400">
                                    Espace réservé au rapport de médiation et de clôture.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-between items-start text-center break-inside-avoid bg-white p-2">
                    <div className="w-1/3">
                        <p className="font-bold underline uppercase text-[10px]">Le Médiateur</p>
                        <div className="h-20"></div>
                        <p className="text-[8px] text-slate-400 italic">Signature</p>
                    </div>
                    <div className="w-1/3">
                        <p className="font-bold underline uppercase text-[10px]">Fait à Yamoussoukro, le</p>
                        <p className="font-bold text-xs mt-1">{format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                    </div>
                    <div className="w-1/3">
                        <p className="font-bold underline uppercase text-[10px]">Le Secrétaire Général</p>
                        <div className="h-20"></div>
                        <p className="text-[8px] text-slate-400 italic">Cachet et Signature</p>
                    </div>
                </div>
            </div>
        </PrintLayout>
    );
}
