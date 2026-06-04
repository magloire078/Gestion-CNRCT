"use client";

import { useEffect, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { Crown, History, Loader2 } from "lucide-react";
import { subscribeToRegencyHistory } from "@/services/regency-service";
import type { RegencyHistory } from "@/types/regency";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Props = {
  villageId: string;
};

function safeFormat(date?: string): string {
  if (!date) return "—";
  try {
    const d = parseISO(date);
    if (isValid(d)) return format(d, "dd MMM yyyy", { locale: fr });
    // Format YYYY uniquement
    if (/^\d{4}$/.test(date)) return date;
    return date;
  } catch {
    return date;
  }
}

export function VillageRegencyTimeline({ villageId }: Props) {
  const [history, setHistory] = useState<RegencyHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!villageId) return;
    setLoading(true);
    const unsubscribe = subscribeToRegencyHistory(villageId, (items) => {
      setHistory(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [villageId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
        <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
          Aucun historique de régence renseigné
        </p>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
          La succession des chefs s'enrichit au fil des saisies dans le module Chefferie.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-6 border-l-2 border-slate-100 ml-3">
      {history.map((entry) => (
        <li key={entry.id} className="ml-6">
          <span
            className={cn(
              "absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white",
              entry.isCurrent ? "bg-emerald-500" : "bg-slate-300"
            )}
            aria-hidden="true"
          >
            <Crown className="h-3 w-3 text-white" />
          </span>
          <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 rounded-xl border border-slate-100 shrink-0">
                <AvatarImage src={entry.photoUrl || ""} alt={entry.chiefName} />
                <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px] font-black">
                  {entry.chiefName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-slate-900 tracking-tight">{entry.chiefName}</h3>
                  {entry.chiefTitle && (
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {entry.chiefTitle}
                    </span>
                  )}
                  {entry.isCurrent && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none rounded-md text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                      En fonction
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {safeFormat(entry.startDate)} → {entry.endDate ? safeFormat(entry.endDate) : "Présent"}
                </p>
                {entry.achievements && (
                  <p className="mt-3 text-sm text-slate-700 leading-relaxed">{entry.achievements}</p>
                )}
                {entry.notes && (
                  <p className="mt-2 text-xs italic text-slate-500">{entry.notes}</p>
                )}
              </div>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
