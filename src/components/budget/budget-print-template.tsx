"use client";

import { BudgetLine } from "@/types/payroll";
import { InstitutionalHeader } from "../reports/institutional-header";
import { InstitutionalFooter } from "../reports/institutional-footer";
import { InstitutionalReportWrapper } from "../reports/institutional-report-wrapper";
import { InstitutionalCover } from "../reports/institutional-cover";
import { cn } from "@/lib/utils";
import { Wallet, TrendingUp, FileText, CheckCircle2 } from "lucide-react";

interface BudgetPrintTemplateProps {
  budgetLines: BudgetLine[];
  year: string;
  isPrinting: boolean;
  onAfterPrint: () => void;
}

export function BudgetPrintTemplate({ budgetLines, year, isPrinting, onAfterPrint }: BudgetPrintTemplateProps) {
  const formatCurrency = (amount: number) => {
    if (isNaN(amount)) return "0 F CFA";
    return new Intl.NumberFormat('fr-CI', { 
        style: 'currency', 
        currency: 'XOF', 
        maximumFractionDigits: 0 
    }).format(amount);
  };

  const safeLines = budgetLines.filter(l => l && l.name && typeof l.allocatedAmount === 'number');

  const emplois = safeLines.filter(l => l.type === 'emploi');
  const ressources = safeLines.filter(l => l.type === 'ressource');
  
  const prevYear = parseInt(year) - 1;

  const totalEmploisN = emplois.reduce((acc, l) => acc + (l.allocatedAmount || 0), 0);
  const totalEmploisPrev = emplois.reduce((acc, l) => acc + (l.previousAmount || 0), 0);
  
  const totalRessourcesN = ressources.reduce((acc, l) => acc + (l.allocatedAmount || 0), 0);
  const totalRessourcesPrev = ressources.reduce((acc, l) => acc + (l.previousAmount || 0), 0);

  return (
    <InstitutionalReportWrapper 
      isPrinting={isPrinting} 
      onAfterPrint={onAfterPrint} 
      orientation="landscape"
    >
      <div id="print-section" className="bg-white text-slate-900 font-serif leading-tight">
        {/* Cover Page */}
        <InstitutionalCover 
          title={`ANNEXE BUDGÉTAIRE`}
          subtitle={`ETAT COMPARATIF DES DOTATIONS ET PRÉVISIONS`}
          period={`EXERCICE BUDGÉTAIRE ${year}`}
          direction="DFP"
          service="Direction des Finances et du Patrimoine"
          orientation="landscape"
          stats={[
            { label: "Total Emplois", value: formatCurrency(totalEmploisN), icon: TrendingUp },
            { label: "Total Ressources", value: formatCurrency(totalRessourcesN), icon: FileText },
            { label: "Solde Budgétaire", value: formatCurrency(totalRessourcesN - totalEmploisN), icon: CheckCircle2 }
          ]}
          reference={`CNRCT-BUDGET-${year}`}
        />

        {/* Tableau des Emplois */}
        <div className="p-16 break-after-page min-h-[21cm]">
          <InstitutionalHeader 
            title={`ANNEXE BUDGÉTAIRE - EXERCICE ${year}`}
            period={`TABLEAU DES EMPLOIS (DÉPENSES)`}
            showService={true}
          />

          <div className="mt-12">
            <h2 className="text-2xl font-black uppercase border-b-4 border-slate-900 pb-3 mb-4 tracking-tighter italic">
              I. TABLEAU DES EMPLOIS
            </h2>
            
            <table className="w-full border-collapse border-2 border-slate-900 text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase font-black text-center">
                  <th className="border border-slate-700 p-3 w-16">Parag.</th>
                  <th className="border border-slate-700 p-3 w-16">Ligne</th>
                  <th className="border border-slate-700 p-3 text-left">Libellé du Poste Budgétaire</th>
                  <th className="border border-slate-700 p-3 w-40 text-right">Dotation {prevYear}</th>
                  <th className="border border-slate-700 p-3 w-40 text-right">Dotation {year}</th>
                </tr>
              </thead>
              <tbody>
                {emplois.map((line) => (
                  <tr key={line.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="border border-slate-300 p-2.5 text-center font-bold">{line.paragraphe || '-'}</td>
                    <td className="border border-slate-300 p-2.5 text-center font-mono text-slate-500">{line.code || '-'}</td>
                    <td className="border border-slate-300 p-2.5 font-bold uppercase tracking-tight">{line.name}</td>
                    <td className="border border-slate-300 p-2.5 text-right text-slate-500 italic">
                      {formatCurrency(line.previousAmount || 0)}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-right font-black bg-slate-50/50">
                      {formatCurrency(line.allocatedAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-black uppercase border-t-2 border-slate-900">
                <tr>
                  <td colSpan={3} className="p-4 text-right tracking-widest">Total Général des Emplois</td>
                  <td className="p-4 text-right border-l border-slate-700">{formatCurrency(totalEmploisPrev)}</td>
                  <td className="p-4 text-right bg-slate-800 border-l border-slate-700">{formatCurrency(totalEmploisN)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Tableau des Ressources */}
        <div className="p-16 break-after-page min-h-[21cm]">
          <InstitutionalHeader 
            title={`ANNEXE BUDGÉTAIRE - EXERCICE ${year}`}
            period={`TABLEAU DES RESSOURCES (RECETTES)`}
            showService={true}
          />

          <div className="mt-12">
            <h2 className="text-2xl font-black uppercase border-b-4 border-slate-900 pb-3 mb-4 tracking-tighter italic">
              II. TABLEAU DES RESSOURCES
            </h2>
            
            <table className="w-full border-collapse border-2 border-slate-900 text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase font-black text-center">
                  <th className="border border-slate-700 p-3 w-16">Parag.</th>
                  <th className="border border-slate-700 p-3 w-16">Ligne</th>
                  <th className="border border-slate-700 p-3 text-left">Libellé du Poste Budgétaire</th>
                  <th className="border border-slate-700 p-3 w-40 text-right">Montant {prevYear}</th>
                  <th className="border border-slate-700 p-3 w-40 text-right">Prévision {year}</th>
                </tr>
              </thead>
              <tbody>
                {ressources.map((line) => (
                  <tr key={line.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="border border-slate-300 p-2.5 text-center font-bold">{line.paragraphe || '-'}</td>
                    <td className="border border-slate-300 p-2.5 text-center font-mono text-slate-500">{line.code || '-'}</td>
                    <td className="border border-slate-300 p-2.5 font-bold uppercase tracking-tight">{line.name}</td>
                    <td className="border border-slate-300 p-2.5 text-right text-slate-500 italic">
                      {formatCurrency(line.previousAmount || 0)}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-right font-black bg-emerald-50/30">
                      {formatCurrency(line.allocatedAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-emerald-800 text-white font-black uppercase border-t-2 border-emerald-900">
                <tr>
                  <td colSpan={3} className="p-4 text-right tracking-widest">Total Général des Ressources</td>
                  <td className="p-4 text-right border-l border-emerald-700">{formatCurrency(totalRessourcesPrev)}</td>
                  <td className="p-4 text-right bg-emerald-900 border-l border-emerald-700">{formatCurrency(totalRessourcesN)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Summary and Signatures */}
        <div className="p-16 min-h-[21cm] flex flex-col">
          <InstitutionalHeader 
            title={`ANNEXE BUDGÉTAIRE - EXERCICE ${year}`}
            period={`RÉCAPITULATIF ET SIGNATURES`}
            showService={true}
          />

          <div className="mt-12 p-5 border-4 border-double border-slate-900 bg-slate-50/50 rounded-xl">
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Synthèse de l'Annexe</span>
                    <span className="text-3xl font-black uppercase tracking-tighter italic">Équilibre Budgétaire {year}</span>
                </div>
                <div className="flex gap-16">
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Emplois</div>
                        <div className="text-3xl font-black tabular-nums">{formatCurrency(totalEmploisN)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Ressources</div>
                        <div className="text-3xl font-black text-emerald-600 tabular-nums">{formatCurrency(totalRessourcesN)}</div>
                    </div>
                </div>
            </div>
          </div>

          <div className="mt-24 grid grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <div className="w-full border-b-2 border-slate-200 mb-6 pb-2 text-center">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Le Trésorier</span>
              </div>
              <div className="h-32" />
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-tight">M. LE TRÉSORIER</p>
                <p className="text-[10px] italic text-slate-500 uppercase font-bold">Trésorerie de la Chambre</p>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-full border-b-2 border-slate-200 mb-6 pb-2 text-center">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Le Secrétaire Général</span>
              </div>
              <div className="h-32" />
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-tight">YEO Fatogoma</p>
                <p className="text-[10px] italic text-slate-500 uppercase font-bold">Administrateur Civil</p>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-full border-b-2 border-slate-200 mb-6 pb-2 text-center">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Le Président</span>
              </div>
              <div className="h-32" />
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-tight">M. LE PRÉSIDENT</p>
                <p className="text-[10px] italic text-slate-500 uppercase font-bold">Directoire de la CNRCT</p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-16">
            <InstitutionalFooter />
          </div>
        </div>
      </div>
    </InstitutionalReportWrapper>
  );
}
