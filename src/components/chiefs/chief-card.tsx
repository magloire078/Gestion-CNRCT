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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            onClick={onClick}
            className="cursor-pointer"
        >
            <Card className={cn(
                "group relative overflow-hidden transition-all duration-500 border-slate-200/60 bg-white/50 backdrop-blur-xl hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30",
                isHighAuthority && "border-amber-200/50 bg-gradient-to-br from-white to-amber-50/20"
            )}>
                {/* Visual Accent */}
                <div className={cn(
                    "absolute top-0 left-0 w-1.5 h-full transition-all duration-500",
                    isHighAuthority ? "bg-amber-500 group-hover:bg-amber-600" : "bg-blue-500 group-hover:bg-blue-600"
                )} />

                <div className="p-5">
                    <div className="flex items-start gap-4">
                        <div className="relative">
                            <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-xl shadow-slate-200 transform group-hover:scale-105 transition-transform duration-500">
                                <AvatarImage src={chief.photoUrl} alt={chief.name} className="object-cover" />
                                <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">
                                    {chief.lastName?.charAt(0)}{chief.firstName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            {isHighAuthority && (
                                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-lg shadow-lg border-2 border-white">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <Badge variant="secondary" className={cn(
                                    "px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-md",
                                    isHighAuthority ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-700"
                                )}>
                                    {chief.role}
                                </Badge>
                                
                                {meritPoints > 0 && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-100 shadow-sm group-hover:border-blue-200 transition-colors">
                                        <Award className={cn(
                                            "h-3.5 w-3.5",
                                            meritPoints > 70 ? "text-amber-500" : "text-blue-500"
                                        )} />
                                        <span className="text-[11px] font-black text-slate-700 italic">{meritPoints} pts</span>
                                    </div>
                                )}
                            </div>
                            
                            <h3 className="text-base font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase truncate">
                                {chief.name}
                            </h3>
                            
                            <div className="mt-3 space-y-1.5">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-xs font-medium truncate">{chief.village || "Localité non spécifiée"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-xs font-medium truncate">{chief.subPrefecture} • {chief.region}</span>
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
