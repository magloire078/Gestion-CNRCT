"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import type { Employe } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SalarySimulatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: Employe[];
}

export function SalarySimulatorDialog({
  isOpen,
  onClose,
  employees = [],
}: SalarySimulatorDialogProps) {
  const { toast } = useToast();
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

  // When an employee is selected, populate their parameters
  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (empId === "custom") return;

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-slate-200 bg-slate-50/70 backdrop-blur-2xl shadow-2xl rounded-2xl">
        {/* Dialog Header */}
        <DialogHeader className="bg-slate-900 p-6 text-white text-left relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <Calculator className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                Simulateur de Rémunération & Salaires
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Moteur de calcul conforme au barème CNRCT & Réglementation Ivoirienne
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Dialog Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
