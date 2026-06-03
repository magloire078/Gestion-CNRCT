"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Chief, OrganizationSettings } from "@/lib/data";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";
import { InstitutionalCover } from "./institutional-cover";
import { BarChart3, Building2, MapPin } from "lucide-react";

interface ChiefsStatisticsReportProps {
    chiefs: Chief[];
    organizationSettings: OrganizationSettings | null;
    isPrinting?: boolean;
    onAfterPrint?: () => void;
    stats: {
        total: number;
        regions: number;
        villages: number;
    };
}

type SubPrefectureStat = {
    region: string;
    department: string;
    subPrefecture: string;
    villagesCount: number;
    activeChiefsCount: number;
    femaleChiefsCount: number;
    cantonChiefsCount: number;
    tribeChiefsCount: number;
    kingsCount: number;
};

export function ChiefsStatisticsReport({ 
    chiefs, 
    organizationSettings, 
    isPrinting,
    onAfterPrint,
    stats 
}: ChiefsStatisticsReportProps) {
    
    const rows = useMemo(() => {
        const grouped: Record<string, SubPrefectureStat> = {};

        chiefs.forEach(chief => {
            const region = chief.region || "Non définie";
            const department = chief.department || "Non défini";
            const subPrefecture = chief.subPrefecture || "Non définie";
            
            const key = `${region}-${department}-${subPrefecture}`;

            if (!grouped[key]) {
                grouped[key] = {
                    region,
                    department,
                    subPrefecture,
                    villagesCount: 0,
                    activeChiefsCount: 0,
                    femaleChiefsCount: 0,
                    cantonChiefsCount: 0,
                    tribeChiefsCount: 0,
                    kingsCount: 0,
                };
            }

            const stat = grouped[key];
            
            // Helper to check if a chief has a specific role (main or additional)
            const hasRole = (roleToCheck: string) => chief.role === roleToCheck || chief.additionalRoles?.includes(roleToCheck as any);

            // Unique villages count. For simplicity, we count chiefs with role "Chef de Village" as a proxy, 
            // or we could track unique village names. Let's count chiefs who are 'Chef de Village'.
            if (hasRole("Chef de Village")) stat.villagesCount++;
            
            // Chefs en exercice (Actifs ou À vie)
            if (chief.status === "actif" || chief.status === "a_vie" || !chief.status) {
                stat.activeChiefsCount++;
            }

            if (chief.sexe === "Femme") stat.femaleChiefsCount++;
            if (hasRole("Chef de canton")) stat.cantonChiefsCount++;
            if (hasRole("Chef de tribu")) stat.tribeChiefsCount++;
            if (hasRole("Roi") || hasRole("Chef de province")) stat.kingsCount++; // Including kings and provinces
        });

        // Convert to array and sort
        return Object.values(grouped).sort((a, b) => {
            if (a.region !== b.region) return a.region.localeCompare(b.region);
            if (a.department !== b.department) return a.department.localeCompare(b.department);
            return a.subPrefecture.localeCompare(b.subPrefecture);
        });
    }, [chiefs]);

    const totals = useMemo(() => {
        return rows.reduce((acc, row) => {
            acc.villagesCount += row.villagesCount;
            acc.activeChiefsCount += row.activeChiefsCount;
            acc.femaleChiefsCount += row.femaleChiefsCount;
            acc.cantonChiefsCount += row.cantonChiefsCount;
            acc.tribeChiefsCount += row.tribeChiefsCount;
            acc.kingsCount += row.kingsCount;
            return acc;
        }, {
            villagesCount: 0,
            activeChiefsCount: 0,
            femaleChiefsCount: 0,
            cantonChiefsCount: 0,
            tribeChiefsCount: 0,
            kingsCount: 0,
        });
    }, [rows]);

    if (!organizationSettings) return null;
    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting || false} 
            orientation="landscape"
            onAfterPrint={onAfterPrint}
        >
            <div className="bg-white text-black w-full min-h-screen font-sans">
                <InstitutionalCover 
                    title="SITUATION STATISTIQUE DE LA CHEFFERIE TRADITIONNELLE"
                    orientation="landscape"
                    subtitle="Données Quantitatives et Répartition Géographique"
                    direction="DR"
                    service="Direction de la Gouvernance Traditionnelle"
                    period="Situation Nationale"
                    stats={[
                        { label: "Total Autorités", value: stats.total, icon: BarChart3 },
                        { label: "Régions", value: stats.regions, icon: MapPin },
                        { label: "Localités", value: stats.villages, icon: Building2 },
                    ]}
                    reference={`STAT-CHIEF-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`}
                    settings={organizationSettings}
                />

                <div className="landscape-section min-h-screen p-12 relative print:p-5 bg-white">
                    <InstitutionalHeader 
                        title="Situation Statistique de la Chefferie Traditionnelle"
                        period={`Document extrait le ${todayStr}`}
                        direction="DR"
                        service="Direction de la Gouvernance Traditionnelle"
                        settings={organizationSettings}
                    />

                    <div className="mt-4 break-inside-avoid">
                        <table className="w-full border-collapse border-2 border-slate-900 text-xs">
                            <thead>
                                <tr className="bg-slate-900 text-white uppercase font-black print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-900">
                                    <th className="p-2 border border-slate-700 text-left w-[12%]">Région</th>
                                    <th className="p-2 border border-slate-700 text-left w-[12%]">Département</th>
                                    <th className="p-2 border border-slate-700 text-left w-[15%]">Sous-Préfecture</th>
                                    <th className="p-2 border border-slate-700 text-center w-[8%]">Nb. Villages</th>
                                    <th className="p-2 border border-slate-700 text-center w-[8%]">Chefs en Exer.</th>
                                    <th className="p-2 border border-slate-700 text-center w-[8%]">Femmes Chefs</th>
                                    <th className="p-2 border border-slate-700 text-center w-[8%]">Chefs Cantons</th>
                                    <th className="p-2 border border-slate-700 text-center w-[8%]">Chefs Tribu</th>
                                    <th className="p-2 border border-slate-700 text-center w-[8%]">Rois</th>
                                    <th className="p-2 border border-slate-700 text-left w-[13%]">Observation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="border-b border-slate-200">
                                        <td className="p-2 border border-slate-300 font-bold uppercase text-[10px]">{row.region}</td>
                                        <td className="p-2 border border-slate-300 font-bold uppercase text-[10px]">{row.department}</td>
                                        <td className="p-2 border border-slate-300 font-bold uppercase text-[10px]">{row.subPrefecture}</td>
                                        <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{row.villagesCount || '-'}</td>
                                        <td className="p-2 border border-slate-300 text-center font-bold text-blue-700 bg-blue-50/50">{row.activeChiefsCount || '-'}</td>
                                        <td className="p-2 border border-slate-300 text-center font-bold text-pink-700">{row.femaleChiefsCount || '-'}</td>
                                        <td className="p-2 border border-slate-300 text-center font-bold">{row.cantonChiefsCount || '-'}</td>
                                        <td className="p-2 border border-slate-300 text-center font-bold">{row.tribeChiefsCount || '-'}</td>
                                        <td className="p-2 border border-slate-300 text-center font-black text-amber-700 bg-amber-50/50">{row.kingsCount || '-'}</td>
                                        <td className="p-2 border border-slate-300"></td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-800 text-white font-black uppercase text-[10px] print:bg-slate-200 print:text-slate-900 border-t-4 border-slate-900">
                                    <td colSpan={3} className="p-3 border border-slate-700 text-right">TOTAL NATIONAL</td>
                                    <td className="p-3 border border-slate-700 text-center text-sm">{totals.villagesCount}</td>
                                    <td className="p-3 border border-slate-700 text-center text-sm">{totals.activeChiefsCount}</td>
                                    <td className="p-3 border border-slate-700 text-center text-sm">{totals.femaleChiefsCount}</td>
                                    <td className="p-3 border border-slate-700 text-center text-sm">{totals.cantonChiefsCount}</td>
                                    <td className="p-3 border border-slate-700 text-center text-sm">{totals.tribeChiefsCount}</td>
                                    <td className="p-3 border border-slate-700 text-center text-sm">{totals.kingsCount}</td>
                                    <td className="p-3 border border-slate-700"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="mt-12 break-inside-avoid">
                        <InstitutionalFooter 
                            signatoryName=""
                            signatoryTitle="Le Directeur de la Gouvernance"
                            showCertification={false}
                        />
                    </div>
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
