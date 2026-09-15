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
  showService?: boolean;
  settings?: OrganizationSettings | null;
  children?: React.ReactNode;
  showDivider?: boolean;
  compact?: boolean;
}

export function InstitutionalHeader({ 
  title, 
  period, 
  service = "Direction des Finances et du Patrimoine",
  direction = "DFP",
  showService = true,
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
    <div className={`flex justify-between items-start relative break-inside-avoid ${
      compact 
        ? (showDivider ? "border-b-2 border-slate-900 pb-3 mb-4" : "pb-2 mb-2")
        : (showDivider ? "border-b-2 border-slate-900 pb-5 mb-8" : "pb-4 mb-4")
    }`}>
      {/* Left Column: Local Institution Details */}
      <div className={cn(
        "flex flex-col items-center gap-0.5 text-slate-800 font-black uppercase text-center",
        compact ? "text-[8px] leading-none w-[28%]" : "text-[10px] leading-tight tracking-tighter w-[30%]"
      )}>
        <span className={compact ? "text-xs font-black" : "text-sm"}>Chambre Nationale des Rois</span>
        <span className={compact ? "text-xs font-black" : "text-sm"}>et Chefs Traditionnels</span>
        
        {settings?.mainLogoUrl && (
          <div className={compact ? "my-1" : "my-2"}>
            <img 
              src={settings.mainLogoUrl} 
              alt="Logo CNRCT" 
              className={compact ? "h-12 w-auto object-contain" : "h-16 w-auto object-contain"}
            />
          </div>
        )}

        <div className="w-12 h-0.5 bg-slate-900 my-1 rounded-full" />
        
        <div className={cn(
          "flex flex-col gap-0.5 font-bold text-slate-500 normal-case italic w-full",
          compact ? "mt-0.5 text-[8px]" : "mt-1 text-[9px]"
        )}>
          <span>Le Directoire</span>
          <span>………………</span>
          <span>Le Président</span>
          <span>………………</span>
          <span>Secrétariat Général</span>
          <span>………………</span>
          {showService && (
            <div className="flex flex-col gap-0.5 mt-2 not-italic items-center">
              <span className="font-bold text-slate-800 uppercase tracking-tight text-[9px]">{service}</span>
              <span className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px]">{direction}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center Column: Title (Optional) */}
      {(title || children) && (
        <div className="absolute left-1/2 -translate-x-1/2 text-center max-w-[35%] mt-10">
          {children ? children : (
            <>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-tight italic">
                {title}
              </h1>
              {period && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="h-px w-6 bg-slate-200" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{period}</span>
                  <span className="h-px w-6 bg-slate-200" />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Right Column: Republic Details */}
      <div className={cn(
        "flex flex-col items-center gap-1 text-center",
        compact ? "w-[28%]" : "w-[30%]"
      )}>
        <span className={cn(
          "font-black text-slate-900 uppercase tracking-wider",
          compact ? "text-xs" : "text-sm"
        )}>
          République de Côte d'Ivoire
        </span>
        
        {settings?.secondaryLogoUrl && (
          <div className={compact ? "my-1" : "my-2"}>
            <img 
              src={settings.secondaryLogoUrl} 
              alt="Armoiries RCI" 
              className={compact ? "h-11 w-auto object-contain" : "h-14 w-auto object-contain"}
            />
          </div>
        )}
        
        <span className={cn(
          "italic font-bold text-slate-500",
          compact ? "text-[8px]" : "text-[10px]"
        )}>
          Union – Discipline – Travail
        </span>
      </div>
    </div>
  );
}
