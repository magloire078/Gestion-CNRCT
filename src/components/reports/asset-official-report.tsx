"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Monitor, 
    HardDrive, 
    MapPin, 
    ShieldCheck, 
    Tag,
    Activity,
    Box
} from "lucide-react";
import { OrganizationSettings } from "@/lib/data";
import { InstitutionalCover } from "./institutional-cover";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";

export type CombinedAsset = {
    id: string;
    name: string;
    category: string;
    status: string;
    type: 'IT' | 'Heritage';
    location?: string;
    tag?: string;
    dateAcquisition?: string;
};

interface AssetOfficialReportProps {
    items: CombinedAsset[];
    organizationSettings: OrganizationSettings | null;
    isPrinting: boolean;
    onAfterPrint?: () => void;
}

export function AssetOfficialReport({ 
    items, 
    organizationSettings,
    isPrinting,
    onAfterPrint
}: AssetOfficialReportProps) {
    if (!organizationSettings) return null;

    const totalItems = items.length;
    const itCount = items.filter(i => i.type === 'IT').length;
    const heritageCount = items.filter(i => i.type === 'Heritage').length;
    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });

    // Group by type and then by category
    const groupedItems: Record<string, Record<string, CombinedAsset[]>> = {
        'IT': {},
        'Heritage': {}
    };

    items.forEach(item => {
        if (!groupedItems[item.type][item.category]) {
            groupedItems[item.type][item.category] = [];
        }
        groupedItems[item.type][item.category].push(item);
    });

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting} 
            onAfterPrint={onAfterPrint}
            orientation="landscape"
        >
            <div className="bg-white text-black w-full min-h-screen font-sans">
                <InstitutionalCover 
                    title="INVENTAIRE GLOBAL DU PATRIMOINE"
                    subtitle="Actifs Technologiques & Biens Culturels"
                    direction="DSI / DCP"
                    service="Direction des Systèmes d'Information & du Patrimoine"
                    period={`ÉDITION ${format(new Date(), "yyyy")}`}
                    stats={[
                        { label: "Total Actifs", value: totalItems, icon: Box },
                        { label: "Matériel IT", value: itCount, icon: Monitor },
                        { label: "Patrimoine", value: heritageCount, icon: HardDrive },
                        { label: "Certification", value: "Audit Conforme", icon: ShieldCheck },
                    ]}
                    reference={`INV-${format(new Date(), "yyyy")}-${Math.floor(Math.random() * 9000) + 1000}`}
                    settings={organizationSettings}
                    orientation="landscape"
                />

                <div className="landscape-section min-h-screen p-12 relative print:p-5">
                    <InstitutionalHeader 
                        title="Grand Livre d'Inventaire des Actifs"
                        period={`Situation consolidée au ${todayStr}`}
                        direction="DSI / DCP"
                        service="Rapport d'Audit Interne"
                        settings={organizationSettings}
                    />

                    <div className="space-y-6 mt-10">
                        {Object.entries(groupedItems).map(([type, categories]) => (
                            Object.keys(categories).length > 0 && (
                                <div key={type} className="space-y-4">
                                    <div className="flex items-center gap-4 border-b-4 border-slate-900 pb-2">
                                        <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center">
                                            {type === 'IT' ? <Monitor className="h-6 w-6 text-white" /> : <HardDrive className="h-6 w-6 text-white" />}
                                        </div>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 italic">
                                            SECTION : <span className="text-indigo-600 underline decoration-4 underline-offset-8">{type === 'IT' ? 'MATÉRIEL TECHNOLOGIQUE' : 'PATRIMOINE MOBILIER & CULTUREL'}</span>
                                        </h3>
                                    </div>

                                    {Object.entries(categories).map(([category, catItems]) => (
                                        <div key={category} className="space-y-4 break-inside-avoid">
                                            <div className="flex justify-between items-center bg-slate-50 px-6 py-3 rounded-xl border-l-8 border-slate-900">
                                                <h4 className="text-lg font-black uppercase text-slate-700 tracking-wider">{category}</h4>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200">
                                                    {catItems.length} Éléments
                                                </span>
                                            </div>

                                            <table className="w-full border-collapse border-2 border-slate-900 text-[9px]">
                                                <thead>
                                                    <tr className="bg-slate-900 text-white uppercase font-black">
                                                        <th className="p-3 text-left border-r border-slate-700 w-[25%]">Désignation de l'Actif</th>
                                                        <th className="p-3 text-left border-r border-slate-700 w-[20%]">Localisation / Affectation</th>
                                                        <th className="p-3 text-center border-r border-slate-700 w-[15%]">État / Statut</th>
                                                        <th className="p-3 text-center border-r border-slate-700 w-[20%]">Identification (Tag)</th>
                                                        <th className="p-3 text-right w-[20%]">Date Acquisition</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {catItems.map((item) => (
                                                        <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                                            <td className="p-3 border-r border-slate-100 font-bold text-slate-900 uppercase">
                                                                {item.name}
                                                            </td>
                                                            <td className="p-3 border-r border-slate-100">
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="h-3 w-3 text-slate-400" />
                                                                    <span className="font-bold text-slate-600">{item.location || "N/A"}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 border-r border-slate-100 text-center">
                                                                <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-900 font-black uppercase text-[8px] border border-slate-200">
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 border-r border-slate-100 text-center">
                                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-slate-900">
                                                                    <Tag className="h-2.5 w-2.5 text-slate-400" />
                                                                    {item.tag || "N/A"}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <div className="flex items-center justify-end gap-1.5 text-slate-400 font-bold">
                                                                    <Activity className="h-2.5 w-2.5" />
                                                                    {item.dateAcquisition ? format(new Date(item.dateAcquisition), "MMM yyyy", { locale: fr }).toUpperCase() : "INCONNUE"}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            )
                        ))}
                    </div>

                    <InstitutionalFooter 
                        showSignatures={true}
                        leftSignatureTitle="LE RESPONSABLE PATRIMOINE"
                        rightSignatureTitle="LE SECRÉTAIRE GÉNÉRAL"
                    />
                </div>
            </div>
            <style jsx>{`
                table {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                @media print {
                    .landscape-section {
                        page-break-before: always;
                    }
                    .break-inside-avoid {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </InstitutionalReportWrapper>
    );
}
