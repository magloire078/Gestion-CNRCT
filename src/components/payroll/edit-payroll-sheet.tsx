
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

interface EditPayrollSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdatePayroll: (entryId: string, payroll: Omit<PayrollEntry, "id">) => Promise<void>;
  payrollEntry: PayrollEntry;
}

export function EditPayrollSheet({ isOpen, onClose, onUpdatePayroll, payrollEntry }: EditPayrollSheetProps) {
  const [formState, setFormState] = useState(payrollEntry);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (payrollEntry) {
      setFormState(payrollEntry);
    }
  }, [payrollEntry]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value, type } = e.target;
      setFormState(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (id: string, value: string) => {
      setFormState(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.baseSalary || !formState.nextPayDate) {
      setError("Le salaire et la prochaine date de paie sont obligatoires.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      // We don't want to pass the id field in the data to be updated
      const { id, ...dataToUpdate } = formState;
      await onUpdatePayroll(id, dataToUpdate);
      onClose();
    } catch(err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour de l'entrée de paie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Modifier les Détails de Paie</SheetTitle>
            <SheetDescription>
              Mettez à jour les informations de paie pour {payrollEntry.employeeName}.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Employé</Label>
              <p className="col-span-3 font-medium">{payrollEntry.employeeName}</p>
            </div>

            <hr className="my-2 col-span-4"/>
            <h4 className="col-span-4 font-semibold text-center">Informations Générales</h4>
            
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
            
            <hr className="my-2 col-span-4"/>
            <h4 className="col-span-4 font-semibold text-center">Gains & Indemnités</h4>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="primeAnciennete" className="text-right">Prime Ancienneté</Label>
              <Input id="primeAnciennete" type="number" value={formState.primeAnciennete} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="indemniteTransportImposable" className="text-right">Ind. Transport (Imposable)</Label>
              <Input id="indemniteTransportImposable" type="number" value={formState.indemniteTransportImposable} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="indemniteResponsabilite" className="text-right">Ind. Responsabilité</Label>
              <Input id="indemniteResponsabilite" type="number" value={formState.indemniteResponsabilite} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="indemniteLogement" className="text-right">Ind. Logement</Label>
              <Input id="indemniteLogement" type="number" value={formState.indemniteLogement} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transportNonImposable" className="text-right">Transport (Non Imposable)</Label>
              <Input id="transportNonImposable" type="number" value={formState.transportNonImposable} onChange={handleInputChange} className="col-span-3" />
            </div>

            <hr className="my-2 col-span-4"/>
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
              {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
