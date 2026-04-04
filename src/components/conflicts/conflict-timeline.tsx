"use client";

import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageSquare, Users, FileText, CheckCircle, HelpCircle, Calendar } from "lucide-react";
import type { ConflictComment } from "@/types/common";
import { cn } from "@/lib/utils";

interface ConflictTimelineProps {
    comments?: ConflictComment[];
}

const typeIconMap = {
    Note: MessageSquare,
    Réunion: Users,
    Document: FileText,
    Résolution: CheckCircle,
    Autre: HelpCircle,
} as const;

const typeColorMap = {
    Note: "bg-blue-100 text-blue-600 border-blue-200",
    Réunion: "bg-orange-100 text-orange-600 border-orange-200",
    Document: "bg-purple-100 text-purple-600 border-purple-200",
    Résolution: "bg-green-100 text-green-600 border-green-200",
    Autre: "bg-slate-100 text-slate-600 border-slate-200",
} as const;

export function ConflictTimeline({ comments = [] }: ConflictTimelineProps) {
    if (comments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-xl border-slate-100 bg-slate-50/50">
                <Calendar className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">Aucune étape de médiation enregistrée</p>
                <p className="text-xs text-slate-400 mt-1">Commencez par ajouter une note ou une réunion.</p>
            </div>
        );
    }

    // Sort by date descending
    const sortedComments = [...comments].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {sortedComments.map((comment, index) => {
                const Icon = typeIconMap[comment.type as keyof typeof typeIconMap] || HelpCircle;
                const statusColors = typeColorMap[comment.type as keyof typeof typeColorMap] || typeColorMap.Autre;
                const isNewest = index === 0;

                return (
                    <div key={comment.id} className="relative flex items-start group">
                        {/* Dot / Icon */}
                        <div className={cn(
                            "absolute left-0 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-sm transition-all group-hover:scale-110",
                            statusColors,
                            isNewest && "ring-4 ring-slate-50 ring-offset-0"
                        )}>
                            <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="ml-14 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900">{comment.author}</span>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                        statusColors
                                    )}>
                                        {comment.type || 'Action'}
                                    </span>
                                </div>
                                <time className="text-xs font-semibold text-slate-400">
                                    {(() => {
                                        const d = parseISO(comment.date);
                                        return isValid(d) ? format(d, "PPP 'à' HH:mm", { locale: fr }) : comment.date;
                                    })()}
                                </time>
                            </div>
                            <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm transition-all group-hover:border-slate-300">
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
