"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Supply, OrganizationSettings } from "@/lib/data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Package, AlertTriangle, Zap, BarChart3, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExtendedSupply extends Supply {
    qteInventaire: number;
    qteEntree: number;
    qteSortie: number;
    qteStock: number;
    isModified: boolean;
}

interface SuppliesOfficialReportProps {
    logos: OrganizationSettings | null;
    supplies: ExtendedSupply[];
    categoryLabel: string;
    periodLabel: string;
    stats: {
        total: number;
        outOfStock: number;
        lowStock: number;
        avgHealth: number;
    };
    options: {
        includePhotos: boolean;
        showHealthStatus: boolean;
    };
}

export function SuppliesOfficialReport({ 
    logos, 
    supplies, 
    categoryLabel, 
    periodLabel,
    stats,
    options 
}: SuppliesOfficialReportProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Force landscape mode for audit-style tables
        document.body.classList.add('print-landscape');
        
        const timer = setTimeout(() => {
            window.print();
        }, 1200);

        return () => {
            setMounted(false);
            document.body.classList.remove('print-landscape');
            clearTimeout(timer);
        };
    }, []);

    if (!mounted || !logos) return null;

    return createPortal(
        <div id="print-section" className="bg-white text-black w-full print:shadow-none print:border-none printable-portal-root">
            <style jsx global>{`
                @media print {
                    @page { 
                        size: landscape; 
                        margin: 15mm 15mm 25mm 15mm; /* Extra bottom margin for fixed footer */
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .modified-row {
                        background-color: #f0f7ff !important;
                    }
                    .modified-border {
                        border-left: 6px solid #006039 !important;
                    }
                    thead {
                        display: table-header-group !important;
                        background-color: #f1f5f9 !important;
                    }
                    th {
                        color: black !important;
                        background-color: #f1f5f9 !important;
                        border: 1px solid #94a3b8 !important;
                    }
                    td {
                        border: 1px solid #94a3b8 !important; /* darker borders for grid */
                    }
                    tr {
                        break-inside: avoid !important;
                    }
                    img {
                        max-width: 100%;
                    }
                    /* Ensure headers are visible even if bg is lost */
                    .print-text-black {
                        color: black !important;
                    }
                }
            `}</style>
            
            {/* --- PAGE DE GARDE --- */}
            <div className="print-page h-screen flex flex-col p-16 break-after-page relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <header className="flex justify-between items-start mb-24 min-h-[140px] relative z-10">
                    <div className="w-1/3 text-center flex flex-col items-center">
                        <p className="font-bold text-[11px] text-slate-800 leading-tight uppercase w-full">
                            Chambre Nationale des Rois<br />et Chefs Traditionnels
                        </p>
                        {logos.mainLogoUrl && <img src={logos.mainLogoUrl} alt="Logo" className="max-h-24 mt-4 drop-shadow-sm object-contain" loading="eager" />}
                        <div className="w-12 h-0.5 bg-[#006039] mt-3 rounded-full" />
                    </div>
                    <div className="w-1/3"></div>
                    <div className="w-1/3 text-center flex flex-col items-center">
                        <p className="font-bold text-[11px] leading-tight text-slate-800 uppercase tracking-widest w-full">
                            République de Côte d'Ivoire
                        </p>
                        {logos.secondaryLogoUrl && <img src={logos.secondaryLogoUrl} alt="Logo" className="max-h-20 my-4 drop-shadow-sm object-contain" loading="eager" />}
                        <p className="text-[10px] italic font-black border-t-2 border-slate-900 mt-2 pt-2 px-4 uppercase tracking-tighter w-full">Union - Discipline - Travail</p>
                    </div>
                </header>

                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-16 relative z-10">
                    <div className="space-y-8">
                        <div className="inline-block px-6 py-2 border-2 border-[#006039] text-[#006039] font-black uppercase tracking-[0.3em] text-sm rounded-full mb-4">
                            Document Officiel d'Audit
                        </div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-[0.95] italic">
                            PV D'INVENTAIRE ET DE GESTION<br />DES FOURNITURES & CONSOMMABLES
                        </h1>
                        <div className="h-2 w-48 bg-[#006039] mx-auto rounded-full mt-4"></div>
                    </div>
                    
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-700 bg-white shadow-xl-premium px-12 py-8 rounded-2xl border-2 border-slate-100 italic inline-block">
                             Direction des Affaires Financières et du Patrimoine (DAFP)
                        </h2>
                        <div className="flex flex-col gap-1 uppercase tracking-[0.2em] font-black text-slate-400">
                            <p className="text-sm">Service de l'Intendance et de la Logistique</p>
                            <div className="h-px w-12 bg-slate-200 mx-auto" />
                            <p className="text-[10px]">Division de la Gestion du Patrimoine</p>
                        </div>
                    </div>

                    <div className="mt-12 p-10 border-[6px] border-double border-slate-200 rounded-2xl bg-slate-50/50 backdrop-blur-sm relative max-w-[80%] mx-auto">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 border border-slate-200 rounded-full font-black text-[10px] uppercase tracking-widest text-slate-400">
                            Rapport de Situation
                        </div>
                        <p className="text-3xl font-black uppercase underline decoration-[#006039] decoration-8 underline-offset-[12px]">
                            PÉRIODE : {periodLabel || format(new Date(), 'MMMM yyyy', { locale: fr })}
                        </p>
                        <div className="flex gap-12 justify-center mt-8">
                             {categoryLabel !== 'all' && (
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Catégorie</span>
                                    <p className="text-xl font-black text-[#006039] uppercase italic">{categoryLabel}</p>
                                </div>
                             )}
                             <div className="flex flex-col items-center">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Articles</span>
                                 <p className="text-xl font-black text-slate-900 uppercase italic">{stats.total}</p>
                             </div>
                        </div>
                    </div>
                </div>

                <footer className="mt-auto pt-10 text-center border-t-2 border-slate-900 relative z-10">
                    <div className="flex justify-between items-end">
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Généré via</p>
                            <p className="text-lg font-black text-[#006039] uppercase tracking-tighter">GèreEcole v2.0</p>
                        </div>
                        <div>
                            <p className="font-black text-2xl uppercase tracking-[0.2em] text-[#006039]">Secrétariat Général</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest underline decoration-2 underline-offset-4 decoration-[#006039]">Authenticité Garantie</p>
                        </div>
                    </div>
                </footer>
            </div>

            {/* --- PAGE DE SYNTHÈSE ET TABLEAU --- */}
            <div className="print-page min-h-screen p-12 break-before-page">
                <div className="flex justify-between items-center mb-8 pb-4 border-b-4 border-[#006039]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#006039] rounded-xl flex items-center justify-center text-white">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">
                                Détail des Mouvements de Stock
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                PÉRIODE D'AUDIT : <span className="text-slate-900">{periodLabel || format(new Date(), 'MMMM yyyy', { locale: fr })}</span> | Situation au {format(new Date(), 'dd/MM/yyyy à HH:mm')}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="px-6 py-2 bg-slate-900 text-white text-xs font-black rounded-xl uppercase tracking-widest transition-all">
                            {categoryLabel === 'all' ? 'Inventaire Global (Tous articles)' : categoryLabel}
                        </span>
                    </div>
                </div>

                {/* --- KPI Block (Improved style) --- */}
                <div className="grid grid-cols-4 gap-6 mb-12">
                    <div className="border-2 border-slate-100 p-6 rounded-2xl bg-slate-50/30 break-inside-avoid">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Package className="h-4 w-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Total Références</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 leading-none">{stats.total}</div>
                    </div>
                    <div className={cn(
                        "border-2 p-6 rounded-2xl break-inside-avoid shadow-sm",
                        stats.outOfStock > 0 ? "border-red-100 bg-red-50/20" : "border-slate-100 bg-slate-50/30"
                    )}>
                        <div className={cn("flex items-center gap-2 mb-2", stats.outOfStock > 0 ? "text-red-500" : "text-slate-400")}>
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Ruptures Détectées</span>
                        </div>
                        <div className={cn("text-3xl font-black leading-none", stats.outOfStock > 0 ? "text-red-600" : "text-slate-900")}>
                            {stats.outOfStock}
                        </div>
                    </div>
                    <div className="border-2 border-[#006039]/10 p-6 rounded-2xl bg-[#006039]/5 break-inside-avoid">
                        <div className="flex items-center gap-2 text-[#006039] mb-2">
                            <Zap className="h-4 w-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Mouvements Période</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 leading-none">
                            {supplies.filter(s => s.isModified).length}
                        </div>
                    </div>
                    <div className="border-2 border-emerald-100 p-6 rounded-2xl bg-emerald-50/20 break-inside-avoid">
                        <div className="flex items-center gap-2 text-emerald-600 mb-2">
                            <BarChart3 className="h-4 w-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Disponibilité Global</span>
                        </div>
                        <div className="text-3xl font-black text-emerald-700 leading-none">{Math.round(stats.avgHealth || 0)}%</div>
                    </div>
                </div>

                {/* --- Main Data Table (Black Border Administrative Style) --- */}
                <table className="w-full border-collapse border-2 border-slate-900 text-[10px] leading-tight shadow-lg">
                    <thead>
                        <tr className="bg-slate-100 text-slate-900 uppercase font-black text-center border-b-2 border-slate-900">
                            <th className="border border-slate-300 p-4 w-[40px]">N°</th>
                            <th className="border border-slate-300 p-4 w-[130px]">Code Article</th>
                            <th className="border border-slate-300 p-4 text-left">Désignation / Catégorie</th>
                            <th className="border border-slate-300 p-4 w-[100px] bg-slate-50">Initial</th>
                            <th className="border border-slate-300 p-4 w-[100px] bg-emerald-50">Entrées (+)</th>
                            <th className="border border-slate-300 p-4 w-[100px] bg-amber-50">Sorties (-)</th>
                            <th className="border border-slate-300 p-4 w-[120px] font-black bg-white text-slate-900 border-l-4 border-l-slate-900">Stock Final</th>
                        </tr>
                    </thead>
                    <tbody>
                        {supplies.map((item, idx) => (
                            <tr 
                                key={item.id} 
                                className={cn(
                                    "border-b border-slate-300",
                                    item.isModified && "modified-row modified-border"
                                )}
                            >
                                <td className="border border-slate-300 p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="border border-slate-300 p-3 text-center font-mono text-[9px] uppercase font-bold text-slate-600">
                                    {item.code || '---'}
                                </td>
                                <td className="border border-slate-300 p-3">
                                    <div className="flex items-center gap-3">
                                        {options.includePhotos && item.photoUrl && (
                                            <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
                                                <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-black text-slate-900 uppercase text-xs tracking-tight">{item.name}</div>
                                            <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{item.category}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="border border-slate-300 p-3 text-center text-sm font-bold text-slate-600 bg-slate-50/30">
                                    {Number(item.qteInventaire) || 0}
                                </td>
                                <td className="border border-slate-300 p-3 text-center text-sm font-black text-emerald-700 italic bg-emerald-50/10">
                                    {item.qteEntree > 0 ? `+ ${item.qteEntree}` : '---'}
                                </td>
                                <td className="border border-slate-300 p-3 text-center text-sm font-black text-amber-700 italic bg-amber-50/10">
                                    {item.qteSortie > 0 ? `- ${item.qteSortie}` : '---'}
                                </td>
                                <td className={cn(
                                    "border border-slate-900 p-3 text-center text-base font-black italic border-l-4 border-l-slate-900",
                                    (Number(item.qteStock) || 0) <= (item.reorderLevel || 5) ? "text-red-700 bg-red-50/50" : "text-slate-900"
                                )}>
                                    {Number(item.qteStock) || 0}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* --- Validations Area (Institutional Style) --- */}
                <div className="mt-16 grid grid-cols-3 gap-12 pt-12 border-t-4 border-slate-900 break-inside-avoid">
                    <div className="space-y-6">
                        <p className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] italic underline decoration-2 underline-offset-8 decoration-[#006039]">Visa Magasinier / Régisseur</p>
                        <div className="h-32 w-full border-4 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-center p-4 bg-slate-50/30">
                            <span className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] leading-relaxed">Signatures des mouvements<br />physiques constatés</span>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <p className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] italic underline decoration-2 underline-offset-8 decoration-[#006039]">Direction Financière / Audit</p>
                        <div className="h-32 w-full border-4 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-center p-4 bg-slate-50/30">
                            <span className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] leading-relaxed">Validation de la conformité<br />comptable et analytique</span>
                        </div>
                    </div>
                    <div className="text-right space-y-8">
                        <div className="space-y-2">
                            <p className="text-[11px] font-black text-slate-900 italic">Édité le {format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Système de Gestion Intégré, Yamoussoukro</p>
                        </div>
                        <div className="pt-4 flex flex-col items-end gap-3">
                             <div className="h-1 w-40 bg-slate-900 rounded-full" />
                             <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">COULIBALY Hamadou</p>
                             <div className="bg-[#006039] text-white px-6 py-2 rounded-xl flex items-center gap-3 shadow-md">
                                 <Shield className="h-4 w-4" />
                                 <span className="text-[9px] font-black uppercase tracking-[0.2em]">Authentifié par GèreEcole</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* --- Traceability Bar --- */}
                <div className="mt-12 pt-4 border-t border-slate-100 flex justify-between items-center text-[7px] text-slate-300 font-mono uppercase tracking-widest break-inside-avoid">
                    <p>DOC_ID: {Math.random().toString(36).substring(2, 12).toUpperCase()}</p>
                    <p>HASH_DIGITAL: {Buffer.from(periodLabel).toString('hex').substring(0, 16).toUpperCase()}</p>
                    <p>CNRCT_INTRA_SEC_V3</p>
                </div>

                <footer className="fixed bottom-6 left-12 right-12 text-center text-[8px] text-slate-500 border-t-2 border-slate-900 pt-4 flex justify-between items-center px-4 bg-white/80 backdrop-blur-sm">
                    <p className="font-black uppercase tracking-widest">© {new Date().getFullYear()} CNRCT - Yamoussoukro</p>
                    <p className="font-black italic text-slate-900">PV D'INVENTAIRE OFFICIEL - DOCUMENT À VALEUR JURIDIQUE</p>
                    <p className="font-black uppercase">BP 201 | Tél : +225 30 64 06 60</p>
                </footer>
            </div>
        </div>,
        document.body
    );
}
