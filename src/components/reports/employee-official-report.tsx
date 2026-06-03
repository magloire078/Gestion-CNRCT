"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Employe, OrganizationSettings } from "@/lib/data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, UserCheck, TrendingUp, PieChart, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { allColumns, chiefColumns, type ColumnKeys } from "@/lib/constants/employee";
import { InstitutionalCover } from "./institutional-cover";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalReportWrapper } from "@/components/reports/institutional-report-wrapper";

interface EmployeeOfficialReportProps {
    employees: Employe[];
    logos: OrganizationSettings | null;
    unitLabel: string;
    selectedColumns?: ColumnKeys[];
    stats: {
        total: number;
        active: number;
        men: number;
        women: number;
    };
    orientation?: 'portrait' | 'landscape';
    isPrinting: boolean;
    onAfterPrint?: () => void;
}


export function EmployeeOfficialReport({ 
    employees, 
    logos, 
    unitLabel,
    selectedColumns,
    stats,
    orientation = 'landscape', // Default to landscape for many columns
    isPrinting,
    onAfterPrint
}: EmployeeOfficialReportProps) {
    // Always render to allow pre-mounting and stable portal transition
    
    const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    const columnsToDisplay = selectedColumns || ["index", "matricule", "name", "poste", "department", "sexe", "status"];
    
    const getColumnLabel = (key: ColumnKeys) => {
        return (allColumns as any)[key] || (chiefColumns as any)[key] || key;
    };

    const getCellContent = (emp: Employe, key: ColumnKeys, idx: number) => {
        switch (key) {
            case 'index': return idx + 1;
            case 'name': return `${emp.lastName || ''} ${emp.firstName || ''}`.trim();
            case 'department': return emp.department || '---';
            case 'CNPS': return emp.CNPS ? 'OUI' : 'NON';
            case 'age': {
                if (!emp.Date_Naissance) return '---';
                const birthDate = new Date(emp.Date_Naissance);
                const age = new Date().getFullYear() - birthDate.getFullYear();
                return `${age} ans`;
            }
            case 'status': return (
                <span className={cn(
                    "font-black uppercase text-[7px]",
                    emp.status === 'Actif' ? "text-emerald-700" : "text-slate-700"
                )}>
                    {emp.status}
                </span>
            );
            case 'sexe': return emp.sexe || '---';
            default: return (emp as any)[key] || '---';
        }
    };

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting} 
            onAfterPrint={onAfterPrint}
            orientation={orientation}
        >
            <div className="bg-white text-black w-full font-sans print:min-h-0">
                {/* --- PAGE DE GARDE --- */}
                <InstitutionalCover 
                    title="ÉTAT NOMINATIF DU PERSONNEL ET DES EFFECTIFS REPRÉSENTÉS"
                    subtitle={`PÉRIMÈTRE : ${unitLabel}`}
                    direction="DAARH"
                    service="Direction des Affaires Administratives et des Ressources Humaines"
                    reference={`RH-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`}
                    stats={[
                        { label: "Total Agents", value: stats.total, icon: Users },
                        { label: "Agents Actifs", value: stats.active, icon: UserCheck },
                        { label: "Hommes", value: stats.men, icon: TrendingUp },
                        { label: "Femmes", value: stats.women, icon: PieChart }
                    ]}
                    settings={logos}
                    orientation={orientation}
                />

                {/* --- PAGE DE DONNÉES --- */}
                <div className="print-page p-5 landscape-section bg-white">
                    <InstitutionalHeader 
                        title="Registre Nominatif du Personnel"
                        period={`Situation arrêtée au ${todayStr}`}
                        direction="DAARH"
                        service="Direction des Affaires Administratives et des Ressources Humaines"
                        settings={logos}
                    />

                    {/* Synthesis KPIs */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/30 break-inside-avoid shadow-sm">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Users className="h-3 w-3" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Effectif Global</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 leading-none">{stats.total}</div>
                        </div>
                        <div className="border border-[#006039]/10 p-4 rounded-xl bg-[#006039]/5 break-inside-avoid shadow-sm">
                            <div className="flex items-center gap-2 text-[#006039] mb-1">
                                <UserCheck className="h-3 w-3" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Agents Actifs</span>
                            </div>
                            <div className="text-2xl font-black text-[#006039] leading-none">{stats.active}</div>
                        </div>
                        <div className="border border-blue-100 p-4 rounded-xl bg-blue-50/20 break-inside-avoid shadow-sm">
                            <div className="flex items-center gap-2 text-blue-500 mb-1">
                                <TrendingUp className="h-3 w-3" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Hommes</span>
                            </div>
                            <div className="text-2xl font-black text-blue-700 leading-none">{stats.men}</div>
                        </div>
                        <div className="border border-rose-100 p-4 rounded-xl bg-rose-50/20 break-inside-avoid shadow-sm">
                            <div className="flex items-center gap-2 text-rose-500 mb-1">
                                <PieChart className="h-3 w-3" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Femmes</span>
                            </div>
                            <div className="text-2xl font-black text-rose-700 leading-none">{stats.women}</div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="w-full overflow-visible mt-4">
                        <table className="w-full border-collapse border-2 border-slate-900 text-[7.5px] leading-tight shadow-sm">
                            <thead>
                                <tr className="bg-slate-900 text-white uppercase font-black text-center border-b-2 border-slate-900">
                                    {columnsToDisplay.map((key) => (
                                        <th key={key} className={cn(
                                            "border border-slate-700 p-1.5 align-middle break-words",
                                            key === 'index' && "w-[30px]",
                                            key === 'matricule' && "w-[60px]",
                                            key === 'sexe' && "w-[40px]",
                                            key === 'status' && "w-[60px]"
                                        )}>
                                            {getColumnLabel(key)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp, idx) => (
                                    <tr key={emp.id} className="border-b border-slate-300 even:bg-slate-50/50 break-inside-avoid">
                                        {columnsToDisplay.map((key) => (
                                            <td key={key} className={cn(
                                                "border border-slate-300 p-1.5 align-top",
                                                (key === 'index' || key === 'sexe' || key === 'status') && "text-center",
                                                key === 'name' && "font-black uppercase text-slate-900 text-[8.5px] min-w-[140px]",
                                                key === 'matricule' && "font-mono font-bold text-slate-600",
                                                key === 'poste' && "italic min-w-[120px] break-words",
                                                key === 'department' && "min-w-[100px] break-words"
                                            )}>
                                                {getCellContent(emp, key, idx)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Validation Area */}
                    <div className="mt-4 break-inside-avoid">
                        <InstitutionalFooter 
                            signatoryName="YEO Fatogoma"
                            signatoryTitle="Secrétaire Général de la CNRCT"
                            place="Yamoussoukro"
                        />
                    </div>
                </div>
                
                <style jsx>{`
                    @media print {
                        .print-page {
                            min-height: 0 !important;
                            height: auto !important;
                            padding: 10mm !important;
                        }
                        table {
                            page-break-inside: auto;
                        }
                        tr {
                            page-break-inside: avoid;
                            page-break-after: auto;
                        }
                    }
                `}</style>
            </div>
        </InstitutionalReportWrapper>
    );
}
