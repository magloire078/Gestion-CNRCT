"use client";

import { useMemo } from "react";
import { Conflict } from "@/types/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    MapPin, User, Calendar, ShieldAlert, 
    Pencil, Trash2, Eye, Printer, 
    ChevronRight, Users, AlertTriangle, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

interface ConflictCardProps {
    conflict: Conflict;
    index: number;
    onClick?: () => void;
    onEdit?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
    onPrint?: (e: React.MouseEvent) => void;
    canEdit?: boolean;
    canDelete?: boolean;
}

export function ConflictCard({ 
    conflict, 
    index, 
    onClick, 
    onEdit, 
    onDelete, 
    onPrint,
    canEdit = false,
    canDelete = false
}: ConflictCardProps) {
    const isUrgent = !conflict.status || conflict.status === 'Ouvert' || (conflict.status as string) === 'En cours';

    // Color maps for left accent and badges
    const statusAccentMap: Record<string, string> = {
        "Résolu": "bg-gradient-to-b from-emerald-400 to-emerald-600",
        "En médiation": "bg-gradient-to-b from-blue-500 to-indigo-600",
        "Ouvert": "bg-gradient-to-b from-rose-500 to-pink-600",
        "En cours": "bg-gradient-to-b from-rose-500 to-pink-600",
        "Classé sans suite": "bg-gradient-to-b from-slate-400 to-slate-600",
        "Escaladé à la justice": "bg-gradient-to-b from-purple-500 to-violet-600",
        "En appel": "bg-gradient-to-b from-amber-400 to-amber-600"
    };

    const statusBadgeClassMap: Record<string, string> = {
        "Résolu": "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50",
        "En médiation": "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50",
        "Ouvert": "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50",
        "En cours": "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50",
        "Classé sans suite": "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
        "Escaladé à la justice": "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-50",
        "En appel": "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50"
    };

    const activeStatus = (conflict.status as string) || "Ouvert";
    const accentBg = statusAccentMap[activeStatus] || "bg-gradient-to-b from-slate-400 to-slate-600";
    const badgeClass = statusBadgeClassMap[activeStatus] || "bg-slate-100 text-slate-700 border-slate-200";

    const formattedDate = useMemo(() => {
        if (!conflict.reportedDate) return "-";
        try {
            const d = parseISO(conflict.reportedDate);
            return isValid(d) ? format(d, 'dd MMMM yyyy', { locale: fr }) : conflict.reportedDate;
        } catch {
            return conflict.reportedDate;
        }
    }, [conflict.reportedDate]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            onClick={onClick}
            className="cursor-pointer h-full"
        >
            <Card className={cn(
                "group relative overflow-hidden transition-all duration-500 h-full border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_24px_50px_rgb(0,0,0,0.08)] hover:border-slate-300/80 rounded-2xl flex flex-col",
                isUrgent && "border-rose-100/70 bg-gradient-to-br from-white via-white to-rose-50/10"
            )}>
                {/* Visual Status Indicator Accent Strip */}
                <div className={cn("absolute top-0 left-0 w-2 h-full transition-all duration-500 opacity-90 group-hover:opacity-100", accentBg)} />

                {/* Subtle Background Icon */}
                <div className="absolute -bottom-8 -right-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none transform group-hover:scale-125 group-hover:-rotate-6">
                    <ShieldAlert className="h-36 w-36" />
                </div>

                <div className="p-4 flex-1 flex flex-col">
                    {/* Top Row: Meta details */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex flex-wrap gap-1.5 items-center">
                            <Badge variant="outline" className={cn("px-2.5 py-0.5 text-[9px] uppercase tracking-widest font-black rounded-lg shadow-sm border", badgeClass)}>
                                {activeStatus === "En cours" ? "Ouvert" : activeStatus}
                            </Badge>
                            
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none font-bold text-[9px] uppercase tracking-wider">
                                {conflict.type}
                            </Badge>

                            {isUrgent && (
                                <Badge className="bg-rose-500 text-white border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded shadow-sm animate-pulse">
                                    Urgent
                                </Badge>
                            )}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-300 group-hover:text-slate-400 transition-colors">
                            #{String(index).padStart(3, '0')}
                        </span>
                    </div>

                    {/* Conflict Title (Location) */}
                    <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors uppercase tracking-tight line-clamp-1">
                        {conflict.village}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {conflict.region || 'Région non spécifiée'}
                    </p>

                    {/* Parties Section */}
                    {conflict.parties && (
                        <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                            <Users className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Parties Impliquées</p>
                                <p className="text-xs font-bold text-slate-700 truncate mt-0.5" title={conflict.parties}>
                                    {conflict.parties}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Description excerpt */}
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2.5 line-clamp-2 italic">
                        "{conflict.description}"
                    </p>

                    {/* Metadata details */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100/60 grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <div className="min-w-0">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Signalé le</p>
                                <p className="text-[10px] font-bold text-slate-600 truncate">{formattedDate}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <div className="min-w-0">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Médiateur</p>
                                <p className="text-[10px] font-black text-slate-700 truncate">
                                    {conflict.mediatorName || 'Non assigné'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-3">
                            {onPrint && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onPrint(e); }}
                                    className="p-1.5 rounded bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm"
                                    title="Imprimer le dossier"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                </button>
                            )}
                            {canEdit && onEdit && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onEdit(e); }}
                                    className="p-1.5 rounded bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors shadow-sm"
                                    title="Modifier le dossier"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            )}
                            {canDelete && onDelete && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                                    className="p-1.5 rounded bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm"
                                    title="Supprimer le dossier"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                            Consulter
                            <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
