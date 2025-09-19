
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
import { Calculator, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [desiredNetSalary, setDesiredNetSalary] = useState<number | string>('');
  const [originalBaseSalary, setOriginalBaseSalary] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      setFormState({
        ...employee,
        baseSalary: employee.baseSalary || 0,
      });
      setDesiredNetSalary('');
      setOriginalBaseSalary(null);
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

  const seniorityInfo = useMemo(() => {
    return calculateSeniority(formState.dateEmbauche, new Date().toISOString());
  }, [formState.dateEmbauche]);

  const primeAncienneteRate = useMemo(() => {
    if (seniorityInfo.years >= 2) {
      return Math.min(25, seniorityInfo.years);
    }
    return 0;
  }, [seniorityInfo.years]);

  const { brutImposable, netAPayer, cnpsEmploye, cnpsEmployeur, baseCalculCotisations, primeAncienneteValue } = useMemo(() => {
    const baseSalary = formState.baseSalary || 0;
    
    let primeAnciennete = formState.primeAnciennete || 0;
    if (seniorityInfo.years >= 2 && !formState.primeAnciennete) {
        primeAnciennete = baseSalary * (primeAncienneteRate / 100);
    }
    
    const otherIndemnities = [
        formState.indemniteTransportImposable, formState.indemniteSujetion, formState.indemniteCommunication, 
        formState.indemniteRepresentation, formState.indemniteResponsabilite, formState.indemniteLogement
    ].reduce((sum, val) => sum + (val || 0), 0);

    const earnings = baseSalary + primeAnciennete + otherIndemnities;
    
    const transportNonImposable = formState.transportNonImposable || 0;
    const brutTotal = earnings + transportNonImposable;

    const cnpsBase = earnings;
    const cnpsEmployeCalc = formState.CNPS ? cnpsBase * 0.063 : 0;
    const cnpsEmployeurCalc = formState.CNPS ? cnpsBase * 0.138 : 0;
    
    const its = 0;
    const igr = 0;
    const cn = 0;
    const totalDeductions = cnpsEmployeCalc + its + igr + cn;

    const net = earnings + transportNonImposable - totalDeductions;
    
    return { 
        brutImposable: earnings, 
        netAPayer: net,
        cnpsEmploye: cnpsEmployeCalc,
        cnpsEmployeur: cnpsEmployeurCalc,
        baseCalculCotisations: brutTotal,
        primeAncienneteValue: primeAnciennete,
    };
  }, [formState, seniorityInfo.years, primeAncienneteRate]);

  const handleSimulation = () => {
    const netTarget = typeof desiredNetSalary === 'string' ? parseFloat(desiredNetSalary) : desiredNetSalary;
    if (!netTarget || netTarget <= 0) {
        toast({
            variant: "destructive",
            title: "Valeur Invalide",
            description: "Veuillez entrer un salaire net valide pour la simulation."
        });
        return;
    }

    setOriginalBaseSalary(formState.baseSalary || 0);
    
    const otherIndemnities = [
        formState.indemniteTransportImposable, formState.indemniteSujetion, formState.indemniteCommunication,
        formState.indemniteRepresentation, formState.indemniteResponsabilite, formState.indemniteLogement
    ].reduce((sum, val) => sum + (val || 0), 0);
    
    const transportNonImposable = formState.transportNonImposable || 0;
    const cnpsRate = formState.CNPS ? 0.063 : 0;
    
    // Let B = baseSalary. Brut Imposable (BI) = B * (1 + primeRate) + otherIndemnities
    // Net = BI * (1 - cnpsRate) + transportNonImposable
    // Net = (B * (1 + primeRate) + otherIndemnities) * (1 - cnpsRate) + T_NI
    // (Net - T_NI) / (1 - cnpsRate) = B * (1 + primeRate) + otherIndemnities
    // (Net - T_NI) / (1 - cnpsRate) - otherIndemnities = B * (1 + primeRate)
    // B = ((Net - T_NI) / (1 - cnpsRate) - otherIndemnities) / (1 + primeRate)

    const primeRate = primeAncienneteRate / 100;

    let baseSalary = 0;
    if ((1 - cnpsRate) > 0 && (1 + primeRate) > 0) {
         const tempBrut = (netTarget - transportNonImposable) / (1 - cnpsRate);
         baseSalary = (tempBrut - otherIndemnities) / (1 + primeRate);
    }

    if (baseSalary < 0) {
        toast({
            variant: "destructive",
            title: "Calcul Impossible",
            description: "Le salaire net souhaité est trop bas pour couvrir les indemnités. Le salaire de base serait négatif."
        });
        setOriginalBaseSalary(null); // Cancel the simulation state change
        return;
    }

    setFormState(prev => ({...prev, baseSalary: Math.round(baseSalary), primeAnciennete: 0 })); // Reset manual prime to allow recalculation
    toast({
        title: "Simulation Réussie",
        description: `Le salaire de base a été ajusté à ${formatCurrency(Math.round(baseSalary))}.`
    });
  }
  
  const handleRevertSalary = () => {
    if (originalBaseSalary !== null) {
      setFormState(prev => ({ ...prev, baseSalary: originalBaseSalary }));
      setOriginalBaseSalary(null);
      toast({ title: "Annulé", description: "Le salaire de base a été rétabli." });
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " FCFA";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isCnpsRegistered = formState.CNPS === true;

    if (isCnpsRegistered && !formState.baseSalary) {
      setError("Le salaire de base est obligatoire pour les employés déclarés à la CNPS.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      await onUpdatePayroll(employee.id, { ...formState, payFrequency: 'Mensuel' });
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
                        <div className="space-y-2">
                           <Label>Fréquence de Paie</Label>
                           <Input value="Mensuel" readOnly className="bg-muted" />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Gains & Indemnités</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="p-4 border rounded-md bg-muted/50 space-y-2">
                            <Label htmlFor="netSimulator">Simuler à partir du Net</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="netSimulator" 
                                    type="number" 
                                    placeholder="Entrez le net souhaité..." 
                                    value={desiredNetSalary}
                                    onChange={(e) => setDesiredNetSalary(e.target.value)}
                                />
                                <Button type="button" variant="secondary" onClick={handleSimulation}>
                                    <Calculator className="mr-2 h-4 w-4"/>
                                    Calculer
                                </Button>
                            </div>
                        </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="baseSalary">Salaire de Base</Label>
                                    {originalBaseSalary !== null && (
                                        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleRevertSalary}>
                                            <Undo2 className="mr-1 h-3 w-3" /> Rétablir
                                        </Button>
                                    )}
                                </div>
                                <Input id="baseSalary" type="number" value={formState.baseSalary || 0} onChange={handleInputChange} />
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
                                <Label htmlFor="enfants">Enfants</Label>
                                <Input id="enfants" type="number" value={formState.enfants || 0} onChange={handleInputChange} />
                            </div>
                         </div>
                         <div className="pt-4 mt-4 border-t">
                             <h4 className="text-sm font-medium mb-2">Informations Bancaires</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="banque">Banque</Label>
                                    <Input id="banque" value={formState.banque || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="CB">Code Banque</Label>
                                    <Input id="CB" type="text" value={formState.CB || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="CG">Code Guichet</Label>
                                    <Input id="CG" type="text" value={formState.CG || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="numeroCompte">N° Compte</Label>
                                    <Input id="numeroCompte" type="text" value={formState.numeroCompte || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="Cle_RIB">Clé RIB</Label>
                                    <Input id="Cle_RIB" type="text" value={formState.Cle_RIB || ''} onChange={handleInputChange} />
                                </div>
                             </div>
                         </div>
                         <div className="pt-4 mt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="anciennete">Ancienneté</Label>
                                <Input id="anciennete" value={formState.anciennete || ''} onChange={handleInputChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="categorie">Catégorie</Label>
                                <Input id="categorie" value={formState.categorie || ''} onChange={handleInputChange} />
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
