
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Evaluation, Employe } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface AddEvaluationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvaluation: (evaluation: Omit<Evaluation, "id">) => Promise<void>;
}

export function AddEvaluationSheet({
  isOpen,
  onClose,
  onAddEvaluation,
}: AddEvaluationSheetProps) {
  const [allEmployees, setAllEmployees] = useState<Employe[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [employeeId, setEmployeeId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [reviewPeriod, setReviewPeriod] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
        async function fetchEmployees() {
            setLoadingEmployees(true);
            try {
                const fetchedEmployees = await getEmployees();
                setAllEmployees(fetchedEmployees);
            } catch(err) {
                console.error(err);
                setError("Impossible de charger la liste des employés.");
            } finally {
                setLoadingEmployees(false);
            }
        }
        fetchEmployees();
    }
  }, [isOpen]);

  const resetForm = () => {
    setEmployeeId("");
    setManagerId("");
    setReviewPeriod("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !managerId || !reviewPeriod) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
        const employee = allEmployees.find(e => e.id === employeeId);
        const manager = allEmployees.find(e => e.id === managerId);

        if(!employee || !manager) {
            throw new Error("Employé ou manager introuvable.");
        }

        const newEvaluationData: Omit<Evaluation, 'id'> = {
            employeeId,
            employeeName: employee.name,
            managerId,
            managerName: manager.name,
            reviewPeriod,
            evaluationDate: new Date().toISOString().split('T')[0],
            status: 'Draft',
            scores: {},
            strengths: '',
            areasForImprovement: '',
            managerComments: '',
            employeeComments: '',
            goals: [],
        }

        await onAddEvaluation(newEvaluationData);
        handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du lancement de l'évaluation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const periodSuggestions = [
      `Annuel ${currentYear}`, `Semestre 1 ${currentYear}`, `Semestre 2 ${currentYear}`,
      `Q1 ${currentYear}`, `Q2 ${currentYear}`, `Q3 ${currentYear}`, `Q4 ${currentYear}`
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Lancer une nouvelle évaluation</SheetTitle>
            <SheetDescription>
              Sélectionnez l'employé, le manager et la période pour commencer.
            </SheetDescription>
          </SheetHeader>
           <div className="py-4 h-[calc(100vh-150px)]">
             <ScrollArea className="h-full w-full pr-6">
                 {loadingEmployees && (
                    <div className="flex items-center justify-center col-span-4 py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                {!loadingEmployees && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="employee">Employé</Label>
                            <Select value={employeeId} onValueChange={setEmployeeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez l'employé à évaluer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allEmployees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="manager">Manager</Label>
                            <Select value={managerId} onValueChange={setManagerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez le manager" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allEmployees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reviewPeriod">Période d'évaluation</Label>
                            <Input id="reviewPeriod" value={reviewPeriod} onChange={(e) => setReviewPeriod(e.target.value)} list="period-suggestions" placeholder="Ex: Annuel 2024"/>
                            <datalist id="period-suggestions">
                                {periodSuggestions.map(p => <option key={p} value={p} />)}
                            </datalist>
                        </div>
                    </div>
                )}
                {error && (
                  <p className="col-span-4 text-center text-sm text-destructive pt-4">
                    {error}
                  </p>
                )}
             </ScrollArea>
           </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting || loadingEmployees}>
              {isSubmitting ? "Lancement..." : "Lancer l'évaluation"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

    
