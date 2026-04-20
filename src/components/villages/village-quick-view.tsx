"use client";

import { Village } from "@/types/village";
import { Chief } from "@/types/chief";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
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
    TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VillageQuickViewProps {
    village: Village;
    currentChief: Chief | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function VillageQuickView({ village, currentChief, open, onOpenChange }: VillageQuickViewProps) {
    const score = village.developmentScore || 0;
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                <div className="relative h-48 bg-slate-900 flex flex-col justify-end p-8">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 pattern-dots text-white"></div>
                    </div>
                    <div className="relative z-10">
                        <Badge className="bg-amber-500 text-white mb-2 border-none">Fiche Territoriale</Badge>
                        <DialogTitle className="text-3xl font-black text-white">{village.name}</DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {village.region} • {village.department} • {village.subPrefecture}
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* IDL Section */}
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Indice de Développement</h4>
                                    <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Observatoire Territorial CNRCT</p>
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
                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
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

                    <div className="grid grid-cols-2 gap-6">
                        {/* Status Section */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <Info className="h-3 w-3" /> État Civil & Social
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">Population</p>
                                        <p className="text-sm text-slate-500">{village.population?.toLocaleString() || "N/D"} hab. ({village.populationYear || "2024"})</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <History className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">Mis à jour</p>
                                        <p className="text-sm text-slate-500">
                                            {village.updatedAt ? format(new Date(village.updatedAt), "PPP", { locale: fr }) : "N/D"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Infrastructure Section */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <Zap className="h-3 w-3" /> Équipements
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Badge variant={village.hasElectricity ? "success" : "outline"} className={cn("justify-center py-2", !village.hasElectricity && "opacity-40")}>
                                    <Zap className="h-3 w-3 mr-1" /> CIE
                                </Badge>
                                <Badge variant={village.hasWater ? "success" : "outline"} className={cn("justify-center py-2", !village.hasWater && "opacity-40")}>
                                    <Droplets className="h-3 w-3 mr-1" /> Eau
                                </Badge>
                                <Badge variant={village.hasSchool ? "success" : "outline"} className={cn("justify-center py-2", !village.hasSchool && "opacity-40")}>
                                    <School className="h-3 w-3 mr-1" /> École
                                </Badge>
                                <Badge variant={village.hasHealthCenter ? "success" : "outline"} className={cn("justify-center py-2", !village.hasHealthCenter && "opacity-40")}>
                                    <Activity className="h-3 w-3 mr-1" /> Santé
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <span>ID Unique: {village.id.slice(0, 8)}...</span>
                        <span>Code INS: {village.codeINS || "NON_RENSEIGNÉ"}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
