"use client";

import { Shield } from "lucide-react";

interface InstitutionalFooterProps {
  place?: string;
  date?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  showCertification?: boolean;
  showVisa?: boolean;
  showSignatures?: boolean;
  leftSignatureTitle?: string;
  rightSignatureTitle?: string;
}

export function InstitutionalFooter({ 
  place = "Yamoussoukro", 
  date, 
  signatoryName, 
  signatoryTitle = "Contrôleur Interne et Qualité, CNRCT",
  showCertification = true,
  showVisa = true,
  showSignatures = false,
  leftSignatureTitle = "LE MÉDIATEUR EN CHARGE",
  rightSignatureTitle = "LE SECRÉTAIRE GÉNÉRAL"
}: InstitutionalFooterProps) {
  const displayDate = date || new Date().toLocaleDateString('fr-FR');

  return (
    <div className="pt-12 border-t-2 border-slate-900 mt-16 print:mt-12 break-inside-avoid relative w-full">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 w-full">
        {showSignatures ? (
          <>
            {/* Dual Signature Layout */}
            <div className="flex-1 space-y-16">
              <div className="space-y-4">
                <p className="text-sm font-black text-slate-900 leading-none italic uppercase underline underline-offset-4">{leftSignatureTitle}</p>
                <div className="h-24" /> {/* Space for signature */}
                <div className="h-1 w-40 bg-slate-900 rounded-full" />
              </div>
            </div>

            <div className="flex-1 text-right space-y-16">
              <div className="space-y-4">
                <p className="text-sm font-black text-slate-900 leading-none">Fait à {place}, le {displayDate}</p>
                <p className="text-sm font-black text-slate-900 leading-none italic uppercase underline underline-offset-4 mt-1">{rightSignatureTitle}</p>
                <div className="h-24" /> {/* Space for signature */}
                <div className="h-1 w-40 bg-slate-900 rounded-full ml-auto" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Visa Area */}
            <div className="space-y-1 flex-1">
              {showVisa && (
                <>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic mb-6">Visa de Contrôle Systèmes</p>
                  <div className="h-28 w-56 border-4 border-dashed border-slate-100 rounded-2xl flex items-center justify-center bg-slate-50/50">
                    <span className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] text-center px-4">Cachet Numérique &<br/> Signature Autorisée</span>
                  </div>
                </>
              )}
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
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Certifié par CNRCT Digital v2.5</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Institutional Details Footer */}
      <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6 text-slate-500">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Chambre Nationale des Rois et Chefs Traditionnels</p>
          <p className="text-[9px] font-medium leading-relaxed italic">
            Quartier Résidentiel, Rue du Lycée Scientifique, Yamoussoukro, Côte d'Ivoire<br />
            BP 1500 Yamoussoukro | Tél: (+225) 27 30 64 20 20 | Fax: (+225) 27 30 64 20 21
          </p>
        </div>
        <div className="flex flex-col items-center md:items-end gap-1">
          <p className="text-[9px] font-black text-primary lowercase tracking-tighter">www.cnrct.ci | info@cnrct.ci</p>
          <div className="flex items-center gap-4 text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">
            <span>Généré le {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <span className="w-1 h-1 bg-slate-200 rounded-full" />
            <span>Digital Audit Trail v2.5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
