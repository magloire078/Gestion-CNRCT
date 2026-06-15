"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Employe, OrganizationSettings } from "@/lib/data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, UserCheck, TrendingUp, PieChart, Briefcase, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { allColumns, chiefColumns, type ColumnKeys } from "@/lib/constants/employee";
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
            case 'Date_Naissance': 
            case 'dateEmbauche': 
            case 'Date_Depart': {
                const val = (emp as any)[key];
                if (!val) return '---';
                try {
                    return format(new Date(val), 'dd/MM/yyyy');
                } catch (e) {
                    return val;
                }
            }
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
            case 'subPrefecture': return (emp as any).sousPrefecture || (emp as any).subPrefecture || '---';
            case 'Village': return (emp as any).village || (emp as any).Village || '---';
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
                
                {/* --- PAGE DE RÉSUMÉ GRAPHIQUE --- */}
                <div className="print-page p-8 bg-white flex flex-col items-center justify-center break-after-page" style={{ minHeight: '21cm', pageBreakAfter: 'always' }}>
                    
                    <div className="w-full mb-2">
                        <InstitutionalHeader showService={false} settings={logos} />
                    </div>
                    
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2 text-center max-w-4xl italic">
                      ÉTAT NOMINATIF DU PERSONNEL ET DES EFFECTIFS REPRÉSENTÉS
                    </h1>
                    
                    <p className="text-xl font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">
                      PÉRIMÈTRE : {unitLabel}
                    </p>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-px w-16 bg-slate-200" />
                      <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-[0.2em] text-sm">
                        <Calendar className="h-4 w-4" />
                        {todayStr}
                      </div>
                      <div className="h-px w-16 bg-slate-200" />
                    </div>

                    {/* Synthesis KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl">
                        <div className="flex flex-col items-center gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                            <Users className="h-5 w-5 text-slate-400 mb-1" />
                            <span className="text-3xl font-black text-slate-900">{stats.total}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Effectif Global</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-3 bg-[#f0f9f4] rounded-xl border border-[#006039]/20 shadow-sm">
                            <UserCheck className="h-5 w-5 text-[#006039] mb-1" />
                            <span className="text-3xl font-black text-[#006039]">{stats.active}</span>
                            <span className="text-[10px] font-bold text-[#006039] uppercase tracking-widest text-center">Agents Actifs</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-3 bg-[#f0f5ff] rounded-xl border border-blue-200 shadow-sm">
                            <TrendingUp className="h-5 w-5 text-blue-500 mb-1" />
                            <span className="text-3xl font-black text-blue-700">{stats.men}</span>
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest text-center">Hommes</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-3 bg-[#fff0f4] rounded-xl border border-rose-200 shadow-sm">
                            <PieChart className="h-5 w-5 text-rose-500 mb-1" />
                            <span className="text-3xl font-black text-rose-700">{stats.women}</span>
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center">Femmes</span>
                        </div>
                    </div>
                </div>

                {/* --- PAGE DE DONNÉES --- */}
                <div className="print-page p-5 landscape-section bg-white" style={{ pageBreakBefore: 'always' }}>
                    
                    {/* Header text above table */}
                    <div className="mb-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-left">
                        Liste personnel {unitLabel} du {todayStr}
                    </div>

                    {/* Data Table */}
                    <div className="w-full overflow-visible mt-4">
                        <table className="w-full border-collapse border-2 border-slate-900 text-[8px] leading-tight shadow-sm">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900 uppercase font-black text-center border-b-2 border-slate-900" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                    {columnsToDisplay.map((key) => (
                                        <th key={key} className={cn(
                                            "border border-slate-700 p-2 align-middle break-words",
                                            key === 'index' && "w-[30px]",
                                            key === 'matricule' && "w-[60px]",
                                            key === 'name' && "w-[180px]",
                                            key === 'sexe' && "w-[40px]",
                                            key === 'status' && "w-[50px]",
                                            (key === 'Date_Naissance' || key === 'dateEmbauche' || key === 'Date_Depart') && "w-[75px]",
                                            key === 'Lieu_Naissance' && "w-[130px]",
                                            key === 'poste' && "w-[150px]",
                                            key === 'department' && "w-[120px]"
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
                                                "border border-slate-300 p-2 align-top",
                                                (key === 'index' || key === 'sexe' || key === 'status' || key === 'Date_Naissance' || key === 'dateEmbauche' || key === 'Date_Depart') && "text-center",
                                                key === 'name' && "font-black uppercase text-slate-900 text-[9px]",
                                                key === 'matricule' && "font-mono font-bold text-slate-600",
                                                key === 'poste' && "italic break-words text-slate-700",
                                                key === 'department' && "break-words font-semibold"
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
                    <div className="mt-8 break-inside-avoid w-full">
                        <InstitutionalFooter 
                            signatoryName="YEO Fatogoma"
                            signatoryTitle="Secrétaire Général de la CNRCT"
                            place="Yamoussoukro"
                            showCertification={false}
                            showVisa={false}
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
                        .break-after-page {
                            page-break-after: always;
                        }
                    }
                `}</style>
            </div>
        </InstitutionalReportWrapper>
    );
}
