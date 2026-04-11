"use client";

import { Shield } from "lucide-react";

interface InstitutionalFooterProps {
  place?: string;
  date?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  showCertification?: boolean;
}

export function InstitutionalFooter({ 
  place = "Yamoussoukro", 
  date, 
  signatoryName, 
  signatoryTitle = "Contrôleur Interne et Qualité, CNRCT",
  showCertification = true 
}: InstitutionalFooterProps) {
  const displayDate = date || new Date().toLocaleDateString('fr-FR');

  return (
    <div className="pt-12 border-t-2 border-slate-900 mt-16 print:mt-12 break-inside-avoid relative">
      <div className="flex flex-col md:flex-row justify-between items-start gap-12">
        {/* Visa Area */}
        <div className="space-y-1">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic mb-6">Visa de Contrôle Systèmes</p>
          <div className="h-28 w-56 border-4 border-dashed border-slate-100 rounded-2xl flex items-center justify-center bg-slate-50/50">
            <span className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] text-center px-4">Cachet Numérique &<br/> Signature Autorisée</span>
          </div>
        </div>

        {/* Signature Area */}
        <div className="text-center md:text-right space-y-4 ml-auto">
          <div className="space-y-1 text-right">
            <p className="text-sm font-black text-slate-900 leading-none">Fait à {place}, le {displayDate}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{signatoryTitle}</p>
          </div>
          
          <div className="pt-12 flex flex-col items-center md:items-end gap-3">
            <div className="h-1 w-40 bg-slate-900 rounded-full" />
            <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{signatoryName}</p>
            {showCertification && (
              <div className="bg-[#006039] text-white px-5 py-2 rounded-xl flex items-center gap-3 shadow-md">
                <Shield className="h-4 w-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Certifié par GèreEcole v2.0</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Metadata Line */}
      <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-center text-[8px] text-slate-300 font-bold uppercase tracking-widest">
        <span>Généré le {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span className="italic">Document Institutional - CNRCT Yamoussoukro</span>
      </div>
    </div>
  );
}
