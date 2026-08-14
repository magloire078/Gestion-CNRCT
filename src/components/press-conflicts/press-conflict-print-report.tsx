"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InstitutionalHeader } from "../reports/institutional-header";
import { InstitutionalFooter } from "../reports/institutional-footer";
import { InstitutionalReportWrapper } from "../reports/institutional-report-wrapper";
import type { OrganizationSettings } from "@/types/common";
import type { PressConflict } from "@/types/press-conflict";

interface PressConflictPrintReportProps {
  conflicts: PressConflict[];
  organizationSettings: OrganizationSettings | null;
  isPrinting?: boolean;
  onAfterPrint?: () => void;
  filterSummary?: string;
}

export function PressConflictPrintReport({
  conflicts,
  organizationSettings,
  isPrinting,
  onAfterPrint,
  filterSummary,
}: PressConflictPrintReportProps) {
  if (!organizationSettings) return null;

  const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });

  return (
    <InstitutionalReportWrapper
      isPrinting={isPrinting || false}
      orientation="landscape"
      onAfterPrint={onAfterPrint}
    >
      <div className="min-h-screen p-8 print:p-4 bg-white text-slate-900 font-sans text-xs">
        <InstitutionalHeader
          title="TABLEAU DE VEILLE : CONFLITS ET FAITS SIGNALÉS"
          period={`Situation arrêtée au ${todayStr} ${filterSummary ? `• Filtre : ${filterSummary}` : ""}`}
          settings={organizationSettings}
        />

        <div className="mb-4 flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
          <div>
            <span className="font-semibold text-slate-800">Note méthodologique : </span>
            Faits et alertes relevés à travers la presse écrite nationale et les correspondants locaux. Données de veille non rattachées à des saisines formelles CNRCT.
          </div>
          <div className="font-bold text-primary shrink-0 ml-4">
            Total : {conflicts.length} enregistrements
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-[10px] leading-tight">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold text-center border-b border-slate-300">
                <th className="border border-slate-300 p-1.5 w-[3%]">N°</th>
                <th className="border border-slate-300 p-1.5 w-[7%]">Date des faits</th>
                <th className="border border-slate-300 p-1.5 w-[10%]">Source / Journal</th>
                <th className="border border-slate-300 p-1.5 w-[7%]">Région</th>
                <th className="border border-slate-300 p-1.5 w-[9%]">Localité</th>
                <th className="border border-slate-300 p-1.5 w-[5%]">Catégorie</th>
                <th className="border border-slate-300 p-1.5 w-[8%]">Type de conflit</th>
                <th className="border border-slate-300 p-1.5 w-[32%] text-left">Description des faits</th>
                <th className="border border-slate-300 p-1.5 w-[7%]">Statut du suivi</th>
                <th className="border border-slate-300 p-1.5 w-[12%] text-left">Observations</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((item, index) => (
                <tr
                  key={item.id || index}
                  className={`border-b border-slate-200 break-inside-avoid ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                  }`}
                >
                  <td className="border border-slate-300 p-1.5 text-center font-bold">
                    {item.orderNumber || index + 1}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-center font-medium">
                    {item.dateOfFacts}
                  </td>
                  <td className="border border-slate-300 p-1.5 font-semibold text-slate-800">
                    {item.source}
                  </td>
                  <td className="border border-slate-300 p-1.5">
                    {item.region}
                  </td>
                  <td className="border border-slate-300 p-1.5 font-medium">
                    {item.locality}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-center">
                    <span className="px-1 py-0.5 rounded bg-slate-200 text-slate-800 font-medium text-[9px]">
                      {item.category}
                    </span>
                  </td>
                  <td className="border border-slate-300 p-1.5 font-semibold text-slate-900">
                    {item.conflictType}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-justify leading-relaxed">
                    {item.description}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-center font-bold">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] ${
                        item.status.includes("En cours")
                          ? "bg-amber-100 text-amber-800"
                          : item.status.includes("À suivre")
                          ? "bg-blue-100 text-blue-800"
                          : item.status.toLowerCase().includes("résolu")
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="border border-slate-300 p-1.5 text-slate-700 italic">
                    {item.observations || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-4">
          <InstitutionalFooter 
            signatoryName={organizationSettings?.globalSignatoryName}
            signatoryTitle={organizationSettings?.globalSignatoryTitle || "Contrôleur Interne et Qualité, CNRCT"}
          />
        </div>
      </div>
    </InstitutionalReportWrapper>
  );
}
