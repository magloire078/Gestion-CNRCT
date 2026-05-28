"use client";

import { useMemo } from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, AlertCircle, Map as MapIcon, User, ShieldAlert, XCircle, Hourglass } from "lucide-react";
import type { Conflict, ConflictStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

interface ConflictGlobalTimelineProps {
    conflicts: Conflict[];
    onCardClick?: (conflict: Conflict) => void;
}

type TimelineEvent = {
    date: string;
    kind: "report" | "resolution";
    conflict: Conflict;
};

const statusStyles: Record<ConflictStatus, { ring: string; dot: string; bg: string }> = {
    "Ouvert": { ring: "ring-rose-200", dot: "bg-rose-500", bg: "bg-rose-50" },
    "En médiation": { ring: "ring-indigo-200", dot: "bg-indigo-500", bg: "bg-indigo-50" },
    "Résolu": { ring: "ring-emerald-200", dot: "bg-emerald-500", bg: "bg-emerald-50" },
    "Classé sans suite": { ring: "ring-slate-200", dot: "bg-slate-400", bg: "bg-slate-50" },
};

export function ConflictGlobalTimeline({ conflicts, onCardClick }: ConflictGlobalTimelineProps) {
    const grouped = useMemo(() => {
        const events: TimelineEvent[] = [];
        conflicts.forEach(c => {
            if (c.reportedDate && isValid(parseISO(c.reportedDate))) {
                events.push({ date: c.reportedDate, kind: "report", conflict: c });
            }
            if (c.resolutionDate && isValid(parseISO(c.resolutionDate))) {
                events.push({ date: c.resolutionDate, kind: "resolution", conflict: c });
            }
        });
        events.sort((a, b) => b.date.localeCompare(a.date));

        const map = new Map<string, TimelineEvent[]>();
        events.forEach(e => {
            const d = parseISO(e.date);
            const key = format(d, "yyyy-MM");
            const arr = map.get(key) || [];
            arr.push(e);
            map.set(key, arr);
        });
        return Array.from(map.entries()).map(([key, evts]) => ({
            key,
            label: format(parseISO(key + "-01"), "MMMM yyyy", { locale: fr }),
            events: evts,
            counts: {
                reports: evts.filter(e => e.kind === "report").length,
                resolutions: evts.filter(e => e.kind === "resolution").length,
            }
        }));
    }, [conflicts]);

    if (grouped.length === 0) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 p-12">
                <Hourglass className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-bold text-sm uppercase tracking-widest">Aucun événement à afficher.</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8">
            <div className="relative pl-8 md:pl-12 space-y-10">
                <div className="absolute left-3 md:left-4 top-2 bottom-2 w-px bg-gradient-to-b from-slate-200 via-slate-100 to-transparent" />

                {grouped.map(group => (
                    <div key={group.key} className="relative">
                        <div className="absolute -left-8 md:-left-12 top-0 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-900 text-white ring-4 ring-white shadow-lg">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>

                        <div className="mb-4 flex items-baseline gap-3 flex-wrap">
                            <h3 className="text-2xl font-black text-slate-900 capitalize tracking-tight">{group.label}</h3>
                            <div className="flex gap-2">
                                {group.counts.reports > 0 && (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-rose-50 text-rose-600 border border-rose-100">
                                        {group.counts.reports} signalement{group.counts.reports > 1 ? 's' : ''}
                                    </span>
                                )}
                                {group.counts.resolutions > 0 && (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        {group.counts.resolutions} résolution{group.counts.resolutions > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {group.events.map((evt, idx) => {
                                const c = evt.conflict;
                                const status = (c.status || 'Ouvert') as ConflictStatus;
                                const style = statusStyles[status];
                                const isResolution = evt.kind === "resolution";

                                return (
                                    <button
                                        key={`${c.id}-${evt.kind}-${idx}`}
                                        onClick={() => onCardClick?.(c)}
                                        className={cn(
                                            "text-left group bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all",
                                            "relative overflow-hidden"
                                        )}
                                    >
                                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.dot)} />

                                        <div className="flex items-start justify-between gap-3 mb-2 pl-1">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                    isResolution ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                )}>
                                                    {isResolution ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                        {isResolution ? "Résolution" : "Signalement"}
                                                    </p>
                                                    <p className="text-[10px] font-bold font-mono text-slate-500">
                                                        {format(parseISO(evt.date), "dd MMM yyyy", { locale: fr })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                                                status === 'Résolu' ? "bg-emerald-50 text-emerald-700" :
                                                status === 'En médiation' ? "bg-indigo-50 text-indigo-700" :
                                                status === 'Classé sans suite' ? "bg-slate-100 text-slate-700" :
                                                "bg-rose-50 text-rose-700"
                                            )}>
                                                {status === 'Classé sans suite' ? <XCircle className="h-2.5 w-2.5" /> : <ShieldAlert className="h-2.5 w-2.5" />}
                                                {status}
                                            </div>
                                        </div>

                                        <div className="pl-1">
                                            <p className="text-sm font-black text-slate-900 tracking-tight mb-1 group-hover:translate-x-0.5 transition-transform">
                                                {c.village}
                                            </p>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 mb-2">
                                                <span className="inline-flex items-center gap-1">
                                                    <MapIcon className="h-2.5 w-2.5" /> {c.region || 'National'}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="font-black uppercase tracking-widest text-slate-600">{c.type}</span>
                                            </div>
                                            {isResolution && c.resolutionDetails ? (
                                                <p className="text-[11px] text-emerald-700 leading-snug italic line-clamp-2 bg-emerald-50/50 p-2 rounded border-l-2 border-emerald-200">
                                                    {c.resolutionDetails}
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 italic">
                                                    "{c.description}"
                                                </p>
                                            )}
                                            {c.mediatorName && (
                                                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                    <User className="h-2.5 w-2.5" /> {c.mediatorName}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
