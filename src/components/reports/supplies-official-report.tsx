"use client";

import { Supply, OrganizationSettings } from "@/lib/data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalCover } from "./institutional-cover";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";
import { cn } from "@/lib/utils";
import { Package, AlertTriangle, Zap, BarChart3 } from "lucide-react";

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
    isPrinting?: boolean;
    onAfterPrint?: () => void;
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
    isPrinting = true,
    onAfterPrint,
    stats,
    options 
}: SuppliesOfficialReportProps) {
    // Render even if logos are null to allow the print wrapper to mount and handle the lifecycle

    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting} 
            orientation="landscape"
            onAfterPrint={onAfterPrint}
        >
            <div className="bg-white text-black w-full printable-portal-root">
                <InstitutionalCover 
                    title="PV D'INVENTAIRE ET DE GESTION DES FOURNITURES & CONSOMMABLES"
                    subtitle="Direction Financière et du Patrimoine (DFP)"
                    direction="DFP"
                    service="Service de l'Intendance et de la Logistique"
                    period={periodLabel || format(new Date(), 'MMMM yyyy', { locale: fr })}
                    stats={[
                        { label: "Articles", value: stats.total, icon: Package },
                        { label: "Ruptures", value: stats.outOfStock, icon: AlertTriangle },
                        { label: "Mouvements", value: supplies.filter(s => s.isModified).length, icon: Zap },
                        { label: "Disponibilité", value: `${Math.round(stats.avgHealth || 0)}%`, icon: BarChart3 },
                    ]}
                    reference={`SUP-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`}
                    settings={logos}
                    orientation="landscape"
                />

                {/* --- PAGE DE SYNTHÈSE ET TABLEAU --- */}
                <div className="landscape-section min-h-screen p-12 relative print:p-5">
                    <InstitutionalHeader 
                        title="Détail des Mouvements de Stock"
                        period={`PÉRIODE : ${periodLabel || format(new Date(), 'MMMM yyyy', { locale: fr })} | Situation au ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`}
                        direction="DFP"
                        service="Direction des Finances et du Patrimoine"
                        settings={logos}
                    />

                    <div className="space-y-6">
                        {/* --- Main Data Table (Black Border Administrative Style) --- */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b-4 border-slate-100 pb-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">
                                    Inventaire <span className="text-[#006039] underline decoration-4 underline-offset-8">Opérationnel</span>
                                </h3>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full border border-slate-100">
                                    {categoryLabel === 'all' ? 'Inventaire Global' : categoryLabel}
                                </div>
                            </div>

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
                        </div>
                    </div>

                    <InstitutionalFooter 
                        showSignatures={true}
                        leftSignatureTitle="LE MAGASINIER / RÉGISSEUR"
                        rightSignatureTitle="LE DIRECTEUR FINANCIER (DFP)"
                        signatoryName="COULIBALY Hamadou"
                    />
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
