
"use client";

import type { Mission, Employe } from "@/lib/data";
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ParticipantWithDetails extends Employe {
    moyenTransport?: string;
    immatriculation?: string;
    numeroOrdre?: string;
    coutTransport?: number;
    coutHebergement?: number;
    totalIndemnites?: number;
}

interface MissionCostReportProps {
    mission: Mission;
    participants: ParticipantWithDetails[];
    duration: number;
    totalCost: number;
}

const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '0';
    return value.toLocaleString('fr-FR');
}

export function MissionCostReport({ mission, participants, duration, totalCost }: MissionCostReportProps) {
    const today = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    return (
        <div className="bg-white text-black p-8 font-arial w-full print:shadow-none print:border-none print:p-0">
            <header className="flex justify-between items-center pb-4 border-b-2 border-black">
                <div className="w-1/4">
                    {/* Placeholder for a logo if available */}
                </div>
                <div className="text-center">
                    <h1 className="font-bold text-lg">ETAT DES FRAIS DE MISSION</h1>
                    <h2 className="text-md">Mission N° {mission.numeroMission}</h2>
                </div>
                <div className="w-1/4 text-right">
                    <p className="text-sm">Date d'édition: {today}</p>
                </div>
            </header>

            <section className="my-6">
                <h3 className="font-bold text-md underline mb-2">Détails de la mission</h3>
                <p><span className="font-bold inline-block w-32">Objet :</span> {mission.title}</p>
                <p><span className="font-bold inline-block w-32">Lieu :</span> {mission.lieuMission}</p>
                <p><span className="font-bold inline-block w-32">Période :</span> du {format(parseISO(mission.startDate), 'dd/MM/yyyy')} au {format(parseISO(mission.endDate), 'dd/MM/yyyy')} ({duration} jours)</p>
            </section>
            
            <section>
                 <table className="w-full text-sm border-collapse border border-black">
                    <thead className="bg-gray-200 text-center">
                        <tr>
                            <th className="border border-black p-1">N°</th>
                            <th className="border border-black p-1">NOM & PRENOMS</th>
                            <th className="border border-black p-1">FONCTION</th>
                            <th className="border border-black p-1">INDEMNITÉS</th>
                            <th className="border border-black p-1">TRANSPORT</th>
                            <th className="border border-black p-1">HEBERGEMENT</th>
                            <th className="border border-black p-1">TOTAL</th>
                            <th className="border border-black p-1">EMARGEMENT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((p, index) => {
                            const totalParticipant = (p.totalIndemnites || 0) + (p.coutTransport || 0) + (p.coutHebergement || 0);
                            return (
                                <tr key={p.id}>
                                    <td className="border border-black p-1 text-center">{index + 1}</td>
                                    <td className="border border-black p-1">{`${p.lastName || ''} ${p.firstName || ''}`.trim()}</td>
                                    <td className="border border-black p-1">{p.poste}</td>
                                    <td className="border border-black p-1 text-right">{formatCurrency(p.totalIndemnites)}</td>
                                    <td className="border border-black p-1 text-right">{formatCurrency(p.coutTransport)}</td>
                                    <td className="border border-black p-1 text-right">{formatCurrency(p.coutHebergement)}</td>
                                    <td className="border border-black p-1 text-right font-bold">{formatCurrency(totalParticipant)}</td>
                                    <td className="border border-black p-1 h-12"></td>
                                </tr>
                            )
                        })}
                        <tr className="font-bold bg-gray-100">
                           <td colSpan={6} className="text-right p-2 border-black border">TOTAL GÉNÉRAL</td>
                           <td className="text-right p-2 border-black border">{formatCurrency(totalCost)}</td>
                           <td className="border-black border"></td>
                        </tr>
                    </tbody>
                </table>
            </section>
            
            <footer className="mt-12 flex justify-between text-center text-sm">
                <div>
                    <p className="font-bold">Le Chef de Mission</p>
                </div>
                 <div>
                    <p className="font-bold">Le Service Financier</p>
                </div>
                 <div>
                    <p className="font-bold">La Direction</p>
                </div>
            </footer>
        </div>
    )
}
