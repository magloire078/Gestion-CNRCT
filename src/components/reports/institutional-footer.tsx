"use client";

import { ShieldCheck } from "lucide-react";

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
    <div className="pt-12 border-t border-slate-100 mt-16 print:mt-12">
      <div className="flex flex-col md:flex-row justify-between items-start gap-12">
        {/* Visa Area */}
        <div className="space-y-1">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic mb-6">Visa de l'Informaticien</p>
          <div className="h-24 w-48 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center">
            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Cachet & Signature</span>
          </div>
        </div>

        {/* Signature Area */}
        <div className="text-center md:text-right space-y-4 ml-auto">
          <div className="space-y-1 text-right">
            <p className="text-sm font-black text-slate-900">Fait à {place}, le {displayDate}</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{signatoryTitle}</p>
          </div>
          
          <div className="pt-10 flex flex-col items-center md:items-end gap-2">
            <div className="h-px w-32 bg-slate-200" />
            <p className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">{signatoryName}</p>
            {showCertification && (
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">Document Certifié par Système GèreEcole</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
