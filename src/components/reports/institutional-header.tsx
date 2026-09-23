"use client";

import { useEffect, useState } from "react";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/types/common";
import { cn } from "@/lib/utils";

interface InstitutionalHeaderProps {
  title?: string;
  period?: string;
  service?: string;
  direction?: string;
  secretariatLabel?: string;
  showService?: boolean;
  settings?: OrganizationSettings | null;
  children?: React.ReactNode;
  showDivider?: boolean;
  compact?: boolean;
}

export function InstitutionalHeader({ 
  title, 
  period, 
  service = "",
  direction = "",
  secretariatLabel = "Secrétariat Général",
  showService = false,
  settings: initialSettings,
  children,
  showDivider = true,
  compact = false
}: InstitutionalHeaderProps) {
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
      "flex justify-between items-start w-full relative break-inside-avoid",
      compact 
        ? (showDivider ? "border-b-2 border-slate-900 pb-3 mb-4" : "pb-2 mb-2")
        : (showDivider ? "border-b-2 border-slate-900 pb-5 mb-8" : "pb-4 mb-4")
    )}>
      {/* Left Column: Local Institution Details */}
      <div className={cn(
        "flex flex-col items-center gap-0.5 text-slate-900 font-black uppercase text-center shrink-0",
        compact ? "text-[8px] leading-tight w-[30%] max-w-[32%]" : "text-[9.5px] leading-tight tracking-tight w-[30%] max-w-[32%]"
      )}>
        <span className={compact ? "text-[11px] font-black tracking-tight" : "text-xs sm:text-sm font-black tracking-tight"}>
          Chambre Nationale des Rois
        </span>
        <span className={compact ? "text-[11px] font-black tracking-tight" : "text-xs sm:text-sm font-black tracking-tight"}>
          et Chefs Traditionnels
        </span>
        
        {settings?.mainLogoUrl && (
          <div className={compact ? "my-1 flex items-center justify-center" : "my-1.5 flex items-center justify-center"}>
            <img 
              src={settings.mainLogoUrl} 
              alt="Logo CNRCT" 
              className="w-auto object-contain mx-auto"
              style={{
                height: compact ? "48px" : "60px",
                maxHeight: compact ? "48px" : "60px",
                maxWidth: compact ? "80px" : "96px",
              }}
            />
          </div>
        )}

        <div className="w-12 h-0.5 bg-slate-900 my-0.5 rounded-full" />
        
        <div className={cn(
          "flex flex-col gap-0.5 font-bold text-slate-600 normal-case italic w-full",
          compact ? "mt-0.5 text-[8px]" : "mt-0.5 text-[9px]"
        )}>
          <span>Le Directoire</span>
          <span className="tracking-widest text-[7px] text-slate-400 font-normal">………………</span>
          <span>Le Président</span>
          <span className="tracking-widest text-[7px] text-slate-400 font-normal">………………</span>
          {secretariatLabel && (
            <>
              <span>{secretariatLabel}</span>
              <span className="tracking-widest text-[7px] text-slate-400 font-normal">………………</span>
            </>
          )}
          {showService && service && (
            <div className="flex flex-col gap-0.5 mt-1.5 not-italic items-center">
              <span className="font-bold text-slate-800 uppercase tracking-tight text-[8.5px] leading-tight">{service}</span>
              {direction && <span className="font-black text-slate-900 uppercase tracking-[0.2em] text-[9.5px]">{direction}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Center Column: Title (Optional) */}
      {(title || children) && (
        <div className="flex-1 px-3 text-center self-center my-auto">
          {children ? children : (
            <>
              <h1 className={cn(
                "font-black text-slate-900 tracking-tight uppercase leading-snug italic",
                compact ? "text-sm sm:text-base" : "text-base sm:text-xl"
              )}>
                {title}
              </h1>
              {period && (
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <span className="h-px w-5 bg-slate-300" />
                  <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">{period}</span>
                  <span className="h-px w-5 bg-slate-300" />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Right Column: Republic Details */}
      <div className={cn(
        "flex flex-col items-center gap-0.5 text-center shrink-0",
        compact ? "w-[30%] max-w-[32%]" : "w-[30%] max-w-[32%]"
      )}>
        <span className={cn(
          "font-black text-slate-900 uppercase tracking-normal leading-tight",
          compact ? "text-[11px]" : "text-xs sm:text-sm"
        )}>
          République de Côte d'Ivoire
        </span>
        
        {settings?.secondaryLogoUrl && (
          <div className={compact ? "my-1 flex items-center justify-center" : "my-1.5 flex items-center justify-center"}>
            <img 
              src={settings.secondaryLogoUrl} 
              alt="Armoiries RCI" 
              className="w-auto object-contain mx-auto"
              style={{
                height: compact ? "48px" : "60px",
                maxHeight: compact ? "48px" : "60px",
                maxWidth: compact ? "80px" : "96px",
              }}
            />
          </div>
        )}
        
        <span className={cn(
          "italic font-bold text-slate-600 tracking-tight",
          compact ? "text-[8px]" : "text-[9px]"
        )}>
          Union – Discipline – Travail
        </span>
      </div>
    </div>
  );
}
