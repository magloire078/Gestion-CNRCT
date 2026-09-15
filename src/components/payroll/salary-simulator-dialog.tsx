"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  Coins,
  ArrowRight,
  Sparkles,
  Building2,
  User,
  ShieldCheck,
  TrendingUp,
  Landmark,
  Undo2,
  Copy,
  Check,
  Printer,
  Download,
  FileText,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import type { Employe, PayslipDetails, OrganizationSettings } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { cn, numberToWords } from "@/lib/utils";
import { PayslipTemplate } from "@/components/payroll/payslip-template";
import { InstitutionalReportWrapper } from "@/components/reports/institutional-report-wrapper";
import { getOrganizationSettings } from "@/services/organization-service";
import { lastDayOfMonth, format, parseISO, addMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface SalarySimulatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: Employe[];
}

const MONTHS = [
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

export function SalarySimulatorDialog({
  isOpen,
  onClose,
  employees = [],
}: SalarySimulatorDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"calculator" | "bulletin">("calculator");
  const [mode, setMode] = useState<"net-to-gross" | "gross-to-net">("net-to-gross");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("custom");
  const [copied, setCopied] = useState(false);

  // Form inputs
  const [targetNet, setTargetNet] = useState<number>(500000);
  const [baseSalaryInput, setBaseSalaryInput] = useState<number>(350000);
  const [seniorityYears, setSeniorityYears] = useState<number>(0);
  const [isCnps, setIsCnps] = useState<boolean>(true);
  const [transportNonImposable, setTransportNonImposable] = useState<number>(30000);

  // Indemnities
  const [indemniteTransportImposable, setIndemniteTransportImposable] = useState<number>(0);
  const [indemniteLogement, setIndemniteLogement] = useState<number>(0);
  const [indemniteResponsabilite, setIndemniteResponsabilite] = useState<number>(0);
  const [indemniteRepresentation, setIndemniteRepresentation] = useState<number>(0);
  const [indemniteCommunication, setIndemniteCommunication] = useState<number>(0);
  const [indemniteSujetion, setIndemniteSujetion] = useState<number>(0);

  // Custom agent identity fields for simulation
  const [customAgentName, setCustomAgentName] = useState("KOUAME YAO");
  const [customMatricule, setCustomMatricule] = useState("SIM-2026-001");
  const [customPoste, setCustomPoste] = useState("Cadre Opérationnel / Simulation RH");
  const [customCategorie, setCustomCategorie] = useState("HC - Hors Catégorie");
  const [customService, setCustomService] = useState("Direction des Opérations");
  const [customBanque, setCustomBanque] = useState("SGBCI (Société Générale)");
  const [customCompte, setCustomCompte] = useState("CI059 01001 00123456789 45");

  // Date / Period Controls for Test Payslips
  const [generationMode, setGenerationMode] = useState<"monthly" | "period">("monthly");
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();
  const [year, setYear] = useState<string>(currentYear);
  const [month, setMonth] = useState<string>(currentMonth);
  const [endYear, setEndYear] = useState<string>(currentYear);
  const [endMonth, setEndMonth] = useState<string>(currentMonth);

  // Preview page index in multi-month period
  const [previewMonthIndex, setPreviewMonthIndex] = useState<number>(0);

  // Print state
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [orgLogos, setOrgLogos] = useState<OrganizationSettings | null>(null);

  useEffect(() => {
    getOrganizationSettings().then(setOrgLogos).catch(console.error);
  }, []);

  const years = Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  // When an employee is selected, populate their parameters
  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (empId === "custom") {
      setCustomAgentName("KOUAME YAO");
      setCustomMatricule("SIM-2026-001");
      setCustomPoste("Cadre Opérationnel / Simulation RH");
      setCustomCategorie("HC - Hors Catégorie");
      setCustomService("Direction des Opérations");
      return;
    }

    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    if (emp.baseSalary) setBaseSalaryInput(emp.baseSalary);
    if (emp.CNPS !== undefined) setIsCnps(emp.CNPS);
    if (emp.transportNonImposable !== undefined) setTransportNonImposable(emp.transportNonImposable);
    if (emp.indemniteTransportImposable !== undefined) setIndemniteTransportImposable(emp.indemniteTransportImposable);
    if (emp.indemniteLogement !== undefined) setIndemniteLogement(emp.indemniteLogement);
    if (emp.indemniteResponsabilite !== undefined) setIndemniteResponsabilite(emp.indemniteResponsabilite);
    if (emp.indemniteRepresentation !== undefined) setIndemniteRepresentation(emp.indemniteRepresentation);
    if (emp.indemniteCommunication !== undefined) setIndemniteCommunication(emp.indemniteCommunication);
    if (emp.indemniteSujetion !== undefined) setIndemniteSujetion(emp.indemniteSujetion);

    const fullName = `${emp.lastName || ""} ${emp.firstName || ""}`.trim() || emp.name || "Agent CNRCT";
    setCustomAgentName(fullName);
    setCustomMatricule(emp.matricule || "N/A");
    setCustomPoste(emp.poste || "Agent CNRCT");
    setCustomCategorie(emp.categorie || "Catégorie 1");
    setCustomService(emp.departmentId || "Service Général");
    if (emp.banque) setCustomBanque(emp.banque);
    if (emp.numeroCompte) setCustomCompte(emp.numeroCompte);

    // Calculate seniority years from hire date
    if (emp.dateEmbauche) {
      const hireDate = new Date(emp.dateEmbauche);
      const now = new Date();
      const diffYears = Math.max(0, Math.floor((now.getTime() - hireDate.getTime()) / (365.25 * 24 * 3600 * 1000)));
      setSeniorityYears(diffYears);
    }
  };

  const primeAncienneteRate = useMemo(() => {
    if (seniorityYears >= 2) {
      return Math.min(25, seniorityYears);
    }
    return 0;
  }, [seniorityYears]);

  const totalOtherIndemnities = useMemo(() => {
    return (
      indemniteTransportImposable +
      indemniteLogement +
      indemniteResponsabilite +
      indemniteRepresentation +
      indemniteCommunication +
      indemniteSujetion
    );
  }, [
    indemniteTransportImposable,
    indemniteLogement,
    indemniteResponsabilite,
    indemniteRepresentation,
    indemniteCommunication,
    indemniteSujetion,
  ]);

  // Calculations based on mode
  const simulationResults = useMemo(() => {
    const cnpsRate = isCnps ? 0.063 : 0;
    const cnpsPatronalRate = isCnps ? 0.138 : 0;
    const primeRate = primeAncienneteRate / 100;

    let computedBaseSalary = 0;
    let computedPrimeAnciennete = 0;
    let computedBrutImposable = 0;
    let computedCnpsEmploye = 0;
    let computedCnpsEmployeur = 0;
    let computedNet = 0;
    let computedCoutTotal = 0;

    if (mode === "net-to-gross") {
      // Net -> Base & Brut
      const target = Number(targetNet) || 0;
      const transExempt = Number(transportNonImposable) || 0;
      const otherInd = totalOtherIndemnities;

      const denominator = (1 + primeRate) * (1 - cnpsRate);
      if (denominator > 0) {
        const numerator = target - transExempt - otherInd * (1 - cnpsRate);
        computedBaseSalary = Math.max(0, Math.round(numerator / denominator));
      }

      computedPrimeAnciennete = Math.round(computedBaseSalary * primeRate);
      computedBrutImposable = computedBaseSalary + computedPrimeAnciennete + otherInd;
      computedCnpsEmploye = Math.round(computedBrutImposable * cnpsRate);
      computedCnpsEmployeur = Math.round(computedBrutImposable * cnpsPatronalRate);
      computedNet = computedBrutImposable - computedCnpsEmploye + transExempt;
      computedCoutTotal = computedBrutImposable + transExempt + computedCnpsEmployeur;
    } else {
      // Gross/Base -> Net
      computedBaseSalary = Number(baseSalaryInput) || 0;
      computedPrimeAnciennete = Math.round(computedBaseSalary * primeRate);
      computedBrutImposable = computedBaseSalary + computedPrimeAnciennete + totalOtherIndemnities;
      computedCnpsEmploye = Math.round(computedBrutImposable * cnpsRate);
      computedCnpsEmployeur = Math.round(computedBrutImposable * cnpsPatronalRate);
      computedNet = computedBrutImposable - computedCnpsEmploye + (Number(transportNonImposable) || 0);
      computedCoutTotal = computedBrutImposable + (Number(transportNonImposable) || 0) + computedCnpsEmployeur;
    }

    return {
      baseSalary: computedBaseSalary,
      primeAnciennete: computedPrimeAnciennete,
      otherIndemnities: totalOtherIndemnities,
      brutImposable: computedBrutImposable,
      transportNonImposable: Number(transportNonImposable) || 0,
      cnpsEmploye: computedCnpsEmploye,
      cnpsEmployeur: computedCnpsEmployeur,
      netAPayer: computedNet,
      coutTotalEmployeur: computedCoutTotal,
    };
  }, [
    mode,
    targetNet,
    baseSalaryInput,
    primeAncienneteRate,
    isCnps,
    transportNonImposable,
    totalOtherIndemnities,
  ]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " FCFA";
  };

  const handleCopySummary = () => {
    const text = `--- SIMULATION DE RÉMUNÉRATION CNRCT ---
Bénéficiaire : ${customAgentName} (Matricule: ${customMatricule})
Poste : ${customPoste}
Salaire de Base : ${formatCurrency(simulationResults.baseSalary)}
Prime Ancienneté (${primeAncienneteRate}%) : ${formatCurrency(simulationResults.primeAnciennete)}
Indemnités Imposables : ${formatCurrency(simulationResults.otherIndemnities)}
---------------------------------------
Salaire Brut Imposable : ${formatCurrency(simulationResults.brutImposable)}
CNPS Salariale (6.3%) : ${formatCurrency(simulationResults.cnpsEmploye)}
Transport Exonéré : ${formatCurrency(simulationResults.transportNonImposable)}
---------------------------------------
NET À PAYER : ${formatCurrency(simulationResults.netAPayer)}
Coût Global Employeur : ${formatCurrency(simulationResults.coutTotalEmployeur)} (CNPS Patronale 13.8%: ${formatCurrency(simulationResults.cnpsEmployeur)})`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copié !", description: "Le résumé de la simulation a été copié dans le presse-papiers." });
    setTimeout(() => setCopied(false), 2000);
  };

  // Build the list of period dates
  const periodDates = useMemo(() => {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    if (generationMode === "monthly") {
      return [lastDayOfMonth(start).toISOString().split("T")[0]];
    }

    const end = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
    const dates: string[] = [];
    let current = start;

    while (current <= end) {
      dates.push(lastDayOfMonth(current).toISOString().split("T")[0]);
      current = addMonths(current, 1);
      // Safety limit to max 24 months
      if (dates.length > 24) break;
    }

    return dates.length > 0 ? dates : [lastDayOfMonth(start).toISOString().split("T")[0]];
  }, [generationMode, year, month, endYear, endMonth]);

  // Construct PayslipDetails array for all months in the selected simulation period
  const generatedPayslips = useMemo<PayslipDetails[]>(() => {
    const selectedEmp = selectedEmployeeId !== "custom" ? employees.find((e) => e.id === selectedEmployeeId) : null;

    const baseEmployeeInfo: Employe & { numeroCompteComplet?: string } = {
      id: selectedEmp?.id || "simulated-id",
      name: customAgentName,
      firstName: selectedEmp?.firstName || customAgentName.split(" ")[1] || "",
      lastName: selectedEmp?.lastName || customAgentName.split(" ")[0] || customAgentName,
      matricule: customMatricule,
      poste: customPoste,
      categorie: customCategorie,
      departmentId: customService,
      banque: customBanque,
      numeroCompte: customCompte,
      numeroCompteComplet: customCompte,
      situationMatrimoniale: selectedEmp?.situationMatrimoniale || "Célibataire",
      enfants: selectedEmp?.enfants || 0,
      parts: selectedEmp?.parts || 1,
      dateEmbauche: selectedEmp?.dateEmbauche || `${new Date().getFullYear() - seniorityYears}-01-01`,
      cnpsEmployeur: "48 944",
      cnpsEmploye: isCnps ? (selectedEmp?.cnpsEmploye || "0000000000") : "N/A",
      anciennete: `${seniorityYears} an(s)`,
      baseSalary: simulationResults.baseSalary,
      CNPS: isCnps,
      transportNonImposable: simulationResults.transportNonImposable,
      indemniteTransportImposable,
      indemniteLogement,
      indemniteResponsabilite,
      indemniteRepresentation,
      indemniteCommunication,
      indemniteSujetion,
    };

    // Earnings list
    const earnings = [
      { label: "SALAIRE DE BASE", amount: simulationResults.baseSalary },
      ...(simulationResults.primeAnciennete > 0
        ? [{ label: `PRIME D'ANCIENNETÉ (${primeAncienneteRate}%)`, amount: simulationResults.primeAnciennete }]
        : []),
      ...(indemniteLogement > 0 ? [{ label: "INDEMNITÉ DE LOGEMENT", amount: indemniteLogement }] : []),
      ...(indemniteTransportImposable > 0 ? [{ label: "INDEMNITÉ DE TRANSPORT IMPOSABLE", amount: indemniteTransportImposable }] : []),
      ...(indemniteResponsabilite > 0 ? [{ label: "INDEMNITÉ DE RESPONSABILITÉ", amount: indemniteResponsabilite }] : []),
      ...(indemniteRepresentation > 0 ? [{ label: "INDEMNITÉ DE REPRÉSENTATION", amount: indemniteRepresentation }] : []),
      ...(indemniteCommunication > 0 ? [{ label: "INDEMNITÉ DE COMMUNICATION", amount: indemniteCommunication }] : []),
      ...(indemniteSujetion > 0 ? [{ label: "INDEMNITÉ DE SUJÉTION", amount: indemniteSujetion }] : []),
    ];

    // Deductions list
    const deductions = isCnps && simulationResults.cnpsEmploye > 0
      ? [{ label: "RETENUE CNPS SALARIALE (6.3%)", amount: simulationResults.cnpsEmploye }]
      : [];

    // Employer Contributions
    const employerContributions = isCnps && simulationResults.cnpsEmployeur > 0
      ? [
          {
            label: "CNPS PATRONALE (13.8%)",
            base: simulationResults.brutImposable,
            rate: "13.8%",
            amount: simulationResults.cnpsEmployeur,
          },
        ]
      : [];

    const logos = {
      mainLogoUrl: orgLogos?.mainLogoUrl || "https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png",
      secondaryLogoUrl:
        orgLogos?.secondaryLogoUrl ||
        "https://upload.wikimedia.org/wikipedia/commons/4/4a/Coat_of_arms_of_C%C3%B4te_d%27Ivoire_%281997-2001_variant%29.svg",
    };

    return periodDates.map((pDate) => ({
      employeeInfo: {
        ...baseEmployeeInfo,
        paymentDate: pDate,
      },
      earnings,
      deductions,
      totals: {
        brutImposable: simulationResults.brutImposable,
        transportNonImposable: {
          label: "INDEMNITÉ DE TRANSPORT NON IMPOSABLE",
          amount: simulationResults.transportNonImposable,
        },
        netAPayer: simulationResults.netAPayer,
        netAPayerInWords: numberToWords(simulationResults.netAPayer),
      },
      employerContributions,
      organizationLogos: logos,
    }));
  }, [
    periodDates,
    selectedEmployeeId,
    employees,
    customAgentName,
    customMatricule,
    customPoste,
    customCategorie,
    customService,
    customBanque,
    customCompte,
    seniorityYears,
    primeAncienneteRate,
    isCnps,
    indemniteLogement,
    indemniteTransportImposable,
    indemniteResponsabilite,
    indemniteRepresentation,
    indemniteCommunication,
    indemniteSujetion,
    simulationResults,
    orgLogos,
  ]);

  const handlePrint = () => {
    setIsPrinting(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0 border-slate-200 bg-slate-50/80 backdrop-blur-2xl shadow-2xl rounded-2xl">
        {/* Dialog Header */}
        <DialogHeader className="bg-slate-900 p-6 text-white text-left relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                <Calculator className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                  Simulateur & Édition de Bulletins Test
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Barème CNRCT & Générateur de Spécimens de Paie pour un Mois ou une Période
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === "calculator" ? "default" : "secondary"}
                onClick={() => setActiveTab("calculator")}
                className={cn(
                  "h-9 px-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all",
                  activeTab === "calculator" ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                <Calculator className="h-3.5 w-3.5 mr-1.5" />
                Paramètres
              </Button>
              <Button
                variant={activeTab === "bulletin" ? "default" : "secondary"}
                onClick={() => setActiveTab("bulletin")}
                className={cn(
                  "h-9 px-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all",
                  activeTab === "bulletin" ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Bulletin Test ({periodDates.length})
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Dialog Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "calculator" ? (
            <>
              {/* Employee Pre-fill & Mode Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" /> Profil de référence (Optionnel)
                  </Label>
                  <Select value={selectedEmployeeId} onValueChange={handleEmployeeSelect}>
                    <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 font-medium">
                      <SelectValue placeholder="Choisir un employé..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="custom" className="font-bold text-slate-900">
                        ⚙️ Simulation libre (Personnalisée)
                      </SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id} className="text-xs">
                          {emp.name || `${emp.lastName || ""} ${emp.firstName || ""}`.trim()} — {emp.poste || "Agent"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Méthode de calcul
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={mode === "net-to-gross" ? "default" : "outline"}
                      onClick={() => setMode("net-to-gross")}
                      className={cn(
                        "h-10 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                        mode === "net-to-gross" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border-slate-200"
                      )}
                    >
                      🎯 Du Net au Brut
                    </Button>
                    <Button
                      type="button"
                      variant={mode === "gross-to-net" ? "default" : "outline"}
                      onClick={() => setMode("gross-to-net")}
                      className={cn(
                        "h-10 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                        mode === "gross-to-net" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border-slate-200"
                      )}
                    >
                      📊 Du Brut au Net
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Input Parameters Column */}
                <div className="lg:col-span-6 space-y-4">
                  <Card className="border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
                    <CardHeader className="p-4 bg-slate-50 border-b border-slate-100">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Coins className="h-4 w-4 text-emerald-600" />
                        {mode === "net-to-gross" ? "Cible de Rémunération Nette" : "Salaire de Base & Rémunération"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {mode === "net-to-gross" ? (
                        <div className="space-y-1.5">
                          <Label htmlFor="targetNet" className="text-xs font-bold text-slate-700">
                            Salaire Net Souhaité (FCFA)
                          </Label>
                          <Input
                            id="targetNet"
                            type="number"
                            step="5000"
                            value={targetNet}
                            onChange={(e) => setTargetNet(parseFloat(e.target.value) || 0)}
                            className="h-11 text-lg font-bold text-emerald-700 bg-emerald-50/50 border-emerald-300 focus-visible:ring-emerald-500"
                            placeholder="Ex: 500000"
                          />
                          <p className="text-[11px] text-slate-500 font-medium">
                            Le simulateur déterminera le salaire de base requis pour garantir exactement ce net à payer.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Label htmlFor="baseSalaryInput" className="text-xs font-bold text-slate-700">
                            Salaire de Base (FCFA)
                          </Label>
                          <Input
                            id="baseSalaryInput"
                            type="number"
                            step="5000"
                            value={baseSalaryInput}
                            onChange={(e) => setBaseSalaryInput(parseFloat(e.target.value) || 0)}
                            className="h-11 text-lg font-bold text-slate-900 bg-slate-50 border-slate-200"
                            placeholder="Ex: 350000"
                          />
                        </div>
                      )}

                      {/* General settings */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-600">Ancienneté (Années)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="40"
                            value={seniorityYears}
                            onChange={(e) => setSeniorityYears(parseInt(e.target.value) || 0)}
                            className="h-9 text-xs"
                          />
                          <span className="text-[10px] text-slate-400 font-bold">
                            Taux prime : {primeAncienneteRate}% {seniorityYears < 2 && "(Dès 2 ans)"}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-600">Transport Exonéré</Label>
                          <Input
                            type="number"
                            step="5000"
                            value={transportNonImposable}
                            onChange={(e) => setTransportNonImposable(parseFloat(e.target.value) || 0)}
                            className="h-9 text-xs"
                          />
                          <span className="text-[10px] text-slate-400 font-bold">Standard : 30 000 FCFA</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800">Déclaration CNPS</span>
                          <p className="text-[10px] text-slate-400">Cotisation salariale 6.3% & patronale 13.8%</p>
                        </div>
                        <Switch checked={isCnps} onCheckedChange={setIsCnps} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Indemnities Collapsible Card */}
                  <Card className="border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
                    <CardHeader className="p-4 bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-blue-600" />
                        Indemnités & Primes Spécifiques
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        Total: {formatCurrency(totalOtherIndemnities)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600">Transport Imposable</Label>
                        <Input
                          type="number"
                          step="5000"
                          value={indemniteTransportImposable}
                          onChange={(e) => setIndemniteTransportImposable(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600">Logement</Label>
                        <Input
                          type="number"
                          step="5000"
                          value={indemniteLogement}
                          onChange={(e) => setIndemniteLogement(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600">Responsabilité</Label>
                        <Input
                          type="number"
                          step="5000"
                          value={indemniteResponsabilite}
                          onChange={(e) => setIndemniteResponsabilite(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600">Représentation</Label>
                        <Input
                          type="number"
                          step="5000"
                          value={indemniteRepresentation}
                          onChange={(e) => setIndemniteRepresentation(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600">Communication</Label>
                        <Input
                          type="number"
                          step="5000"
                          value={indemniteCommunication}
                          onChange={(e) => setIndemniteCommunication(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600">Sujétion</Label>
                        <Input
                          type="number"
                          step="5000"
                          value={indemniteSujetion}
                          onChange={(e) => setIndemniteSujetion(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Simulation Results Breakdown Column */}
                <div className="lg:col-span-6 space-y-4">
                  <Card className="border-emerald-200 dark:border-emerald-800 shadow-md bg-gradient-to-br from-emerald-500/5 to-white dark:from-emerald-950/20 dark:to-slate-900 rounded-xl overflow-hidden">
                    <CardHeader className="p-4 bg-emerald-600 text-white flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Résultat du Calcul</span>
                        <CardTitle className="text-base font-extrabold uppercase">Bulletin & Ventilation Estimée</CardTitle>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopySummary}
                        className="h-8 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-500 text-[10px] font-bold uppercase tracking-wider gap-1.5 shadow-sm"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? "Copié" : "Copier"}</span>
                      </Button>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {/* Highlights Banner */}
                      <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                          <span>Net à Payer Estimé</span>
                          <Badge className="bg-emerald-500 text-white font-black text-[10px]">CONFORME</Badge>
                        </div>
                        <div className="text-3xl font-black text-emerald-400 tracking-tight">
                          {formatCurrency(simulationResults.netAPayer)}
                        </div>
                      </div>

                      {/* Detailed Table Breakdown */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        <div className="py-2.5 flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Salaire de Base Recommandé</span>
                          <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(simulationResults.baseSalary)}
                          </span>
                        </div>

                        <div className="py-2.5 flex items-center justify-between text-slate-600">
                          <span>Prime d'Ancienneté ({primeAncienneteRate}%)</span>
                          <span className="font-mono font-semibold">
                            {formatCurrency(simulationResults.primeAnciennete)}
                          </span>
                        </div>

                        {simulationResults.otherIndemnities > 0 && (
                          <div className="py-2.5 flex items-center justify-between text-slate-600">
                            <span>Indemnités Spécifiques Imposables</span>
                            <span className="font-mono font-semibold">
                              {formatCurrency(simulationResults.otherIndemnities)}
                            </span>
                          </div>
                        )}

                        <div className="py-2.5 flex items-center justify-between font-bold text-blue-900 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 px-2 rounded">
                          <span>Salaire Brut Imposable</span>
                          <span className="font-mono">{formatCurrency(simulationResults.brutImposable)}</span>
                        </div>

                        <div className="py-2.5 flex items-center justify-between text-rose-600">
                          <span>Cotisation CNPS Employé (6.3%)</span>
                          <span className="font-mono font-semibold">
                            - {formatCurrency(simulationResults.cnpsEmploye)}
                          </span>
                        </div>

                        <div className="py-2.5 flex items-center justify-between text-emerald-600">
                          <span>Indemnité Transport (Non Imposable)</span>
                          <span className="font-mono font-semibold">
                            + {formatCurrency(simulationResults.transportNonImposable)}
                          </span>
                        </div>
                      </div>

                      {/* Employer Total Cost Card */}
                      <div className="p-3.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                          <span>Charges Patronales & Coût Global</span>
                          <ShieldCheck className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-700 dark:text-slate-300">CNPS Employeur (13.8%)</span>
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                            {formatCurrency(simulationResults.cnpsEmployeur)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Coût Global Employeur
                          </span>
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                            {formatCurrency(simulationResults.coutTotalEmployeur)}
                          </span>
                        </div>
                      </div>

                      {/* Quick jump to test payslip button */}
                      <Button
                        type="button"
                        onClick={() => setActiveTab("bulletin")}
                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl gap-2 shadow-md"
                      >
                        <Printer className="h-4 w-4 text-emerald-400" />
                        Générer & Imprimer le Bulletin Test
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : (
            /* Tab 2: Test Payslip Generation, Preview & Print */
            <div className="space-y-6">
              {/* Period & Target Controls Bar */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      Période du Bulletin Test
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sélectionnez un mois spécifique ou une période continue pour générer les bulletins spécimens.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={generationMode === "monthly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGenerationMode("monthly")}
                      className={cn("text-xs font-bold", generationMode === "monthly" && "bg-slate-900")}
                    >
                      Mois Unique
                    </Button>
                    <Button
                      type="button"
                      variant={generationMode === "period" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGenerationMode("period")}
                      className={cn("text-xs font-bold", generationMode === "period" && "bg-slate-900")}
                    >
                      Période (Multi-Mois)
                    </Button>
                  </div>
                </div>

                {/* Date Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600">
                      {generationMode === "period" ? "Mois de début" : "Mois"}
                    </Label>
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger className="h-9 text-xs bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value} className="text-xs">
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600">
                      {generationMode === "period" ? "Année de début" : "Année"}
                    </Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger className="h-9 text-xs bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y} className="text-xs">
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {generationMode === "period" && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Mois de fin</Label>
                        <Select value={endMonth} onValueChange={setEndMonth}>
                          <SelectTrigger className="h-9 text-xs bg-slate-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((m) => (
                              <SelectItem key={m.value} value={m.value} className="text-xs">
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Année de fin</Label>
                        <Select value={endYear} onValueChange={setEndYear}>
                          <SelectTrigger className="h-9 text-xs bg-slate-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y} className="text-xs">
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>

                {/* Identity Customization for Test Slip */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-blue-600" />
                      Identité du Bénéficiaire sur le Bulletin
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {selectedEmployeeId === "custom" ? "Profil Test Libre" : "Données de l'Agent Sélectionné"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-slate-500">Nom & Prénoms</Label>
                      <Input
                        value={customAgentName}
                        onChange={(e) => setCustomAgentName(e.target.value)}
                        className="h-8 text-xs bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-slate-500">Matricule</Label>
                      <Input
                        value={customMatricule}
                        onChange={(e) => setCustomMatricule(e.target.value)}
                        className="h-8 text-xs bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-slate-500">Poste / Emploi</Label>
                      <Input
                        value={customPoste}
                        onChange={(e) => setCustomPoste(e.target.value)}
                        className="h-8 text-xs bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Period Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black tracking-tight">
                      {generatedPayslips.length === 1
                        ? `1 Bulletin Test Prêt (${MONTHS.find((m) => m.value === month)?.label} ${year})`
                        : `${generatedPayslips.length} Bulletins Test Prêts (Période Complète)`}
                    </div>
                    <div className="text-xs text-slate-400">
                      Montant Net Unitaire : <strong className="text-emerald-400 font-mono">{formatCurrency(simulationResults.netAPayer)}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    onClick={handlePrint}
                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimer Bulletin(s) Test
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs uppercase tracking-wider gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exporter PDF
                  </Button>
                </div>
              </div>

              {/* Multi-month Switcher if period mode */}
              {generatedPayslips.length > 1 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">
                    Aperçu du mois :{" "}
                    <strong className="text-emerald-700">
                      {format(new Date(generatedPayslips[previewMonthIndex]?.employeeInfo.paymentDate || ""), "MMMM yyyy", { locale: fr })}
                    </strong>{" "}
                    ({previewMonthIndex + 1} sur {generatedPayslips.length})
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      disabled={previewMonthIndex === 0}
                      onClick={() => setPreviewMonthIndex((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      disabled={previewMonthIndex >= generatedPayslips.length - 1}
                      onClick={() => setPreviewMonthIndex((p) => Math.min(generatedPayslips.length - 1, p + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Live Visual Preview of the Test Payslip */}
              <div className="bg-slate-200/60 p-4 rounded-2xl border border-slate-300/80 shadow-inner">
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    Aperçu Fidèle du Document Imprimé
                  </span>
                  <Badge className="bg-amber-500 text-white font-black text-[9px] uppercase tracking-widest">
                    Spécimen / Document de Simulation
                  </Badge>
                </div>

                <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 overflow-x-auto max-w-4xl mx-auto relative">
                  {/* Subtle Simulation Watermark Badge in top corner */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[9px] font-black uppercase tracking-widest pointer-events-none print:hidden">
                    SIMULATION TEST
                  </div>
                  {generatedPayslips[previewMonthIndex] && (
                    <PayslipTemplate payslipDetails={generatedPayslips[previewMonthIndex]} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Print Engine for Test Payslips */}
        <InstitutionalReportWrapper
          isPrinting={isPrinting}
          onAfterPrint={() => setIsPrinting(false)}
          orientation="portrait"
        >
          <div className="bg-white">
            {generatedPayslips.map((payslip, index) => (
              <div key={index} className={index > 0 ? "print:break-before-page" : ""}>
                <PayslipTemplate payslipDetails={payslip} />
              </div>
            ))}
          </div>
        </InstitutionalReportWrapper>
      </DialogContent>
    </Dialog>
  );
}
