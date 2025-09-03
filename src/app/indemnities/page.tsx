
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Loader2, Calculator, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { differenceInYears, parseISO } from "date-fns";
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
  const [result, setResult] = useState<{ amount: number; details: string[] } | null>(null);

  const [isEmployeeComboboxOpen, setIsEmployeeComboboxOpen] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        const data = await getEmployees();
        // Include active and dismissed employees
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


  const handleCalculate = () => {
    if (!selectedEmployeeId) {
      toast({ variant: "destructive", title: "Veuillez sélectionner un employé." });
      return;
    }
    
    setIsCalculating(true);
    setResult(null);

    const employee = allEmployees.find(e => e.id === selectedEmployeeId);
    if (!employee || !employee.dateEmbauche || !employee.baseSalary) {
      toast({ variant: "destructive", title: "Données de l'employé incomplètes", description: "Le salaire de base et la date d'embauche sont requis." });
      setIsCalculating(false);
      return;
    }

    const seniority = differenceInYears(parseISO(departureDate), parseISO(employee.dateEmbauche));
    const salary = employee.baseSalary;
    let indemnity = 0;
    const details : string[] = [];

    const employeeDisplayName = `${employee.lastName || ''} ${employee.firstName || ''}`.trim();
    details.push(`Employé: ${employeeDisplayName}`);
    details.push(`Ancienneté: ${seniority} ans`);
    details.push(`Salaire de base de référence: ${salary.toLocaleString('fr-FR')} FCFA`);
    details.push(`Type: ${calculationType === 'retraite' ? 'Départ à la retraite' : 'Licenciement'}`);


    const yearsInBracket1 = Math.min(seniority, 5);
    if (yearsInBracket1 > 0) {
        const indemnityBracket1 = salary * 0.30 * yearsInBracket1;
        details.push(`- Tranche 1 (0-5 ans): ${yearsInBracket1} an(s) * 30% = ${indemnityBracket1.toLocaleString('fr-FR')} FCFA`);
        indemnity += indemnityBracket1;
    }

    if (seniority > 5) {
        const yearsInBracket2 = Math.min(seniority - 5, 5); // 5 ans max (de la 6e à la 10e)
        if (yearsInBracket2 > 0) {
            const indemnityBracket2 = salary * 0.35 * yearsInBracket2;
            details.push(`- Tranche 2 (6-10 ans): ${yearsInBracket2} an(s) * 35% = ${indemnityBracket2.toLocaleString('fr-FR')} FCFA`);
            indemnity += indemnityBracket2;
        }
    }

    if (seniority > 10) {
        const yearsInBracket3 = seniority - 10;
        if (yearsInBracket3 > 0) {
            const indemnityBracket3 = salary * 0.40 * yearsInBracket3;
            details.push(`- Tranche 3 (>10 ans): ${yearsInBracket3} an(s) * 40% = ${indemnityBracket3.toLocaleString('fr-FR')} FCFA`);
            indemnity += indemnityBracket3;
        }
    }

    setTimeout(() => {
        setResult({ amount: indemnity, details });
        setIsCalculating(false);
    }, 1000); // Simule un calcul
  };


  return (
    <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Calcul des Indemnités</h1>
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Paramètres du Calcul</CardTitle>
                        <CardDescription>Sélectionnez un employé et le type d'indemnité.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="employee">Employé</Label>
                            {loading ? <Skeleton className="h-10 w-full" /> : (
                                 <Popover open={isEmployeeComboboxOpen} onOpenChange={setIsEmployeeComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isEmployeeComboboxOpen}
                                            className="w-full justify-between font-normal"
                                        >
                                            {selectedEmployeeId
                                                ? `${allEmployees.find(e => e.id === selectedEmployeeId)?.lastName || ''} ${allEmployees.find(e => e.id === selectedEmployeeId)?.firstName || ''}`.trim()
                                                : "Sélectionnez un employé..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un employé..." value={employeeSearchTerm} onValueChange={setEmployeeSearchTerm}/>
                                            <CommandList>
                                                <CommandEmpty>Aucun employé trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredEmployees.map((emp) => (
                                                        <CommandItem
                                                            key={emp.id}
                                                            value={`${emp.lastName} ${emp.firstName}`}
                                                            onSelect={() => {
                                                                setSelectedEmployeeId(emp.id);
                                                                setIsEmployeeComboboxOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedEmployeeId === emp.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
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
                        <div className="space-y-2">
                             <Label>Type d'indemnité</Label>
                             <RadioGroup defaultValue="retraite" value={calculationType} onValueChange={(v: CalculationType) => setCalculationType(v)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="retraite" id="r-retraite" />
                                    <Label htmlFor="r-retraite">Départ à la retraite</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="licenciement" id="r-licenciement" />
                                    <Label htmlFor="r-licenciement">Licenciement</Label>
                                </div>
                            </RadioGroup>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="departureDate">Date de Départ</Label>
                            <Input
                                id="departureDate"
                                type="date"
                                value={departureDate}
                                onChange={(e) => setDepartureDate(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleCalculate} disabled={isCalculating || !selectedEmployeeId} className="w-full">
                            {isCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                            Calculer l'indemnité
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Card className="min-h-[300px]">
                    <CardHeader>
                        <CardTitle>Résultat du Calcul</CardTitle>
                        <CardDescription>Le détail et le montant final de l'indemnité s'afficheront ici.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isCalculating && (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        {result && (
                            <div className="space-y-4">
                                <div className="text-center bg-primary/10 p-6 rounded-lg">
                                    <p className="text-sm text-primary font-semibold uppercase">Montant total de l'indemnité</p>
                                    <p className="text-4xl font-bold text-primary">{result.amount.toLocaleString('fr-FR')} FCFA</p>
                                </div>
                                <div className="space-y-2 pt-4">
                                    <h4 className="font-semibold">Détails du calcul :</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
                                        {result.details.map((detail, i) => <li key={i}>{detail}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                         {!result && !isCalculating && (
                            <div className="flex justify-center items-center h-48 text-center text-muted-foreground">
                                <p>Veuillez remplir les paramètres et lancer le calcul.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
