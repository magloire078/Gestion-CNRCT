"use client";

import { useState, useMemo } from "react";
import { format, parseISO, isValid, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { GripVertical, MapPin, Calendar, Users, Flame, Clock } from "lucide-react";
import type { Mission } from "@/lib/data";
import { cn } from "@/lib/utils";

type Status = "Planifiée" | "En cours" | "Terminée" | "Annulée";
const statuses: Status[] = ["Planifiée", "En cours", "Terminée", "Annulée"];

interface MissionKanbanBoardProps {
    missions: Mission[];
    onStatusChange: (mission: Mission, newStatus: Status) => Promise<void>;
    onCardClick?: (mission: Mission) => void;
    canEdit: boolean;
}

const columnStyles: Record<Status, { bg: string; bar: string; ring: string; label: string }> = {
    "Planifiée": { bg: "from-blue-50/40 to-white", bar: "bg-blue-500", ring: "ring-blue-200", label: "À démarrer" },
    "En cours": { bg: "from-emerald-50/40 to-white", bar: "bg-emerald-500", ring: "ring-emerald-200", label: "En déploiement" },
    "Terminée": { bg: "from-slate-50/40 to-white", bar: "bg-slate-500", ring: "ring-slate-200", label: "Clôturée" },
    "Annulée": { bg: "from-rose-50/40 to-white", bar: "bg-rose-400", ring: "ring-rose-200", label: "Annulée" },
};

function getAlert(mission: Mission) {
    const status = mission.status;
    if (status === "Terminée" || status === "Annulée") return null;
    if (!mission.startDate) return null;
    const start = parseISO(mission.startDate);
    if (!isValid(start)) return null;
    const today = new Date();
    const daysToStart = differenceInDays(start, today);

    if (status === "Planifiée") {
        if (daysToStart < 0) return { level: "urgent" as const, label: `En retard de ${-daysToStart}j` };
        if (daysToStart <= 1) return { level: "urgent" as const, label: daysToStart === 0 ? "Démarre aujourd'hui" : "Démarre demain" };
        if (daysToStart <= 7) return { level: "warning" as const, label: `Démarre dans ${daysToStart}j` };
    }
    if (status === "En cours" && mission.endDate) {
        const end = parseISO(mission.endDate);
        if (isValid(end)) {
            const daysOverdue = differenceInDays(today, end);
            if (daysOverdue > 0) return { level: "urgent" as const, label: `Fin dépassée de ${daysOverdue}j` };
        }
    }
    return null;
}

export function MissionKanbanBoard({ missions, onStatusChange, onCardClick, canEdit }: MissionKanbanBoardProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

    const grouped = useMemo(() => {
        const map: Record<Status, Mission[]> = { "Planifiée": [], "En cours": [], "Terminée": [], "Annulée": [] };
        missions.forEach(m => {
            const s = (m.status || "Planifiée") as Status;
            if (map[s]) map[s].push(m);
        });
        Object.keys(map).forEach(k => {
            map[k as Status].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
        });
        return map;
    }, [missions]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        if (!canEdit) return;
        setDraggedId(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
    };

    const handleDragOver = (e: React.DragEvent, col: Status) => {
        if (!canEdit || !draggedId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverColumn !== col) setDragOverColumn(col);
    };

    const handleDrop = async (e: React.DragEvent, col: Status) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        setDraggedId(null);
        setDragOverColumn(null);
        if (!id) return;
        const mission = missions.find(m => m.id === id);
        if (!mission || mission.status === col) return;
        await onStatusChange(mission, col);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 p-6">
            {statuses.map(status => {
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
                                    Aucune mission
                                </div>
                            ) : (
                                items.map(m => {
                                    const alert = getAlert(m);
                                    return (
                                        <div
                                            key={m.id}
                                            draggable={canEdit}
                                            onDragStart={(e) => handleDragStart(e, m.id)}
                                            onDragEnd={() => { setDraggedId(null); setDragOverColumn(null); }}
                                            onClick={() => onCardClick?.(m)}
                                            className={cn(
                                                "group bg-white rounded-2xl border border-slate-100 p-3 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all cursor-pointer",
                                                canEdit && "active:cursor-grabbing",
                                                draggedId === m.id && "opacity-40"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <p className="text-sm font-black text-slate-900 tracking-tight line-clamp-2">{m.title}</p>
                                                {canEdit && <GripVertical className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                                            </div>

                                            {m.lieuMission && (
                                                <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                                    <MapPin className="h-2.5 w-2.5" />
                                                    {m.lieuMission}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                    <Calendar className="h-2.5 w-2.5" />
                                                    {m.startDate && isValid(parseISO(m.startDate))
                                                        ? format(parseISO(m.startDate), "dd MMM", { locale: fr })
                                                        : "-"}
                                                    {m.endDate && isValid(parseISO(m.endDate)) && (
                                                        <span> → {format(parseISO(m.endDate), "dd MMM", { locale: fr })}</span>
                                                    )}
                                                </div>
                                                {(m.participants || []).length > 0 && (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                        <Users className="h-2.5 w-2.5" />
                                                        {(m.participants || []).length}
                                                    </div>
                                                )}
                                            </div>

                                            {alert && (
                                                <div className={cn(
                                                    "mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                                                    alert.level === "urgent" ? "bg-rose-600 text-white animate-pulse" : "bg-amber-100 text-amber-800 border border-amber-200"
                                                )}>
                                                    {alert.level === "urgent" ? <Flame className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                                                    {alert.label}
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
