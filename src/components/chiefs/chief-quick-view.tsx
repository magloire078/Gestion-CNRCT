"use client";

import { Chief, ChiefCareerEvent } from "@/types/chief";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Calendar, 
    MapPin, 
    Phone, 
    Mail, 
    Award, 
    ShieldCheck, 
    Clock, 
    FileText,
    History
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { Printer } from "lucide-react";
import React, { useState } from "react";
import { ChiefProfileReport } from "@/components/reports/chief-profile-report";

interface ChiefQuickViewProps {
    chief: Chief | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ChiefQuickView({ chief, isOpen, onClose }: ChiefQuickViewProps) {
    if (!chief) return null;

    const career = chief.career || [];
    const predecessors = chief.predecessors || [];
    const meritPoints = chief.meritPoints || 0;
    const isHighAuthority = ["Roi", "Chef de province", "Chef de canton"].includes(chief.role);
    const { hasPermission } = useAuth();
    
    const canReadCareer = hasPermission('chiefs-career:read');
    const canReadAudit = hasPermission('chiefs-audit:read');
    const [isPrinting, setIsPrinting] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-none gap-0 bg-slate-50/95 backdrop-blur-2xl">
                {/* Header Profile Section */}
                <div className={cn(
                    "relative p-5 text-white overflow-hidden",
                    isHighAuthority ? "bg-amber-900" : "bg-blue-900"
                )}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                        <div className="h-full w-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                    </div>

                    <div className="relative flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                        <Avatar className="h-24 w-24 rounded-xl border-4 border-white/20 shadow-2xl">
                            <AvatarImage src={chief.photoUrl} alt={chief.name} className="object-cover" />
                            <AvatarFallback className="bg-white/10 text-white font-bold text-2xl">
                                {chief.lastName?.charAt(0)}{chief.firstName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                {chief.cnrctAffiliation === 'Directoire' && (
                                    <Badge className="bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 border-none px-3 py-1 text-[10px] uppercase tracking-widest font-black shadow-lg">
                                        Directoire
                                    </Badge>
                                )}
                                {chief.cnrctAffiliation === 'Comité Régional' && (
                                    <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30 px-3 py-1 text-[10px] uppercase tracking-widest font-black shadow-lg">
                                        Comité Régional
                                    </Badge>
                                )}
                                <Badge className="bg-white/20 text-white hover:bg-white/30 border-none px-3 py-1 text-[10px] uppercase tracking-widest font-black">
                                    {chief.role}
                                </Badge>
                                {chief.additionalRoles && chief.additionalRoles.length > 0 && (
                                    <div className="flex gap-1.5">
                                        {chief.additionalRoles.map((r, i) => {
                                            let initials = "CV";
                                            let colorClass = "bg-white/10 text-white border-white/20";
                                            if (r === "Roi") { initials = "R"; colorClass = "bg-amber-500/20 text-amber-300 border-amber-500/30"; }
                                            else if (r === "Chef de province") { initials = "CP"; colorClass = "bg-purple-500/20 text-purple-300 border-purple-500/30"; }
                                            else if (r === "Chef de canton") { initials = "CC"; colorClass = "bg-blue-500/20 text-blue-300 border-blue-500/30"; }
                                            else if (r === "Chef de tribu") { initials = "CT"; colorClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"; }
                                            
                                            return (
                                                <div key={i} title={r} className={cn("flex items-center justify-center h-6 px-2 text-[10px] font-black rounded-md border", colorClass)}>
                                                    {initials}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {chief.status === 'actif' && (
                                    <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/30 px-3 py-1 text-[10px] uppercase font-black">
                                        En fonction
                                    </Badge>
                                )}
                            </div>
                            <DialogTitle className="text-3xl font-black tracking-tight leading-none uppercase">
                                {chief.name}
                            </DialogTitle>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-white/70 text-sm font-medium">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {chief.village}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="h-4 w-4" />
                                    <div className="flex flex-col text-left leading-tight">
                                        <span>{chief.subPrefecture} • {chief.region}</span>
                                        {(chief.cantonName || chief.tribuName) && (
                                            <span className="text-[10px] text-white/60 tracking-widest uppercase">
                                                {[chief.cantonName, chief.tribuName].filter(Boolean).join(" • ")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[110px] shadow-2xl">
                            <Award className={cn("h-8 w-8 mx-auto mb-2", meritPoints > 70 ? "text-amber-400" : "text-blue-400")} />
                            <div className="text-3xl font-black text-white">{meritPoints}</div>
                            <div className="text-[10px] uppercase font-black text-white/70 tracking-widest mt-1">Mérites</div>
                        </div>
                    </div>
                </div>

                <ScrollArea className="max-h-[70vh]">
                    <div className="p-5">
                        <Tabs defaultValue="profil" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-slate-100/80 rounded-2xl p-1.5 border border-slate-200/50 mb-4">
                                <TabsTrigger value="profil" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all rounded-xl py-3">
                                    Profil & Contact
                                </TabsTrigger>
                                <TabsTrigger value="carriere" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all rounded-xl py-3">
                                    Historique & Carrière
                                </TabsTrigger>
                                <TabsTrigger value="territoire" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all rounded-xl py-3">
                                    Administration
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="profil" className="space-y-4 focus-visible:outline-none mt-0">
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> BIOGRAPHIE OFFICIELLE
                                    </h4>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <ShieldCheck className="h-32 w-32 rotate-12" />
                                        </div>
                                        <p className="text-slate-700 text-sm leading-loose font-medium relative z-10">
                                            {chief.bio || "Aucune information biographique n'a été versée au dossier pour cette autorité."}
                                        </p>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">COORDONNÉES</h4>
                                        <div className="space-y-3">
                                            {chief.phone && (
                                                <div className="flex items-center gap-4 text-sm text-slate-700 font-black bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:border-blue-300 transition-colors">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Phone className="h-4 w-4" /></div>
                                                    {chief.phone}
                                                </div>
                                            )}
                                            {chief.email && (
                                                <div className="flex items-center gap-4 text-sm text-slate-700 font-black bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:border-blue-300 transition-colors">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Mail className="h-4 w-4" /></div>
                                                    {chief.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="carriere" className="space-y-4 focus-visible:outline-none mt-0">
                                {canReadCareer ? (
                                    <section className="space-y-6">
                                        <div className="relative space-y-4 before:absolute before:left-[23px] before:top-4 before:bottom-4 before:w-1 before:bg-slate-100 before:rounded-full">
                                            {career.length > 0 ? (
                                                career.map((event, index) => (
                                                    <div key={event.id} className="relative pl-14 group">
                                                        <div className="absolute left-0 top-1 h-12 w-12 bg-white rounded-2xl border-2 border-slate-200 shadow-lg flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-110 group-hover:border-blue-400 group-hover:text-blue-600">
                                                            {getEventIcon(event.type)}
                                                        </div>
                                                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm group-hover:shadow-xl group-hover:border-blue-200 transition-all duration-500">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h5 className="font-black text-slate-900 text-base uppercase tracking-tight">{event.title}</h5>
                                                                <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 uppercase tracking-widest">
                                                                    {event.date}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-500 text-sm leading-relaxed font-medium">{event.description}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="pl-14 text-slate-400 italic font-medium py-4 flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                        <History className="h-5 w-5 opacity-30" />
                                                    </div>
                                                    Aucun événement répertorié dans la timeline officielle.
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                ) : (
                                    <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                        Accès restreint. Habilitation insuffisante.
                                    </div>
                                )}

                                {/* Lignée / Prédécesseurs */}
                                {predecessors.length > 0 && (
                                    <section className="space-y-4 pt-6 border-t border-slate-200">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <History className="h-4 w-4" /> GÉNÉALOGIE & PRÉDÉCESSEURS
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {predecessors.map((pred) => (
                                                <div key={pred.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center space-y-1">
                                                    <div className="font-black text-slate-800 text-sm">{pred.name}</div>
                                                    <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-max">Règne : {pred.period}</div>
                                                    {pred.notes && <div className="text-xs text-slate-500 mt-1">{pred.notes}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </TabsContent>

                            <TabsContent value="territoire" className="space-y-4 focus-visible:outline-none mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                                            <MapPin className="h-4 w-4" /> Zone de Juridiction
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Village / Localité</div>
                                                <div className="text-base font-black text-slate-900">{chief.village || "Non spécifié"}</div>
                                            </div>
                                            <Separator className="bg-slate-200" />
                                            <div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Sous-Préfecture</div>
                                                <div className="text-base font-black text-slate-900">{chief.subPrefecture}</div>
                                            </div>
                                            {chief.cantonName && (
                                                <>
                                                    <Separator className="bg-slate-200" />
                                                    <div>
                                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Canton</div>
                                                        <div className="text-base font-black text-slate-900">{chief.cantonName}</div>
                                                    </div>
                                                </>
                                            )}
                                            {chief.tribuName && (
                                                <>
                                                    <Separator className="bg-slate-200" />
                                                    <div>
                                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Tribu</div>
                                                        <div className="text-base font-black text-slate-900">{chief.tribuName}</div>
                                                    </div>
                                                </>
                                            )}
                                            <Separator className="bg-slate-200" />
                                            <div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Région</div>
                                                <div className="text-base font-black text-slate-900">{chief.region}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                                            <ShieldCheck className="h-4 w-4" /> Informations Légales
                                        </h4>
                                        <div className="space-y-4">
                                            {chief.designationDate && (
                                                <div>
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Date de Désignation</div>
                                                    <div className="text-sm font-black text-slate-900">{format(new Date(chief.designationDate), 'dd MMMM yyyy', { locale: fr })}</div>
                                                </div>
                                            )}
                                            {chief.throneAccessionDate && (
                                                <>
                                                    <Separator className="bg-slate-200" />
                                                    <div>
                                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Date d'Accession au Trône</div>
                                                        <div className="text-sm font-black text-blue-700">{format(new Date(chief.throneAccessionDate), 'dd MMMM yyyy', { locale: fr })}</div>
                                                    </div>
                                                </>
                                            )}
                                            <Separator className="bg-slate-200" />
                                            <div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">ID Système</div>
                                                <code className="text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">{chief.id}</code>
                                            </div>
                                            <Separator className="bg-slate-200" />
                                            {canReadAudit && (
                                                <div>
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Date d'Immatriculation</div>
                                                    <div className="text-sm font-black text-slate-900">
                                                        {chief.audit?.createdAt ? format(new Date(chief.audit.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr }) : "Information non disponible"}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </ScrollArea>
                
                <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsPrinting(true)}
                        disabled={isPrinting}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Printer className="h-4 w-4" />
                        {isPrinting ? "Préparation..." : "Imprimer la Fiche"}
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                    >
                        Quitter
                    </button>
                </div>
            </DialogContent>

            <ChiefProfileReport 
                chief={chief}
                isPrinting={isPrinting}
                onAfterPrint={() => setIsPrinting(false)}
            />
        </Dialog>
    );
}

function getEventIcon(type: string) {
    switch (type) {
        case "Intronisation": return <Clock className="h-4 w-4 text-blue-500" />;
        case "Médaille": return <Award className="h-4 w-4 text-amber-500" />;
        case "Médiation": return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
        case "Mission": return <MapPin className="h-4 w-4 text-indigo-500" />;
        default: return <FileText className="h-4 w-4 text-slate-500" />;
    }
}
