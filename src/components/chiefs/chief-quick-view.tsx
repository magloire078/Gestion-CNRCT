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

interface ChiefQuickViewProps {
    chief: Chief | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ChiefQuickView({ chief, isOpen, onClose }: ChiefQuickViewProps) {
    if (!chief) return null;

    const career = chief.career || [];
    const meritPoints = chief.meritPoints || 0;
    const isHighAuthority = ["Roi", "Chef de province", "Chef de canton"].includes(chief.role);
    const { hasPermission } = useAuth();
    
    const canReadCareer = hasPermission('chiefs-career:read');
    const canReadAudit = hasPermission('chiefs-audit:read');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-none gap-0 bg-slate-50/95 backdrop-blur-2xl">
                {/* Header Profile Section */}
                <div className={cn(
                    "relative p-8 text-white overflow-hidden",
                    isHighAuthority ? "bg-amber-900" : "bg-blue-900"
                )}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                        <div className="h-full w-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                    </div>

                    <div className="relative flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                        <Avatar className="h-24 w-24 rounded-3xl border-4 border-white/20 shadow-2xl">
                            <AvatarImage src={chief.photoUrl} alt={chief.name} className="object-cover" />
                            <AvatarFallback className="bg-white/10 text-white font-bold text-2xl">
                                {chief.lastName?.charAt(0)}{chief.firstName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <Badge className="bg-white/20 text-white hover:bg-white/30 border-none px-3 py-1 text-[10px] uppercase tracking-widest font-black">
                                    {chief.role}
                                </Badge>
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
                                    {chief.subPrefecture} • {chief.region}
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                            <Award className={cn("h-6 w-6 mx-auto mb-1", meritPoints > 70 ? "text-amber-400" : "text-blue-400")} />
                            <div className="text-2xl font-black text-white">{meritPoints}</div>
                            <div className="text-[9px] uppercase font-black text-white/50 tracking-tighter">Points de Mérite</div>
                        </div>
                    </div>
                </div>

                <ScrollArea className="max-h-[70vh]">
                    <div className="p-8 space-y-8">
                        {/* Bio / Overview */}
                        <section className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                BIOGRAPHIE & MISSION
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed font-medium bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                                {chief.bio || "Aucune information biographique disponible pour le moment."}
                            </p>
                        </section>

                        {/* Career Timeline */}
                        {canReadCareer && (
                            <section className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <History className="h-3 w-3" />
                                    PARCOURS DE L&apos;AUTORITÉ
                                </h4>
                                
                                <div className="relative space-y-6 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                    {career.length > 0 ? (
                                        career.map((event, index) => (
                                            <div key={event.id} className="relative pl-10">
                                                <div className="absolute left-0 top-1 h-9 w-9 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center z-10 transition-transform hover:scale-110">
                                                    {getEventIcon(event.type)}
                                                </div>
                                                <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm hover:border-blue-400/50 transition-colors">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h5 className="font-black text-slate-900 text-sm">{event.title}</h5>
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full ring-1 ring-slate-100">
                                                            {event.date}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-500 text-xs leading-relaxed">{event.description}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="pl-10 text-slate-400 italic text-sm py-2">
                                            Aucun événement répertorié dans la timeline officielle.
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        <Separator className="bg-slate-200/60" />

                        {/* Additional Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">CONTACTS OFFICIELS</h4>
                                <div className="space-y-2">
                                    {chief.phone && (
                                        <div className="flex items-center gap-3 text-sm text-slate-600 font-bold bg-white p-3 rounded-xl border border-slate-200/60">
                                            <Phone className="h-4 w-4 text-blue-500" />
                                            {chief.phone}
                                        </div>
                                    )}
                                    {chief.email && (
                                        <div className="flex items-center gap-3 text-sm text-slate-600 font-bold bg-white p-3 rounded-xl border border-slate-200/60">
                                            <Mail className="h-4 w-4 text-blue-500" />
                                            {chief.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">ADMINISTRATION</h4>
                                <div className="space-y-2">
                                    {canReadAudit && (
                                        <div className="flex items-center gap-3 text-sm text-slate-600 font-bold bg-white p-3 rounded-xl border border-slate-200/60">
                                            <Calendar className="h-4 w-4 text-blue-500" />
                                            Inscrit le {chief.audit?.createdAt ? format(new Date(chief.audit.createdAt), 'dd MMMM yyyy', { locale: fr }) : "N/A"}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm text-slate-400 font-bold bg-white/50 p-3 rounded-xl border border-dashed border-slate-200/60">
                                        <ShieldCheck className="h-4 w-4" />
                                        ID: {chief.id.substring(0, 8)}...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                
                <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                    >
                        Quitter
                    </button>
                </div>
            </DialogContent>
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
