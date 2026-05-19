"use client";

import React from "react";
import { Village } from "@/types/village";
import { Chief } from "@/types/chief";
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
    ResponsiveDialogDescription,
} from "@/components/ui/responsive-dialog";
import { Badge } from "@/components/ui/badge";
import { 
    MapPin, 
    Users, 
    Calendar, 
    History, 
    Droplets, 
    Zap, 
    School, 
    Activity,
    Info,
    TrendingUp,
    ShoppingBag,
    Church,
    Moon as Mosque,
    Coins
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { VillageProfileReport } from "@/components/reports/village-profile-report";

interface VillageQuickViewProps {
    village: Village;
    currentChief: Chief | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function VillageQuickView({ village, currentChief, open, onOpenChange }: VillageQuickViewProps) {
    const score = village.developmentScore || 0;
    const [isPrinting, setIsPrinting] = React.useState(false);
    
    return (
        <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
            <ResponsiveDialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                <div className="relative h-48 bg-slate-900 flex flex-col justify-end p-8">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 pattern-dots text-white"></div>
                    </div>
                    {village.photoUrl && (
                        <img src={village.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                    )}
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <Badge className="bg-amber-500 text-white mb-2 border-none font-black text-[9px] uppercase tracking-widest">Fiche Territoriale</Badge>
                            <ResponsiveDialogTitle className="text-3xl font-black text-white uppercase tracking-tighter">{village.name}</ResponsiveDialogTitle>
                            <ResponsiveDialogDescription className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-amber-500" />
                                {village.region} • {village.department} • {village.subPrefecture}
                            </ResponsiveDialogDescription>
                        </div>
                        <Button 
                            onClick={() => setIsPrinting(true)} 
                            variant="outline" 
                            disabled={isPrinting}
                            className="bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-xl shadow-black/20"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            {isPrinting ? "Préparation..." : "Imprimer la Fiche"}
                        </Button>
                    </div>
                </div>

                <div className="p-8 space-y-6 print:hidden">
                    {/* IDL Section */}
                    <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Indice de Développement</h4>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Observatoire Territorial</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn(
                                    "text-3xl font-black",
                                    score >= 80 ? "text-emerald-600" : 
                                    score >= 50 ? "text-blue-600" : "text-amber-600"
                                )}>{score}%</span>
                            </div>
                        </div>
                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 1.5, type: "spring" }}
                                className={cn(
                                    "h-full rounded-full",
                                    score >= 80 ? "bg-emerald-500" : 
                                    score >= 50 ? "bg-blue-500" : "bg-amber-500"
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Status Section */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <Users className="h-3 w-3" /> Démographie
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Population</p>
                                        <p className="text-xs font-bold text-slate-500">{village.population?.toLocaleString() || "N/D"} hab.</p>
                                    </div>
                                </div>
                                {village.mainActivities && village.mainActivities.length > 0 && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                            <Coins className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Économie</p>
                                            <p className="text-xs font-bold text-slate-500 truncate max-w-[140px]">{village.mainActivities[0]}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Infrastructure Section */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <Zap className="h-3 w-3" /> Équipements
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                                <div className={cn("flex flex-col items-center p-2 rounded-xl border transition-all", village.hasElectricity ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-slate-50 border-slate-100 opacity-30 text-slate-400")} title="Électricité">
                                    <Zap className="h-4 w-4 mb-1" />
                                    <span className="text-[8px] font-black uppercase">CIE</span>
                                </div>
                                <div className={cn("flex flex-col items-center p-2 rounded-xl border transition-all", village.hasWater ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-slate-50 border-slate-100 opacity-30 text-slate-400")} title="Eau Potable">
                                    <Droplets className="h-4 w-4 mb-1" />
                                    <span className="text-[8px] font-black uppercase">EAU</span>
                                </div>
                                <div className={cn("flex flex-col items-center p-2 rounded-xl border transition-all", village.hasSchool ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-100 opacity-30 text-slate-400")} title="École">
                                    <School className="h-4 w-4 mb-1" />
                                    <span className="text-[8px] font-black uppercase">EDU</span>
                                </div>
                                <div className={cn("flex flex-col items-center p-2 rounded-xl border transition-all", village.hasHealthCenter ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-slate-50 border-slate-100 opacity-30 text-slate-400")} title="Santé">
                                    <Activity className="h-4 w-4 mb-1" />
                                    <span className="text-[8px] font-black uppercase">SAN</span>
                                </div>
                                <div className={cn("flex flex-col items-center p-2 rounded-xl border transition-all", village.hasMarket ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-100 opacity-30 text-slate-400")} title="Marché">
                                    <ShoppingBag className="h-4 w-4 mb-1" />
                                    <span className="text-[8px] font-black uppercase">COM</span>
                                </div>
                                <div className={cn("flex flex-col items-center p-2 rounded-xl border transition-all", (village.hasMosque || village.hasChurch) ? "bg-purple-50 border-purple-100 text-purple-600" : "bg-slate-50 border-slate-100 opacity-30 text-slate-400")} title="Culte">
                                    {village.hasMosque ? <Mosque className="h-4 w-4 mb-1" /> : <Church className="h-4 w-4 mb-1" />}
                                    <span className="text-[8px] font-black uppercase">REL</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><History className="h-3 w-3" /> {village.updatedAt ? format(new Date(village.updatedAt), "dd/MM/yyyy", { locale: fr }) : "N/D"}</span>
                        <span>Code INS: {village.codeINS || "N/A"}</span>
                    </div>
                </div>
            </ResponsiveDialogContent>

            {/* Fiche Officielle Imprimable */}
            <VillageProfileReport
                village={village}
                currentChief={currentChief}
                isPrinting={isPrinting}
                onAfterPrint={() => setIsPrinting(false)}
            />
        </ResponsiveDialog>
    );
}
