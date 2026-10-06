"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download, Copy, Check, FileSpreadsheet, Layers, ListFilter } from "lucide-react";
import type { Mission, OrganizationSettings } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

interface MissionsRecapTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: Mission[];
  organizationSettings?: OrganizationSettings | null;
  periodLabel?: string;
}

interface RecapRow {
  key: string;
  objet: string;
  count: number;
  countPercentage: number;
  participants: number;
  participantsPercentage: number;
  dossiers?: string[];
}

export function MissionsRecapTableModal({
  isOpen,
  onClose,
  missions,
  organizationSettings,
  periodLabel
}: MissionsRecapTableModalProps) {
  const { toast } = useToast();
  const [directionTitle, setDirectionTitle] = useState<string>("DE LA DIRECTION ADMINISTRATIVE");
  const [groupBy, setGroupBy] = useState<"objet" | "dossier">("objet");
  const [copied, setCopied] = useState(false);

  // If modal is closed, skip calculations
  if (!isOpen) return null;

  // Computations
  const { rows, totalCount, totalParticipants } = useMemo(() => {
    const totalCount = missions.length;
    const totalParticipants = missions.reduce((acc, m) => acc + (m.participants?.length || 0), 0);

    if (totalCount === 0) {
      return { rows: [], totalCount: 0, totalParticipants: 0 };
    }

    if (groupBy === "dossier") {
      const rows: RecapRow[] = missions.map(m => {
        const pCount = m.participants?.length || 0;
        return {
          key: m.id,
          objet: m.numeroMission ? `[${m.numeroMission}] ${m.title}` : m.title,
          count: 1,
          countPercentage: totalCount > 0 ? (1 / totalCount) * 100 : 0,
          participants: pCount,
          participantsPercentage: totalParticipants > 0 ? (pCount / totalParticipants) * 100 : 0,
          dossiers: m.numeroMission ? [m.numeroMission] : []
        };
      });

      return { rows, totalCount, totalParticipants };
    }

    // Group by title / object
    const map = new Map<string, { count: number; participants: number; dossiers: string[] }>();

    missions.forEach(m => {
      const rawTitle = (m.title || "Mission sans titre").trim();
      // Normalize key (case-insensitive trim)
      const key = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      const existing = map.get(key) || { count: 0, participants: 0, dossiers: [] };
      existing.count += 1;
      existing.participants += (m.participants?.length || 0);
      if (m.numeroMission && !existing.dossiers.includes(m.numeroMission)) {
        existing.dossiers.push(m.numeroMission);
      }
      map.set(key, existing);
    });

    const rows: RecapRow[] = Array.from(map.entries()).map(([objet, data]) => {
      return {
        key: objet,
        objet,
        count: data.count,
        countPercentage: totalCount > 0 ? (data.count / totalCount) * 100 : 0,
        participants: data.participants,
        participantsPercentage: totalParticipants > 0 ? (data.participants / totalParticipants) * 100 : 0,
        dossiers: data.dossiers
      };
    });

    return { rows, totalCount, totalParticipants };
  }, [missions, groupBy]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Fenêtre bloquée",
        description: "Veuillez autoriser les fenêtres pop-up pour imprimer le tableau."
      });
      return;
    }

    const titleText = `TABLEAU RECAPITULATIF DES ORDRES DE MISSION ${directionTitle.trim() ? directionTitle.trim().toUpperCase() : ""}`;

    const tableRowsHtml = rows.map((r) => `
      <tr>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 11px; line-height: 1.3;">
          ${r.objet}
        </td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-weight: bold; font-size: 11px;">
          ${r.count}
        </td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 11px;">
          ${r.countPercentage.toFixed(r.countPercentage % 1 === 0 ? 0 : 2)}
        </td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-weight: bold; font-size: 11px;">
          ${r.participants < 10 && r.participants > 0 ? `0${r.participants}` : r.participants}
        </td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 11px;">
          ${r.participantsPercentage.toFixed(r.participantsPercentage % 1 === 0 ? 0 : 2)}
        </td>
      </tr>
    `).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>${titleText}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 12mm 15mm 12mm;
          }
          body {
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-box {
            text-align: center;
            margin-bottom: 20px;
          }
          .doc-title {
            font-size: 13px;
            font-weight: bold;
            text-decoration: underline;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 10px 0;
            line-height: 1.4;
          }
          .period-subtitle {
            font-size: 11px;
            font-style: italic;
            margin-bottom: 12px;
          }
          table.recap-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
          }
          table.recap-table th {
            border: 1px solid #000;
            padding: 6px 8px;
            font-size: 10.5px;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            background-color: #f8fafc;
          }
          table.recap-table td {
            border: 1px solid #000;
          }
          table.recap-table tr.total-row td {
            border-top: 2px solid #000;
            font-weight: bold;
            background-color: #f1f5f9;
            padding: 7px 8px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="doc-title">
            CI-JOINT LE ${titleText}
          </div>
          ${periodLabel ? `<div class="period-subtitle">Période : ${periodLabel}</div>` : ""}
        </div>

        <table class="recap-table">
          <thead>
            <tr>
              <th style="text-align: left; width: 62%;">OBJET ET DOMAINE DE LA MISSION</th>
              <th style="width: 10%;">Nombre</th>
              <th style="width: 9%;">%</th>
              <th style="width: 10%;">Participants</th>
              <th style="width: 9%;">%</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
            <tr class="total-row">
              <td style="text-align: left;">TOTAL</td>
              <td style="text-align: center;">${totalCount}</td>
              <td style="text-align: center;">100</td>
              <td style="text-align: center;">${totalParticipants}</td>
              <td style="text-align: center;">100</td>
            </tr>
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    const titleText = `TABLEAU RECAPITULATIF DES ORDRES DE MISSION ${directionTitle.trim() ? directionTitle.trim().toUpperCase() : ""}`;
    const header = ["OBJET ET DOMAINE DE LA MISSION", "Nombre", "% Missions", "Participants", "% Participants"];
    
    const csvRows = [
      [titleText],
      periodLabel ? [`Période: ${periodLabel}`] : [],
      [],
      header,
      ...rows.map(r => [
        `"${r.objet.replace(/"/g, '""')}"`,
        r.count,
        r.countPercentage.toFixed(2),
        r.participants,
        r.participantsPercentage.toFixed(2)
      ]),
      ["TOTAL", totalCount, "100.00", totalParticipants, "100.00"]
    ];

    const csvContent = "\uFEFF" + csvRows.map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `recapitulatif-missions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportation réussie",
      description: "Le fichier CSV a été téléchargé avec succès."
    });
  };

  const handleCopyToClipboard = () => {
    const textLines = [
      `CI-JOINT LE TABLEAU RECAPITULATIF DES ORDRES DE MISSION ${directionTitle.toUpperCase()}`,
      periodLabel ? `Période : ${periodLabel}` : "",
      "",
      `OBJET ET DOMAINE DE LA MISSION\tNombre\t%\tParticipants\t%`,
      ...rows.map(r => `${r.objet}\t${r.count}\t${r.countPercentage.toFixed(2)}%\t${r.participants}\t${r.participantsPercentage.toFixed(2)}%`),
      `TOTAL\t${totalCount}\t100%\t${totalParticipants}\t100%`
    ].filter(Boolean);

    navigator.clipboard.writeText(textLines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copié dans le presse-papier",
        description: "Vous pouvez coller ce tableau directement dans Excel ou Word."
      });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl">
        {/* Header Modal */}
        <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                Tableau Récapitulatif des Ordres de Mission
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Vue statistique conforme au format administratif ({rows.length} entrées • {totalCount} dossiers • {totalParticipants} participants)
              </DialogDescription>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                className="h-8 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 gap-1.5 shadow-2xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                <span>{copied ? "Copié !" : "Copier"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 gap-1.5 shadow-2xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>CSV</span>
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="h-8 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 gap-1.5 shadow-sm"
              >
                <Printer className="h-3.5 w-3.5 text-emerald-400" />
                <span>Imprimer</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar: Direction and Grouping */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
              Intitulé :
            </Label>
            <Input
              value={directionTitle}
              onChange={(e) => setDirectionTitle(e.target.value)}
              placeholder="ex: DE LA DIRECTION ADMINISTRATIVE"
              className="h-8 text-xs font-semibold bg-slate-50 border-slate-200 focus:bg-white flex-1 max-w-md"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setGroupBy("objet")}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                groupBy === "objet" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="h-3 w-3" />
              Groupé par Objet
            </button>
            <button
              onClick={() => setGroupBy("dossier")}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                groupBy === "dossier" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListFilter className="h-3 w-3" />
              Détail par Dossier
            </button>
          </div>
        </div>

        {/* Table Content (Exact styling replica of the administrative image) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30">
          <div className="bg-white border-2 border-slate-900 rounded-lg shadow-sm overflow-hidden max-w-3xl mx-auto">
            {/* Title Header Banner inside document view */}
            <div className="p-3 text-center border-b-2 border-slate-900 bg-white">
              <h3 className="text-xs sm:text-sm font-black underline tracking-wide uppercase text-slate-900 leading-snug">
                CI-JOINT LE TABLEAU RECAPITULATIF DES ORDRES DE MISSION {directionTitle.trim() ? directionTitle.trim().toUpperCase() : ""}
              </h3>
              {periodLabel && (
                <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">
                  {periodLabel}
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <Table className="w-full border-collapse">
                <TableHeader>
                  <TableRow className="border-b-2 border-slate-900 bg-slate-100 hover:bg-slate-100 text-slate-900">
                    <TableHead className="font-black text-slate-900 text-left border-r border-slate-900 py-2.5 px-3 text-[11px] uppercase w-[58%]">
                      OBJET ET DOMAINE DE LA MISSION
                    </TableHead>
                    <TableHead className="font-black text-slate-900 text-center border-r border-slate-900 py-2.5 px-2 text-[11px] uppercase w-[10%]">
                      Nombre
                    </TableHead>
                    <TableHead className="font-black text-slate-900 text-center border-r border-slate-900 py-2.5 px-2 text-[11px] uppercase w-[9%]">
                      %
                    </TableHead>
                    <TableHead className="font-black text-slate-900 text-center border-r border-slate-900 py-2.5 px-2 text-[11px] uppercase w-[12%]">
                      Participants
                    </TableHead>
                    <TableHead className="font-black text-slate-900 text-center py-2.5 px-2 text-[11px] uppercase w-[11%]">
                      %
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500 font-bold">
                        Aucune mission affichée pour les critères sélectionnés.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.key} className="border-b border-slate-900 hover:bg-slate-50/60 text-slate-900">
                        <TableCell className="border-r border-slate-900 py-2 px-3 text-[11px] font-normal leading-tight text-slate-900">
                          {row.objet}
                        </TableCell>
                        <TableCell className="border-r border-slate-900 py-2 px-2 text-center text-[11px] font-bold text-slate-900">
                          {row.count}
                        </TableCell>
                        <TableCell className="border-r border-slate-900 py-2 px-2 text-center text-[11px] text-slate-900">
                          {row.countPercentage.toFixed(row.countPercentage % 1 === 0 ? 0 : 2)}
                        </TableCell>
                        <TableCell className="border-r border-slate-900 py-2 px-2 text-center text-[11px] font-bold text-slate-900">
                          {row.participants < 10 && row.participants > 0 ? `0${row.participants}` : row.participants}
                        </TableCell>
                        <TableCell className="py-2 px-2 text-center text-[11px] text-slate-900">
                          {row.participantsPercentage.toFixed(row.participantsPercentage % 1 === 0 ? 0 : 2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}

                  {/* TOTAL ROW */}
                  <TableRow className="border-t-2 border-slate-900 bg-slate-100 hover:bg-slate-100 font-black text-slate-900">
                    <TableCell className="border-r border-slate-900 py-2.5 px-3 text-[11px] font-black uppercase text-slate-900">
                      TOTAL
                    </TableCell>
                    <TableCell className="border-r border-slate-900 py-2.5 px-2 text-center text-[11px] font-black text-slate-900">
                      {totalCount}
                    </TableCell>
                    <TableCell className="border-r border-slate-900 py-2.5 px-2 text-center text-[11px] font-black text-slate-900">
                      100
                    </TableCell>
                    <TableCell className="border-r border-slate-900 py-2.5 px-2 text-center text-[11px] font-black text-slate-900">
                      {totalParticipants}
                    </TableCell>
                    <TableCell className="py-2.5 px-2 text-center text-[11px] font-black text-slate-900">
                      100
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 border-t border-slate-100 bg-white flex justify-between items-center sm:justify-between">
          <span className="text-[11px] font-semibold text-slate-500">
            {rows.length} lignes générées à partir des missions actives
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs font-bold text-slate-600">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
