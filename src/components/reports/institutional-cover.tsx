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
  service = "Direction des Finances et du Patrimoine",
  direction = "DFP",
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

  return (
    <div className={cn(
        "flex flex-col bg-white p-12 print:p-16 relative overflow-hidden",
        !compact && "break-after-page",
        !compact && (orientation === 'portrait' ? "min-h-[29.7cm]" : "min-h-[21cm]"),
        compact && "pb-6 print:pb-6"
    )}>
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-50 rounded-full -ml-48 -mb-48 opacity-50" />

      <InstitutionalHeader 
        service={service} 
        direction={direction} 
        period={period} 
        settings={settings}
      />

      <div className="flex-1 flex flex-col justify-center items-center text-center py-5 relative z-10">
        <div className="mb-4 p-1">
          {settings?.mainLogoUrl ? (
            <img src={settings.mainLogoUrl} alt="Logo" className="h-32 w-auto object-contain" />
          ) : (
            <div className="p-6 bg-slate-900 rounded-xl rotate-3 shadow-2xl">
              <FileText className="h-16 w-16 text-white -rotate-3" />
            </div>
          )}
        </div>

        <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9] max-w-4xl mb-6 italic">
          {title}
        </h1>

        {subtitle && (
          <p className="text-xl font-bold text-slate-500 uppercase tracking-widest max-w-2xl mb-12">
            {subtitle}
          </p>
        )}

        <div className="flex items-center gap-6 mb-16">
          <div className="h-px w-12 bg-slate-200" />
          <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-[0.3em] text-xs">
            <Calendar className="h-4 w-4" />
            {format(date, "MMMM yyyy", { locale: fr })}
          </div>
          <div className="h-px w-12 bg-slate-200" />
        </div>

        {stats && stats.length > 0 && (
          <div className={cn("grid gap-6 w-full max-w-5xl", compact ? "grid-cols-3 mt-4" : "grid-cols-2 md:grid-cols-4 mt-4")}>
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center gap-2 p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                {stat.icon && <stat.icon className="h-5 w-5 text-slate-400 mb-2" />}
                <span className={cn("font-black text-slate-900 tracking-tighter tabular-nums", compact ? "text-2xl" : "text-3xl")}>{stat.value}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center leading-tight">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!compact && (
        <div className="flex justify-between items-end mt-auto pt-12 border-t border-slate-100 relative z-10">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence Document</span>
            <span className="text-sm font-bold text-slate-900 font-mono uppercase">{reference || `CNRCT-${direction}-${format(date, 'yyyyMM')}`}</span>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Document Certifié</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1 italic">CNRCT Digital Quality Assurance</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
