"use client";

import { Zap, Droplets, School, Activity, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Village, Chief } from "@/lib/data";

type VillageListCardProps = {
  village: Village;
  chief?: Chief | null;
  index: number;
  onClick: () => void;
};

export function VillageListCard({ village, chief, index, onClick }: VillageListCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition-all active:scale-[0.98] active:bg-slate-50"
    >
      <span className="absolute top-2 right-2 text-[10px] font-black text-slate-300 tabular-nums">
        #{index}
      </span>

      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-xl bg-slate-50 p-2.5">
          <Crown className="h-5 w-5 text-slate-400" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <p className="font-black text-slate-900 text-sm tracking-tight truncate">{village.name}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
            {village.subPrefecture || village.commune}
          </p>
          <p className="mt-1 text-xs text-slate-600 truncate">
            {[village.region, village.department].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {chief ? (
            <>
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={chief.photoUrl} />
                <AvatarFallback className="bg-slate-100 text-slate-400 text-[9px] font-black">
                  {chief.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-bold text-slate-700 truncate">{chief.name}</span>
            </>
          ) : (
            <span className="text-[10px] font-bold text-slate-300 italic uppercase tracking-widest">
              --- Aucune autorité ---
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex gap-1">
            <Zap className={cn("h-3.5 w-3.5", village.hasElectricity ? "text-amber-500 fill-amber-500" : "text-slate-200")} />
            <Droplets className={cn("h-3.5 w-3.5", village.hasWater ? "text-blue-500 fill-blue-500" : "text-slate-200")} />
            <School className={cn("h-3.5 w-3.5", village.hasSchool ? "text-indigo-500 fill-indigo-500" : "text-slate-200")} />
            <Activity className={cn("h-3.5 w-3.5", village.hasHealthCenter ? "text-emerald-500 fill-emerald-500" : "text-slate-200")} />
          </div>
          {chief ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none rounded-md text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
              Occupé
            </Badge>
          ) : (
            <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none rounded-md text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
              Vacant
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
