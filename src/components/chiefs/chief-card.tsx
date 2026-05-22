"use client";

import { Chief } from "@/types/chief";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Award, ShieldCheck, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChiefCardProps {
    chief: Chief;
    onClick?: () => void;
}

export function ChiefCard({ chief, onClick }: ChiefCardProps) {
    const meritPoints = chief.meritPoints || 0;
    
    // Determine the "level" of authority for visual styling
    const isHighAuthority = ["Roi", "Chef de province", "Chef de canton"].includes(chief.role);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClick}
            className="cursor-pointer h-full"
        >
            <Card className={cn(
                "group relative overflow-hidden transition-all duration-700 h-full border-slate-200/50 bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgb(0,0,0,0.12)] hover:border-slate-300/80 rounded-[2rem]",
                isHighAuthority && "border-amber-200/60 bg-gradient-to-br from-white via-white to-amber-50/30"
            )}>
                {/* Refined Visual Accent Line */}
                <div className={cn(
                    "absolute top-0 left-0 w-2 h-full transition-all duration-700 opacity-80 group-hover:opacity-100",
                    isHighAuthority ? "bg-gradient-to-b from-amber-400 to-amber-600" : "bg-gradient-to-b from-blue-600 to-slate-900"
                )} />

                {/* Subtle Background Icon */}
                <div className="absolute -bottom-6 -right-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none transform group-hover:scale-150 group-hover:rotate-12">
                    <ShieldCheck className="h-40 w-40" />
                </div>

                <div className="p-6">
                    <div className="flex items-start gap-5">
                        <div className="relative">
                            <Avatar className="h-20 w-20 rounded-2xl border-[3px] border-white shadow-xl shadow-slate-200/50 transform group-hover:scale-110 transition-transform duration-700 ease-out">
                                <AvatarImage src={chief.photoUrl} alt={chief.name} className="object-cover" />
                                <AvatarFallback className="bg-slate-50 text-slate-400 font-black text-xl">
                                    {chief.lastName?.charAt(0)}{chief.firstName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            {isHighAuthority && (
                                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-400 to-amber-600 text-white p-1.5 rounded-xl shadow-lg border-2 border-white transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <Badge variant="secondary" className={cn(
                                    "px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-black rounded-lg shadow-sm border",
                                    isHighAuthority ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-blue-50 text-blue-700 border-blue-100"
                                )}>
                                    {chief.role}
                                </Badge>
                                
                                {meritPoints > 0 && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-100 shadow-sm group-hover:border-slate-300 transition-colors">
                                        <Award className={cn(
                                            "h-3.5 w-3.5",
                                            meritPoints > 70 ? "text-amber-500" : "text-blue-600"
                                        )} />
                                        <span className="text-[10px] font-black text-slate-700">{meritPoints} pts</span>
                                    </div>
                                )}
                            </div>
                            
                            <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">
                                {chief.name}
                            </h3>
                            
                            <div className="mt-4 space-y-2.5">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <MapPin className="h-3 w-3" />
                                    </div>
                                    <span className="text-xs font-bold truncate uppercase tracking-widest text-slate-600">{chief.village || "Non spécifiée"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500">
                                    <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <ShieldCheck className="h-3 w-3" />
                                    </div>
                                    <span className="text-[10px] font-bold truncate uppercase tracking-widest opacity-80">{chief.subPrefecture} • {chief.region}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar (visible on hover) */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                        <div className="flex items-center gap-4">
                            {chief.phone && (
                                <div className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                                    <Phone className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-bold">{chief.phone}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                            Voir Profil
                            <ChevronRight className="h-3 w-3" />
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
