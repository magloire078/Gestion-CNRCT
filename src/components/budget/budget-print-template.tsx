"use client";

import { BudgetLine } from "@/types/payroll";
import { InstitutionalHeader } from "../reports/institutional-header";
import { cn } from "@/lib/utils";

interface BudgetPrintTemplateProps {
  budgetLines: BudgetLine[];
  year: string;
}

export function BudgetPrintTemplate({ budgetLines, year }: BudgetPrintTemplateProps) {
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
    <div className="bg-white p-10 text-slate-900 font-serif leading-tight">
      <InstitutionalHeader 
        title={`ANNEXE BUDGÉTAIRE - EXERCICE ${year}`}
        period={`CODE ÉTABLISSEMENT : 522610101`}
        showDAFP={true}
      />

      <div className="mt-8">
        <h2 className="text-xl font-black uppercase border-b-2 border-slate-900 pb-2 mb-6 tracking-tighter italic">
          I. TABLEAU DES EMPLOIS (DÉPENSES)
        </h2>
        
        <table className="w-full border-collapse border border-slate-300 text-[10px]">
          <thead>
            <tr className="bg-slate-50 uppercase font-black text-center">
              <th className="border border-slate-300 p-2 w-16">Parag.</th>
              <th className="border border-slate-300 p-2 w-16">Ligne</th>
              <th className="border border-slate-300 p-2 text-left">Libellé du Poste</th>
              <th className="border border-slate-300 p-2 w-32 text-right">Dotation {prevYear}</th>
              <th className="border border-slate-300 p-2 w-32 text-right">Dotation {year}</th>
            </tr>
          </thead>
          <tbody>
            {emplois.map((line) => (
              <tr key={line.id} className="border-b border-slate-200">
                <td className="border border-slate-300 p-2 text-center font-bold">{line.paragraphe || '-'}</td>
                <td className="border border-slate-300 p-2 text-center">{line.code || '-'}</td>
                <td className="border border-slate-300 p-2 font-medium">{line.name}</td>
                <td className="border border-slate-300 p-2 text-right text-slate-500 italic">
                  {formatCurrency(line.previousAmount || 0)}
                </td>
                <td className="border border-slate-300 p-2 text-right font-black">
                  {formatCurrency(line.allocatedAmount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900 text-white font-black uppercase">
            <tr>
              <td colSpan={3} className="p-3 text-right">Total Général des Emplois</td>
              <td className="p-3 text-right border-l border-slate-700">{formatCurrency(totalEmploisPrev)}</td>
              <td className="p-3 text-right bg-slate-800">{formatCurrency(totalEmploisN)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-12 break-before-page">
        <h2 className="text-xl font-black uppercase border-b-2 border-slate-900 pb-2 mb-6 tracking-tighter italic">
          II. TABLEAU DES RESSOURCES (RECETTES)
        </h2>
        
        <table className="w-full border-collapse border border-slate-300 text-[10px]">
          <thead>
            <tr className="bg-slate-50 uppercase font-black text-center">
              <th className="border border-slate-300 p-2 w-16">Parag.</th>
              <th className="border border-slate-300 p-2 w-16">Ligne</th>
              <th className="border border-slate-300 p-2 text-left">Libellé du Poste</th>
              <th className="border border-slate-300 p-2 w-32 text-right">Montant {prevYear}</th>
              <th className="border border-slate-300 p-2 w-32 text-right">Prévision {year}</th>
            </tr>
          </thead>
          <tbody>
            {ressources.map((line) => (
              <tr key={line.id} className="border-b border-slate-200">
                <td className="border border-slate-300 p-2 text-center font-bold">{line.paragraphe || '-'}</td>
                <td className="border border-slate-300 p-2 text-center">{line.code || '-'}</td>
                <td className="border border-slate-300 p-2 font-medium">{line.name}</td>
                <td className="border border-slate-300 p-2 text-right text-slate-500 italic">
                  {formatCurrency(line.previousAmount || 0)}
                </td>
                <td className="border border-slate-300 p-2 text-right font-black">
                  {formatCurrency(line.allocatedAmount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-emerald-700 text-white font-black uppercase">
            <tr>
              <td colSpan={3} className="p-3 text-right">Total Général des Ressources</td>
              <td className="p-3 text-right border-l border-emerald-600">{formatCurrency(totalRessourcesPrev)}</td>
              <td className="p-3 text-right bg-emerald-800">{formatCurrency(totalRessourcesN)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary Box */}
      <div className="mt-12 p-6 border-4 border-double border-slate-900 bg-slate-50">
        <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Récapitulatif Équilibré</span>
                <span className="text-lg font-black uppercase tracking-tighter">Budget {year}</span>
            </div>
            <div className="flex gap-10">
                <div className="text-right">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Total Emplois</div>
                    <div className="text-xl font-black">{formatCurrency(totalEmploisN)}</div>
                </div>
                <div className="text-right">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Total Ressources</div>
                    <div className="text-xl font-black text-emerald-600">{formatCurrency(totalRessourcesN)}</div>
                </div>
            </div>
        </div>
      </div>

      {/* Signatures Section */}
      <div className="mt-20 grid grid-cols-2 gap-20">
        <div className="flex flex-col items-center">
          <span className="text-[10px] italic font-bold text-slate-400 mb-20 uppercase tracking-widest">Le Trésorier de la Chambre</span>
          <div className="w-48 h-px bg-slate-300" />
          <span className="mt-2 text-[10px] font-black uppercase">Cachet & Signature</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] italic font-bold text-slate-400 mb-20 uppercase tracking-widest">Le Président du Directoire</span>
          <div className="w-48 h-px bg-slate-300" />
          <span className="mt-2 text-[10px] font-black uppercase">Cachet & Signature</span>
        </div>
      </div>

      <div className="mt-10 text-[8px] text-slate-400 text-center italic border-t border-slate-100 pt-4">
        Généré via le Système de Gestion Intégrée de la CNRCT - République de Côte d'Ivoire
      </div>
    </div>
  );
}
