"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Crown, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Chief } from "@/types/chief";
import { Village } from "@/types/village";

export interface CantonData {
    name: string;
    region: string;
    department: string;
    subPrefecture: string;
    villages: Village[];
    chiefs: Chief[];
    cantonChief: Chief | null;
    population: number;
}

interface CantonCardProps {
    canton: CantonData;
    onClick?: () => void;
}

export function CantonCard({ canton, onClick }: CantonCardProps) {
    const hasChief = !!canton.cantonChief;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.4 }}
            onClick={onClick}
            className="cursor-pointer h-full"
        >
            <Card className={cn(
                "group relative overflow-hidden transition-all duration-700 h-full border-slate-200/50 bg-white/70 backdrop-blur-2xl shadow-xl hover:shadow-2xl rounded-2xl",
                hasChief ? "border-amber-200/60" : "border-slate-200/50"
            )}>
                {/* Visual Accent */}
                <div className={cn(
                    "absolute top-0 left-0 w-2 h-full transition-all duration-700 opacity-80 group-hover:opacity-100",
                    hasChief ? "bg-gradient-to-b from-amber-400 to-amber-600" : "bg-gradient-to-b from-blue-400 to-blue-600"
                )} />

                <div className="p-5 flex flex-col h-full pl-6">
                    <div className="flex justify-between items-start mb-3">
                        <Badge variant="outline" className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-black rounded-lg bg-blue-50 text-blue-700 border-blue-200">
                            Canton
                        </Badge>
                        {hasChief && (
                            <Badge className="bg-amber-100 text-amber-700 border-none shadow-none text-[9px] uppercase">
                                <Crown className="w-3 h-3 mr-1" /> Avec Chef
                            </Badge>
                        )}
                    </div>

                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1 truncate group-hover:text-amber-600 transition-colors">
                        {canton.name}
                    </h3>
                    
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-4 truncate">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {canton.subPrefecture} • {canton.department}
                    </p>

                    <div className="mt-auto space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2 border border-slate-100">
                                <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <Building2 className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Localités</div>
                                    <div className="text-sm font-black text-slate-700">{canton.villages.length}</div>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2 border border-slate-100">
                                <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <Users className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Population</div>
                                    <div className="text-sm font-black text-slate-700">{canton.population > 0 ? canton.population.toLocaleString() : "N/D"}</div>
                                </div>
                            </div>
                        </div>

                        {hasChief && (
                            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-50/50 border border-amber-100/50 mt-2">
                                <img src={canton.cantonChief?.photoUrl || "/placeholder.jpg"} alt="" className="w-8 h-8 rounded-full object-cover border border-amber-200" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Chef de Canton</div>
                                    <div className="text-xs font-bold text-slate-800 truncate">{canton.cantonChief?.name}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
