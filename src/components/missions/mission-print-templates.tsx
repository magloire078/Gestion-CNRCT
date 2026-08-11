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
        <header className="flex justify-between items-start mb-4 h-[100px]">
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
        }, 800);
        return () => {
            setMounted(false);
            clearTimeout(timer);
        };
    }, [onCloseAction]);

    if (!mounted) return null;

    let yearSuffix = "26";
    try {
        if (mission.startDate) {
            yearSuffix = format(parseISO(mission.startDate), "yy");
        }
    } catch (e) {
        yearSuffix = new Date().getFullYear().toString().slice(-2);
    }

    let missionNumber = mission.numeroMission || "117";
    try {
        missionNumber = parseInt(mission.numeroMission).toString();
    } catch (e) {
        // keep as is
    }

    const formatPrintDate = (dateStr: string) => {
        if (!dateStr) return "";
        try {
            const date = parseISO(dateStr);
            let dayStr = format(date, "d", { locale: fr });
            if (dayStr === "1") dayStr = "1er";
            return `${dayStr} ${format(date, "MMMM yyyy", { locale: fr })}`;
        } catch (e) {
            return dateStr;
        }
    };

    const formattedDate = format(new Date(), "d MMMM yyyy", { locale: fr });

    const vehicles = mission.participants?.map(p => {
        if (p.moyenTransport && p.immatriculation) {
            return `${p.moyenTransport} (${p.immatriculation})`;
        }
        return p.moyenTransport;
    }).filter(Boolean) || [];
    const uniqueVehicles = Array.from(new Set(vehicles));
    const vehiclesText = uniqueVehicles.join(", ");

    return createPortal(
        <div id="print-section" className="bg-white text-black p-8 w-[210mm] h-[297mm] max-h-[297mm] mx-auto relative leading-normal overflow-hidden box-border">
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
                {/* Left Header */}
                <div className="flex flex-col items-start">
                    {logos.mainLogoUrl ? (
                        <img src={logos.mainLogoUrl} alt="Logo" className="h-16 w-auto mb-1" />
                    ) : (
                        <div className="h-16" />
                    )}
                    <p className="font-extrabold text-[9px] uppercase tracking-widest text-slate-800 mb-4">UN CHEF NOUVEAU</p>
                    <div className="space-y-0.5 text-[11pt] font-bold text-black">
                        <p>Secrétariat du Président</p>
                        <p className="font-bold">SP/AK/{missionNumber}-{yearSuffix}</p>
                    </div>
                </div>

                {/* Right Date */}
                <div className="text-right text-[11pt] font-semibold text-black mt-2">
                    Yamoussoukro {formattedDate}
                </div>
            </div>

            {/* Title Section */}
            <div className="text-center my-8">
                <h1 className="text-[14pt] font-bold underline uppercase tracking-wider">DEMANDE D’ORDRE DE MISSION{mission.isRegularisation ? " (Régularisation)" : ""}</h1>
            </div>

            {/* Body Section */}
            <div className="space-y-6 text-[11pt] pl-4 pr-4 leading-relaxed text-black">
                <p className="flex items-start">
                    <span className="font-bold underline shrink-0 mr-1.5">Objet :</span>
                    <span className="font-medium flex-1 text-justify">{mission.description || mission.title}</span>
                </p>
                <p>
                    <span className="font-bold underline mr-1.5">Lieu :</span>
                    <span className="font-medium">{mission.lieuMission || "Abidjan"}</span>
                </p>
                <p>
                    <span className="font-bold underline mr-1.5">Départ :</span>
                    <span className="font-medium">{formatPrintDate(mission.startDate)}</span>
                </p>
                <p>
                    <span className="font-bold underline mr-1.5">Retour :</span>
                    <span className="font-medium">{formatPrintDate(mission.endDate)}</span>
                </p>
                <p>
                    <span className="font-bold underline mr-1.5">Véhicule :</span>
                    <span className="font-medium">{vehiclesText || "Véhicule CNRCT"}</span>
                </p>
                <div className="space-y-2">
                    <p className="font-bold underline">Personnes Concernées :</p>
                    <div className="space-y-1 pl-4">
                        {mission.participants?.map((p, i) => (
                            <p key={i} className="font-semibold">{p.employeeName}</p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Print style overrides for absolute A4 sizing and zero margin */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait !important;
                        margin: 0 !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    #print-section {
                        font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif !important;
                        font-size: 11pt !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        padding: 25mm 20mm !important;
                        box-sizing: border-box !important;
                        position: relative !important;
                    }
                }
                #print-section {
                    font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
                }
            `}</style>
        </div>,
        document.body
    );
}

function getDisplayOrderNumber(participant?: MissionParticipant, mission?: Mission, index?: number): string {
    let raw = participant?.numeroOrdre?.trim() || "";
    if (!raw && mission?.numeroMission) {
        raw = mission.numeroMission;
        if (typeof index === 'number' && mission.participants && mission.participants.length > 1) {
            raw = `${mission.numeroMission}-${index + 1}`;
        }
    }
    if (!raw) return "_____";
    // Strip leading "N°" or "n°" if already present
    raw = raw.replace(/^N°\s*/i, '');
    // Strip trailing "/ CNRCT..." if already present
    raw = raw.replace(/\/?\s*CNRCT.*$/i, '').trim();
    return raw || mission?.numeroMission || "_____";
}

export function IndividualMissionSlipPrint({ mission, participant, logos, onCloseAction }: IndividualPrintProps) {
    const [mounted, setMounted] = useState(false);
    const [employee, setEmployee] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => {
            window.print();
            onCloseAction();
        }, 800);

        if (participant.employeeId) {
            import("@/services/employee-service").then(({ getEmployee }) => {
                getEmployee(participant.employeeId!).then(setEmployee).catch(console.error);
            });
        }

        return () => {
            setMounted(false);
            clearTimeout(timer);
        };
    }, [participant.employeeId, onCloseAction]);

    if (!mounted) return null;

    const formatDayDate = (dateStr: string) => {
        if (!dateStr) return "";
        try {
            const date = parseISO(dateStr);
            const formatted = format(date, "EEEE dd MMMM yyyy", { locale: fr });
            return formatted.charAt(0).toUpperCase() + formatted.slice(1);
        } catch (e) {
            return dateStr;
        }
    };

    const civilite = employee?.civilite || (employee?.sexe === "Femme" ? "Madame" : "Monsieur");
    const formattedOrderDate = format(new Date(), "dd MMMM yyyy", { locale: fr });
    const orderNumber = getDisplayOrderNumber(participant, mission);

    return createPortal(
        <div id="print-section" className="bg-white text-black p-8 w-[210mm] h-[297mm] max-h-[297mm] mx-auto relative leading-normal overflow-hidden box-border">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                {/* Left Header */}
                <div className="text-center flex flex-col items-center w-[250px]">
                    <p className="font-bold text-[12pt] leading-tight text-slate-700 text-center">
                        Chambre Nationale des Rois<br />et Chefs Traditionnels
                    </p>
                    {logos.mainLogoUrl ? (
                        <img src={logos.mainLogoUrl} alt="Logo" className="h-16 w-auto my-1.5" />
                    ) : (
                        <div className="h-16" />
                    )}
                    <p className="font-bold text-[13pt] text-black">Le Directoire</p>
                    <p className="text-[10pt] text-slate-400 leading-none">------§§§------</p>
                    <p className="font-bold text-[14pt] text-black font-president">Le Président</p>
                    <p className="text-[10pt] text-slate-400 leading-none">------§§§------</p>
                    <p className="text-[12pt] text-black font-bold mt-1">
                        N° <span className="underline font-black">{orderNumber}</span>/ CNRCT/DIR/PDT.
                    </p>
                </div>

                {/* Right Header */}
                <div className="text-center flex flex-col items-center w-[220px]">
                    <p className="font-bold text-[12pt] text-slate-700">République de Côte d'Ivoire</p>
                    {logos.secondaryLogoUrl ? (
                        <img src={logos.secondaryLogoUrl} alt="Armoiries" className="h-14 w-auto my-1.5" />
                    ) : (
                        <div className="h-14" />
                    )}
                    <p className="text-[10pt] font-bold text-slate-600 italic">Union-Discipline-Travail</p>
                </div>
            </div>

            {/* Date line on the right */}
            <div className="text-right text-[12pt] font-bold text-black mb-3">
                Yamoussoukro, le {formattedOrderDate}
            </div>

            {/* Title Section */}
            <div className="text-center my-4">
                <h1 className="text-xl font-black underline uppercase tracking-wider">ORDRE DE MISSION{mission.isRegularisation ? " (Régularisation)" : ""}</h1>
                <h2 className="text-[13pt] font-bold uppercase tracking-wide mt-1 font-president">LE PRESIDENT DU DIRECTOIRE</h2>
            </div>

            {/* Body Section */}
            <div className="space-y-2 text-[12pt] pl-6 pr-6 leading-relaxed">
                <p className="flex items-start">
                    <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Donne ordre à :</span>
                    <span className="font-medium flex-1">{civilite} {participant.employeeName}</span>
                </p>
                <p className="flex items-start">
                    <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Fonction :</span>
                    <span className="font-medium flex-1">{employee?.poste || "Collaborateur CNRCT"}</span>
                </p>
                <p className="flex items-start">
                    <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">De se rendre à :</span>
                    <span className="font-medium flex-1">{mission.lieuMission || "Non spécifié"}</span>
                </p>
                <p className="flex items-start">
                    <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Objet de la mission :</span>
                    <span className="font-medium flex-1 text-justify">{mission.description || mission.title}</span>
                </p>
                <p className="flex items-start">
                    <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Moyen de transport :</span>
                    <span className="font-medium flex-1">{participant.moyenTransport || "Véhicule CNRCT"}{participant.immatriculation ? ` (N° Immatriculation : ${participant.immatriculation})` : ""}</span>
                </p>
                <p className="flex items-start">
                    <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Date de départ :</span>
                    <span className="font-medium flex-1">{formatDayDate(mission.startDate)}</span>
                </p>
                <p className="flex items-start">
                    <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Date de retour :</span>
                    <span className="font-medium flex-1">{formatDayDate(mission.endDate)}</span>
                </p>
                <p className="flex items-start">
                    <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Imputation budgétaire :</span>
                    <span className="font-medium flex-1">Chambre Nationale des Rois et Chefs Traditionnels</span>
                </p>
            </div>

            {/* Signature Block */}
            <div className="flex justify-end mt-4 pr-6">
                <div className="text-center w-80 space-y-1 font-signature-block">
                    <p className="font-bold text-black">P. Le Président du Directoire et P.O</p>
                    <p className="font-bold text-black">Le Secrétaire Général</p>
                    <div className="h-14"></div>
                    <p className="font-bold text-black underline uppercase">
                        {logos.globalSignatoryName || "FATOGOMA YEO"}
                    </p>
                    <p className="text-slate-700 italic font-medium">
                        {logos.globalSignatoryTitle || "Préfet"}
                    </p>
                </div>
            </div>

            {/* Footer with horizontal line */}
            <div className="absolute bottom-8 left-8 right-8">
                <div className="border-t border-slate-300 w-full mb-3" />
                <div className="text-center text-[10px] text-slate-500 leading-relaxed">
                    <p className="font-bold">Chambre Nationale des Rois et Chefs Traditionnels (CNRCT)</p>
                    <p>Yamoussoukro, Riviera — BP 201 Yamoussoukro   Tél : (225) 30 64 06 60   Fax : (225) 30 64 06 63</p>
                    <p className="text-blue-500 underline text-[10px]">www.cnrct.ci</p>
                </div>
            </div>

            {/* Print style overrides for absolute A4 sizing and zero margin */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait !important;
                        margin: 0 !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    #print-section {
                        font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif !important;
                        font-size: 12pt !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        padding: 20mm !important;
                        box-sizing: border-box !important;
                        position: relative !important;
                    }
                    .font-president {
                        font-family: 'Lucida Handwriting', 'Brush Script MT', 'Comic Sans MS', cursive !important;
                    }
                    .font-signature-block {
                        font-family: Arial, Helvetica, sans-serif !important;
                        font-size: 14pt !important;
                    }
                }
                #print-section {
                    font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
                }
                .font-president {
                    font-family: 'Lucida Handwriting', 'Brush Script MT', 'Comic Sans MS', cursive;
                }
                .font-signature-block {
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 14pt;
                }
            `}</style>
        </div>,
        document.body
    );
}

export function CollectiveMissionOrderPrint({ mission, logos, onCloseAction }: GroupPrintProps) {
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

    return createPortal(
        <div id="print-section" className="bg-white text-black p-6 w-full min-h-screen font-serif">
            <PrintHeader logos={logos} />

            <div className="text-center my-6 border-2 border-black p-3">
                <h1 className="text-xl font-black uppercase tracking-wider">ORDRE DE MISSION COLLECTIF{mission.isRegularisation ? " (Régularisation)" : ""}</h1>
                <p className="text-md font-bold mt-1">N° {mission.numeroMission} /CNRCT/DIR/PDT</p>
            </div>

            <div className="space-y-5 text-sm mt-4">
                <div className="space-y-3">
                    <p className="flex items-start gap-4">
                        <span className="font-bold w-48 uppercase">Objet de la Mission :</span>
                        <span className="border-b border-dotted border-black flex-1 font-bold">{mission.title}</span>
                    </p>
                    <p className="flex items-start gap-4">
                        <span className="font-bold w-48 uppercase">Description :</span>
                        <span className="border-b border-dotted border-black flex-1 text-justify">{mission.description || "Sans description."}</span>
                    </p>
                    <p className="flex items-start gap-4">
                        <span className="font-bold w-48 uppercase">Destination :</span>
                        <span className="border-b border-dotted border-black flex-1">{mission.lieuMission || "Non spécifié"}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <p className="flex items-start gap-4">
                            <span className="font-bold w-48 uppercase">Date de départ :</span>
                            <span className="border-b border-dotted border-black flex-1">{format(parseISO(mission.startDate), "dd MMMM yyyy", { locale: fr })}</span>
                        </p>
                        <p className="flex items-start gap-4">
                            <span className="font-bold uppercase">Date de retour :</span>
                            <span className="border-b border-dotted border-black flex-1">{format(parseISO(mission.endDate), "dd MMMM yyyy", { locale: fr })}</span>
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="font-black uppercase underline mb-2 mt-4">LISTE DES PARTICIPANTS</h3>
                    <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-black p-2 text-center w-12">N°</th>
                            <th className="border border-black p-2 text-left">NOM ET PRENOMS</th>
                            <th className="border border-black p-2 text-left">MOYEN DE TRANSPORT</th>
                            <th className="border border-black p-2 text-center w-36">N° D'ORDRE INDIVIDUEL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mission.participants?.map((p, i) => (
                            <tr key={i}>
                              <td className="border border-black p-2 text-center">{i + 1}</td>
                              <td className="border border-black p-2 font-bold">{p.employeeName}</td>
                              <td className="border border-black p-2">{p.moyenTransport || "Véhicule CNRCT"} {p.immatriculation ? `(${p.immatriculation})` : ""}</td>
                              <td className="border border-black p-2 text-center font-mono">{getDisplayOrderNumber(p, mission, i)}</td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                </div>

                <div>
                    <p className="text-right italic mt-4">Fait à Yamoussoukro, le {format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-20">
                    <div className="text-center">
                        <p className="font-bold underline uppercase">Cachet de l'Administration</p>
                        <div className="h-24 mt-2 border border-dashed border-gray-300"></div>
                    </div>
                    <div className="text-center">
                        <p className="font-bold underline uppercase">Le Secrétaire Général</p>
                        <p className="text-[10pt] uppercase mt-1">P. Le Président du Directoire et P.O</p>
                        <div className="h-24 mt-2 border border-dashed border-gray-300"></div>
                    </div>
                </div>
            </div>
            <PrintFooter />
        </div>,
        document.body
    );
}

export function GroupedIndividualMissionsPrint({ mission, logos, onCloseAction }: GroupPrintProps) {
    const [mounted, setMounted] = useState(false);
    const [employees, setEmployees] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        
        const participantIds = mission.participants?.map(p => p.employeeId).filter((id): id is string => !!id) || [];
        if (participantIds.length === 0) {
            setLoading(false);
            return;
        }

        import("@/services/employee-service").then(({ getEmployee }) => {
            Promise.all(
                participantIds.map(id => 
                    getEmployee(id!)
                        .then(emp => ({ id, emp }))
                        .catch(() => ({ id, emp: null }))
                )
            ).then(results => {
                const map: Record<string, any> = {};
                results.forEach(res => {
                    if (res.emp) map[res.id] = res.emp;
                });
                setEmployees(map);
                setLoading(false);
            });
        });
    }, [mission.participants]);

    useEffect(() => {
        if (!loading && mounted) {
            const timer = setTimeout(() => {
                window.print();
                onCloseAction();
            }, 1200); // 1.2s to guarantee rendering of all elements
            return () => clearTimeout(timer);
        }
    }, [loading, mounted, onCloseAction]);

    if (!mounted || loading) return null;

    const formatDayDate = (dateStr: string) => {
        if (!dateStr) return "";
        try {
            const date = parseISO(dateStr);
            const formatted = format(date, "EEEE dd MMMM yyyy", { locale: fr });
            return formatted.charAt(0).toUpperCase() + formatted.slice(1);
        } catch (e) {
            return dateStr;
        }
    };

    const formattedOrderDate = format(new Date(), "dd MMMM yyyy", { locale: fr });

    return createPortal(
        <div id="print-section">
            {mission.participants?.map((participant, index) => {
                const employee = employees[participant.employeeId || ""];
                const civilite = employee?.civilite || (employee?.sexe === "Femme" ? "Madame" : "Monsieur");
                const orderNumber = getDisplayOrderNumber(participant, mission, index);

                return (
                    <div 
                        key={participant.employeeId || index} 
                        className="bg-white text-black p-8 w-[210mm] h-[297mm] max-h-[297mm] mx-auto relative leading-normal overflow-hidden box-border print-page-break"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            {/* Left Header */}
                            <div className="text-center flex flex-col items-center w-[250px]">
                                <p className="font-bold text-[12pt] leading-tight text-slate-700 text-center">
                                    Chambre Nationale des Rois<br />et Chefs Traditionnels
                                </p>
                                {logos.mainLogoUrl ? (
                                    <img src={logos.mainLogoUrl} alt="Logo" className="h-16 w-auto my-1.5" />
                                ) : (
                                    <div className="h-16" />
                                )}
                                <p className="font-bold text-[13pt] text-black">Le Directoire</p>
                                <p className="text-[10pt] text-slate-400 leading-none">------§§§------</p>
                                <p className="font-bold text-[14pt] text-black font-president">Le Président</p>
                                <p className="text-[10pt] text-slate-400 leading-none">------§§§------</p>
                                <p className="text-[12pt] text-black font-bold mt-1">
                                    N° <span className="underline font-black">{orderNumber}</span>/ CNRCT/DIR/PDT.
                                </p>
                            </div>

                            {/* Right Header */}
                            <div className="text-center flex flex-col items-center w-[220px]">
                                <p className="font-bold text-[12pt] text-slate-700">République de Côte d'Ivoire</p>
                                {logos.secondaryLogoUrl ? (
                                    <img src={logos.secondaryLogoUrl} alt="Armoiries" className="h-14 w-auto my-1.5" />
                                ) : (
                                    <div className="h-14" />
                                )}
                                <p className="text-[10pt] font-bold text-slate-600 italic">Union-Discipline-Travail</p>
                            </div>
                        </div>

                        {/* Date line on the right */}
                        <div className="text-right text-[12pt] font-bold text-black mb-3">
                            Yamoussoukro, le {formattedOrderDate}
                        </div>

                        {/* Title Section */}
                        <div className="text-center my-4">
                            <h1 className="text-xl font-black underline uppercase tracking-wider">ORDRE DE MISSION{mission.isRegularisation ? " (Régularisation)" : ""}</h1>
                            <h2 className="text-[13pt] font-bold uppercase tracking-wide mt-1 font-president">LE PRESIDENT DU DIRECTOIRE</h2>
                        </div>

                        {/* Body Section */}
                        <div className="space-y-2 text-[12pt] pl-6 pr-6 leading-relaxed">
                            <p className="flex items-start">
                                <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Donne ordre à :</span>
                                <span className="font-medium flex-1">{civilite} {participant.employeeName}</span>
                            </p>
                            <p className="flex items-start">
                                <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Fonction :</span>
                                <span className="font-medium flex-1">{employee?.poste || "Collaborateur CNRCT"}</span>
                            </p>
                            <p className="flex items-start">
                                <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">De se rendre à :</span>
                                <span className="font-medium flex-1">{mission.lieuMission || "Non spécifié"}</span>
                            </p>
                            <p className="flex items-start">
                                <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Objet de la mission :</span>
                                <span className="font-medium flex-1 text-justify">{mission.description || mission.title}</span>
                            </p>
                            <p className="flex items-start">
                                <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Moyen de transport :</span>
                                <span className="font-medium flex-1">{participant.moyenTransport || "Véhicule CNRCT"}{participant.immatriculation ? ` (N° Immatriculation : ${participant.immatriculation})` : ""}</span>
                            </p>
                            <p className="flex items-start">
                                <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Date de départ :</span>
                                <span className="font-medium flex-1">{formatDayDate(mission.startDate)}</span>
                            </p>
                            <p className="flex items-start">
                                <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Date de retour :</span>
                                <span className="font-medium flex-1">{formatDayDate(mission.endDate)}</span>
                            </p>
                            <p className="flex items-start">
                                <span className="font-bold w-[195px] shrink-0 whitespace-nowrap">Imputation budgétaire :</span>
                                <span className="font-medium flex-1">Chambre Nationale des Rois et Chefs Traditionnels</span>
                            </p>
                        </div>

                        {/* Signature Block */}
                        <div className="flex justify-end mt-4 pr-6">
                            <div className="text-center w-80 space-y-1 font-signature-block">
                                <p className="font-bold text-black">P. Le Président du Directoire et P.O</p>
                                <p className="font-bold text-black">Le Secrétaire Général</p>
                                <div className="h-14"></div>
                                <p className="font-bold text-black underline uppercase">
                                    {logos.globalSignatoryName || "FATOGOMA YEO"}
                                </p>
                                <p className="text-slate-700 italic font-medium">
                                    {logos.globalSignatoryTitle || "Préfet"}
                                </p>
                            </div>
                        </div>

                        {/* Footer with horizontal line */}
                        <div className="absolute bottom-8 left-8 right-8">
                            <div className="border-t border-slate-300 w-full mb-3" />
                            <div className="text-center text-[10px] text-slate-500 leading-relaxed">
                                <p className="font-bold">Chambre Nationale des Rois et Chefs Traditionnels (CNRCT)</p>
                                <p>Yamoussoukro, Riviera — BP 201 Yamoussoukro   Tél : (225) 30 64 06 60   Fax : (225) 30 64 06 63</p>
                                <p className="text-blue-500 underline text-[10px]">www.cnrct.ci</p>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Print style overrides for absolute A4 sizing, zero margin, and page breaks */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait !important;
                        margin: 0 !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    #print-section {
                        width: 210mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print-page-break {
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        padding: 20mm !important;
                        box-sizing: border-box !important;
                        position: relative !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        background: white !important;
                    }
                    .print-page-break:last-child {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }
                    .font-president {
                        font-family: 'Lucida Handwriting', 'Brush Script MT', 'Comic Sans MS', cursive !important;
                    }
                    .font-signature-block {
                        font-family: Arial, Helvetica, sans-serif !important;
                        font-size: 14pt !important;
                    }
                }
                #print-section {
                    font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
                }
                .print-page-break {
                    border-bottom: 2px dashed #ccc;
                    margin-bottom: 20px;
                }
                @media print {
                    .print-page-break {
                        border-bottom: none;
                        margin-bottom: 0;
                    }
                }
                .font-president {
                    font-family: 'Lucida Handwriting', 'Brush Script MT', 'Comic Sans MS', cursive;
                }
                .font-signature-block {
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 14pt;
                }
            `}</style>
        </div>,
        document.body
    );
}

