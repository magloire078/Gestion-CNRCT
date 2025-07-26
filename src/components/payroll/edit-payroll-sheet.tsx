
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Employee } from "@/lib/data";

interface EditPayrollSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdatePayroll: (employeeId: string, payroll: Partial<Employee>) => Promise<void>;
  employee: Employee;
}

export function EditPayrollSheet({ isOpen, onClose, onUpdatePayroll, employee }: EditPayrollSheetProps) {
  const [formState, setFormState] = useState<Partial<Employee>>(employee);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormState({
        ...employee,
        payFrequency: employee.payFrequency || 'Mensuel',
        baseSalary: employee.baseSalary || 0,
        nextPayDate: employee.nextPayDate || '',
      });
    }
  }, [employee]);

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
      await onUpdatePayroll(employee.id, formState);
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
              Mettez à jour les informations de paie pour {employee.name}.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
             <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Informations Générales</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Employé</Label>
                            <p className="font-medium text-muted-foreground">{employee.name}</p>
                        </div>
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
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Gains & Indemnités</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primeAnciennete">Prime Ancienneté</Label>
                                <Input id="primeAnciennete" type="number" value={formState.primeAnciennete || 0} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="indemniteTransportImposable">Ind. Transport (Imposable)</Label>
                                <Input id="indemniteTransportImposable" type="number" value={formState.indemniteTransportImposable || 0} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="indemniteResponsabilite">Ind. Responsabilité</Label>
                                <Input id="indemniteResponsabilite" type="number" value={formState.indemniteResponsabilite || 0} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="indemniteLogement">Ind. Logement</Label>
                                <Input id="indemniteLogement" type="number" value={formState.indemniteLogement || 0} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="transportNonImposable">Transport (Non Imposable)</Label>
                                <Input id="transportNonImposable" type="number" value={formState.transportNonImposable || 0} onChange={handleInputChange} />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                    <AccordionTrigger>Détails du Bulletin de Paie</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cnpsEmployeur">CNPS Employeur</Label>
                                <Input id="cnpsEmployeur" value={formState.cnpsEmployeur || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnpsEmploye">CNPS Employé</Label>
                                <Input id="cnpsEmploye" value={formState.cnpsEmploye || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="situationMatrimoniale">Sit. Matrimoniale</Label>
                                <Input id="situationMatrimoniale" value={formState.situationMatrimoniale || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="banque">Banque</Label>
                                <Input id="banque" value={formState.banque || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="numeroCompte">N° Compte</Label>
                                <Input id="numeroCompte" value={formState.numeroCompte || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="service">Service</Label>
                                <Input id="service" value={formState.service || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="anciennete">Ancienneté</Label>
                                <Input id="anciennete" value={formState.anciennete || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="categorie">Catégorie</Label>
                                <Input id="categorie" value={formState.categorie || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="enfants">Enfants</Label>
                                <Input id="enfants" type="number" value={formState.enfants || 0} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parts">Parts</Label>
                                <Input id="parts" type="number" step="0.5" value={formState.parts || 0} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateEmbauche">Date d'embauche</Label>
                                <Input id="dateEmbauche" type="date" value={formState.dateEmbauche || ''} onChange={handleInputChange} />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {error && <p className="text-sm text-destructive text-center pt-2">{error}</p>}
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
