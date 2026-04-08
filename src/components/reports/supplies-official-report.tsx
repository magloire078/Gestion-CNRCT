"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Supply, OrganizationSettings } from "@/lib/data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Package, AlertTriangle, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuppliesOfficialReportProps {
    logos: OrganizationSettings | null;
    supplies: Supply[];
    categoryLabel: string;
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
    stats,
    options 
}: SuppliesOfficialReportProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Portrait mode for official administrative documents
        document.body.classList.add('print-portrait');
        
        const timer = setTimeout(() => {
            window.print();
        }, 1000);

        return () => {
            setMounted(false);
            document.body.classList.remove('print-portrait');
            clearTimeout(timer);
        };
    }, []);

    if (!mounted || !logos) return null;

    return createPortal(
        <div id="print-section" className="bg-white text-black w-full print:shadow-none print:border-none">
            {/* --- PAGE DE GARDE --- */}
            <div className="print-page h-screen flex flex-col p-16 border-b-2 border-slate-100 break-inside-avoid">
                <header className="flex justify-between items-start mb-24 min-h-[140px] break-inside-avoid">
                    <div className="w-1/3 text-center flex flex-col justify-center items-center break-inside-avoid">
                        <p className="font-bold text-[10px] items-center text-slate-800 leading-tight uppercase">
                            Chambre Nationale des Rois<br />et Chefs Traditionnels
                        </p>
                        {logos.mainLogoUrl && <img src={logos.mainLogoUrl} alt="Logo" className="max-h-24 mt-4" loading="eager" />}
                        <div className="w-12 h-0.5 bg-slate-900 mt-4 rounded-full" />
                    </div>
                    <div className="w-1/3"></div>
                    <div className="w-1/3 text-center flex flex-col justify-center items-center break-inside-avoid">
                        <p className="font-bold text-[10px] leading-tight text-slate-800 uppercase tracking-wider">
                            République de Côte d'Ivoire
                        </p>
                        {logos.secondaryLogoUrl && <img src={logos.secondaryLogoUrl} alt="Logo" className="max-h-20 my-4" loading="eager" />}
                        <p className="text-[9px] italic font-bold border-t border-slate-200 mt-1 px-4">Union - Discipline - Travail</p>
                    </div>
                </header>

                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-16">
                    <div className="space-y-6">
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none italic">
                            ÉTAT DE GESTION DES FOURNITURES<br />ET CONSOMMABLES
                        </h1>
                        <div className="h-2 w-64 bg-slate-900 mx-auto rounded-full"></div>
                    </div>
                    
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-600 bg-slate-50 px-10 py-6 rounded-xl border border-slate-100 italic inline-block">
                             Direction des Affaires Financières et du Patrimoine (DAFP)
                        </h2>
                        <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">Service de l'Intendance et de la Logistique</p>
                    </div>

                    <div className="mt-16 p-10 border-[6px] border-double border-slate-200 rounded-xl bg-slate-50/30">
                        <p className="text-2xl font-black uppercase underline decoration-slate-300 decoration-4 underline-offset-8">
                            SITUATION AU : {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                        {categoryLabel !== 'all' && (
                            <p className="text-lg font-bold text-primary mt-4 uppercase italic">Périmètre : {categoryLabel}</p>
                        )}
                    </div>
                </div>

                <footer className="mt-auto pt-10 text-center border-t border-slate-100">
                    <p className="font-black text-xl uppercase tracking-[0.2em] text-slate-900">Secrétariat Général / Cabinet</p>
                    <p className="text-xs text-slate-400 mt-2 italic font-medium">Document officiel généré par le Système de Gestion Intégré - GèreEcole</p>
                </footer>
            </div>

            {/* --- PAGE DE SYNTHÈSE ET TABLEAU --- */}
            <div className="print-page min-h-screen p-12">
                <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-slate-900">
                    <h3 className="text-xl font-black uppercase tracking-tight italic">
                        Inventaire et Analyse du Stock
                    </h3>
                    <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                        {categoryLabel === 'all' ? 'Inventaire Global' : categoryLabel}
                    </span>
                </div>

                {/* --- KPI Block in Official Style --- */}
                <div className="grid grid-cols-4 gap-4 mb-10">
                    <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Package className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Total Articles</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 leading-none">{stats.total}</div>
                    </div>
                    <div className={cn(
                        "border p-4 rounded-2xl",
                        stats.outOfStock > 0 ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-slate-50/50"
                    )}>
                        <div className={cn("flex items-center gap-2 mb-2", stats.outOfStock > 0 ? "text-red-500" : "text-slate-400")}>
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Ruptures</span>
                        </div>
                        <div className={cn("text-2xl font-black leading-none", stats.outOfStock > 0 ? "text-red-600" : "text-slate-900")}>
                            {stats.outOfStock}
                        </div>
                    </div>
                    <div className={cn(
                        "border p-4 rounded-2xl",
                        stats.lowStock > 0 ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-slate-50/50"
                    )}>
                        <div className={cn("flex items-center gap-2 mb-2", stats.lowStock > 0 ? "text-amber-500" : "text-slate-400")}>
                            <Zap className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Stocks Critiques</span>
                        </div>
                        <div className={cn("text-2xl font-black leading-none", stats.lowStock > 0 ? "text-amber-600" : "text-slate-900")}>
                            {stats.lowStock}
                        </div>
                    </div>
                    <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50/50">
                        <div className="flex items-center gap-2 text-emerald-600 mb-2">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Disponibilité</span>
                        </div>
                        <div className="text-2xl font-black text-emerald-600 leading-none">{Math.round(stats.avgHealth)}%</div>
                    </div>
                </div>

                {/* --- Main Data Table (Black Border Administrative Style) --- */}
                <table className="w-full border-collapse border border-slate-900 text-[10px] leading-tight">
                    <thead>
                        <tr className="bg-slate-100 text-slate-900 uppercase font-black text-center border-b border-slate-900">
                            <th className="border border-slate-900 p-3 w-[40px]">N°</th>
                            {options.includePhotos && <th className="border border-slate-900 p-3 w-[60px]">Aperçu</th>}
                            <th className="border border-slate-900 p-3 w-[80px]">Code</th>
                            <th className="border border-slate-900 p-3 text-left">Désignation de l'Article</th>
                            <th className="border border-slate-900 p-3 w-[60px]">Qté</th>
                            {options.showHealthStatus && <th className="border border-slate-900 p-3 w-[120px]">État de Santé</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {supplies.map((item, idx) => (
                            <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                                <td className="border border-slate-900 p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                {options.includePhotos && (
                                    <td className="border border-slate-900 p-2 text-center">
                                        <div className="h-8 w-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mx-auto">
                                            {item.photoUrl ? (
                                                <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="h-3 w-3 text-slate-200" />
                                            )}
                                        </div>
                                    </td>
                                )}
                                <td className="border border-slate-900 p-3 text-center font-mono text-[9px] uppercase">{item.code || '---'}</td>
                                <td className="border border-slate-900 p-3">
                                    <div className="font-black text-slate-900 uppercase">{item.name}</div>
                                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{item.category}</div>
                                </td>
                                <td className="border border-slate-900 p-3 text-center text-lg font-black text-slate-900 italic">{item.quantity}</td>
                                {options.showHealthStatus && (
                                    <td className="border border-slate-900 p-3">
                                        <div className="flex flex-col gap-1">
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                <div 
                                                    className={cn(
                                                        "h-full transition-all",
                                                        item.quantity <= 0 ? "bg-red-500 w-[5%]" :
                                                        item.quantity <= item.reorderLevel ? "bg-amber-500 w-[40%]" : "bg-emerald-500 w-[100%]"
                                                    )}
                                                />
                                            </div>
                                            <span className={cn(
                                                "text-[8px] font-black uppercase text-right",
                                                item.quantity <= 0 ? "text-red-500" :
                                                item.quantity <= item.reorderLevel ? "text-amber-500" : "text-emerald-500"
                                            )}>
                                                {item.quantity <= 0 ? 'Rupture' : item.quantity <= item.reorderLevel ? 'Bas' : 'Optimal'}
                                            </span>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* --- Validations Area --- */}
                <div className="mt-12 grid grid-cols-2 gap-12 pt-8 border-t border-slate-100">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic underline underline-offset-4">Visa Technique (Logistique)</p>
                        <div className="h-32 w-56 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center p-6 text-center">
                            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em] leading-tight">Réservé au Chef de Service<br />Patrimoine & Maintenance</span>
                        </div>
                    </div>
                    <div className="text-right space-y-6">
                        <div className="space-y-1">
                            <p className="text-xs font-black text-slate-900 italic">Fait à Yamoussoukro, le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Contrôleur Interne et Qualité, CNRCT</p>
                        </div>
                        <div className="pt-8 flex flex-col items-end gap-3">
                             <div className="h-0.5 w-32 bg-slate-900 rounded-full" />
                             <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">COULIBALY Hamadou</p>
                             <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 flex items-center gap-2">
                                 <BarChart3 className="h-3 w-3 text-slate-400" />
                                 <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Document Généré par Système GèreEcole</span>
                             </div>
                        </div>
                    </div>
                </div>

                <footer className="fixed bottom-12 left-12 right-12 text-center text-[8px] text-slate-400 border-t border-slate-50 pt-4 flex justify-between items-center px-4">
                    <p className="font-bold">© {new Date().getFullYear()} CNRCT - Système de Surveillance et de Gestion Intégré</p>
                    <p>Yamoussoukro, Riviera - BP 201 | Tél : (225) 30 64 06 60</p>
                </footer>
            </div>
        </div>,
        document.body
    );
}
