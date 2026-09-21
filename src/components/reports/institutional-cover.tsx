"use client";

import { useEffect, useState } from "react";
import { InstitutionalHeader } from "./institutional-header";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, ShieldCheck, Calendar } from "lucide-react";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/types/common";
import { cn } from "@/lib/utils";

interface InstitutionalCoverProps {
  title: string;
  subtitle?: string;
  period?: string;
  service?: string;
  direction?: string;
  showService?: boolean;
  secretariatLabel?: string;
  stats?: { label: string; value: string | number; icon?: any }[];
  reference?: string;
  date?: Date;
  settings?: OrganizationSettings | null;
  orientation?: 'portrait' | 'landscape';
  compact?: boolean;
}

export function InstitutionalCover({
  title,
  subtitle,
  period,
  service,
  direction,
  showService,
  secretariatLabel,
  stats,
  reference,
  date = new Date(),
  settings: initialSettings,
  orientation = 'portrait',
  compact = false
}: InstitutionalCoverProps) {
  const [settings, setSettings] = useState<OrganizationSettings | null>(initialSettings || null);

  useEffect(() => {
    if (!initialSettings) {
      getOrganizationSettings().then(setSettings);
    } else {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const isLandscape = orientation === 'landscape';

  return (
    <div className={cn(
        "flex flex-col bg-white relative overflow-hidden break-after-page print:break-after-page",
        isLandscape 
          ? "p-6 print:p-6 min-h-0 justify-between" 
          : "p-10 print:p-12 min-h-0 justify-between",
        compact && "pb-4 print:pb-4"
    )}>
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-50 rounded-full -ml-48 -mb-48 opacity-50 pointer-events-none" />

      <InstitutionalHeader 
        service={service} 
        direction={direction} 
        showService={showService !== undefined ? showService : (service !== undefined ? Boolean(service) : true)}
        secretariatLabel={secretariatLabel}
        period={period} 
        settings={settings}
        compact={isLandscape || compact}
        showDivider={true}
      />

      <div className={cn(
        "flex flex-col items-center text-center relative z-10",
        isLandscape ? "py-2 my-auto" : "py-4 my-auto"
      )}>
        <h1 className={cn(
          "font-black text-slate-900 uppercase tracking-tighter leading-tight max-w-4xl italic text-center",
          isLandscape ? "text-2xl sm:text-3xl mb-2" : "text-3xl sm:text-4xl mb-3"
        )}>
          {title}
        </h1>

        {subtitle && (
          <p className={cn(
            "font-bold text-slate-500 uppercase tracking-widest max-w-3xl text-center",
            isLandscape ? "text-xs sm:text-sm mb-3" : "text-sm sm:text-base mb-4"
          )}>
            {subtitle}
          </p>
        )}

        <div className={cn("flex items-center gap-4", isLandscape ? "mb-4" : "mb-6")}>
          <div className="h-px w-10 bg-slate-200" />
          <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-[0.25em] text-[10px]">
            <Calendar className="h-3.5 w-3.5" />
            {format(date, "MMMM yyyy", { locale: fr })}
          </div>
          <div className="h-px w-10 bg-slate-200" />
        </div>

        {stats && stats.length > 0 && (
          <div className={cn(
            "grid gap-3 w-full",
            isLandscape ? "grid-cols-2 sm:grid-cols-4 max-w-4xl" : "grid-cols-2 md:grid-cols-4 max-w-4xl"
          )}>
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                {stat.icon && <stat.icon className="h-4 w-4 text-slate-400 mb-1" />}
                <span className="font-black text-slate-900 tracking-tighter tabular-nums text-xl sm:text-2xl leading-none">{stat.value}</span>
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider text-center leading-tight mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!compact && (
        <div className={cn(
          "flex justify-between items-end border-t border-slate-100 relative z-10",
          isLandscape ? "pt-3 mt-2" : "pt-4 mt-4"
        )}>
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Référence Document</span>
            <span className="text-xs font-bold text-slate-900 font-mono uppercase">{reference || `CNRCT-${direction}-${format(date, 'yyyyMM')}`}</span>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none">Document Certifié</span>
              <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 italic">CNRCT Digital Quality Assurance</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
