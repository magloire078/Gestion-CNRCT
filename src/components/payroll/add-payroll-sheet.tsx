
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
  
  const [formState, setFormState] = useState<Partial<Omit<PayrollEntry, 'id' | 'employeeName' | 'role'>>>({
      payFrequency: 'Mensuel',
      baseSalary: 0,
      cnpsEmployeur: '320491',
      cnpsEmploye: '288011808670',
      situationMatrimoniale: 'Célibataire',
      banque: 'BNI',
      numeroCompte: 'CI092 09001 00134952000 77',
      service: 'Cabinet',
      dateConge: '__/__/____',
      anciennete: "7 an(s) 8 mois 14 jours",
      categorie: 'Catégorie',
      enfants: 1,
      parts: 2.0,
      dateEmbauche: '2017-08-16',
      paymentLocation: 'Yamoussoukro',
      paymentDate: 'Mercredi 30 Avril 2025'
  });

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
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectEmployee = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    setSelectedEmployee(employee || null);
    if(employee) {
        setFormState(prev => ({
            ...prev,
            employeeId: employee.id,
            emploi: employee.role,
        }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value, type } = e.target;
      setFormState(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (id: string, value: string) => {
      setFormState(prev => ({ ...prev, [id]: value }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee) {
      setError("Veuillez sélectionner un employé.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const payrollData: Omit<PayrollEntry, 'id'> = {
          employeeId: selectedEmployee.id,
          employeeName: selectedEmployee.name,
          role: selectedEmployee.role,
          ...formState
      } as Omit<PayrollEntry, 'id'>;

      await onAddPayroll(payrollData);
      handleClose();
    } catch(err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de l'entrée de paie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter des Détails de Paie</SheetTitle>
            <SheetDescription>
              Remplissez les informations de paie pour un employé. Les champs sont pré-remplis avec les données de l'exemple.
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
              <Input id="baseSalary" type="number" value={formState.baseSalary} onChange={handleInputChange} className="col-span-3" required />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payFrequency" className="text-right">Fréquence</Label>
              <Select value={formState.payFrequency} onValueChange={(v: 'Mensuel' | 'Bi-hebdomadaire') => handleSelectChange('payFrequency', v)} required>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensuel">Mensuel</SelectItem>
                  <SelectItem value="Bi-hebdomadaire">Bi-hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nextPayDate" className="text-right">Prochaine Paie</Label>
              <Input id="nextPayDate" type="date" value={formState.nextPayDate} onChange={handleInputChange} className="col-span-3" required />
            </div>
            
            <hr className="my-4 col-span-4"/>
            <h4 className="col-span-4 font-semibold text-center">Informations du Bulletin</h4>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cnpsEmployeur" className="text-right">CNPS Employeur</Label>
              <Input id="cnpsEmployeur" value={formState.cnpsEmployeur} onChange={handleInputChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cnpsEmploye" className="text-right">CNPS Employé</Label>
              <Input id="cnpsEmploye" value={formState.cnpsEmploye} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="situationMatrimoniale" className="text-right">Sit. Matrimoniale</Label>
              <Input id="situationMatrimoniale" value={formState.situationMatrimoniale} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banque" className="text-right">Banque</Label>
              <Input id="banque" value={formState.banque} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numeroCompte" className="text-right">N° Compte</Label>
              <Input id="numeroCompte" value={formState.numeroCompte} onChange={handleInputChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service" className="text-right">Service</Label>
              <Input id="service" value={formState.service} onChange={handleInputChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="anciennete" className="text-right">Ancienneté</Label>
              <Input id="anciennete" value={formState.anciennete} onChange={handleInputChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categorie" className="text-right">Catégorie</Label>
              <Input id="categorie" value={formState.categorie} onChange={handleInputChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="enfants" className="text-right">Enfants</Label>
              <Input id="enfants" type="number" value={formState.enfants} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parts" className="text-right">Parts</Label>
              <Input id="parts" type="number" step="0.5" value={formState.parts} onChange={handleInputChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateEmbauche" className="text-right">Date d'embauche</Label>
              <Input id="dateEmbauche" type="date" value={formState.dateEmbauche} onChange={handleInputChange} className="col-span-3" />
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
