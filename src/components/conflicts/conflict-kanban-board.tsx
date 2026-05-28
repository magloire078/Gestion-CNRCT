"use client";

import { useState, useMemo } from "react";
import { format, parseISO, isValid, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { GripVertical, Map, History, User, Flame, Clock, ShieldAlert } from "lucide-react";
import type { Conflict, ConflictStatus } from "@/lib/data";
import { conflictStatuses } from "@/lib/data";
import { cn } from "@/lib/utils";

interface ConflictKanbanBoardProps {
    conflicts: Conflict[];
    onStatusChange: (conflict: Conflict, newStatus: ConflictStatus) => Promise<void>;
    onCardClick?: (conflict: Conflict) => void;
    canEdit: boolean;
}

const columnStyles: Record<ConflictStatus, { bg: string; bar: string; ring: string; icon: string; label: string }> = {
    "Ouvert": { bg: "from-rose-50/40 to-white", bar: "bg-rose-500", ring: "ring-rose-200", icon: "text-rose-500", label: "À traiter" },
    "En médiation": { bg: "from-indigo-50/40 to-white", bar: "bg-indigo-500", ring: "ring-indigo-200", icon: "text-indigo-500", label: "En cours" },
    "Résolu": { bg: "from-emerald-50/40 to-white", bar: "bg-emerald-500", ring: "ring-emerald-200", icon: "text-emerald-500", label: "Clôturé" },
    "Classé sans suite": { bg: "from-slate-50/40 to-white", bar: "bg-slate-400", ring: "ring-slate-200", icon: "text-slate-500", label: "Archivé" },
};

function getAge(conflict: Conflict) {
    const status = conflict.status || "Ouvert";
    if (status === "Résolu" || status === "Classé sans suite" || !conflict.reportedDate) return null;
    const reported = parseISO(conflict.reportedDate);
    if (!isValid(reported)) return null;
    const days = differenceInDays(new Date(), reported);
    if (days >= 60) return { level: "urgent" as const, days };
    if (days >= 30) return { level: "warning" as const, days };
    return null;
}

export function ConflictKanbanBoard({ conflicts, onStatusChange, onCardClick, canEdit }: ConflictKanbanBoardProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<ConflictStatus | null>(null);

    const grouped = useMemo(() => {
        const map: Record<ConflictStatus, Conflict[]> = {
            "Ouvert": [],
            "En médiation": [],
            "Résolu": [],
            "Classé sans suite": [],
        };
        conflicts.forEach(c => {
            const s = (c.status || "Ouvert") as ConflictStatus;
            if (map[s]) map[s].push(c);
        });
        // Sort each column by reported date desc
        Object.keys(map).forEach(k => {
            map[k as ConflictStatus].sort((a, b) => (b.reportedDate || '').localeCompare(a.reportedDate || ''));
        });
        return map;
    }, [conflicts]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        if (!canEdit) return;
        setDraggedId(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
    };

    const handleDragOver = (e: React.DragEvent, col: ConflictStatus) => {
        if (!canEdit || !draggedId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverColumn !== col) setDragOverColumn(col);
    };

    const handleDrop = async (e: React.DragEvent, col: ConflictStatus) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        setDraggedId(null);
        setDragOverColumn(null);
        if (!id) return;
        const conflict = conflicts.find(c => c.id === id);
        if (!conflict || (conflict.status || "Ouvert") === col) return;
        await onStatusChange(conflict, col);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 p-6">
            {conflictStatuses.map(status => {
                const items = grouped[status];
                const style = columnStyles[status];
                const isDragTarget = dragOverColumn === status;

                return (
                    <div
                        key={status}
                        onDragOver={(e) => handleDragOver(e, status)}
                        onDragLeave={() => setDragOverColumn(prev => (prev === status ? null : prev))}
                        onDrop={(e) => handleDrop(e, status)}
                        className={cn(
                            "rounded-3xl bg-gradient-to-b border border-slate-100 flex flex-col min-h-[400px] transition-all",
                            style.bg,
                            isDragTarget && cn("ring-4 ring-offset-2 scale-[1.01]", style.ring)
                        )}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className={cn("h-2 w-2 rounded-full", style.bar)} />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{status}</p>
                                    <p className="text-[9px] font-bold italic text-slate-400">{style.label}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-slate-100 tabular-nums">
                                {items.length}
                            </span>
                        </div>

                        <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[700px]">
                            {items.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-300 italic py-12">
                                    Aucun dossier
                                </div>
                            ) : (
                                items.map(c => {
                                    const alert = getAge(c);
                                    return (
                                        <div
                                            key={c.id}
                                            draggable={canEdit}
                                            onDragStart={(e) => handleDragStart(e, c.id)}
                                            onDragEnd={() => { setDraggedId(null); setDragOverColumn(null); }}
                                            onClick={() => onCardClick?.(c)}
                                            className={cn(
                                                "group bg-white rounded-2xl border border-slate-100 p-3 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all cursor-pointer",
                                                canEdit && "active:cursor-grabbing",
                                                draggedId === c.id && "opacity-40"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <p className="text-sm font-black text-slate-900 tracking-tight line-clamp-1">{c.village}</p>
                                                {canEdit && <GripVertical className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                                            </div>

                                            {c.region && (
                                                <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                                    <Map className="h-2.5 w-2.5" />
                                                    {c.region}
                                                </div>
                                            )}

                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-[9px] font-black uppercase text-slate-600 mb-2">
                                                <ShieldAlert className={cn("h-2.5 w-2.5", style.icon)} />
                                                {c.type}
                                            </div>

                                            <p className="text-[11px] text-slate-500 line-clamp-2 italic leading-snug mb-2">
                                                {c.description}
                                            </p>

                                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                    <History className="h-2.5 w-2.5" />
                                                    {c.reportedDate && isValid(parseISO(c.reportedDate))
                                                        ? format(parseISO(c.reportedDate), "dd MMM yy", { locale: fr })
                                                        : "-"}
                                                </div>
                                                {c.mediatorName && (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 truncate max-w-[110px]">
                                                        <User className="h-2.5 w-2.5" />
                                                        <span className="truncate">{c.mediatorName}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {alert && (
                                                <div className={cn(
                                                    "mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                                                    alert.level === "urgent" ? "bg-rose-600 text-white animate-pulse" : "bg-amber-100 text-amber-800 border border-amber-200"
                                                )}>
                                                    {alert.level === "urgent" ? <Flame className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                                                    {alert.days}j
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
