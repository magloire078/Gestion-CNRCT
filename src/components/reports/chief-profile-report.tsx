import React from "react";
import { Chief } from "@/types/chief";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalCover } from "./institutional-cover";

interface ChiefProfileReportProps {
    chief: Chief;
    isPrinting: boolean;
    onAfterPrint: () => void;
}

export const ChiefProfileReport: React.FC<ChiefProfileReportProps> = ({ chief, isPrinting, onAfterPrint }) => {
    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting}
            onAfterPrint={onAfterPrint}
            orientation="portrait"
        >
            <InstitutionalHeader />
            <InstitutionalCover 
                title={`Fiche d'Autorité : ${chief.name}`}
                subtitle={`${chief.role} - ${chief.village || chief.subPrefecture}`}
            />
            <div className="space-y-6 px-16 pb-16">
                {/* Identification de l'Autorité */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3">
                        I. Identification Officielle
                    </h3>
                    <table className="w-full text-xs text-left border-collapse border border-slate-800 mb-2">
                        <tbody>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Nom Complet</th>
                                <td className="border border-slate-800 px-3 py-2 font-bold">{chief.name}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Matricule CNRCT</th>
                                <td className="border border-slate-800 px-3 py-2 font-mono font-bold">{chief.CNRCTRegistrationNumber || "N/A"}</td>
                            </tr>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Prénoms & Nom</th>
                                <td className="border border-slate-800 px-3 py-2">{chief.firstName} {chief.lastName}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Statut</th>
                                <td className="border border-slate-800 px-3 py-2 font-bold uppercase">{chief.status === 'actif' ? "En Exercice" : chief.status === 'archive' ? "Archivé" : chief.status === 'a_vie' ? "À Vie" : chief.status || "Inconnu"}</td>
                            </tr>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Titre Traditionnel</th>
                                <td className="border border-slate-800 px-3 py-2">{chief.title || chief.role}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Catégorie (Grade)</th>
                                <td className="border border-slate-800 px-3 py-2">{chief.role}</td>
                            </tr>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Points de Mérite</th>
                                <td className="border border-slate-800 px-3 py-2" colSpan={3}>{chief.meritPoints || 0} pts</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Localisation et Compétence Territoriale */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3 mt-4">
                        II. Compétence Territoriale
                    </h3>
                    <table className="w-full text-xs text-left border-collapse border border-slate-800 mb-2">
                        <tbody>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Localité / Siège</th>
                                <td className="border border-slate-800 px-3 py-2 font-bold">{chief.village || "Non spécifié"}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Sous-Préfecture</th>
                                <td className="border border-slate-800 px-3 py-2">{chief.subPrefecture}</td>
                            </tr>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Département</th>
                                <td className="border border-slate-800 px-3 py-2">{chief.department}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Région</th>
                                <td className="border border-slate-800 px-3 py-2">{chief.region}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Historique et Mandat */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3 mt-4">
                        III. Mandat et Historique
                    </h3>
                    <table className="w-full text-xs text-left border-collapse border border-slate-800 mb-2">
                        <tbody>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Date de Nomination</th>
                                <td className="border border-slate-800 px-3 py-2">{chief.designationDate ? format(new Date(chief.designationDate), "dd MMMM yyyy", { locale: fr }) : "N/D"}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Date de Naissance</th>
                                <td className="border border-slate-800 px-3 py-2">{chief.dateOfBirth ? format(new Date(chief.dateOfBirth), "dd/MM/yyyy") : "N/D"}</td>
                            </tr>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Mode de Désignation</th>
                                <td className="border border-slate-800 px-3 py-2" colSpan={3}>{chief.designationMode || "Héritage (Coutumier)"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Contacts et Documents */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3 mt-4">
                        IV. Coordonnées & Arrêtés
                    </h3>
                    <table className="w-full text-xs text-left border-collapse border border-slate-800 mb-2">
                        <tbody>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Téléphone / Contact</th>
                                <td className="border border-slate-800 px-3 py-2">{chief.phone || chief.contact || "N/D"}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Documents Officiels</th>
                                <td className="border border-slate-800 px-3 py-2 font-mono">{chief.officialDocuments || "Néant / Non communiqué"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Informations de Registre */}
                <div className="mt-8 pt-4 border-t border-slate-200">
                    <p className="text-[10px] text-slate-500 italic text-center">
                        Extrait du registre numérique des autorités traditionnelles de Côte d'Ivoire.<br/>
                        Document généré électroniquement par le système central du CNRCT le {format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}.
                    </p>
                </div>
                <InstitutionalFooter />
            </div>
        </InstitutionalReportWrapper>
    );
};
