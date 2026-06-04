"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatChiefStatus, isChiefCurrentlyInOffice } from "@/lib/chief-status";
import { 
    Crown, 
    MapPin, 
    Phone, 
    Mail,
    Building2,
    Calendar
} from "lucide-react";
import { Chief, OrganizationSettings } from "@/lib/data";
import { cn } from "@/lib/utils";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalCover } from "./institutional-cover";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";

interface ChiefsOfficialReportProps {
    chiefs: Chief[];
    organizationSettings: OrganizationSettings | null;
    subtitle?: string;
    isPrinting?: boolean;
    onAfterPrint?: () => void;
    stats: {
        total: number;
        regions: number;
        villages: number;
    };
}

export function ChiefsOfficialReport({ 
    chiefs, 
    organizationSettings, 
    subtitle,
    isPrinting,
    onAfterPrint,
    stats 
}: ChiefsOfficialReportProps) {
    if (!organizationSettings) return null;

    // Group chiefs by Region
    const chiefsByRegion = chiefs.reduce((acc, chief) => {
        const region = chief.region || "Non définie";
        if (!acc[region]) acc[region] = [];
        acc[region].push(chief);
        return acc;
    }, {} as Record<string, Chief[]>);

    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting || false} 
            orientation="landscape"
            onAfterPrint={onAfterPrint}
        >
            <div className="bg-white text-black w-full min-h-screen font-sans">
                <InstitutionalCover 
                    title="RÉPERTOIRE OFFICIEL DES AUTORITÉS TRADITIONNELLES"
                    orientation="landscape"
                    subtitle="Directoire des Rois et Chefs Traditionnels"
                    direction="DR"
                    service="Direction du Directoire et de la Gouvernance"
                    period={subtitle || "Situation Nationale"}
                    stats={[
                        { label: "Total Autorités", value: stats.total, icon: Crown },
                        { label: "Régions", value: stats.regions, icon: MapPin },
                        { label: "Localités", value: stats.villages, icon: Building2 },
                    ]}
                    reference={`DR-CHIEF-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`}
                    settings={organizationSettings}
                />

                {/* --- PAGES DÉTAILLÉES --- */}
                <div className="landscape-section min-h-screen p-12 relative print:p-8 bg-white">
                    <InstitutionalHeader 
                        title="Registre Nominatif des Rois et Chefs Traditionnels"
                        period={`Document extrait le ${todayStr}`}
                        direction="DR"
                        service="Direction de la Gouvernance Traditionnelle"
                        settings={organizationSettings}
                    />

                    <div className="space-y-12">
                        {Object.entries(chiefsByRegion).sort().map(([region, regionChiefs]) => (
                            <div key={region} className="space-y-6 break-inside-avoid px-2">
                                <div className="flex justify-between items-end border-b-4 border-slate-100 pb-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                        Région : <span className="text-[#D4AF37] underline decoration-4 underline-offset-8">{region}</span>
                                    </h3>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {regionChiefs.length} Autorités recensées
                                    </div>
                                </div>
                                
                                <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-900 text-white uppercase font-black">
                                            <th className="p-3 w-[40px] text-center border-r border-slate-700">N°</th>
                                            <th className="p-3 text-left border-r border-slate-700">Identité & Titre</th>
                                            <th className="p-3 text-left border-r border-slate-700">Circonscription (S-P / Dept)</th>
                                            <th className="p-3 text-left border-r border-slate-700">Village / Localité</th>
                                            <th className="p-3 w-[150px] text-left border-r border-slate-700">Contacts</th>
                                            <th className="p-3 w-[100px] text-center">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {regionChiefs.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '')).map((chief, idx) => (
                                            <tr key={chief.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                                                <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                                                <td className="p-3 border-r border-slate-200">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black uppercase text-slate-900">{chief.lastName} {chief.firstName}</span>
                                                        <span className="text-[9px] font-bold text-[#D4AF37] uppercase italic">{chief.title || 'Chef de Village'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 border-r border-slate-200 uppercase font-bold text-slate-600">
                                                    {chief.subPrefecture} / {chief.department}
                                                </td>
                                                <td className="p-3 border-r border-slate-200 uppercase font-black text-slate-800">
                                                    {chief.village}
                                                </td>
                                                <td className="p-3 border-r border-slate-200">
                                                    <div className="flex flex-col gap-1">
                                                        {chief.phone && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Phone className="h-2.5 w-2.5 text-slate-400" />
                                                                <span className="font-bold">{chief.phone}</span>
                                                            </div>
                                                        )}
                                                        {chief.email && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Mail className="h-2.5 w-2.5 text-slate-400" />
                                                                <span className="text-[9px] lowercase">{chief.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={cn(
                                                        "inline-block px-2 py-0.5 rounded font-black text-[8px] uppercase tracking-widest border",
                                                        isChiefCurrentlyInOffice(chief.status)
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                            : "bg-slate-50 text-slate-400 border-slate-200"
                                                    )}>
                                                        {formatChiefStatus(chief.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    <InstitutionalFooter 
                        signatoryName="KASSI Kouamé"
                        signatoryTitle="Chef de Service Gouvernance et Territoires"
                        showCertification={true}
                    />
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
