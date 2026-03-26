"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmployees } from "@/services/employee-service";
import type { Employe } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { 
    Loader2, Calculator, Search, 
    User, Calendar as CalendarIcon, 
    ArrowRight, Info, CheckCircle2,
    Briefcase, Banknote, ShieldCheck,
    ChevronRight, TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { differenceInYears, parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";


type CalculationType = "retraite" | "licenciement";

export default function IndemnityCalculatorPage() {
  const [allEmployees, setAllEmployees] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [calculationType, setCalculationType] = useState<CalculationType>("retraite");
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);

  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<{ amount: number; details: { label: string, value: string, highlight?: boolean }[] } | null>(null);

  const [isEmployeeComboboxOpen, setIsEmployeeComboboxOpen] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        const data = await getEmployees();
        setAllEmployees(data.filter(e => e.status === 'Actif' || e.status === 'Licencié'));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la liste des employés.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, [toast]);
  
  const filteredEmployees = useMemo(() => {
    if (!employeeSearchTerm) return allEmployees;
    const lowercasedTerm = employeeSearchTerm.toLowerCase();
    return allEmployees.filter(emp => 
        (emp.name.toLowerCase().includes(lowercasedTerm)) ||
        (emp.firstName?.toLowerCase().includes(lowercasedTerm)) ||
        (emp.lastName?.toLowerCase().includes(lowercasedTerm))
    );
  }, [allEmployees, employeeSearchTerm]);

  const selectedEmployee = useMemo(() => 
    allEmployees.find(e => e.id === selectedEmployeeId), 
    [allEmployees, selectedEmployeeId]
  );


  const handleCalculate = () => {
    if (!selectedEmployeeId) {
      toast({ variant: "destructive", title: "Veuillez sélectionner un employé." });
      return;
    }
    
    setIsCalculating(true);
    setResult(null);

    const employee = selectedEmployee;
    if (!employee || !employee.dateEmbauche || !employee.baseSalary) {
      toast({ 
        variant: "destructive", 
        title: "Données incomplètes", 
        description: "Le salaire de base et la date d'embauche sont requis." 
      });
      setIsCalculating(false);
      return;
    }

    const seniority = differenceInYears(parseISO(departureDate), parseISO(employee.dateEmbauche));
    const salary = employee.baseSalary;
    let indemnity = 0;
    const details : { label: string, value: string, highlight?: boolean }[] = [];

    const employeeDisplayName = `${employee.lastName || ''} ${employee.firstName || ''}`.trim();
    
    details.push({ label: "Ancienneté", value: `${seniority} ans` });
    details.push({ label: "Salaire de base", value: `${salary.toLocaleString('fr-FR')} FCFA` });
    details.push({ label: "Type d'indemnité", value: calculationType === 'retraite' ? 'Départ à la retraite' : 'Licenciement', highlight: true });

    const yearsInBracket1 = Math.min(seniority, 5);
    if (yearsInBracket1 > 0) {
        const indemnityBracket1 = salary * 0.30 * yearsInBracket1;
        details.push({ label: "Tranche 1 (0-5 ans)", value: `${yearsInBracket1} an(s) * 30% = ${Math.round(indemnityBracket1).toLocaleString('fr-FR')} FCFA` });
        indemnity += indemnityBracket1;
    }

    if (seniority > 5) {
        const yearsInBracket2 = Math.min(seniority - 5, 5);
        if (yearsInBracket2 > 0) {
            const indemnityBracket2 = salary * 0.35 * yearsInBracket2;
            details.push({ label: "Tranche 2 (6-10 ans)", value: `${yearsInBracket2} an(s) * 35% = ${Math.round(indemnityBracket2).toLocaleString('fr-FR')} FCFA` });
            indemnity += indemnityBracket2;
        }
    }

    if (seniority > 10) {
        const yearsInBracket3 = seniority - 10;
        if (yearsInBracket3 > 0) {
            const indemnityBracket3 = salary * 0.40 * yearsInBracket3;
            details.push({ label: "Tranche 3 (>10 ans)", value: `${yearsInBracket3} an(s) * 40% = ${Math.round(indemnityBracket3).toLocaleString('fr-FR')} FCFA` });
            indemnity += indemnityBracket3;
        }
    }

    setTimeout(() => {
        setResult({ amount: Math.round(indemnity), details });
        setIsCalculating(false);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Simulateur d'Indemnités</h1>
                <p className="text-muted-foreground mt-1 text-sm">Calcul légal des indemnités de fin de carrière ou de rupture.</p>
            </div>
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                 <Button 
                    variant={calculationType === "retraite" ? "default" : "ghost"}
                    className={cn("rounded-lg h-9 text-xs font-bold", calculationType === "retraite" && "bg-slate-900 shadow-sm")}
                    onClick={() => setCalculationType("retraite")}
                >
                    Retraite
                </Button>
                <Button 
                    variant={calculationType === "licenciement" ? "default" : "ghost"}
                    className={cn("rounded-lg h-9 text-xs font-bold", calculationType === "licenciement" && "bg-slate-900 shadow-sm")}
                    onClick={() => setCalculationType("licenciement")}
                >
                    Licenciement
                </Button>
            </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="h-1.5 bg-slate-900" />
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Info className="h-5 w-5 text-slate-400" /> Paramètres
                        </CardTitle>
                        <CardDescription>Configuration du calcul.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Employé Concerné</Label>
                            {loading ? <Skeleton className="h-11 w-full rounded-xl" /> : (
                                 <Popover open={isEmployeeComboboxOpen} onOpenChange={setIsEmployeeComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between h-11 rounded-xl border-slate-200 font-medium"
                                        >
                                            {selectedEmployeeId ? (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-slate-400" />
                                                    {`${selectedEmployee?.lastName || ''} ${selectedEmployee?.firstName || ''}`.trim()}
                                                </div>
                                            ) : "Choisir un collaborateur..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0 rounded-xl" align="start">
                                        <Command className="rounded-xl">
                                            <CommandInput placeholder="Rechercher..." className="h-11" />
                                            <CommandList>
                                                <CommandEmpty>Aucun résultat.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredEmployees.map((emp) => (
                                                        <CommandItem
                                                            key={emp.id}
                                                            onSelect={() => {
                                                                setSelectedEmployeeId(emp.id);
                                                                setIsEmployeeComboboxOpen(false);
                                                            }}
                                                            className="h-10 cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedEmployeeId === emp.id ? "opacity-100" : "opacity-0")} />
                                                            {`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>

                        {selectedEmployee && (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 animate-in fade-in slide-in-from-top-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Résumé du contrat</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-slate-500">Recruté le</span>
                                        <p className="text-xs font-bold text-slate-700">{selectedEmployee.dateEmbauche}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-slate-500">Salaire Base</span>
                                        <p className="text-xs font-bold text-slate-900">{selectedEmployee.baseSalary?.toLocaleString()} F</p>
                                    </div>
                                </div>
                            </div>
                        )}

                         <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Date de cessation</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="date"
                                    className="pl-10 h-11 rounded-xl border-slate-200"
                                    value={departureDate}
                                    onChange={(e) => setDepartureDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button 
                            onClick={handleCalculate} 
                            disabled={isCalculating || !selectedEmployeeId} 
                            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all font-bold"
                        >
                            {isCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                            Générer la Simulation
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none bg-blue-50/50 shadow-none">
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-blue-900">Base Réglementaire</p>
                                <p className="text-[11px] text-blue-700 leading-relaxed italic">
                                    Calcul basé sur la convention collective interprofessionnelle. 
                                    (Tranches: 30%, 35%, 40% selon l'ancienneté).
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-8">
                 <Card className="min-h-[500px] border-none shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Résultat de la Simulation</CardTitle>
                                <CardDescription>Analyse détaillée des droits acquis.</CardDescription>
                            </div>
                            {result && (
                                <Badge variant="outline" className="h-8 rounded-lg px-3 bg-white border-slate-200 text-slate-600 font-bold">
                                    Cycle {calculationType === 'retraite' ? 'Retraite' : 'Rupture'}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-8">
                        {isCalculating && (
                            <div className="flex flex-col justify-center items-center h-[350px] gap-4">
                                <div className="relative">
                                    <div className="h-16 w-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                                    <Calculator className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
                                </div>
                                <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Calcul complexe en cours...</p>
                            </div>
                        )}
                        
                        {result && (
                            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl blur opacity-10 group-hover:opacity-20 transition" />
                                    <div className="relative flex flex-col items-center justify-center bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Indemnité de Fin de Carrière</p>
                                        <p className="text-5xl font-black text-slate-900 tabular-nums">
                                            {result.amount.toLocaleString('fr-FR')} <span className="text-xl">FCFA</span>
                                        </p>
                                        <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Simulation prête
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-xs uppercase tracking-widest text-slate-500">Décomposition du calcul</h4>
                                        <div className="h-px bg-slate-100 flex-1 ml-4" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {result.details.map((item, i) => (
                                            <div 
                                                key={i} 
                                                className={cn(
                                                    "p-4 rounded-xl border transition-all flex justify-between items-center group",
                                                    item.highlight ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-100 hover:border-slate-300"
                                                )}
                                            >
                                                <div className="space-y-0.5">
                                                    <p className={cn("text-[10px] font-bold uppercase", item.highlight ? "text-slate-400" : "text-slate-400")}>{item.label}</p>
                                                    <p className="text-sm font-bold text-inherit">{item.value}</p>
                                                </div>
                                                <ChevronRight className={cn("h-4 w-4 opacity-20", item.highlight ? "text-white" : "text-slate-900")} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-100 grid grid-cols-2 gap-8 text-center">
                                    <div>
                                        <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Impact Budgétaire</p>
                                        <p className="text-sm font-bold text-slate-700">Majeur</p>
                                    </div>
                                    <div>
                                        <Briefcase className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Provisionnement RH</p>
                                        <p className="text-sm font-bold text-slate-700">Obligatoire</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!result && !isCalculating && (
                            <div className="flex flex-col justify-center items-center h-[350px] text-center gap-4">
                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                    <Banknote className="h-10 w-10 text-slate-200" />
                                </div>
                                <div className="max-w-[300px] space-y-1">
                                    <p className="font-bold text-slate-400">Aucune simulation en cours</p>
                                    <p className="text-xs text-slate-300">Sélectionnez un employé pour débuter l'analyse financière de sa fin de contrat.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    {result && (
                        <CardFooter className="bg-slate-50/50 p-6 flex justify-center gap-4">
                             <Button variant="outline" className="rounded-xl border-slate-200">
                                Télécharger PDF
                            </Button>
                            <Button variant="outline" className="rounded-xl border-slate-200">
                                Imprimer Simulation
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    </div>
  );
}