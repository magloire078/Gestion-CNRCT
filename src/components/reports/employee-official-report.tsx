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
import { findComiteRegionalMember, getMemberChiefStatuses, getMemberProfile } from "@/lib/comites-regionaux-2026";
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

function cleanValue(raw?: string | null): string {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '.' || trimmed === '-' || trimmed === '---' || trimmed === 'N/A' || trimmed === 'null') {
        return '';
    }
    return trimmed;
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

    const getColumnWidthClass = (key: ColumnKeys) => {
        switch (key) {
            case 'index': return "w-[30px] min-w-[30px] text-center";
            case 'matricule': return "w-[56px] min-w-[50px] text-center";
            case 'Region': return "w-[11%] min-w-[70px] text-left";
            case 'Departement': return "w-[11%] min-w-[70px] text-left";
            case 'subPrefecture': return "w-[11%] min-w-[70px] text-left";
            case 'Village': return "w-[12%] min-w-[75px] text-left";
            case 'name': return "w-[22%] min-w-[120px] text-left";
            case 'poste': return "w-[12%] min-w-[75px] text-left";
            case 'statutChef': return "w-[12%] min-w-[85px] text-center";
            case 'profile': return "w-[76px] min-w-[72px] text-center";
            case 'status': return "w-[52px] min-w-[48px] text-center";
            case 'sexe': return "w-[44px] min-w-[40px] text-center";
            case 'contact':
            case 'email': return "w-[84px] min-w-[75px] text-center";
            case 'situationMatrimoniale': return "w-[64px] min-w-[55px] text-center";
            case 'enfants': return "w-[40px] min-w-[35px] text-center";
            case 'CNPS': return "w-[40px] min-w-[35px] text-center";
            case 'Date_Naissance':
            case 'dateEmbauche':
            case 'Date_Depart': return "w-[68px] min-w-[60px] text-center";
            case 'age': return "w-[44px] min-w-[40px] text-center";
            case 'Lieu_Naissance': return "w-[11%] min-w-[70px] text-left";
            case 'department': return "w-[12%] min-w-[75px] text-left";
            default: return "w-auto text-left";
        }
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
            case 'index': return <span className="font-bold text-slate-500 text-[8px]">{idx + 1}</span>;
            case 'name': return <span className="font-bold uppercase text-slate-900 text-[8px] tracking-tight">{fullName || <span className="text-slate-300">—</span>}</span>;
            case 'department': {
                const val = cleanValue(emp.department);
                return val ? <span className="font-semibold text-slate-800 text-[8px]">{val}</span> : <span className="text-slate-300">—</span>;
            }
            case 'CNPS': return emp.CNPS ? <span className="font-bold text-emerald-700 text-[8px]">OUI</span> : <span className="text-slate-400 text-[8px]">NON</span>;
            case 'sexe': {
                const s = cleanValue(emp.sexe);
                if (!s) return <span className="text-slate-300 font-bold text-[8px]">—</span>;
                const isFemme = s.toLowerCase().startsWith('f');
                return (
                    <span className={cn(
                        "font-bold text-[8px] uppercase",
                        isFemme ? "text-rose-700 font-black" : "text-slate-800"
                    )}>
                        {isFemme ? "F" : "M"}
                    </span>
                );
            }
            case 'situationMatrimoniale': {
                const val = cleanValue(emp.situationMatrimoniale || (emp as any).situation_famille || (emp as any).Situation_Matrimoniale);
                if (!val) return <span className="text-slate-300 font-bold text-[8px]">—</span>;
                return <span className="font-semibold text-[8px] text-slate-800 uppercase">{val}</span>;
            }
            case 'enfants': {
                const val = emp.enfants ?? (emp as any).nombre_enfants;
                if (val === undefined || val === null || val === '' || val === 0) return <span className="text-slate-300 font-bold text-[8px]">—</span>;
                return <span className="font-black text-[8px] text-slate-800 tabular-nums">{val}</span>;
            }
            case 'statutChef': {
                const statuses = getMemberChiefStatuses(emp);
                if (statuses.length === 0) return <span className="text-slate-300 font-bold text-[8px]">—</span>;
                return (
                    <div className="flex flex-col gap-0.5 justify-center items-center py-0.5">
                        {statuses.map(s => {
                            const isRoi = s.toLowerCase().includes("roi") || s.toLowerCase().includes("province");
                            const isCanton = s.toLowerCase().includes("canton");
                            const isTribu = s.toLowerCase().includes("tribu");
                            const isVillage = s.toLowerCase().includes("village");
                            return (
                                <span 
                                    key={s} 
                                    className={cn(
                                        "text-[7px] font-black tracking-tight uppercase leading-tight px-1.5 py-0.5 rounded border whitespace-nowrap",
                                        isRoi ? "bg-purple-50 text-purple-950 border-purple-200" :
                                        isCanton ? "bg-amber-50 text-amber-950 border-amber-200" :
                                        isTribu ? "bg-blue-50 text-blue-950 border-blue-200" :
                                        isVillage ? "bg-emerald-50 text-emerald-950 border-emerald-200" :
                                        "bg-slate-50 text-slate-900 border-slate-200"
                                    )}
                                >
                                    {s}
                                </span>
                            );
                        })}
                    </div>
                );
            }
            case 'profile': {
                const prof = cleanValue(getMemberProfile(emp) || (emp as any).profile || (emp.estRenouvele !== undefined ? (emp.estRenouvele ? 'Reconduit' : 'Nouveau') : ''));
                if (!prof) return <span className="text-slate-300 font-bold text-[8px]">—</span>;
                const isReconduit = prof.toLowerCase().includes('reconduit');
                const isRemplace = prof.toLowerCase().includes('remplac');
                return (
                    <span className={cn(
                        "text-[7px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider whitespace-nowrap inline-block border",
                        isReconduit ? "bg-emerald-50 text-emerald-800 border-emerald-300" :
                        isRemplace ? "bg-rose-50 text-rose-800 border-rose-300" :
                        "bg-blue-50 text-blue-800 border-blue-300"
                    )}>
                        {prof}
                    </span>
                );
            }
            case 'contact':
            case 'email': {
                const directContact = cleanValue(emp.mobile || 
                    (emp as any).contact || 
                    (emp as any).contacts || 
                    (emp as any).telephone || 
                    (emp as any).phone || 
                    (emp as any).Contact || 
                    (emp as any).tel || 
                    (emp as any).Mobile || 
                    ((emp.email && !emp.email.includes('@intras') && !emp.email.includes('cnrct.ci')) ? emp.email : ''));
                
                let contactStr = '';
                if (directContact) {
                    contactStr = directContact;
                } else if (comiteInfo?.contacts) {
                    contactStr = cleanValue(comiteInfo.contacts);
                }
                
                const formatted = formatPhone(contactStr);
                if (!formatted) return <span className="text-slate-300 font-bold text-[8px]">—</span>;
                return (
                    <span className="font-mono tabular-nums font-bold tracking-tight text-slate-800 text-[8px] whitespace-nowrap">
                        {formatted}
                    </span>
                );
            }
            case 'Date_Naissance': 
            case 'dateEmbauche': 
            case 'Date_Depart': {
                const val = (emp as any)[key];
                if (!val) return <span className="text-slate-300 font-bold text-[8px]">—</span>;
                try {
                    return <span className="font-mono text-[8px] font-semibold text-slate-800">{format(new Date(val), 'dd/MM/yyyy')}</span>;
                } catch (e) {
                    return <span className="text-[8px]">{val}</span>;
                }
            }
            case 'age': {
                if (!emp.Date_Naissance) return <span className="text-slate-300 font-bold text-[8px]">—</span>;
                const birthDate = new Date(emp.Date_Naissance);
                const age = new Date().getFullYear() - birthDate.getFullYear();
                return <span className="font-bold text-[8px] text-slate-800">{age} ans</span>;
            }
            case 'status': {
                const st = cleanValue(emp.status);
                if (!st) return <span className="text-slate-300 font-bold text-[8px]">—</span>;
                return (
                    <span className={cn(
                        "font-black uppercase text-[7px] tracking-wider px-1.5 py-0.5 rounded border inline-block whitespace-nowrap",
                        st === 'Actif' ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"
                    )}>
                        {st}
                    </span>
                );
            }
            case 'Departement': {
                const rawDept = cleanValue((emp as any).Departement || (emp as any).departement || comiteInfo?.department);
                const rawRegion = cleanValue((emp as any).Region || (emp as any).region || comiteInfo?.region);
                if (!rawDept) return <span className="text-slate-300 font-bold text-[8px]">—</span>;
                return <span className="font-bold text-slate-800 text-[8px] uppercase">{getOfficialDepartment(rawRegion || '', rawDept)}</span>;
            }
            case 'Region': {
                const raw = cleanValue((emp as any).Region || (emp as any).region || comiteInfo?.region);
                if (!raw) return <span className="text-slate-300 font-bold text-[8px]">—</span>;
                return <span className="font-black text-slate-900 text-[8px] uppercase">{getOfficialRegion(raw)}</span>;
            }
            case 'subPrefecture': {
                const sp = cleanValue((emp as any).subPrefecture || (emp as any).sousPrefecture || (emp as any).Commune);
                const cleaned = cleanVillage(sp);
                if (cleaned) return <span className="font-semibold text-slate-800 text-[8px] uppercase">{cleaned}</span>;
                if (comiteInfo?.department) return <span className="font-semibold text-slate-800 text-[8px] uppercase">{comiteInfo.department}</span>;
                return <span className="text-slate-300 font-bold text-[8px]">—</span>;
            }
            case 'Village': {
                const directVillage = cleanValue((emp as any).Village || (emp as any).village || (emp as any).localite || (emp as any).villageName);
                const cleaned = cleanVillage(directVillage);
                if (cleaned) return <span className="font-semibold text-slate-800 text-[8px] uppercase">{cleaned}</span>;
                if (comiteInfo?.fonctionLocalite) {
                    const cleanedLocalite = cleanVillage(comiteInfo.fonctionLocalite);
                    if (cleanedLocalite) return <span className="font-semibold text-slate-800 text-[8px] uppercase">{cleanedLocalite}</span>;
                }
                return <span className="text-slate-300 font-bold text-[8px]">—</span>;
            }
            case 'poste': {
                const p = cleanValue(emp.poste);
                if (!p) return <span className="text-slate-300 font-bold text-[8px]">—</span>;
                return <span className="font-bold text-slate-700 text-[8px] uppercase tracking-tight">{p}</span>;
            }
            default: {
                const val = cleanValue((emp as any)[key]);
                return val ? <span className="text-[8px] text-slate-800">{val}</span> : <span className="text-slate-300 font-bold text-[8px]">—</span>;
            }
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
                    
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mb-1 text-center max-w-4xl">
                      ÉTAT NOMINATIF DU PERSONNEL ET DES EFFECTIFS REPRÉSENTÉS
                    </h1>
                    
                    <p className="text-sm sm:text-base font-bold text-slate-600 uppercase tracking-wider mb-2 text-center">
                      PÉRIMÈTRE : {unitLabel}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px w-8 bg-slate-300" />
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                        <Calendar className="h-3 w-3 text-emerald-600" />
                        {todayStr}
                      </div>
                      <div className="h-px w-8 bg-slate-300" />
                    </div>

                    {/* Synthesis Core KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-3xl mb-2">
                        <div className="flex flex-col items-center gap-0.5 p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                            <Users className="h-4 w-4 text-slate-500 mb-0.5" />
                            <span className="text-2xl font-black text-slate-900 leading-none">{stats.total}</span>
                            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider text-center mt-0.5">Effectif Global</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 shadow-sm">
                            <UserCheck className="h-4 w-4 text-emerald-700 mb-0.5" />
                            <span className="text-2xl font-black text-emerald-950 leading-none">{stats.active}</span>
                            <span className="text-[8.5px] font-black text-emerald-800 uppercase tracking-wider text-center mt-0.5">Membres Actifs</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 p-3 bg-blue-50/60 rounded-xl border border-blue-200 shadow-sm">
                            <TrendingUp className="h-4 w-4 text-blue-600 mb-0.5" />
                            <span className="text-2xl font-black text-blue-950 leading-none">{stats.men}</span>
                            <span className="text-[8.5px] font-black text-blue-700 uppercase tracking-wider text-center mt-0.5">Hommes</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 p-3 bg-rose-50/60 rounded-xl border border-rose-200 shadow-sm">
                            <PieChart className="h-4 w-4 text-rose-600 mb-0.5" />
                            <span className="text-2xl font-black text-rose-950 leading-none">{stats.women}</span>
                            <span className="text-[8.5px] font-black text-rose-700 uppercase tracking-wider text-center mt-0.5">Femmes</span>
                        </div>
                    </div>

                    {/* Customary Chief Statuses Cards (If applicable) */}
                    {chiefStats.hasChiefs && (
                        <div className="w-full max-w-3xl mt-3 pt-3 border-t border-slate-200">
                            <div className="text-center mb-2.5">
                                <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-500">Répartition par Titres Coutumiers</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="flex flex-col items-center p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 shadow-sm">
                                    <Crown className="h-4 w-4 text-amber-600 mb-0.5" />
                                    <span className="text-xl font-black text-amber-950 leading-none">{chiefStats.canton}</span>
                                    <span className="text-[8px] font-black text-amber-800 uppercase tracking-wider text-center mt-0.5">Chefs de Canton</span>
                                </div>
                                <div className="flex flex-col items-center p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 shadow-sm">
                                    <Shield className="h-4 w-4 text-blue-600 mb-0.5" />
                                    <span className="text-xl font-black text-blue-950 leading-none">{chiefStats.tribu}</span>
                                    <span className="text-[8px] font-black text-blue-800 uppercase tracking-wider text-center mt-0.5">Chefs de Tribu</span>
                                </div>
                                <div className="flex flex-col items-center p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 shadow-sm">
                                    <Users className="h-4 w-4 text-emerald-600 mb-0.5" />
                                    <span className="text-xl font-black text-emerald-950 leading-none">{chiefStats.village}</span>
                                    <span className="text-[8px] font-black text-emerald-800 uppercase tracking-wider text-center mt-0.5">Chefs de Village</span>
                                </div>
                                <div className="flex flex-col items-center p-2.5 bg-purple-50/80 rounded-xl border border-purple-200 shadow-sm">
                                    <Layers className="h-4 w-4 text-purple-600 mb-0.5" />
                                    <span className="text-xl font-black text-purple-950 leading-none">{chiefStats.multi}</span>
                                    <span className="text-[8px] font-black text-purple-800 uppercase tracking-wider text-center mt-0.5">Cumuls de Titres</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- PAGE DE DONNÉES --- */}
                <div className="print-page p-3 sm:p-4 landscape-section bg-white break-before-page">
                    
                    {/* Header text above table */}
                    <div className="mb-2 text-[10px] font-black text-slate-900 uppercase tracking-wider text-left border-b-2 border-slate-900 pb-1.5 flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
                            LISTE DU PERSONNEL {unitLabel} — ÉDITION DU {todayStr}
                        </span>
                        <span className="text-[9.5px] text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                            {sortedEmployees.length} MEMBRES ENREGISTRÉS
                        </span>
                    </div>

                    {/* Data Table */}
                    <div className="w-full overflow-hidden rounded-lg border border-slate-300 shadow-sm">
                        <table className="w-full table-fixed border-collapse text-[8px] leading-tight bg-white">
                            <thead>
                                <tr className="bg-slate-900 text-white uppercase font-black text-center border-b border-slate-900">
                                    {columnsToDisplay.map((key) => (
                                        <th 
                                            key={key} 
                                            className={cn(
                                                "border-r border-slate-700 last:border-r-0 py-2 px-1.5 align-middle text-[8px] font-black tracking-wider text-white uppercase bg-slate-900",
                                                getColumnWidthClass(key)
                                            )}
                                        >
                                            {getColumnLabel(key)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedEmployees.map((emp, idx) => (
                                    <tr key={emp.id || idx} className="border-b border-slate-200 even:bg-slate-50/70 hover:bg-slate-100/70 transition-colors break-inside-avoid">
                                        {columnsToDisplay.map((key) => (
                                            <td key={key} className={cn(
                                                "border-r border-slate-200 last:border-r-0 py-1.5 px-1.5 align-middle break-words",
                                                (key === 'index' || key === 'sexe' || key === 'status' || key === 'profile' || key === 'Date_Naissance' || key === 'dateEmbauche' || key === 'Date_Depart' || key === 'statutChef' || key === 'CNPS' || key === 'enfants' || key === 'age') && "text-center",
                                                (key === 'name' || key === 'Region' || key === 'Departement' || key === 'Village' || key === 'subPrefecture' || key === 'poste' || key === 'department' || key === 'Lieu_Naissance') && "text-left pl-2",
                                                key === 'matricule' && "text-center font-mono font-bold text-slate-700 text-[7.5px]"
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
                            table-layout: fixed !important;
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
                            border-right: 1px solid #334155 !important;
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
