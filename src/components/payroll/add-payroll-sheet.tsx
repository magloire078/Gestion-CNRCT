
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

const initialFormState: Omit<PayrollEntry, 'id' | 'employeeId' | 'employeeName' | 'role'> = {
    payFrequency: 'Mensuel',
    nextPayDate: '',
    baseSalary: 0,
    primeAnciennete: 0,
    indemniteTransportImposable: 0,
    indemniteResponsabilite: 0,
    indemniteLogement: 0,
    transportNonImposable: 0,
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
    emploi: '',
    parts: 2.0,
    dateEmbauche: '2017-08-16',
    paymentLocation: 'Yamoussoukro',
    paymentDate: 'Mercredi 30 Avril 2025'
};


interface AddPayrollSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPayroll: (payroll: Omit<PayrollEntry, "id">) => Promise<void>;
}

export function AddPayrollSheet({ isOpen, onClose, onAddPayroll }: AddPayrollSheetProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [formState, setFormState] = useState(initialFormState);

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
    setFormState(initialFormState);
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

    if (!selectedEmployee || !formState.baseSalary || !formState.nextPayDate) {
      setError("Veuillez sélectionner un employé et remplir le salaire et la prochaine date de paie.");
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
      };

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
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter des Détails de Paie</SheetTitle>
            <SheetDescription>
              Remplissez les informations de paie pour un employé.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
              <Label htmlFor="employee">Employé</Label>
              <Select onValueChange={handleSelectEmployee} required>
                <SelectTrigger>
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

            <hr className="my-2"/>
            <h4 className="font-semibold text-center">Informations Générales</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="baseSalary">Salaire de Base</Label>
                    <Input id="baseSalary" type="number" value={formState.baseSalary} onChange={handleInputChange} required />
                </div>
                 <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="payFrequency">Fréquence</Label>
                    <Select value={formState.payFrequency} onValueChange={(v: 'Mensuel' | 'Bi-hebdomadaire') => handleSelectChange('payFrequency', v)} required>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Mensuel">Mensuel</SelectItem>
                        <SelectItem value="Bi-hebdomadaire">Bi-hebdomadaire</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="nextPayDate">Prochaine Paie</Label>
                    <Input id="nextPayDate" type="date" value={formState.nextPayDate} onChange={handleInputChange} required />
                </div>
            </div>
            
            <hr className="my-2"/>
            <h4 className="font-semibold text-center">Gains & Indemnités</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="primeAnciennete">Prime Ancienneté</Label>
                    <Input id="primeAnciennete" type="number" value={formState.primeAnciennete} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="indemniteTransportImposable">Ind. Transport (Imposable)</Label>
                    <Input id="indemniteTransportImposable" type="number" value={formState.indemniteTransportImposable} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="indemniteResponsabilite">Ind. Responsabilité</Label>
                    <Input id="indemniteResponsabilite" type="number" value={formState.indemniteResponsabilite} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="indemniteLogement">Ind. Logement</Label>
                    <Input id="indemniteLogement" type="number" value={formState.indemniteLogement} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="transportNonImposable">Transport (Non Imposable)</Label>
                    <Input id="transportNonImposable" type="number" value={formState.transportNonImposable} onChange={handleInputChange} />
                </div>
            </div>

            <hr className="my-2"/>
            <h4 className="font-semibold text-center">Informations du Bulletin</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="cnpsEmployeur">CNPS Employeur</Label>
                    <Input id="cnpsEmployeur" value={formState.cnpsEmployeur} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cnpsEmploye">CNPS Employé</Label>
                    <Input id="cnpsEmploye" value={formState.cnpsEmploye} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="situationMatrimoniale">Sit. Matrimoniale</Label>
                    <Input id="situationMatrimoniale" value={formState.situationMatrimoniale} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="banque">Banque</Label>
                    <Input id="banque" value={formState.banque} onChange={handleInputChange} />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="numeroCompte">N° Compte</Label>
                    <Input id="numeroCompte" value={formState.numeroCompte} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="service">Service</Label>
                    <Input id="service" value={formState.service} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="anciennete">Ancienneté</Label>
                    <Input id="anciennete" value={formState.anciennete} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="categorie">Catégorie</Label>
                    <Input id="categorie" value={formState.categorie} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="enfants">Enfants</Label>
                    <Input id="enfants" type="number" value={formState.enfants} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="parts">Parts</Label>
                    <Input id="parts" type="number" step="0.5" value={formState.parts} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="dateEmbauche">Date d'embauche</Label>
                    <Input id="dateEmbauche" type="date" value={formState.dateEmbauche} onChange={handleInputChange} />
                </div>
            </div>

            {error && <p className="text-sm text-destructive text-center pt-2">{error}</p>}
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
