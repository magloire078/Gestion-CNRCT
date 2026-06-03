"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Users, Building2, Crown, ChevronRight, Network } from "lucide-react";
import { TribuData } from "./tribu-card";

interface TribuQuickViewProps {
    tribu: TribuData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TribuQuickView({ tribu, open, onOpenChange }: TribuQuickViewProps) {
    if (!tribu) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] rounded-xl p-0 overflow-hidden border-none shadow-2xl bg-slate-50">
                <div className="relative h-40 bg-emerald-900 flex flex-col justify-end p-6 overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pattern-dots text-white" />
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <Badge className="bg-amber-500 text-white mb-2 border-none font-black text-[9px] uppercase tracking-widest">
                                Fiche Territoriale
                            </Badge>
                            <DialogTitle className="text-3xl font-black text-white uppercase tracking-tighter">
                                Tribu {tribu.name}
                            </DialogTitle>
                            <DialogDescription className="text-emerald-200 font-bold text-sm flex flex-col gap-1 mt-1">
                                <span className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-amber-500" />
                                    {tribu.subPrefecture} • {tribu.department} • {tribu.region}
                                </span>
                                {tribu.canton && (
                                    <span className="flex items-center gap-2 text-[11px] text-emerald-300 uppercase tracking-widest">
                                        <Network className="h-3.5 w-3.5" /> Rattaché au Canton {tribu.canton}
                                    </span>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <ScrollArea className="max-h-[65vh]">
                    <div className="p-6 space-y-6">
                        {/* Statistics */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Localités</div>
                                    <div className="text-2xl font-black text-slate-800">{tribu.villages.length}</div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Population Cumulée</div>
                                    <div className="text-2xl font-black text-slate-800">
                                        {tribu.population > 0 ? tribu.population.toLocaleString() : "N/D"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chef de Tribu */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <Crown className="h-3.5 w-3.5" /> Chef de Tribu
                            </h4>
                            {tribu.tribuChief ? (
                                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center gap-4">
                                    <img src={tribu.tribuChief.photoUrl || "/placeholder.jpg"} alt="" className="w-14 h-14 rounded-xl object-cover shadow-md border-2 border-amber-100" />
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{tribu.tribuChief.name}</div>
                                        <div className="text-xs font-bold text-slate-500 flex items-center gap-2 mt-1">
                                            {tribu.tribuChief.village}
                                            <span className="text-[9px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md uppercase tracking-widest">
                                                En fonction
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-100/50 border border-slate-200 border-dashed rounded-xl p-4 text-center text-sm font-bold text-slate-400">
                                    Aucun Chef de tribu formellement identifié dans la base de données.
                                </div>
                            )}
                        </div>

                        {/* Villages de la Tribu */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5" /> Localités rattachées ({tribu.villages.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {tribu.villages.map(village => {
                                    const villageChief = tribu.chiefs.find(c => c.villageId === village.id || c.village?.toLowerCase() === village.name.toLowerCase());
                                    
                                    return (
                                        <div key={village.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-colors">
                                            <div>
                                                <div className="font-black text-sm text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{village.name}</div>
                                                <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                                                    {villageChief ? villageChief.name : "Pas de chef"}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
