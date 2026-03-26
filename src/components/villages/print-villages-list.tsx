"use client";

import { PrintLayout } from "@/components/reports/print-layout";
import { OrganizationSettings } from "@/types/common";
import { VillageEntry } from "@/app/villages/page";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PrintVillagesListProps {
    villages: VillageEntry[];
    organizationSettings: OrganizationSettings | null;
    subtitle?: string;
}

export function PrintVillagesList({ villages, organizationSettings, subtitle }: PrintVillagesListProps) {
    // Group villages by Region
    const villagesByRegion = villages.reduce((acc, village) => {
        const region = village.village.region || "Non définie";
        if (!acc[region]) acc[region] = [];
        acc[region].push(village);
        return acc;
    }, {} as Record<string, VillageEntry[]>);

    return (
        <PrintLayout 
            title="Liste des Localités et Autorités Traditionnelles"
            logos={organizationSettings}
            subtitle={subtitle}
        >
            <div className="space-y-8">

                {Object.entries(villagesByRegion).sort().map(([region, regionVillages]) => (
                    <div key={region} className="space-y-4 break-inside-avoid">
                        <h2 className="text-lg font-bold bg-slate-100 px-3 py-1 border-l-4 border-slate-800">
                            Région: {region}
                        </h2>
                        
                        <table className="w-full text-sm border-collapse border border-black">
                            <thead>
                                <tr className="bg-slate-200 text-black uppercase font-bold text-center">
                                    <th className="border border-black py-2 px-1 font-bold">Localité</th>
                                    <th className="border border-black py-2 px-1 font-bold">Département / S-Préf.</th>
                                    <th className="border border-black py-2 px-1 font-bold">Autorité Traditionnelle</th>
                                    <th className="border border-black py-2 px-1 font-bold">Statut du Siège</th>
                                </tr>
                            </thead>
                            <tbody>
                                {regionVillages.sort((a, b) => a.village.name.localeCompare(b.village.name)).map((entry, idx) => (
                                    <tr key={entry.village.id} className="align-top">
                                        <td className="border border-black py-2 px-1 font-medium">{entry.village.name}</td>
                                        <td className="border border-black py-2 px-1 text-slate-600">
                                            {entry.village.department} / {entry.village.subPrefecture}
                                        </td>
                                        <td className="border border-black py-2 px-1">
                                            {entry.currentChief ? (
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{entry.currentChief.name}</span>
                                                    <span className="text-xs text-slate-500">{entry.currentChief.CNRCTRegistrationNumber}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">Non renseignée</span>
                                            )}
                                        </td>
                                        <td className="border border-black py-2 px-1 text-center font-bold uppercase text-[10px]">
                                            {entry.currentChief ? (
                                                <span className="text-green-700">Occupé</span>
                                            ) : (
                                                <span className="text-red-700">Vacance du Trône</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
            
            <div className="mt-12 pt-8 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8">
                <div className="text-center">
                    <p className="font-bold underline mb-12">Le Responsable Local</p>
                    <div className="h-20"></div>
                    <p className="text-xs text-slate-400">Cachet et Signature</p>
                </div>
                <div className="text-center">
                    <p className="font-bold underline mb-12">La Direction Générale</p>
                    <div className="h-20"></div>
                    <p className="text-xs text-slate-400">Cachet et Signature</p>
                </div>
            </div>
        </PrintLayout>
    );
}
