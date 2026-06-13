"use client";

import { Chief } from "@/types/chief";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Award, ShieldCheck, ChevronRight, Crown, Pencil, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChiefCardProps {
    chief: Chief;
    onClick?: () => void;
    onEdit?: (e: React.MouseEvent) => void;
    onLink?: (e: React.MouseEvent) => void;
}

export function ChiefCard({ chief, onClick, onEdit, onLink }: ChiefCardProps) {
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
                "group relative overflow-hidden transition-all duration-700 h-full border-slate-200/50 bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgb(0,0,0,0.12)] hover:border-slate-300/80 rounded-2xl",
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

                <div className="p-4 sm:p-5 flex flex-col h-full">
                    <div className="flex items-start gap-4">
                        <div className="relative flex-shrink-0">
                            <Avatar className="h-16 w-16 rounded-xl border-2 border-white shadow-xl shadow-slate-200/50 transform group-hover:scale-105 transition-transform duration-700 ease-out">
                                <AvatarImage src={chief.photoUrl} alt={chief.name} className="object-cover" />
                                <AvatarFallback className="bg-slate-50 text-slate-400 font-black text-lg">
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
                            <div className="flex flex-col gap-1.5 mb-2">
                                {/* Ligne 1 : Affiliations spéciales (Directoire, Comité) */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex flex-wrap gap-1">
                                        {chief.cnrctAffiliation === 'Directoire' && (
                                            <Badge variant="outline" className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-black rounded-lg shadow-sm border border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800 hover:text-amber-800">
                                                <Crown className="w-3 h-3 mr-1 inline" /> Directoire
                                            </Badge>
                                        )}
                                        {chief.cnrctAffiliation === 'Comité Régional' && (
                                            <Badge variant="outline" className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-black rounded-lg shadow-sm border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-50 hover:text-purple-700">
                                                Comité Régional
                                            </Badge>
                                        )}
                                        {chief.status === 'décédé' && (
                                            <Badge variant="outline" className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-black rounded-lg shadow-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700">
                                                Décédé
                                            </Badge>
                                        )}
                                        {chief.cnrctAffiliation === 'Aucune' && chief.historiqueNominations && chief.historiqueNominations.length > 0 && (
                                            <Badge variant="outline" className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-black rounded-lg shadow-sm border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-500">
                                                Ancien Membre
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Ligne 2 : Rôle principal et Casquettes (initiales colorées) */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Badge variant="outline" className={cn(
                                        "px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] font-black rounded-md shadow-sm border",
                                        isHighAuthority ? "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50 hover:text-amber-700" : "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50 hover:text-blue-700"
                                    )}>
                                        {chief.role}
                                    </Badge>
                                    
                                    {chief.additionalRoles && chief.additionalRoles.length > 0 && (
                                        <div className="flex gap-1">
                                            {chief.additionalRoles.map((r, i) => {
                                                let initials = "CV";
                                                let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
                                                if (r === "Roi") { initials = "R"; colorClass = "bg-amber-100 text-amber-700 border-amber-200"; }
                                                else if (r === "Chef de province") { initials = "CP"; colorClass = "bg-purple-100 text-purple-700 border-purple-200"; }
                                                else if (r === "Chef de canton") { initials = "CC"; colorClass = "bg-blue-100 text-blue-700 border-blue-200"; }
                                                else if (r === "Chef de tribu") { initials = "CT"; colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200"; }
                                                
                                                return (
                                                    <div key={i} title={r} className={cn("flex items-center justify-center h-4 px-1.5 text-[8px] font-black rounded-[4px] border", colorClass)}>
                                                        {initials}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="mt-2 text-sm italic font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight line-clamp-2" title={chief.name}>
                        {chief.name}
                    </h3>

                    <div className="mt-2 space-y-1.5">
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
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold truncate uppercase tracking-widest opacity-80">{chief.subPrefecture} • {chief.region}</span>
                                {(chief.cantonName || chief.tribuName) && (
                                    <span className="text-[9px] font-bold truncate uppercase tracking-widest text-slate-400">
                                        {[chief.cantonName, chief.tribuName].filter(Boolean).join(" • ")}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar (visible on hover) */}
                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                        <div className="flex items-center gap-4">
                            {chief.phone && (
                                <div className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                                    <Phone className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-bold">{chief.phone}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {onEdit && (
                                <button 
                                    onClick={onEdit}
                                    className="p-1 rounded bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600 transition-colors"
                                    title="Modifier le profil"
                                >
                                    <Pencil className="h-3 w-3" />
                                </button>
                            )}
                            {onLink && (
                                <button
                                    onClick={onLink}
                                    className="p-1 rounded bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                    title={chief.villageId ? `Village lié : ${chief.village}` : "Affecter un village"}
                                >
                                    <Link2 className="h-3 w-3" />
                                </button>
                            )}
                            <div className="flex items-center gap-1 text-[8px] font-black text-blue-600 uppercase tracking-widest">
                                Voir Profil
                                <ChevronRight className="h-3 w-3" />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
