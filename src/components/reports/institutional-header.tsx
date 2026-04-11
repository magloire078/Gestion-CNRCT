"use client";

import { useEffect, useState } from "react";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/types/common";

interface InstitutionalHeaderProps {
  title?: string;
  period?: string;
  showDAFP?: boolean;
}

export function InstitutionalHeader({ title, period, showDAFP = true }: InstitutionalHeaderProps) {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);

  useEffect(() => {
    getOrganizationSettings().then(setSettings);
  }, []);

  return (
    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-12 relative break-inside-avoid">
      {/* Left Column: Local Institution Details */}
      <div className="flex flex-col gap-1 text-slate-800 font-black uppercase text-[10px] leading-tight tracking-tighter">
        <span className="text-sm">Chambre Nationale des Rois</span>
        <span className="text-sm">et Chefs Traditionnels</span>
        <div className="w-12 h-1 bg-slate-900 my-2 rounded-full" />
        <div className="flex flex-col gap-0.5 mt-1 font-bold text-slate-500 normal-case italic">
          <span>Le Directoire</span>
          <span>………………</span>
          <span>Le Président</span>
          <span>………………</span>
          <span>Secrétariat Général</span>
          <span>………………</span>
          {showDAFP && <span className="font-bold text-slate-900 mt-1 not-italic italic-none uppercase tracking-widest text-[9px]">DAFP</span>}
        </div>
      </div>

      {/* Center Column: Title (Optional) */}
      {title && (
        <div className="absolute left-1/2 -translate-x-1/2 text-center max-w-[40%] mt-20">
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
        </div>
      )}

      {/* Right Column: Republic Details */}
      <div className="text-right flex flex-col gap-1 items-end">
        <span className="font-black text-slate-900 text-sm uppercase tracking-wider">République de Côte d'Ivoire</span>
        <span className="italic text-xs font-bold text-slate-400">Union – Discipline – Travail</span>
        
        {settings?.secondaryLogoUrl && (
          <div className="mt-4 opacity-80 grayscale hover:grayscale-0 transition-all duration-700">
            <img 
              src={settings.secondaryLogoUrl} 
              alt="Armoiries RCI" 
              className="h-16 w-auto object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
