"use client";

import { useEffect, useState, useMemo } from "react";
import type { Employe, OrganizationSettings } from "@/lib/data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, UserCheck, TrendingUp, PieChart, Calendar, Crown, Layers, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { allColumns, chiefColumns, type ColumnKeys } from "@/lib/constants/employee";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalReportWrapper } from "@/components/reports/institutional-report-wrapper";
import { findComiteRegionalMember, getMemberChiefStatuses } from "@/lib/comites-regionaux-2026";
import { getOfficialRegion, getOfficialDepartment, compareRegionsWithDistrictsFirst } from "@/lib/normalization-utils";

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

function formatPhone(contact?: string | null): string {
    if (!contact || contact === '---') return '';
    const clean = contact.replace(/[^\d+]/g, '');
    if (clean.length === 10) {
        return clean.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    if (clean.startsWith('225') && clean.length === 13) {
        const digits = clean.slice(3);
        return `+225 ${digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`;
    }
    if (clean.length === 8) {
        return clean.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    }
    return contact;
}

function cleanVillage(raw?: string | null): string {
    if (!raw || raw === '---') return '';
    let val = raw.trim();
    val = val.replace(/^[\/\\:\-\s]+/, '');
    val = val.replace(/^(Chef\s+(du\s+village|de\s+village|de\s+Canton|de\s+canton|de\s+la\s+Tribu|de\s+tribu|central|de\s+province))\s*[\/:\-]?\s*(de\s+|du\s+|d')?/i, '');
    val = val.trim();
    if (!val) return raw.trim();
    return val.split(/([\s-]+)/).map(w => {
        if (w.trim() === '' || w === '-') return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
    }).join('');
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
    if (!isPrinting) return null;

    const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    const columnsToDisplay = selectedColumns || ["index", "matricule", "name", "sexe", "poste", "statutChef", "department", "status"];
    
    const getColumnLabel = (key: ColumnKeys) => {
        return (allColumns as any)[key] || (chiefColumns as any)[key] || key;
    };

    // Sort employees placing District d'Abidjan and District de Yamoussoukro first, then alphabetical
    const sortedEmployees = useMemo(() => {
        return [...employees].sort((a, b) => {
            const nameA = `${a.lastName || ''} ${a.firstName || ''}`.trim() || a.name || '';
            const nameB = `${b.lastName || ''} ${b.firstName || ''}`.trim() || b.name || '';
            
            const comiteA = findComiteRegionalMember(nameA, a.Region, (a as any).Departement);
            const comiteB = findComiteRegionalMember(nameB, b.Region, (b as any).Departement);

            // Official decree order if available (Abidjan = 1-2, Yamoussoukro = 3-6, Agneby-Tiassa = 7+, etc.)
            if (comiteA?.num && comiteB?.num) {
                return comiteA.num - comiteB.num;
            }

            const rawRegA = (a as any).Region || (a as any).region || comiteA?.region || '';
            const rawRegB = (b as any).Region || (b as any).region || comiteB?.region || '';
            const regA = getOfficialRegion(rawRegA);
            const regB = getOfficialRegion(rawRegB);

            const regComp = compareRegionsWithDistrictsFirst(regA, regB);
            if (regComp !== 0) return regComp;

            const deptA = (a as any).Departement || (a as any).departement || comiteA?.department || '';
            const deptB = (b as any).Departement || (b as any).departement || comiteB?.department || '';
            const deptComp = (deptA || '').localeCompare(deptB || '', 'fr', { sensitivity: 'base' });
            if (deptComp !== 0) return deptComp;

            return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
        });
    }, [employees]);

    // Customary Chief breakdown stats
    const chiefStats = useMemo(() => {
        let canton = 0;
        let tribu = 0;
        let village = 0;
        let multi = 0;
        let roi = 0;

        sortedEmployees.forEach(emp => {
            const st = getMemberChiefStatuses(emp);
            if (st.includes("Chef de Canton")) canton++;
            if (st.includes("Chef de Tribu")) tribu++;
            if (st.includes("Chef de Village")) village++;
            if (st.includes("Roi") || st.includes("Chef de Province")) roi++;
            if (st.length > 1) multi++;
        });

        return { canton, tribu, village, multi, roi, hasChiefs: (canton + tribu + village + roi + multi) > 0 };
    }, [sortedEmployees]);

    const getCellContent = (emp: Employe, key: ColumnKeys, idx: number) => {
        const fullName = `${emp.lastName || ''} ${emp.firstName || ''}`.trim() || emp.name || '';
        const comiteInfo = findComiteRegionalMember(fullName, emp.Region, (emp as any).Departement);

        switch (key) {
            case 'index': return idx + 1;
            case 'name': return fullName;
            case 'department': return emp.department || <span className="text-slate-300">-</span>;
            case 'CNPS': return emp.CNPS ? 'OUI' : 'NON';
            case 'sexe': {
                const s = emp.sexe?.trim();
                if (!s || s === '---') return <span className="text-slate-300 font-bold text-[8px]">-</span>;
                const isFemme = s.toLowerCase().startsWith('f');
                return (
                    <span className={cn(
                        "font-bold text-[8px]",
                        isFemme ? "text-rose-700 font-black" : "text-slate-800"
                    )}>
                        {isFemme ? "Femme" : "Homme"}
                    </span>
                );
            }
            case 'statutChef': {
                const statuses = getMemberChiefStatuses(emp);
                if (statuses.length === 0) return <span className="text-slate-300 font-bold text-[8px]">-</span>;
                return (
                    <div className="flex flex-wrap gap-1 justify-center items-center">
                        {statuses.map(s => (
                            <span 
                                key={s} 
                                className={cn(
                                    "px-1.5 py-0.5 rounded border text-[7.5px] font-black uppercase tracking-tight whitespace-nowrap",
                                    s === "Chef de Canton" && "bg-amber-50 border-amber-200 text-amber-900",
                                    s === "Chef de Tribu" && "bg-blue-50 border-blue-200 text-blue-900",
                                    s === "Chef de Village" && "bg-emerald-50 border-emerald-200 text-emerald-900",
                                    s === "Roi" && "bg-purple-50 border-purple-200 text-purple-900",
                                    s === "Chef de Province" && "bg-indigo-50 border-indigo-200 text-indigo-900",
                                    s === "Chef Central" && "bg-slate-100 border-slate-300 text-slate-900"
                                )}
                            >
                                {s}
                            </span>
                        ))}
                    </div>
                );
            }
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
                
                let contactStr = '';
                if (directContact && directContact !== '---' && directContact.trim().length > 0) {
                    contactStr = directContact.trim();
                } else if (comiteInfo?.contacts) {
                    contactStr = comiteInfo.contacts.trim();
                }
                
                const formatted = formatPhone(contactStr);
                if (!formatted) return <span className="text-slate-300 font-bold text-[8px]">-</span>;
                return (
                    <span className="font-mono tabular-nums font-bold tracking-tight text-slate-900 text-[8.5px]">
                        {formatted}
                    </span>
                );
            }
            case 'Date_Naissance': 
            case 'dateEmbauche': 
            case 'Date_Depart': {
                const val = (emp as any)[key];
                if (!val) return <span className="text-slate-300 font-bold text-[8px]">-</span>;
                try {
                    return format(new Date(val), 'dd/MM/yyyy');
                } catch (e) {
                    return val;
                }
            }
            case 'age': {
                if (!emp.Date_Naissance) return <span className="text-slate-300 font-bold text-[8px]">-</span>;
                const birthDate = new Date(emp.Date_Naissance);
                const age = new Date().getFullYear() - birthDate.getFullYear();
                return `${age} ans`;
            }
            case 'status': return (
                <span className={cn(
                    "font-black uppercase text-[7.5px] px-1.5 py-0.5 rounded",
                    emp.status === 'Actif' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-700 border border-slate-200"
                )}>
                    {emp.status}
                </span>
            );
            case 'Departement': {
                const rawDept = (emp as any).Departement || (emp as any).departement || comiteInfo?.department;
                const rawRegion = (emp as any).Region || (emp as any).region || comiteInfo?.region;
                if (!rawDept || rawDept === '---') return <span className="text-slate-300 font-bold text-[8px]">-</span>;
                return getOfficialDepartment(rawRegion || '', rawDept);
            }
            case 'Region': {
                const raw = (emp as any).Region || (emp as any).region || comiteInfo?.region;
                if (!raw || raw === '---') return <span className="text-slate-300 font-bold text-[8px]">-</span>;
                return getOfficialRegion(raw);
            }
            case 'subPrefecture': {
                const sp = (emp as any).subPrefecture || (emp as any).sousPrefecture || (emp as any).Commune;
                const cleaned = cleanVillage(sp);
                if (cleaned) return cleaned;
                if (comiteInfo?.department) return comiteInfo.department;
                return <span className="text-slate-300 font-bold text-[8px]">-</span>;
            }
            case 'Village': {
                const directVillage = (emp as any).Village || (emp as any).village || (emp as any).localite || (emp as any).villageName;
                const cleaned = cleanVillage(directVillage);
                if (cleaned) return cleaned;
                if (comiteInfo?.fonctionLocalite) {
                    const cleanedLocalite = cleanVillage(comiteInfo.fonctionLocalite);
                    if (cleanedLocalite) return cleanedLocalite;
                }
                return <span className="text-slate-300 font-bold text-[8px]">-</span>;
            }
            case 'poste': {
                const p = emp.poste || '';
                if (!p || p === '---') return <span className="text-slate-300 font-bold text-[8px]">-</span>;
                return <span className="italic text-slate-600 font-medium text-[8px]">{p}</span>;
            }
            default: return (emp as any)[key] || <span className="text-slate-300 font-bold text-[8px]">-</span>;
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
                <div className="print-page p-4 sm:p-5 bg-white flex flex-col items-center break-after-page min-h-0">
                    
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

                    {/* Synthesis Core KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-3xl mb-2">
                        <div className="flex flex-col items-center gap-0.5 p-2 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                            <Users className="h-3.5 w-3.5 text-slate-400 mb-0.5" />
                            <span className="text-xl font-black text-slate-900 leading-none">{stats.total}</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider text-center mt-0.5">Effectif Global</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 p-2 bg-[#f0f9f4] rounded-lg border border-[#006039]/20 shadow-sm">
                            <UserCheck className="h-3.5 w-3.5 text-[#006039] mb-0.5" />
                            <span className="text-xl font-black text-[#006039] leading-none">{stats.active}</span>
                            <span className="text-[8px] font-black text-[#006039] uppercase tracking-wider text-center mt-0.5">Agents Actifs</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 p-2 bg-[#f0f5ff] rounded-lg border border-blue-200 shadow-sm">
                            <TrendingUp className="h-3.5 w-3.5 text-blue-500 mb-0.5" />
                            <span className="text-xl font-black text-blue-700 leading-none">{stats.men}</span>
                            <span className="text-[8px] font-black text-blue-600 uppercase tracking-wider text-center mt-0.5">Hommes</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 p-2 bg-[#fff0f4] rounded-lg border border-rose-200 shadow-sm">
                            <PieChart className="h-3.5 w-3.5 text-rose-500 mb-0.5" />
                            <span className="text-xl font-black text-rose-700 leading-none">{stats.women}</span>
                            <span className="text-[8px] font-black text-rose-600 uppercase tracking-wider text-center mt-0.5">Femmes</span>
                        </div>
                    </div>

                    {/* Customary Chief Statuses Cards (If applicable) */}
                    {chiefStats.hasChiefs && (
                        <div className="w-full max-w-3xl mt-2 pt-2 border-t border-slate-200">
                            <div className="text-center mb-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Répartition par Titres Coutumiers</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="flex flex-col items-center p-2 bg-amber-50 rounded-lg border border-amber-200 shadow-sm">
                                    <Crown className="h-3.5 w-3.5 text-amber-600 mb-0.5" />
                                    <span className="text-lg font-black text-amber-900 leading-none">{chiefStats.canton}</span>
                                    <span className="text-[8px] font-black text-amber-700 uppercase tracking-wider text-center mt-0.5">Chefs de Canton</span>
                                </div>
                                <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                                    <Shield className="h-3.5 w-3.5 text-blue-600 mb-0.5" />
                                    <span className="text-lg font-black text-blue-900 leading-none">{chiefStats.tribu}</span>
                                    <span className="text-[8px] font-black text-blue-700 uppercase tracking-wider text-center mt-0.5">Chefs de Tribu</span>
                                </div>
                                <div className="flex flex-col items-center p-2 bg-emerald-50 rounded-lg border border-emerald-200 shadow-sm">
                                    <Users className="h-3.5 w-3.5 text-emerald-600 mb-0.5" />
                                    <span className="text-lg font-black text-emerald-900 leading-none">{chiefStats.village}</span>
                                    <span className="text-[8px] font-black text-emerald-700 uppercase tracking-wider text-center mt-0.5">Chefs de Village</span>
                                </div>
                                <div className="flex flex-col items-center p-2 bg-purple-50 rounded-lg border border-purple-200 shadow-sm">
                                    <Layers className="h-3.5 w-3.5 text-purple-600 mb-0.5" />
                                    <span className="text-lg font-black text-purple-900 leading-none">{chiefStats.multi}</span>
                                    <span className="text-[8px] font-black text-purple-700 uppercase tracking-wider text-center mt-0.5">Plusieurs Casquettes</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- PAGE DE DONNÉES --- */}
                <div className="print-page p-3 sm:p-4 landscape-section bg-white break-before-page">
                    
                    {/* Header text above table */}
                    <div className="mb-2 text-[10px] font-black text-slate-800 uppercase tracking-wider text-left border-b border-slate-200 pb-1 flex justify-between items-center">
                        <span>LISTE PERSONNEL {unitLabel} DU {todayStr}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{sortedEmployees.length} MEMBRES ENREGISTRÉS</span>
                    </div>

                    {/* Data Table */}
                    <div className="w-full overflow-visible mt-1 shadow-sm rounded-lg overflow-hidden border border-slate-300">
                        <table className="w-full border-collapse text-[8.5px] leading-normal bg-white">
                            <thead className="bg-slate-900 text-white">
                                <tr className="bg-slate-900 text-white uppercase font-black text-center [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                                    {columnsToDisplay.map((key) => (
                                        <th key={key} className={cn(
                                            "border-r border-slate-700 last:border-r-0 py-2.5 px-2 align-middle break-words text-[8.5px] font-black tracking-wider bg-slate-900 text-white [print-color-adjust:exact] [-webkit-print-color-adjust:exact]",
                                            key === 'index' && "w-[32px] text-center",
                                            key === 'matricule' && "w-[52px] text-center",
                                            key === 'name' && "w-[24%] min-w-[170px] text-left pl-2.5",
                                            key === 'sexe' && "w-[5%] min-w-[42px] text-center",
                                            (key === 'contact' || key === 'email') && "w-[15%] min-w-[105px] text-center",
                                            key === 'status' && "w-[6%] min-w-[48px] text-center",
                                            (key === 'Date_Naissance' || key === 'dateEmbauche' || key === 'Date_Depart') && "w-[9%] min-w-[70px] text-center",
                                            key === 'Lieu_Naissance' && "w-[11%] min-w-[85px] text-left pl-2",
                                            key === 'poste' && "w-[13%] min-w-[100px] text-left pl-2",
                                            key === 'statutChef' && "w-[17%] min-w-[125px] text-center",
                                            key === 'Region' && "w-[13%] min-w-[100px] text-left pl-2",
                                            key === 'Departement' && "w-[12%] min-w-[90px] text-left pl-2",
                                            (key === 'department' || key === 'subPrefecture' || key === 'Village') && "w-[11%] min-w-[85px] text-left pl-2"
                                        )}>
                                            {getColumnLabel(key)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedEmployees.map((emp, idx) => (
                                    <tr key={emp.id || idx} className="border-b border-slate-200 even:bg-slate-50/70 hover:bg-slate-100/60 transition-colors break-inside-avoid">
                                        {columnsToDisplay.map((key) => (
                                            <td key={key} className={cn(
                                                "border-r border-slate-200 last:border-r-0 py-1.5 px-2 align-middle",
                                                (key === 'index' || key === 'sexe' || key === 'status' || key === 'Date_Naissance' || key === 'dateEmbauche' || key === 'Date_Depart' || key === 'statutChef' || key === 'CNPS') && "text-center",
                                                key === 'index' && "font-bold text-slate-500 text-[8.5px]",
                                                key === 'name' && "font-black uppercase text-slate-900 text-[8.5px] pl-2",
                                                key === 'matricule' && "font-mono font-bold text-slate-600 text-center text-[8px]",
                                                (key === 'contact' || key === 'email') && "text-center whitespace-nowrap",
                                                key === 'poste' && "text-[8.5px] pl-2",
                                                (key === 'department' || key === 'Departement' || key === 'Region' || key === 'Village' || key === 'subPrefecture') && "font-semibold text-slate-800 text-[8.5px] pl-2"
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
                            width: 100% !important;
                        }
                        thead {
                            display: table-header-group !important;
                        }
                        thead tr {
                            background-color: #0f172a !important;
                            color: #ffffff !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        thead th {
                            background-color: #0f172a !important;
                            color: #ffffff !important;
                            font-weight: 900 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
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
