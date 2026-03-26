"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { Mission, MissionParticipant, OrganizationSettings } from "@/lib/data";

interface PrintProps {
    logos: OrganizationSettings;
    onCloseAction: () => void;
}

interface GroupPrintProps extends PrintProps {
    mission: Mission;
}

interface IndividualPrintProps extends PrintProps {
    mission: Mission;
    participant: MissionParticipant;
}

function PrintHeader({ logos }: { logos: OrganizationSettings }) {
    return (
        <header className="flex justify-between items-start mb-8 h-[100px]">
            <div className="w-1/3 text-center flex flex-col justify-center items-center h-full">
                <p className="font-bold text-[10px] leading-tight">Chambre Nationale des Rois et Chefs Traditionnels</p>
                {logos.mainLogoUrl && <img src={logos.mainLogoUrl} alt="Logo Principal" className="max-h-16 max-w-full h-auto w-auto mt-1" />}
                <p className="font-bold text-[10px] mt-1">SECRETARIAT GENERAL</p>
            </div>
            <div className="w-1/3"></div>
            <div className="w-1/3 text-center flex flex-col justify-center items-center h-full">
                <p className="font-bold text-[10px] whitespace-nowrap">République de Côte d'Ivoire</p>
                {logos.secondaryLogoUrl && <img src={logos.secondaryLogoUrl} alt="Logo Secondaire" className="max-h-12 max-w-full h-auto w-auto my-1" />}
                <p className="text-[8px]">Union - Discipline - Travail</p>
            </div>
        </header>
    );
}

function PrintFooter() {
    return (
        <footer className="mt-12 text-[10px] border-t pt-4">
            <div className="flex justify-between items-end">
                <div className="text-center w-full">
                    <p>Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63</p>
                    <p>www.cnrct.ci - Email : info@cnrct.ci</p>
                </div>
            </div>
        </footer>
    );
}

export function GroupMissionRequestPrint({ mission, logos, onCloseAction }: GroupPrintProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => {
            window.print();
            onCloseAction();
        }, 500);
        return () => {
            setMounted(false);
            clearTimeout(timer);
        };
    }, [onCloseAction]);

    if (!mounted) return null;

    const totalBudget = mission.participants?.reduce((sum, p) => 
        sum + (p.coutTransport || 0) + (p.coutHebergement || 0) + (p.totalIndemnites || 0), 0
    ) || 0;

    return createPortal(
        <div id="print-section" className="bg-white text-black p-10 w-full min-h-screen">
            <PrintHeader logos={logos} />

            <div className="text-center my-8">
                <h1 className="text-xl font-black underline uppercase">DEMANDE DE MISSION N° {mission.numeroMission}</h1>
                <p className="mt-2 text-md font-bold uppercase">{mission.title}</p>
            </div>

            <div className="space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p><span className="font-bold">Destination :</span> {mission.lieuMission || "Non spécifié"}</p>
                        <p><span className="font-bold">Période :</span> du {format(parseISO(mission.startDate), "dd/MM/yyyy")} au {format(parseISO(mission.endDate), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="text-right">
                        <p><span className="font-bold">Date :</span> {format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                    </div>
                </div>

                <div>
                    <h3 className="font-black uppercase underline mb-2">OBJET DE LA MISSION</h3>
                    <p className="text-justify leading-relaxed">{mission.description || "Sans description."}</p>
                </div>

                <div>
                    <h3 className="font-black uppercase underline mb-2">PARTICIPANTS ET ETAT FINANCIER</h3>
                    <table className="w-full border-collapse border border-black text-[11px]">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-black p-2 text-left">NOM ET PRENOMS</th>
                                <th className="border border-black p-2 text-center">N° ORDRE</th>
                                <th className="border border-black p-2 text-center">TRANSPORT</th>
                                <th className="border border-black p-2 text-center">HEBERGEMENT</th>
                                <th className="border border-black p-2 text-center">INDEMNITES</th>
                                <th className="border border-black p-2 text-right">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mission.participants?.map((p, i) => (
                                <tr key={i}>
                                    <td className="border border-black p-2">{p.employeeName}</td>
                                    <td className="border border-black p-2 text-center">{p.numeroOrdre || "-"}</td>
                                    <td className="border border-black p-2 text-center">{p.coutTransport?.toLocaleString()} F</td>
                                    <td className="border border-black p-2 text-center">{p.coutHebergement?.toLocaleString()} F</td>
                                    <td className="border border-black p-2 text-center">{p.totalIndemnites?.toLocaleString()} F</td>
                                    <td className="border border-black p-2 text-right font-bold">
                                        {((p.coutTransport || 0) + (p.coutHebergement || 0) + (p.totalIndemnites || 0)).toLocaleString()} F
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-gray-50 text-md">
                                <td colSpan={5} className="border border-black p-2 text-right uppercase">Total Général</td>
                                <td className="border border-black p-2 text-right">{totalBudget.toLocaleString()} F</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-20">
                    <div className="text-center">
                        <p className="font-bold underline uppercase">L'Administrateur</p>
                        <div className="h-24"></div>
                    </div>
                    <div className="text-center">
                        <p className="font-bold underline uppercase">Le Secrétaire Général</p>
                        <div className="h-24"></div>
                    </div>
                </div>
            </div>

            <PrintFooter />
        </div>,
        document.body
    );
}

export function IndividualMissionSlipPrint({ mission, participant, logos, onCloseAction }: IndividualPrintProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => {
            window.print();
            onCloseAction();
        }, 500);
        return () => {
            setMounted(false);
            clearTimeout(timer);
        };
    }, [onCloseAction]);

    if (!mounted) return null;

    const totalIndiv = (participant.coutTransport || 0) + (participant.coutHebergement || 0) + (participant.totalIndemnites || 0);

    return createPortal(
        <div id="print-section" className="bg-white text-black p-10 w-full min-h-screen">
            <PrintHeader logos={logos} />

            <div className="text-center my-10 border-2 border-black p-4">
                <h1 className="text-2xl font-black uppercase tracking-widest">ORDRE DE MISSION</h1>
                <p className="text-lg font-bold mt-1">N° {participant.numeroOrdre || "__________"}</p>
            </div>

            <div className="space-y-10 text-sm mt-8">
                <div className="space-y-4">
                    <p className="flex items-center gap-4">
                        <span className="font-bold w-48 uppercase">Objet de la Mission :</span>
                        <span className="border-b border-dotted border-black flex-1 font-bold">{mission.title}</span>
                    </p>
                    <p className="flex items-center gap-4">
                        <span className="font-bold w-48 uppercase">Nom et Prénoms :</span>
                        <span className="border-b border-dotted border-black flex-1 text-lg font-black">{participant.employeeName}</span>
                    </p>
                    <p className="flex items-center gap-4">
                        <span className="font-bold w-48 uppercase">Destination :</span>
                        <span className="border-b border-dotted border-black flex-1">{mission.lieuMission || "Non spécifié"}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <p className="flex items-center gap-4">
                            <span className="font-bold w-48 uppercase">Date de départ :</span>
                            <span className="border-b border-dotted border-black flex-1">{format(parseISO(mission.startDate), "dd MMMM yyyy", { locale: fr })}</span>
                        </p>
                        <p className="flex items-center gap-4">
                            <span className="font-bold uppercase">Date de retour :</span>
                            <span className="border-b border-dotted border-black flex-1">{format(parseISO(mission.endDate), "dd MMMM yyyy", { locale: fr })}</span>
                        </p>
                    </div>
                    <p className="flex items-center gap-4">
                        <span className="font-bold w-48 uppercase">Moyen de transport :</span>
                        <span className="border-b border-dotted border-black flex-1">{participant.moyenTransport} {participant.immatriculation ? `(${participant.immatriculation})` : ""}</span>
                    </p>
                </div>

                <div className="border border-black p-4 bg-gray-50">
                    <h3 className="font-black uppercase text-center underline mb-4">DETAILS FINANCIERS</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-[10px] font-bold uppercase">Transport</p>
                            <p className="text-md border-b border-black py-1">{participant.coutTransport?.toLocaleString()} F</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase">Hébergement</p>
                            <p className="text-md border-b border-black py-1">{participant.coutHebergement?.toLocaleString()} F</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase">Indemnités</p>
                            <p className="text-md border-b border-black py-1">{participant.totalIndemnites?.toLocaleString()} F</p>
                        </div>
                    </div>
                    <p className="text-right mt-4 text-lg font-black uppercase">TOTAL : {totalIndiv.toLocaleString()} F CFA</p>
                </div>

                <div>
                    <p className="text-right italic">Fait à Yamoussoukro, le {format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-20">
                    <div className="text-center">
                        <p className="font-bold underline uppercase">Cachet et Signature</p>
                        <p className="text-[10px] uppercase mt-1">Départ de l'Administration</p>
                        <div className="h-32 border border-dashed border-gray-300 mt-2"></div>
                    </div>
                    <div className="text-center">
                        <p className="font-bold underline uppercase">Le Secrétaire Général</p>
                        <p className="text-[10px] uppercase mt-1">P.O L'Administrateur</p>
                        <div className="h-32 border border-dashed border-gray-300 mt-2"></div>
                    </div>
                </div>
            </div>

            <PrintFooter />
        </div>,
        document.body
    );
}
