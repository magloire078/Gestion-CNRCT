import React from "react";
import { Village } from "@/types/village";
import { Chief } from "@/types/chief";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalCover } from "./institutional-cover";

interface VillageProfileReportProps {
    village: Village;
    currentChief: Chief | null;
    isPrinting: boolean;
    onAfterPrint: () => void;
}

export const VillageProfileReport: React.FC<VillageProfileReportProps> = ({ village, currentChief, isPrinting, onAfterPrint }) => {
    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting}
            onAfterPrint={onAfterPrint}
            orientation="portrait"
        >
            <InstitutionalHeader />
            <InstitutionalCover 
                title={`Fiche Monographique : ${village.name}`}
                subtitle={`${village.region} - ${village.department} - ${village.subPrefecture}`}
            />
            <div className="space-y-6 px-16 pb-16">
                {/* Informations Administratives */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3">
                        I. Identification Administrative
                    </h3>
                    <table className="w-full text-xs text-left border-collapse border border-slate-800 mb-2">
                        <tbody>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Nom de la Localité</th>
                                <td className="border border-slate-800 px-3 py-2 font-bold">{village.name}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Code INS</th>
                                <td className="border border-slate-800 px-3 py-2">{village.codeINS || "Non renseigné"}</td>
                            </tr>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Région</th>
                                <td className="border border-slate-800 px-3 py-2">{village.region}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Département</th>
                                <td className="border border-slate-800 px-3 py-2">{village.department}</td>
                            </tr>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Sous-Préfecture</th>
                                <td className="border border-slate-800 px-3 py-2">{village.subPrefecture}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Commune</th>
                                <td className="border border-slate-800 px-3 py-2">{village.commune || village.subPrefecture}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Coordonnées Géographiques */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3">
                        II. Données Géographiques
                    </h3>
                    <table className="w-full text-xs text-left border-collapse border border-slate-800 mb-2">
                        <tbody>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Latitude (N)</th>
                                <td className="border border-slate-800 px-3 py-2">{village.latitude ? village.latitude.toFixed(6) : "N/D"}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Longitude (W)</th>
                                <td className="border border-slate-800 px-3 py-2">{village.longitude ? village.longitude.toFixed(6) : "N/D"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Démographie et Économie */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3">
                        III. Démographie & Activités
                    </h3>
                    <table className="w-full text-xs text-left border-collapse border border-slate-800 mb-2">
                        <tbody>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Population</th>
                                <td className="border border-slate-800 px-3 py-2">{village.population ? `${village.population.toLocaleString()} habitants (${village.populationYear || "2024"})` : "N/D"}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Nb. de Ménages</th>
                                <td className="border border-slate-800 px-3 py-2">{village.numberOfHouseholds || "N/D"}</td>
                            </tr>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Groupes Ethniques</th>
                                <td className="border border-slate-800 px-3 py-2" colSpan={3}>{village.mainEthnicGroups?.join(", ") || "Non spécifié"}</td>
                            </tr>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Activités Principales</th>
                                <td className="border border-slate-800 px-3 py-2" colSpan={3}>{village.mainActivities?.join(", ") || "Non spécifié"}</td>
                            </tr>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Cultures Majeures</th>
                                <td className="border border-slate-800 px-3 py-2" colSpan={3}>{village.mainCrops?.join(", ") || "Non spécifié"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Infrastructures */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3">
                        IV. Équipements & Infrastructures
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <ul className="space-y-1">
                            <li><strong>École Primaire :</strong> {village.hasSchool ? "Oui" : "Non"}</li>
                            <li><strong>Centre de Santé :</strong> {village.hasHealthCenter ? "Oui" : "Non"}</li>
                            <li><strong>Électricité (CIE) :</strong> {village.hasElectricity ? "Oui" : "Non"}</li>
                        </ul>
                        <ul className="space-y-1">
                            <li><strong>Eau Potable (SODECI/Pompe) :</strong> {village.hasWater ? "Oui" : "Non"}</li>
                            <li><strong>Marché Couvert :</strong> {village.hasMarket ? "Oui" : "Non"}</li>
                            <li><strong>Lieu de Culte :</strong> {(village.hasMosque || village.hasChurch) ? "Oui" : "Non"}</li>
                        </ul>
                    </div>
                </div>

                {/* Chefferie */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3 mt-4">
                        V. Autorité Traditionnelle
                    </h3>
                    <table className="w-full text-xs text-left border-collapse border border-slate-800 mb-2">
                        <tbody>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Statut Actuel</th>
                                <td className="border border-slate-800 px-3 py-2 font-bold">{currentChief ? "Trône pourvu" : "Vacance du trône"}</td>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2 w-1/4">Titre</th>
                                <td className="border border-slate-800 px-3 py-2">{village.chiefTitle || "Chef de Village"}</td>
                            </tr>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Chef en Exercice</th>
                                <td className="border border-slate-800 px-3 py-2" colSpan={3}>
                                    {currentChief ? `${currentChief.name} (Matricule: ${currentChief.CNRCTRegistrationNumber || "N/A"})` : "Néant"}
                                </td>
                            </tr>
                            <tr>
                                <th className="border border-slate-800 bg-slate-100 px-3 py-2">Mode de Succession</th>
                                <td className="border border-slate-800 px-3 py-2" colSpan={3}>{village.successionMode || village.chieftaincyType || "Coutumier"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <InstitutionalFooter />
            </div>
        </InstitutionalReportWrapper>
    );
};
