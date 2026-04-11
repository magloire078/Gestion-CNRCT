import { InstitutionalHeader } from "../reports/institutional-header";
import { InstitutionalFooter } from "../reports/institutional-footer";
import { InstitutionalReportWrapper } from "../reports/institutional-report-wrapper";
import { OrganizationSettings, Conflict } from "@/types/common";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PrintConflictsListProps {
    conflicts: Conflict[];
    organizationSettings: OrganizationSettings | null;
    subtitle?: string;
}

export function PrintConflictsList({ conflicts, organizationSettings, subtitle }: PrintConflictsListProps) {
    return (
        <InstitutionalReportWrapper isPrinting={true}>
            <div className="bg-white p-4">
                <InstitutionalHeader 
                    title="ÉTAT RÉCAPITULATIF DES CONFLITS ET PLAINTES"
                    period={subtitle || "Toutes Régions / Tous Types"}
                />

                <div className="mt-8">
                    <table className="w-full text-[10px] border-collapse border-2 border-black">
                        <thead>
                            <tr className="bg-slate-900 text-white uppercase font-black text-center border-b-2 border-black">
                                <th className="border border-slate-700 py-3 px-1 w-10">N°</th>
                                <th className="border border-slate-700 py-3 px-1 w-24">Date Sign.</th>
                                <th className="border border-slate-700 py-3 px-1">Localité / Région</th>
                                <th className="border border-slate-700 py-3 px-1">Nature & Description</th>
                                <th className="border border-slate-700 py-3 px-1">Parties Impliquées</th>
                                <th className="border border-slate-700 py-3 px-1">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conflicts.map((conflict, idx) => (
                                <tr key={conflict.id} className="align-top border-b border-slate-300">
                                    <td className="border border-slate-300 py-2 px-1 text-center font-bold">{idx + 1}</td>
                                    <td className="border border-slate-300 py-2 px-1 text-center font-mono">
                                        {format(parseISO(conflict.reportedDate), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="border border-slate-300 py-2 px-1">
                                        <div className="font-black text-xs">{conflict.village}</div>
                                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter italic">{conflict.region || "-"}</div>
                                    </td>
                                    <td className="border border-slate-300 py-2 px-2 text-justify">
                                        <span className="font-black text-primary mr-1">[{conflict.type}]</span>
                                        <span className="leading-tight">{conflict.description}</span>
                                    </td>
                                    <td className="border border-slate-300 py-2 px-2 italic text-slate-600">
                                        {conflict.parties || "-"}
                                    </td>
                                    <td className="border border-slate-300 py-2 px-1 text-center">
                                        <span className={cn(
                                            "inline-block px-2 py-1 rounded text-[9px] font-black uppercase",
                                            conflict.status === 'Résolu' ? "bg-emerald-100 text-emerald-800" :
                                            conflict.status === 'En médiation' ? "bg-blue-100 text-blue-800" : "bg-rose-100 text-rose-800 border border-rose-200"
                                        )}>
                                            {conflict.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-12">
                    <InstitutionalFooter 
                        showSignatures={true}
                        leftSignatureTitle="LE MÉDIATEUR RÉGIONAL"
                        rightSignatureTitle="LE SECRÉTAIRE GÉNÉRAL"
                    />
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}

interface PrintConflictDetailProps {
    conflict: Conflict;
    organizationSettings: OrganizationSettings | null;
}

export function PrintConflictDetail({ conflict, organizationSettings }: PrintConflictDetailProps) {
    return (
        <InstitutionalReportWrapper isPrinting={true}>
            <div className="bg-white p-4">
                <InstitutionalHeader 
                    title={`FICHE DE SUIVI DE CONFLIT`}
                    period={`RÉFÉRENCE : #${conflict.id.substring(0, 8).toUpperCase()}`}
                />

                <div className="mt-8 space-y-8 text-sm">
                    {/* Identification Section */}
                    <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 border-2 border-black rounded-xl">
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Localisation</h4>
                                <p className="font-black text-lg text-slate-900">{conflict.village}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase">{conflict.region || "-"}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nature du Conflit</h4>
                                <p className="text-sm font-black bg-white px-3 py-1 border border-slate-200 rounded inline-block">{conflict.type}</p>
                            </div>
                        </div>
                        <div className="space-y-3 border-l border-slate-200 pl-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signalement</h4>
                                    <p className="font-mono text-sm">{format(parseISO(conflict.reportedDate), 'dd/MM/yyyy')}</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Incident</h4>
                                    <p className="font-mono text-sm">{conflict.incidentDate ? format(parseISO(conflict.incidentDate), 'dd/MM/yyyy') : "N/A"}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Statut Actuel</h4>
                                <p className="text-sm font-black uppercase underline decoration-double">{conflict.status}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        <div>
                            <h3 className="bg-slate-900 text-white px-4 py-2 font-black border-l-4 border-primary uppercase text-xs">I. Résumé Détaillé des Faits</h3>
                            <div className="mt-4 text-justify leading-relaxed p-6 border-2 border-black bg-white min-h-[150px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                {conflict.description}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="bg-slate-900 text-white px-4 py-2 font-black border-l-4 border-primary uppercase text-xs">II. Acteurs & Parties</h3>
                                <div className="mt-4 p-4 border-2 border-black italic text-slate-700 min-h-[80px]">
                                    {conflict.parties || "Non identifiés précisément dans ce dossier."}
                                </div>
                            </div>
                            <div>
                                <h3 className="bg-slate-900 text-white px-4 py-2 font-black border-l-4 border-primary uppercase text-xs">III. Impacts Identifiés</h3>
                                <div className="mt-4 p-4 border-2 border-black text-slate-700 min-h-[80px]">
                                    {conflict.impact || "Impact non encore évalué par le médiateur."}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="bg-slate-900 text-white px-4 py-2 font-black border-l-4 border-primary uppercase text-xs">IV. Rapport de Médiation & Résolution</h3>
                            <div className="mt-4 border-2 border-black overflow-hidden bg-white">
                                {conflict.status === 'Résolu' ? (
                                    <div className="p-6 bg-emerald-50">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="font-black text-emerald-900 uppercase text-[10px] tracking-widest">Dossier Résolu le {conflict.resolutionDate ? format(parseISO(conflict.resolutionDate), 'dd MMMM yyyy', { locale: fr }) : "date non précisée"}</p>
                                        </div>
                                        <p className="text-sm italic text-emerald-800 leading-relaxed text-justify px-4 py-2 border-l-2 border-emerald-200">
                                            {conflict.resolutionDetails || "Note de résolution : Le litige a été clos suite à une médiation réussie."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-16 text-center text-slate-300 font-black uppercase tracking-[0.5em] text-xs opacity-50 italic">
                                        Espace réservé au rapport de clôture
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="bg-slate-900 text-white px-4 py-2 font-black border-l-4 border-primary uppercase text-xs">V. Journal des Événements</h3>
                            <div className="mt-4 space-y-4">
                                {(conflict.comments || []).slice(0, 5).map((comment, idx) => (
                                    <div key={idx} className="flex gap-4 items-start border-b border-slate-100 pb-3 last:border-0 italic">
                                        <span className="text-[10px] font-black font-mono text-slate-400 pt-1">
                                            {format(parseISO(comment.date), 'dd/MM/yyyy')}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-900 mb-1">{comment.author}</p>
                                            <p className="text-[11px] text-slate-600 leading-tight">"{comment.content}"</p>
                                        </div>
                                    </div>
                                ))}
                                {(!conflict.comments || conflict.comments.length === 0) && (
                                    <p className="text-xs text-slate-400 italic text-center py-4">Aucune note historique disponible.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12">
                        <InstitutionalFooter 
                            showSignatures={true}
                            leftSignatureTitle="LE MÉDIATEUR EN CHARGE"
                            rightSignatureTitle="LE SECRÉTAIRE GÉNÉRAL"
                        />
                    </div>
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
           </div>
        </PrintLayout>
    );
}
