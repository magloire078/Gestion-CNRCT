"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subscribeToMissions } from "@/services/mission-service";
import type { Mission, OrganizationSettings } from "@/lib/data";
import { 
  Loader2, Printer, FileText, FileSpreadsheet, Calendar, 
  Users, Wallet, TrendingUp, ArrowLeft, Download, Copy, Check,
  Layers, ListFilter, CheckCircle2, PlayCircle, Clock, Search,
  BarChart3, RefreshCw
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { MissionsOfficialReport } from "@/components/reports/missions-official-report";
import { MissionsRecapTableModal } from "@/components/missions/missions-recap-table-modal";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { PermissionGuard } from "@/components/auth/permission-guard";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const MONTHS = [
  { value: "all", label: "Toute l'année" },
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

export default function MissionReportPage() {
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = format(new Date(), "MM");

  const [year, setYear] = useState<string>(currentYear);
  const [month, setMonth] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [dateTarget, setDateTarget] = useState<"dateSaisie" | "startDate">("dateSaisie");
  const [activeTab, setActiveTab] = useState<"recap" | "grandlivre" | "analytics">("recap");
  const [recapGroupBy, setRecapGroupBy] = useState<"objet" | "dossier">("objet");
  const [recapDirectionTitle, setRecapDirectionTitle] = useState<string>("DE LA DIRECTION ADMINISTRATIVE");
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [allMissions, setAllMissions] = useState<Mission[]>([]);

  const { settings } = useSettings();
  const { user, hasPermission } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();

  const canManageAllMissions = can('missions', 'create') || can('missions', 'update') || can('missions', 'delete') || hasPermission('page:admin:view') || ['administrateur', 'super-admin', 'LHcHyfBzile3r0vyFOFb', 'dirigeant-president', 'manager-rh', 'chef-de-service'].includes(user?.roleId || '');

  useEffect(() => {
    const isAdmin = canManageAllMissions;
    const unsubscribe = subscribeToMissions(
      (missions) => {
        setAllMissions(missions);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading missions:", err);
        setLoading(false);
      },
      user?.id,
      user?.employeeId,
      isAdmin
    );
    return () => unsubscribe();
  }, [user, hasPermission, can, canManageAllMissions]);

  const safeParseMissionDate = (m: Mission, target: "dateSaisie" | "startDate"): Date | null => {
    const primary = target === "dateSaisie" ? m.dateSaisie : m.startDate;
    const fallback = target === "dateSaisie" ? m.startDate : m.dateSaisie;
    
    if (primary) {
      try {
        const d = parseISO(primary);
        if (!isNaN(d.getTime())) return d;
      } catch {}
    }
    if (fallback) {
      try {
        const d = parseISO(fallback);
        if (!isNaN(d.getTime())) return d;
      } catch {}
    }
    return null;
  };

  const calculateMissionCost = (mission: Mission): number => {
    return (mission.participants || []).reduce((total, p) => {
      return total + (p.totalIndemnites || 0) + (p.coutTransport || 0) + (p.coutHebergement || 0);
    }, 0);
  };

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    allMissions.forEach(m => {
      [m.dateSaisie, m.startDate, m.endDate].forEach(ds => {
        if (ds) {
          try {
            const d = parseISO(ds);
            if (!isNaN(d.getTime())) {
              const y = d.getFullYear().toString();
              if (y && y.length === 4) years.add(y);
            }
          } catch {}
        }
      });
    });
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [allMissions, currentYear]);

  // Filtered missions based on active configuration
  const filteredMissions = useMemo(() => {
    return allMissions.filter(m => {
      const mDate = safeParseMissionDate(m, dateTarget);

      // Custom date interval (Du ... Au ...)
      if (startDate || endDate) {
        if (!mDate) return false;
        const formatted = format(mDate, "yyyy-MM-dd");
        if (startDate && formatted < startDate) return false;
        if (endDate && formatted > endDate) return false;
        return true;
      }

      // Year filter
      if (year !== "all") {
        if (!mDate) return false;
        if (mDate.getFullYear().toString() !== year) return false;
      }

      // Month filter
      if (month !== "all") {
        if (!mDate) return false;
        if (format(mDate, "MM") !== month) return false;
      }

      return true;
    });
  }, [allMissions, year, month, startDate, endDate, dateTarget]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalCount = filteredMissions.length;
    const totalCost = filteredMissions.reduce((acc, m) => acc + calculateMissionCost(m), 0);
    const totalParticipants = filteredMissions.reduce((acc, m) => acc + (m.participants?.length || 0), 0);
    
    const uniqueAgents = new Set(
      filteredMissions.flatMap(m => (m.participants || []).map(p => p.employeeId || p.employeeName).filter(Boolean))
    ).size;

    const ongoing = filteredMissions.filter(m => m.status === "En cours").length;
    const planned = filteredMissions.filter(m => m.status === "Planifiée").length;
    const completed = filteredMissions.filter(m => m.status === "Terminée").length;

    return {
      totalCount,
      totalCost,
      totalParticipants,
      uniqueAgents,
      ongoing,
      planned,
      completed
    };
  }, [filteredMissions]);

  // Administrative Recap Rows (Matching the uploaded image)
  const recapRows = useMemo(() => {
    const totalCount = filteredMissions.length;
    const totalParticipants = filteredMissions.reduce((acc, m) => acc + (m.participants?.length || 0), 0);

    if (totalCount === 0) return [];

    if (recapGroupBy === "dossier") {
      return filteredMissions.map(m => {
        const pCount = m.participants?.length || 0;
        return {
          key: m.id,
          objet: m.numeroMission ? `[${m.numeroMission}] ${m.title}` : m.title,
          count: 1,
          countPercentage: (1 / totalCount) * 100,
          participants: pCount,
          participantsPercentage: totalParticipants > 0 ? (pCount / totalParticipants) * 100 : 0,
        };
      });
    }

    const map = new Map<string, { count: number; participants: number }>();
    filteredMissions.forEach(m => {
      const rawTitle = (m.title || "Mission sans titre").trim();
      const key = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      const existing = map.get(key) || { count: 0, participants: 0 };
      existing.count += 1;
      existing.participants += (m.participants?.length || 0);
      map.set(key, existing);
    });

    return Array.from(map.entries()).map(([objet, data]) => ({
      key: objet,
      objet,
      count: data.count,
      countPercentage: (data.count / totalCount) * 100,
      participants: data.participants,
      participantsPercentage: totalParticipants > 0 ? (data.participants / totalParticipants) * 100 : 0
    }));
  }, [filteredMissions, recapGroupBy]);

  // Monthly Analytics for the selected year
  const monthlyStats = useMemo(() => {
    const monthsData = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(2026, i, 1);
      return {
        monthCode: format(d, "MM"),
        monthName: format(d, "MMMM", { locale: fr }),
        count: 0,
        participants: 0,
        cost: 0
      };
    });

    allMissions.forEach(m => {
      const mDate = safeParseMissionDate(m, dateTarget);
      if (mDate && mDate.getFullYear().toString() === year) {
        const mIdx = mDate.getMonth();
        if (monthsData[mIdx]) {
          monthsData[mIdx].count += 1;
          monthsData[mIdx].participants += (m.participants?.length || 0);
          monthsData[mIdx].cost += calculateMissionCost(m);
        }
      }
    });

    return monthsData;
  }, [allMissions, year, dateTarget]);

  const selectedPeriodText = useMemo(() => {
    if (startDate && endDate) {
      return `Du ${format(parseISO(startDate), "dd/MM/yyyy")} au ${format(parseISO(endDate), "dd/MM/yyyy")}`;
    }
    if (month !== "all") {
      const mObj = MONTHS.find(m => m.value === month);
      return `${mObj?.label || ""} ${year}`;
    }
    if (year !== "all") {
      return `Exercice Annuel ${year}`;
    }
    return "Toutes les périodes";
  }, [startDate, endDate, month, year]);

  const formatCurrency = (value: number) => {
    if (value === 0) return "0 FCFA";
    return value.toLocaleString("fr-FR") + " FCFA";
  };

  const handlePrintRecap = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Fenêtre bloquée",
        description: "Veuillez autoriser les fenêtres pop-up pour imprimer."
      });
      return;
    }

    const title = `CI-JOINT LE TABLEAU RECAPITULATIF DES ORDRES DE MISSION ${recapDirectionTitle.trim().toUpperCase()}`;
    const rowsHtml = recapRows.map(r => `
      <tr>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 11px;">${r.objet}</td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-weight: bold; font-size: 11px;">${r.count}</td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 11px;">${r.countPercentage.toFixed(r.countPercentage % 1 === 0 ? 0 : 2)}</td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-weight: bold; font-size: 11px;">${r.participants < 10 && r.participants > 0 ? `0${r.participants}` : r.participants}</td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 11px;">${r.participantsPercentage.toFixed(r.participantsPercentage % 1 === 0 ? 0 : 2)}</td>
      </tr>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm 12mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 13px; font-weight: bold; text-decoration: underline; text-transform: uppercase; line-height: 1.4; margin-bottom: 6px; }
          .sub { font-size: 11px; font-style: italic; color: #333; }
          table { width: 100%; border-collapse: collapse; border: 2px solid #000; }
          th { border: 1px solid #000; padding: 6px 8px; font-size: 10.5px; font-weight: bold; text-transform: uppercase; background: #f8fafc; }
          td { border: 1px solid #000; }
          tr.total td { border-top: 2px solid #000; font-weight: bold; background: #f1f5f9; padding: 7px 8px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${title}</div>
          <div class="sub">Période : ${selectedPeriodText}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left; width: 60%;">OBJET ET DOMAINE DE LA MISSION</th>
              <th style="width: 10%;">Nombre</th>
              <th style="width: 10%;">%</th>
              <th style="width: 10%;">Participants</th>
              <th style="width: 10%;">%</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total">
              <td>TOTAL</td>
              <td style="text-align: center;">${stats.totalCount}</td>
              <td style="text-align: center;">100</td>
              <td style="text-align: center;">${stats.totalParticipants}</td>
              <td style="text-align: center;">100</td>
            </tr>
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    const header = ["OBJET ET DOMAINE DE LA MISSION", "Nombre", "% Missions", "Participants", "% Participants"];
    const csvRows = [
      [`CI-JOINT LE TABLEAU RECAPITULATIF DES ORDRES DE MISSION ${recapDirectionTitle.toUpperCase()}`],
      [`Période: ${selectedPeriodText}`],
      [],
      header,
      ...recapRows.map(r => [
        `"${r.objet.replace(/"/g, '""')}"`,
        r.count,
        r.countPercentage.toFixed(2),
        r.participants,
        r.participantsPercentage.toFixed(2)
      ]),
      ["TOTAL", stats.totalCount, "100.00", stats.totalParticipants, "100.00"]
    ];

    const csvContent = "\uFEFF" + csvRows.map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recapitulatif-missions-${year}-${month}.csv`;
    link.click();
  };

  const handleCopyToClipboard = () => {
    const textLines = [
      `CI-JOINT LE TABLEAU RECAPITULATIF DES ORDRES DE MISSION ${recapDirectionTitle.toUpperCase()}`,
      `Période : ${selectedPeriodText}`,
      "",
      `OBJET ET DOMAINE DE LA MISSION\tNombre\t%\tParticipants\t%`,
      ...recapRows.map(r => `${r.objet}\t${r.count}\t${r.countPercentage.toFixed(2)}%\t${r.participants}\t${r.participantsPercentage.toFixed(2)}%`),
      `TOTAL\t${stats.totalCount}\t100%\t${stats.totalParticipants}\t100%`
    ];

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
    <PermissionGuard permission="page:missions:view" allowPersonal>
      <div className="flex flex-col gap-6 pb-20 max-w-7xl mx-auto w-full px-4 sm:px-6">
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link 
                href="/missions" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Retour aux Missions
              </Link>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Centre Opérationnel
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
              Rapports & Statistiques des Missions
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Tableaux récapitulatifs, grand livre des déplacements et analyse budgétaire
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecapModal(true)}
              className="h-10 rounded-xl border-slate-200 bg-white font-bold text-xs text-slate-700 hover:bg-slate-50 gap-2 shadow-2xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Tableau Récapitulatif
            </Button>

            <Button
              size="sm"
              onClick={() => setIsPrinting(true)}
              className="h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs gap-2 shadow-sm"
            >
              <Printer className="h-4 w-4 text-emerald-400" />
              Grand Livre (Impression)
            </Button>
          </div>
        </div>

        {/* Configuration Card with Filter Pills */}
        <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                  Configuration de la Période & Critères
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Filtrez les missions selon l'exercice budgétaire, le mois ou une plage de dates précise
                </CardDescription>
              </div>

              {/* Quick Target Toggle: Date de Saisie vs Date Déroulement */}
              <div className="inline-flex items-center bg-white border border-slate-200/80 rounded-xl p-0.5 text-[11px] font-bold shadow-2xs self-start sm:self-auto">
                <button
                  onClick={() => setDateTarget("dateSaisie")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all text-[11px]",
                    dateTarget === "dateSaisie"
                      ? "bg-slate-900 text-white shadow-xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Date de saisie
                </button>
                <button
                  onClick={() => setDateTarget("startDate")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all text-[11px]",
                    dateTarget === "startDate"
                      ? "bg-slate-900 text-white shadow-xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Date de mission
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* Année */}
              <div className="lg:col-span-3 space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Année Fiscale
                </Label>
                <Select value={year} onValueChange={(val) => { setYear(val); setStartDate(""); setEndDate(""); }}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-bold text-xs shadow-2xs">
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white shadow-xl">
                    <SelectItem value="all" className="text-xs font-bold">Toutes les années</SelectItem>
                    {availableYears.map(y => (
                      <SelectItem key={y} value={y} className="text-xs font-bold">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mois */}
              <div className="lg:col-span-3 space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Période Mensuelle
                </Label>
                <Select value={month} onValueChange={(val) => { setMonth(val); setStartDate(""); setEndDate(""); }}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-bold text-xs shadow-2xs">
                    <SelectValue placeholder="Mois" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white shadow-xl max-h-64">
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value} className="text-xs font-bold">{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Période Du */}
              <div className="lg:col-span-3 space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Plage : Du
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value) {
                      setMonth("all");
                    }
                  }}
                  className="h-10 rounded-xl border-slate-200 bg-white text-xs font-semibold shadow-2xs"
                />
              </div>

              {/* Période Au */}
              <div className="lg:col-span-3 space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Plage : Au
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (e.target.value) {
                      setMonth("all");
                    }
                  }}
                  className="h-10 rounded-xl border-slate-200 bg-white text-xs font-semibold shadow-2xs"
                />
              </div>
            </div>

            {/* Quick Filter Shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 text-[11px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Raccourcis :</span>
              <button
                onClick={() => { setYear(currentYear); setMonth("all"); setStartDate(""); setEndDate(""); }}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-all",
                  year === currentYear && month === "all" && !startDate && !endDate
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                Année {currentYear}
              </button>
              <button
                onClick={() => { setYear(currentYear); setMonth(currentMonth); setStartDate(""); setEndDate(""); }}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-all",
                  year === currentYear && month === currentMonth && !startDate && !endDate
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                Ce Mois ({MONTHS.find(m => m.value === currentMonth)?.label})
              </button>
              <button
                onClick={() => { setYear("all"); setMonth("all"); setStartDate(""); setEndDate(""); }}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-all",
                  year === "all" && month === "all" && !startDate && !endDate
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                Tout l'historique
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Total Missions */}
          <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Ordres de Mission
              </span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-300" /> : stats.totalCount}
            </div>
            <div className="text-[10px] font-semibold text-slate-400 mt-1">
              {selectedPeriodText}
            </div>
          </div>

          {/* Total Participants */}
          <div className="rounded-2xl bg-white p-4 sm:p-5 border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/30 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700">
                Total Participants
              </span>
              <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-950 mt-2">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-indigo-300" /> : stats.totalParticipants}
            </div>
            <div className="text-[10px] font-semibold text-indigo-600 mt-1">
              {stats.uniqueAgents} agents uniques mobilisés
            </div>
          </div>

          {/* Budget Prévisionnel */}
          <div className="rounded-2xl bg-white p-4 sm:p-5 border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/30 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Coût Prévisionnel
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-2 truncate">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-emerald-300" /> : formatCurrency(stats.totalCost)}
            </div>
            <div className="text-[10px] font-semibold text-emerald-600 mt-1">
              Indemnités & Déplacements
            </div>
          </div>

          {/* Statuts Répartition */}
          <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Répartition des Statuts
              </span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                {stats.completed} Term.
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                {stats.ongoing} En cours
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                {stats.planned} Plan.
              </span>
            </div>
            <div className="text-[10px] font-semibold text-slate-400 mt-2">
              Progression globale
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("recap")}
              className={cn(
                "py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0",
                activeTab === "recap"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              )}
            >
              <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
              Tableau Récapitulatif Administratif
            </button>

            <button
              onClick={() => setActiveTab("grandlivre")}
              className={cn(
                "py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0",
                activeTab === "grandlivre"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              )}
            >
              <ListFilter className="h-4 w-4 text-blue-600" />
              Grand Livre des Déplacements ({stats.totalCount})
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={cn(
                "py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0",
                activeTab === "analytics"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              )}
            >
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              Analyse Mensuelle ({year})
            </button>
          </div>
        </div>

        {/* TAB 1: Tableau Récapitulatif Administratif (Exact replica of the uploaded image) */}
        {activeTab === "recap" && (
          <div className="space-y-4">
            {/* Table Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                  Intitulé du Tableau :
                </Label>
                <Input
                  value={recapDirectionTitle}
                  onChange={(e) => setRecapDirectionTitle(e.target.value)}
                  placeholder="ex: DE LA DIRECTION ADMINISTRATIVE"
                  className="h-8 text-xs font-semibold bg-slate-50 border-slate-200 focus:bg-white max-w-md"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                  <button
                    onClick={() => setRecapGroupBy("objet")}
                    className={cn(
                      "px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                      recapGroupBy === "objet" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <Layers className="h-3 w-3" />
                    Groupé par Objet
                  </button>
                  <button
                    onClick={() => setRecapGroupBy("dossier")}
                    className={cn(
                      "px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                      recapGroupBy === "dossier" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <ListFilter className="h-3 w-3" />
                    Détail par Dossier
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  className="h-8 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                  <span>{copied ? "Copié" : "Copier"}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="h-8 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 gap-1.5"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>CSV</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handlePrintRecap}
                  className="h-8 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 gap-1.5 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Imprimer Tableau</span>
                </Button>
              </div>
            </div>

            {/* Rendered Table matching user image */}
            <div className="bg-white border-2 border-slate-900 rounded-xl shadow-md overflow-hidden max-w-4xl mx-auto">
              <div className="p-4 text-center border-b-2 border-slate-900 bg-white">
                <h3 className="text-xs sm:text-sm md:text-base font-black underline tracking-wide uppercase text-slate-900 leading-snug">
                  CI-JOINT LE TABLEAU RECAPITULATIF DES ORDRES DE MISSION {recapDirectionTitle.trim().toUpperCase()}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium italic mt-1">
                  Période : {selectedPeriodText}
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table className="w-full border-collapse">
                  <TableHeader>
                    <TableRow className="border-b-2 border-slate-900 bg-slate-100 hover:bg-slate-100 text-slate-900">
                      <TableHead className="font-black text-slate-900 text-left border-r border-slate-900 py-3 px-4 text-xs uppercase w-[58%]">
                        OBJET ET DOMAINE DE LA MISSION
                      </TableHead>
                      <TableHead className="font-black text-slate-900 text-center border-r border-slate-900 py-3 px-2 text-xs uppercase w-[10%]">
                        Nombre
                      </TableHead>
                      <TableHead className="font-black text-slate-900 text-center border-r border-slate-900 py-3 px-2 text-xs uppercase w-[9%]">
                        %
                      </TableHead>
                      <TableHead className="font-black text-slate-900 text-center border-r border-slate-900 py-3 px-2 text-xs uppercase w-[12%]">
                        Participants
                      </TableHead>
                      <TableHead className="font-black text-slate-900 text-center py-3 px-2 text-xs uppercase w-[11%]">
                        %
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                          <p className="text-xs font-bold text-slate-400 mt-2">Calcul des statistiques administratives...</p>
                        </TableCell>
                      </TableRow>
                    ) : recapRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <p className="font-bold text-slate-700 text-sm">Aucune mission trouvée pour cette période</p>
                          <p className="text-xs text-slate-400 mt-1">Modifiez les filtres d'année ou de mois ci-dessus pour afficher les données.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recapRows.map((row) => (
                        <TableRow key={row.key} className="border-b border-slate-900 hover:bg-slate-50/70 text-slate-900">
                          <TableCell className="border-r border-slate-900 py-2.5 px-4 text-xs font-normal leading-relaxed text-slate-900">
                            {row.objet}
                          </TableCell>
                          <TableCell className="border-r border-slate-900 py-2.5 px-2 text-center text-xs font-bold text-slate-900">
                            {row.count}
                          </TableCell>
                          <TableCell className="border-r border-slate-900 py-2.5 px-2 text-center text-xs text-slate-900">
                            {row.countPercentage.toFixed(row.countPercentage % 1 === 0 ? 0 : 2)}
                          </TableCell>
                          <TableCell className="border-r border-slate-900 py-2.5 px-2 text-center text-xs font-bold text-slate-900">
                            {row.participants < 10 && row.participants > 0 ? `0${row.participants}` : row.participants}
                          </TableCell>
                          <TableCell className="py-2.5 px-2 text-center text-xs text-slate-900">
                            {row.participantsPercentage.toFixed(row.participantsPercentage % 1 === 0 ? 0 : 2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    {/* TOTAL ROW */}
                    {recapRows.length > 0 && (
                      <TableRow className="border-t-2 border-slate-900 bg-slate-100 hover:bg-slate-100 font-black text-slate-900">
                        <TableCell className="border-r border-slate-900 py-3 px-4 text-xs font-black uppercase text-slate-900">
                          TOTAL
                        </TableCell>
                        <TableCell className="border-r border-slate-900 py-3 px-2 text-center text-xs font-black text-slate-900">
                          {stats.totalCount}
                        </TableCell>
                        <TableCell className="border-r border-slate-900 py-3 px-2 text-center text-xs font-black text-slate-900">
                          100
                        </TableCell>
                        <TableCell className="border-r border-slate-900 py-3 px-2 text-center text-xs font-black text-slate-900">
                          {stats.totalParticipants}
                        </TableCell>
                        <TableCell className="py-3 px-2 text-center text-xs font-black text-slate-900">
                          100
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Grand Livre des Déplacements */}
        {activeTab === "grandlivre" && (
          <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-tight text-slate-900">
                  Grand Livre des Déplacements — {selectedPeriodText}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Registre détaillé avec impact financier par mission
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsPrinting(true)}
                  className="h-8 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5 text-blue-400" />
                  Imprimer Rapport Officiel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="border-b border-slate-200 text-slate-500">
                      <TableHead className="py-3 px-4 font-black uppercase text-[10px] tracking-wider w-[120px]">N° Dossier</TableHead>
                      <TableHead className="py-3 px-4 font-black uppercase text-[10px] tracking-wider">Objet de la Mission</TableHead>
                      <TableHead className="py-3 px-4 font-black uppercase text-[10px] tracking-wider">Destination</TableHead>
                      <TableHead className="py-3 px-4 font-black uppercase text-[10px] tracking-wider text-center">Période</TableHead>
                      <TableHead className="py-3 px-4 font-black uppercase text-[10px] tracking-wider text-center">Effectif</TableHead>
                      <TableHead className="py-3 px-4 font-black uppercase text-[10px] tracking-wider text-center">Statut</TableHead>
                      <TableHead className="py-3 px-4 font-black uppercase text-[10px] tracking-wider text-right">Coût Prévisionnel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredMissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-400 font-bold text-xs">
                          Aucune mission trouvée pour cette période.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMissions.map((m) => (
                        <TableRow key={m.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                          <TableCell className="py-3 px-4 font-bold text-xs text-slate-900">
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-mono text-[11px]">
                              {m.numeroMission || `#${m.id.substring(0, 5).toUpperCase()}`}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4 font-bold text-xs text-slate-900 uppercase">
                            <Link href={`/missions/${m.id}`} className="hover:text-indigo-600 hover:underline">
                              {m.title}
                            </Link>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">
                            {m.lieuMission || "Territoire National"}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-xs text-center text-slate-600">
                            {m.startDate ? format(parseISO(m.startDate), "dd/MM/yy") : "-"} au {m.endDate ? format(parseISO(m.endDate), "dd/MM/yy") : "-"}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-xs text-center font-bold text-indigo-700">
                            {m.participants?.length || 0}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-center">
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                              m.status === "Terminée" ? "bg-emerald-100 text-emerald-800" :
                              m.status === "En cours" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                            )}>
                              {m.status}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right font-black text-xs text-slate-900">
                            {formatCurrency(calculateMissionCost(m))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: Analyse Mensuelle & Annuelle */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm font-black uppercase tracking-tight text-slate-900">
                  Ventilation Mensuelle des Missions & Budgets (Exercice {year})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Évolution mois par mois du nombre de missions, participants et budgets mobilisés
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="border-b border-slate-200">
                      <TableHead className="py-3 px-4 font-black uppercase text-[10px] tracking-wider">Mois</TableHead>
                      <TableHead className="py-3 px-4 font-black uppercase text-[10px] tracking-wider text-center">Nbre Missions</TableHead>
                      <TableHead className="py-3 px-4 font-black uppercase text-[10px] tracking-wider text-center">Participants</TableHead>
                      <TableHead className="py-3 px-4 font-black uppercase text-[10px] tracking-wider text-right">Budget Alloué</TableHead>
                      <TableHead className="py-3 px-4 font-black uppercase text-[10px] tracking-wider text-center w-[120px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyStats.map((m) => (
                      <TableRow key={m.monthCode} className={cn(
                        "border-b border-slate-100 transition-colors",
                        m.count > 0 ? "bg-indigo-50/20 hover:bg-indigo-50/40" : "hover:bg-slate-50"
                      )}>
                        <TableCell className="py-3 px-4 font-bold text-xs text-slate-800 capitalize">
                          {m.monthName}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          {m.count > 0 ? (
                            <span className="bg-slate-900 text-white font-black text-xs px-2.5 py-0.5 rounded-full">
                              {m.count}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center font-bold text-xs text-indigo-700">
                          {m.participants > 0 ? m.participants : <span className="text-slate-300 font-bold">-</span>}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-black text-xs text-slate-900">
                          {m.cost > 0 ? formatCurrency(m.cost) : <span className="text-slate-300 font-bold">-</span>}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          {m.count > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setMonth(m.monthCode);
                                setActiveTab("recap");
                              }}
                              className="h-7 px-2 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50"
                            >
                              Voir le Récap
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Printable Official Grand Livre */}
        {isPrinting && (
          <MissionsOfficialReport
            missions={filteredMissions}
            organizationSettings={settings}
            fiscalYear={year}
            periodText={selectedPeriodText}
            totalBudget={stats.totalCost}
            isPrinting={isPrinting}
            onAfterPrint={() => setIsPrinting(false)}
          />
        )}

        {/* Modal Tableau Récapitulatif Administratif */}
        <MissionsRecapTableModal
          isOpen={showRecapModal}
          onClose={() => setShowRecapModal(false)}
          missions={filteredMissions}
          organizationSettings={settings}
          periodLabel={selectedPeriodText}
        />
      </div>
    </PermissionGuard>
  );
}
