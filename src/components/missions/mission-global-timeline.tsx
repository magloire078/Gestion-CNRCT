"use client";

import { useMemo } from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, PlayCircle, Clock, MapPin, Users, Hourglass, XCircle } from "lucide-react";
import type { Mission } from "@/lib/data";
import { cn } from "@/lib/utils";

interface MissionGlobalTimelineProps {
    missions: Mission[];
    onCardClick?: (mission: Mission) => void;
}

type TimelineEvent = {
    date: string;
    kind: "start" | "end";
    mission: Mission;
};

const statusStyles: Record<string, { dot: string }> = {
    "Planifiée": { dot: "bg-blue-500" },
    "En cours": { dot: "bg-emerald-500" },
    "Terminée": { dot: "bg-slate-500" },
    "Annulée": { dot: "bg-rose-500" },
};

export function MissionGlobalTimeline({ missions, onCardClick }: MissionGlobalTimelineProps) {
    const grouped = useMemo(() => {
        const events: TimelineEvent[] = [];
        missions.forEach(m => {
            if (m.startDate && isValid(parseISO(m.startDate))) {
                events.push({ date: m.startDate, kind: "start", mission: m });
            }
            if (m.endDate && isValid(parseISO(m.endDate)) && m.status === 'Terminée') {
                events.push({ date: m.endDate, kind: "end", mission: m });
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
                starts: evts.filter(e => e.kind === "start").length,
                ends: evts.filter(e => e.kind === "end").length,
            }
        }));
    }, [missions]);

    if (grouped.length === 0) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 p-12">
                <Hourglass className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-bold text-sm uppercase tracking-widest">Aucune mission à afficher.</p>
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
                                {group.counts.starts > 0 && (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                                        {group.counts.starts} déploiement{group.counts.starts > 1 ? 's' : ''}
                                    </span>
                                )}
                                {group.counts.ends > 0 && (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        {group.counts.ends} clôture{group.counts.ends > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {group.events.map((evt, idx) => {
                                const m = evt.mission;
                                const isEnd = evt.kind === "end";
                                const style = statusStyles[m.status] || statusStyles["Planifiée"];

                                return (
                                    <button
                                        key={`${m.id}-${evt.kind}-${idx}`}
                                        onClick={() => onCardClick?.(m)}
                                        className="text-left group bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all relative overflow-hidden"
                                    >
                                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.dot)} />

                                        <div className="flex items-start justify-between gap-3 mb-2 pl-1">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                    isEnd ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                                )}>
                                                    {isEnd ? <CheckCircle2 className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                        {isEnd ? "Clôture" : "Déploiement"}
                                                    </p>
                                                    <p className="text-[10px] font-bold font-mono text-slate-500">
                                                        {format(parseISO(evt.date), "dd MMM yyyy", { locale: fr })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                                                m.status === 'Terminée' ? "bg-slate-100 text-slate-700" :
                                                m.status === 'En cours' ? "bg-emerald-50 text-emerald-700" :
                                                m.status === 'Annulée' ? "bg-rose-50 text-rose-700" :
                                                "bg-blue-50 text-blue-700"
                                            )}>
                                                {m.status === 'Annulée' ? <XCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                                                {m.status}
                                            </div>
                                        </div>

                                        <div className="pl-1">
                                            <p className="text-sm font-black text-slate-900 tracking-tight mb-1 line-clamp-2 group-hover:translate-x-0.5 transition-transform">
                                                {m.title}
                                            </p>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 mb-2 flex-wrap">
                                                {m.lieuMission && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin className="h-2.5 w-2.5" /> {m.lieuMission}
                                                    </span>
                                                )}
                                                {(m.participants || []).length > 0 && (
                                                    <>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <Users className="h-2.5 w-2.5" /> {(m.participants || []).length} agent{(m.participants || []).length > 1 ? 's' : ''}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 italic">
                                                "{m.description}"
                                            </p>
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
