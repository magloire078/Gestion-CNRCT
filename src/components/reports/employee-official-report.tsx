"use client";

import { useEffect, useState } from "react";
import type { Employe, OrganizationSettings } from "@/lib/data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, UserCheck, TrendingUp, PieChart, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { allColumns, chiefColumns, type ColumnKeys } from "@/lib/constants/employee";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalReportWrapper } from "@/components/reports/institutional-report-wrapper";
import { findComiteRegionalMember } from "@/lib/comites-regionaux-2026";

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
    orientation = 'landscape',
    isPrinting,
    onAfterPrint
}: EmployeeOfficialReportProps) {
    const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    const columnsToDisplay = selectedColumns || ["index", "matricule", "name", "poste", "department", "sexe", "status"];
    
    const getColumnLabel = (key: ColumnKeys) => {
        return (allColumns as any)[key] || (chiefColumns as any)[key] || key;
    };

    const getCellContent = (emp: Employe, key: ColumnKeys, idx: number) => {
        const fullName = `${emp.lastName || ''} ${emp.firstName || ''}`.trim() || emp.name || '';
        const comiteInfo = findComiteRegionalMember(fullName, emp.Region, (emp as any).Departement);

        switch (key) {
            case 'index': return idx + 1;
            case 'name': return fullName;
            case 'department': return emp.department || '---';
            case 'CNPS': return emp.CNPS ? 'OUI' : 'NON';
            case 'contact':
            case 'email': {
                const directContact = emp.mobile || 
                    (emp as any).contact || 
                    (emp as any).contacts || 
                    (emp as any).telephone || 
                    (emp as any).phone || 
                    (emp as any).Contact || 
                    (emp as any).tel || 
                    (emp as any).Mobile || 
                    ((emp.email && !emp.email.includes('@intras') && !emp.email.includes('cnrct.ci')) ? emp.email : '');
                
                if (directContact && directContact !== '---' && directContact.trim().length > 0) {
                    return directContact.trim();
                }
                if (comiteInfo?.contacts) {
                    return comiteInfo.contacts.trim();
                }
                return '---';
            }
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
            case 'Departement': return (emp as any).Departement || (emp as any).departement || comiteInfo?.department || '---';
            case 'Region': return (emp as any).Region || (emp as any).region || comiteInfo?.region || '---';
            case 'subPrefecture': {
                const sp = (emp as any).subPrefecture || (emp as any).sousPrefecture || (emp as any).Commune;
                if (sp && sp !== '---') return sp;
                if (comiteInfo?.department) return comiteInfo.department;
                return '---';
            }
            case 'Village': {
                const directVillage = (emp as any).Village || (emp as any).village || (emp as any).localite || (emp as any).villageName;
                if (directVillage && directVillage !== '---') return directVillage;
                if (comiteInfo?.fonctionLocalite) {
                    const clean = comiteInfo.fonctionLocalite.replace(/^Chef (du village|de village|de Canton|de canton|de la Tribu|de tribu|central)(\s+de|\s+du|\s*\/)?\s*/i, '').trim();
                    if (clean) return clean;
                }
                return '---';
            }
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
                
                {/* --- PAGE DE RÉSUMÉ GRAPHIQUE ÉPURÉE --- */}
                <div className="print-page p-4 sm:p-6 bg-white flex flex-col items-center break-after-page min-h-0">
                    
                    <div className="w-full mb-1">
                        <InstitutionalHeader showService={false} settings={logos} compact={true} />
                    </div>
                    
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mb-1 text-center max-w-4xl italic">
                      ÉTAT NOMINATIF DU PERSONNEL ET DES EFFECTIFS REPRÉSENTÉS
                    </h1>
                    
                    <p className="text-sm sm:text-base font-bold text-slate-600 uppercase tracking-wider mb-2 text-center">
                      PÉRIMÈTRE : {unitLabel}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px w-8 bg-slate-300" />
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                        <Calendar className="h-3 w-3" />
                        {todayStr}
                      </div>
                      <div className="h-px w-8 bg-slate-300" />
                    </div>

                    {/* Synthesis KPIs - Ultra Compact */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-3xl mb-2">
                        <div className="flex flex-col items-center gap-0.5 p-2 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                            <Users className="h-3.5 w-3.5 text-slate-400 mb-0.5" />
                            <span className="text-xl font-black text-slate-900 leading-none">{stats.total}</span>
                            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider text-center mt-0.5">Effectif Global</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 p-2 bg-[#f0f9f4] rounded-lg border border-[#006039]/20 shadow-sm">
                            <UserCheck className="h-3.5 w-3.5 text-[#006039] mb-0.5" />
                            <span className="text-xl font-black text-[#006039] leading-none">{stats.active}</span>
                            <span className="text-[8.5px] font-black text-[#006039] uppercase tracking-wider text-center mt-0.5">Agents Actifs</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 p-2 bg-[#f0f5ff] rounded-lg border border-blue-200 shadow-sm">
                            <TrendingUp className="h-3.5 w-3.5 text-blue-500 mb-0.5" />
                            <span className="text-xl font-black text-blue-700 leading-none">{stats.men}</span>
                            <span className="text-[8.5px] font-black text-blue-600 uppercase tracking-wider text-center mt-0.5">Hommes</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 p-2 bg-[#fff0f4] rounded-lg border border-rose-200 shadow-sm">
                            <PieChart className="h-3.5 w-3.5 text-rose-500 mb-0.5" />
                            <span className="text-xl font-black text-rose-700 leading-none">{stats.women}</span>
                            <span className="text-[8.5px] font-black text-rose-600 uppercase tracking-wider text-center mt-0.5">Femmes</span>
                        </div>
                    </div>
                </div>

                {/* --- PAGE DE DONNÉES --- */}
                <div className="print-page p-3 sm:p-4 landscape-section bg-white break-before-page">
                    
                    {/* Header text above table */}
                    <div className="mb-2 text-[10px] font-black text-slate-800 uppercase tracking-wider text-left border-b border-slate-200 pb-1">
                        LISTE PERSONNEL {unitLabel} DU {todayStr}
                    </div>

                    {/* Data Table */}
                    <div className="w-full overflow-visible mt-1">
                        <table className="w-full border-collapse border border-slate-800 text-[8px] leading-tight">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900 uppercase font-black text-center border-b border-slate-800 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                                    {columnsToDisplay.map((key) => (
                                        <th key={key} className={cn(
                                            "border border-slate-700 p-1 align-middle break-words text-[8px]",
                                            key === 'index' && "w-[24px]",
                                            key === 'matricule' && "w-[50px]",
                                            key === 'name' && "w-[160px]",
                                            (key === 'contact' || key === 'email') && "w-[95px]",
                                            key === 'sexe' && "w-[30px]",
                                            key === 'status' && "w-[40px]",
                                            (key === 'Date_Naissance' || key === 'dateEmbauche' || key === 'Date_Depart') && "w-[65px]",
                                            key === 'Lieu_Naissance' && "w-[100px]",
                                            key === 'poste' && "w-[130px]",
                                            (key === 'department' || key === 'Departement' || key === 'subPrefecture' || key === 'Region' || key === 'Village') && "w-[95px]"
                                        )}>
                                            {getColumnLabel(key)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp, idx) => (
                                    <tr key={emp.id} className="border-b border-slate-300 even:bg-slate-50/60 break-inside-avoid">
                                        {columnsToDisplay.map((key) => (
                                            <td key={key} className={cn(
                                                "border border-slate-300 p-1 align-middle",
                                                (key === 'index' || key === 'sexe' || key === 'status' || key === 'Date_Naissance' || key === 'dateEmbauche' || key === 'Date_Depart') && "text-center",
                                                (key === 'contact' || key === 'email') && "font-mono font-bold text-slate-900 text-[8.5px] text-center whitespace-nowrap tracking-tight",
                                                key === 'name' && "font-black uppercase text-slate-900 text-[8.5px]",
                                                key === 'matricule' && "font-mono font-bold text-slate-600",
                                                key === 'poste' && "italic break-words text-slate-700 text-[8px]",
                                                key === 'department' && "break-words font-semibold text-[8px]"
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
                    <div className="mt-4 break-inside-avoid w-full">
                        <InstitutionalFooter 
                            signatoryName="YEO Fatogoma"
                            signatoryTitle="Le Secrétaire Général de la CNRCT"
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
                            padding: 6mm !important;
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
                        .break-before-page {
                            page-break-before: always;
                        }
                    }
                `}</style>
            </div>
        </InstitutionalReportWrapper>
    );
}
