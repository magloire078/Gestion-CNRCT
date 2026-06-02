"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    MapPin, Users, Zap, Droplets, School, Activity, Building2, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VillageEntry } from "@/types/village";

export function VillageCard({ entry }: { entry: VillageEntry }) {
    const { village, currentChief, archivedChiefsCount } = entry;
    const score = village.developmentScore || 0;

    return (
        <Card className={cn(
            "group relative rounded-xl border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2",
            !currentChief && "ring-2 ring-amber-500/10 shadow-amber-500/5"
        )}>
            <div className="h-32 bg-slate-900 relative p-6 flex flex-col justify-end overflow-hidden">
                {!currentChief && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-amber-500"
                    />
                )}
                <div className="absolute inset-0 opacity-20 transition-transform duration-700 group-hover:scale-110">
                    <div className="absolute inset-0 pattern-dots text-white"></div>
                </div>
                <div className="absolute top-4 right-4 h-12 w-12 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-12">
                    <MapPin className="h-5 w-5 text-white" />
                </div>

                <h3 className="text-xl font-black text-white truncate group-hover:text-amber-400 transition-colors z-10">
                    {village.name}
                </h3>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest truncate z-10">
                    {village.region} • {village.department}
                </p>

                <div className="absolute inset-x-0 bottom-0 bg-amber-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 p-2 flex items-center justify-center">
                    <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">{village.subPrefecture}</span>
                </div>
            </div>

            <CardContent className="p-4 pt-8">
                <div className="relative mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 rounded-lg border-4 border-slate-50 shadow-sm group-hover:border-amber-50 ring-2 ring-transparent group-hover:ring-amber-500/20 transition-all duration-500">
                            <AvatarImage src={currentChief?.photoUrl || ""} />
                            <AvatarFallback className="bg-slate-100 text-slate-400 font-black rounded-lg">
                                {currentChief?.name?.charAt(0) || <Users className="h-6 w-6" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Autorité Actuelle
                            </p>
                            {currentChief ? (
                                <>
                                    <h4 className="text-sm font-black text-slate-900 truncate leading-none mb-1 group-hover:text-amber-600 transition-colors">
                                        {currentChief.name}
                                    </h4>
                                    <Badge className="bg-green-50 text-green-700 text-[10px] font-black hover:bg-green-50 border-none px-2 rounded-sm">
                                        SIÈGE OCCUPÉ
                                    </Badge>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-bold text-slate-400 italic mb-1">Non renseignée</p>
                                    <Badge className="bg-amber-50 text-amber-700 text-[10px] font-black hover:bg-amber-50 border-none px-2 rounded-sm">
                                        VACANCE DU TRÔNE
                                    </Badge>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-6 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest leading-none">
                        <span className="text-slate-400">Indice de Développement (IDL)</span>
                        <span className={cn(
                            score >= 80 ? "text-emerald-500" :
                            score >= 50 ? "text-blue-500" : "text-amber-500"
                        )}>{score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={cn(
                                "h-full rounded-full",
                                score >= 80 ? "bg-emerald-500" :
                                score >= 50 ? "bg-blue-500" : "bg-amber-500"
                            )}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-50">
                    <div className="col-span-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Infrastructures</p>
                        <div className="flex flex-wrap gap-2">
                            <Zap className={cn("h-3.5 w-3.5", village.hasElectricity ? 'text-amber-500' : 'text-slate-200')} />
                            <Droplets className={cn("h-3.5 w-3.5", village.hasWater ? 'text-blue-500' : 'text-slate-200')} />
                            <School className={cn("h-3.5 w-3.5", village.hasSchool ? 'text-indigo-500' : 'text-slate-200')} />
                            <Activity className={cn("h-3.5 w-3.5", village.hasHealthCenter ? 'text-emerald-500' : 'text-slate-200')} />
                            <Building2 className={cn("h-3.5 w-3.5", village.hasMarket ? 'text-rose-500' : 'text-slate-200')} />
                        </div>
                    </div>
                    <div className="col-span-1 text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Archives</p>
                        <p className="text-sm font-black text-slate-900 leading-none">{archivedChiefsCount} Prédéc.</p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Code INS</p>
                        <p className="text-[11px] font-bold text-slate-900 font-mono tracking-tighter">{village.codeINS || "N/A"}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Population</p>
                        <p className="text-[11px] font-bold text-slate-900 leading-none">
                            {village.population ? `${village.population.toLocaleString()} hab.` : "N/D"}
                        </p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Button asChild className="w-full h-12 rounded-lg border-none shadow-none text-xs font-black uppercase tracking-widest group-hover:bg-slate-900 transition-all duration-500 overflow-hidden relative">
                    <Link href={`/villages/${village.id}`}>
                        <span className="relative z-10">Détails de la localité</span>
                        <ChevronRight className="relative z-10 w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
