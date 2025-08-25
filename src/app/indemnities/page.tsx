
"use client";

import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmployees } from "@/services/employee-service";
import type { Employe } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { differenceInYears, parseISO } from "date-fns";

type CalculationType = "retraite" | "licenciement";

export default function IndemnityCalculatorPage() {
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [calculationType, setCalculationType] = useState<CalculationType>("retraite");
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);

  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<{ amount: number; details: string[] } | null>(null);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        const data = await getEmployees();
        setEmployees(data);
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

  const handleCalculate = () => {
    if (!selectedEmployeeId) {
      toast({ variant: "destructive", title: "Veuillez sélectionner un employé." });
      return;
    }
    
    setIsCalculating(true);
    setResult(null);

    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee || !employee.dateEmbauche || !employee.baseSalary) {
      toast({ variant: "destructive", title: "Données de l'employé incomplètes", description: "Le salaire de base et la date d'embauche sont requis." });
      setIsCalculating(false);
      return;
    }

    // --- Logique de calcul (simplifiée) ---
    // Dans une vraie application, cette logique serait plus complexe et respecterait le code du travail.
    const seniority = differenceInYears(parseISO(departureDate), parseISO(employee.dateEmbauche));
    const salary = employee.baseSalary;
    let indemnity = 0;
    const details : string[] = [];

    details.push(`Employé: ${employee.name}`);
    details.push(`Ancienneté: ${seniority} ans`);
    details.push(`Salaire de base de référence: ${salary.toLocaleString('fr-FR')} FCFA`);

    if (calculationType === 'retraite') {
        let rate = 0;
        if (seniority <= 5) rate = 0.30;
        else if (seniority <= 10) rate = 0.35;
        else rate = 0.40;
        indemnity = salary * seniority * rate;
        details.push(`Type: Départ à la retraite`);
        details.push(`Taux appliqué: ${rate * 100}%`);
        details.push(`Calcul: ${salary.toLocaleString('fr-FR')} * ${seniority} * ${rate} = ${indemnity.toLocaleString('fr-FR')} FCFA`);

    } else { // Licenciement
        let rate = 0;
        if (seniority <= 5) rate = 0.30;
        else if (seniority <= 10) rate = 0.35;
        else rate = 0.40;
        indemnity = salary * seniority * rate;
        details.push(`Type: Licenciement`);
        details.push(`Taux appliqué: ${rate * 100}%`);
        details.push(`Calcul: ${salary.toLocaleString('fr-FR')} * ${seniority} * ${rate} = ${indemnity.toLocaleString('fr-FR')} FCFA`);
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
                                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionnez un employé..." /></SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
