
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PayrollEntry } from "@/lib/payroll-data";
import type { Employee } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";

interface AddPayrollSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPayroll: (payroll: Omit<PayrollEntry, "id">) => Promise<void>;
}

export function AddPayrollSheet({ isOpen, onClose, onAddPayroll }: AddPayrollSheetProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [baseSalary, setBaseSalary] = useState('');
  const [payFrequency, setPayFrequency] = useState<'Mensuel' | 'Bi-hebdomadaire'>('Mensuel');
  const [nextPayDate, setNextPayDate] = useState('');
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function fetchEmployees() {
        try {
          const fetchedEmployees = await getEmployees();
          setEmployees(fetchedEmployees.filter(e => e.status === 'Active'));
        } catch (err) {
          setError("Impossible de charger la liste des employés.");
          console.error(err);
        }
      }
      fetchEmployees();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedEmployee(null);
    setBaseSalary('');
    setPayFrequency('Mensuel');
    setNextPayDate('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectEmployee = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    setSelectedEmployee(employee || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee || !baseSalary || !nextPayDate) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      await onAddPayroll({
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        role: selectedEmployee.role,
        baseSalary: parseFloat(baseSalary),
        payFrequency,
        nextPayDate,
      });
      handleClose();
    } catch(err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de l'entrée de paie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter des Détails de Paie</SheetTitle>
            <SheetDescription>
              Remplissez les informations de paie pour un employé.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employee" className="text-right">
                Employé
              </Label>
              <Select onValueChange={handleSelectEmployee} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionnez un employé..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.matricule})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baseSalary" className="text-right">Salaire de Base</Label>
              <Input
                id="baseSalary"
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="col-span-3"
                placeholder="Ex: 500000"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payFrequency" className="text-right">Fréquence</Label>
              <Select value={payFrequency} onValueChange={(v: 'Mensuel' | 'Bi-hebdomadaire') => setPayFrequency(v)} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensuel">Mensuel</SelectItem>
                  <SelectItem value="Bi-hebdomadaire">Bi-hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nextPayDate" className="text-right">Prochaine Paie</Label>
              <Input
                id="nextPayDate"
                type="date"
                value={nextPayDate}
                onChange={(e) => setNextPayDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
