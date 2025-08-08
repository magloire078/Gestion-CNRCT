
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { Employe } from "@/lib/data";
import { differenceInYears, differenceInMonths, differenceInDays, addYears, addMonths, parseISO, isValid } from 'date-fns';

interface EditPayrollSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdatePayroll: (employeeId: string, payroll: Partial<Employe>) => Promise<void>;
  employee: Employe;
}

function calculateSeniority(hireDateStr: string | undefined, payslipDateStr: string): { text: string, years: number } {
    if (!hireDateStr || !payslipDateStr) return { text: 'N/A', years: 0 };
    
    const hireDate = parseISO(hireDateStr);
    const payslipDate = parseISO(payslipDateStr);

    if (!isValid(hireDate) || !isValid(payslipDate)) return { text: 'Dates invalides', years: 0 };

    const years = differenceInYears(payslipDate, hireDate);
    const dateAfterYears = addYears(hireDate, years);
    
    const months = differenceInMonths(payslipDate, dateAfterYears);
    const dateAfterMonths = addMonths(dateAfterYears, months);

    const days = differenceInDays(payslipDate, dateAfterMonths);

    return {
        text: `${years} an(s), ${months} mois, ${days} jour(s)`,
        years: years
    };
}


export function EditPayrollSheet({ isOpen, onClose, onUpdatePayroll, employee }: EditPayrollSheetProps) {
  const [formState, setFormState] = useState<Partial<Employe>>(employee);
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

  const handleCheckboxChange = (id: string, checked: boolean) => {
      setFormState(prev => ({ ...prev, [id]: checked }));
  }

  const handleSelectChange = (id: string, value: string) => {
      setFormState(prev => ({ ...prev, [id]: value }));
  };

  const { brutImposable, netAPayer, primeAncienneteRate, primeAncienneteValue, cnpsEmploye, cnpsEmployeur, baseCalculCotisations } = useMemo(() => {
    const baseSalary = formState.baseSalary || 0;
    const seniorityInfo = calculateSeniority(formState.dateEmbauche, new Date().toISOString());

    let primeAnciennete = formState.primeAnciennete || 0;
    let primeAncienneteRate = 0;
    if (seniorityInfo.years >= 2 && !formState.primeAnciennete) { // Check if not manually overridden
        primeAncienneteRate = Math.min(25, (seniorityInfo.years));
        primeAnciennete = baseSalary * (primeAncienneteRate / 100);
    }

    const earnings = [
        baseSalary, primeAnciennete, formState.indemniteTransportImposable,
        formState.indemniteSujetion, formState.indemniteCommunication, formState.indemniteRepresentation,
        formState.indemniteResponsabilite, formState.indemniteLogement
    ].reduce((sum, val) => sum + (val || 0), 0);
    
    const transportNonImposable = formState.transportNonImposable || 0;
    const brutTotal = earnings + transportNonImposable;

    const cnpsBase = earnings;
    const cnpsEmploye = formState.CNPS ? cnpsBase * 0.063 : 0;
    const cnpsEmployeur = formState.CNPS ? cnpsBase * 0.138 : 0; // Prestation familiale (5.75) + Accident Travail (3) + Retraite (5.05)
    
    // Taxes are now zero as per request
    const its = 0;
    const igr = 0;
    const cn = 0;
    const totalDeductions = cnpsEmploye + its + igr + cn;

    const net = earnings + transportNonImposable - totalDeductions;
    
    return { 
        brutImposable: earnings, 
        netAPayer: net,
        primeAncienneteRate,
        primeAncienneteValue: primeAnciennete,
        cnpsEmploye,
        cnpsEmployeur,
        baseCalculCotisations: brutTotal
    };
  }, [formState]);
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " XOF";
  }

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
              Mettez à jour les informations de paie pour {`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
             <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Informations Générales</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Employé</Label>
                            <p className="font-medium text-muted-foreground">{`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="payFrequency">Fréquence de Paie</Label>
                                <Select value={formState.payFrequency} onValueChange={(v) => handleSelectChange('payFrequency', v)} required>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="Mensuel">Mensuel</SelectItem>
                                    <SelectItem value="Bi-hebdomadaire">Bi-hebdomadaire</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nextPayDate">Prochaine Date de Paie</Label>
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
                                <Label htmlFor="baseSalary">Salaire de Base</Label>
                                <Input id="baseSalary" type="number" value={formState.baseSalary || 0} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primeAnciennete">Prime Ancienneté</Label>
                                <Input id="primeAnciennete" type="number" value={formState.primeAnciennete || 0} onChange={handleInputChange} />
                                {primeAncienneteRate > 0 && <p className="text-xs text-muted-foreground">Auto-calculée: {formatCurrency(primeAncienneteValue)} ({primeAncienneteRate}%)</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="indemniteTransportImposable">Ind. Transport (Imposable)</Label>
                                <Input id="indemniteTransportImposable" type="number" value={formState.indemniteTransportImposable || 0} onChange={handleInputChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="indemniteSujetion">Ind. Sujétion</Label>
                                <Input id="indemniteSujetion" type="number" value={formState.indemniteSujetion || 0} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="indemniteCommunication">Ind. Communication</Label>
                                <Input id="indemniteCommunication" type="number" value={formState.indemniteCommunication || 0} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="indemniteRepresentation">Ind. Représentation</Label>
                                <Input id="indemniteRepresentation" type="number" value={formState.indemniteRepresentation || 0} onChange={handleInputChange} />
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
                <AccordionItem value="item-4">
                     <AccordionTrigger>Cotisations & Totaux (Estimations)</AccordionTrigger>
                     <AccordionContent className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>CNPS Employé</Label>
                                <Input value={formatCurrency(cnpsEmploye)} readOnly className="font-mono bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>CNPS Employeur</Label>
                                <Input value={formatCurrency(cnpsEmployeur)} readOnly className="font-mono bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Base de calcul</Label>
                                <Input value={formatCurrency(baseCalculCotisations)} readOnly className="font-mono bg-muted" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                                <Label>Salaire Brut Imposable</Label>
                                <Input value={formatCurrency(brutImposable)} readOnly className="font-bold bg-muted" />
                            </div>
                             <div className="space-y-2">
                                <Label>Net à Payer</Label>
                                <Input value={formatCurrency(netAPayer)} readOnly className="font-bold bg-muted" />
                            </div>
                        </div>
                     </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                    <AccordionTrigger>Détails du Bulletin de Paie</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="flex items-center space-x-2 md:col-span-2">
                                <Checkbox 
                                    id="CNPS" 
                                    checked={formState.CNPS || false} 
                                    onCheckedChange={(checked) => handleCheckboxChange('CNPS', Boolean(checked))}
                                />
                                <Label htmlFor="CNPS">Enregistré à la CNPS</Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnpsEmployeur">CNPS Employeur</Label>
                                <Input id="cnpsEmployeur" value={formState.cnpsEmployeur || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnpsEmploye">CNPS Employé</Label>
                                <Input id="cnpsEmploye" value={formState.cnpsEmploye || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="situationMatrimoniale">Sit. Maritale</Label>
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
                                <Label htmlFor="department">Service</Label>
                                <Input id="department" value={formState.department || ''} onChange={handleInputChange} />
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
