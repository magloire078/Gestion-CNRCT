

"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Calculator, Undo2, User, Coins, FileText, Landmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateSeniority } from "@/services/payslip-details-service";


interface EditPayrollSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdatePayroll: (employeeId: string, payroll: Partial<Employe>) => Promise<void>;
  employee: Employe;
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

    const otherIndemnities = ([
      formState.indemniteTransportImposable, formState.indemniteSujetion, formState.indemniteCommunication,
      formState.indemniteRepresentation, formState.indemniteResponsabilite, formState.indemniteLogement
    ] as (number | undefined)[]).reduce((sum: number, val) => sum + (val || 0), 0);

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

    const otherIndemnities = ([
      formState.indemniteTransportImposable, formState.indemniteSujetion, formState.indemniteCommunication,
      formState.indemniteRepresentation, formState.indemniteResponsabilite, formState.indemniteLogement
    ] as (number | undefined)[]).reduce((sum: number, val) => sum + (val || 0), 0);

    const transportNonImposable = formState.transportNonImposable || 0;
    const cnpsRate = formState.CNPS ? 0.063 : 0;

    const primeRate = primeAncienneteRate / 100;

    let baseSalary = 0;
    const denominator = (1 + primeRate) * (1 - cnpsRate);
    if (denominator > 0) {
      const numerator = (netTarget - transportNonImposable) - ((otherIndemnities ?? 0) * (1 - cnpsRate));
      baseSalary = numerator / denominator;
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

    setFormState(prev => ({ ...prev, baseSalary: Math.round(baseSalary), primeAnciennete: 0 }));
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour de l'entrée de paie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-slate-50/50 border-slate-200 shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="px-6 py-5 bg-white border-b border-slate-100 shrink-0">
            <DialogTitle className="text-xl font-semibold text-slate-800">Modifier les Détails de Paie</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1.5">
              Mettez à jour les informations de paie pour <span className="font-medium text-slate-700">{`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-slate-200">
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-4">
              <AccordionItem value="item-1" className="border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden">
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50 transition-colors">
                  <div className="flex items-center text-base font-semibold">
                    <User className="h-5 w-5 mr-3 text-primary" />
                    Informations Générales
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-500">Employé</Label>
                      <p className="font-semibold text-lg">{`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-500">Fréquence de Paie</Label>
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Mensuel
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden">
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50 transition-colors">
                  <div className="flex items-center text-base font-semibold">
                    <Coins className="h-5 w-5 mr-3 text-green-600" />
                    Gains & Indemnités
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-5 pt-4 px-4 pb-4">
                  <div className="p-5 border border-indigo-100 rounded-xl bg-indigo-50/50 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Calculator className="h-4 w-4 text-indigo-600" />
                      <Label htmlFor="netSimulator" className="font-semibold text-indigo-900">Simuler à partir du Net</Label>
                    </div>
                    <div className="flex gap-3">
                      <Input
                        id="netSimulator"
                        type="number"
                        className="bg-white border-indigo-200 focus-visible:ring-indigo-500"
                        placeholder="Entrez le net souhaité..."
                        value={desiredNetSalary}
                        onChange={(e) => setDesiredNetSalary(e.target.value)}
                      />
                      <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={handleSimulation}>
                        Calculer
                      </Button>
                    </div>
                    <p className="text-xs text-indigo-600/80">Cette calculatrice ajustera automatiquement le Salaire de Base pour atteindre ce Net.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="baseSalary">Salaire de Base</Label>
                        {originalBaseSalary !== null && (
                          <Button type="button" variant="link" size="sm" className="h-auto p-0 pl-2 text-xs" onClick={handleRevertSalary}>
                            <Undo2 className="mr-1 h-3 w-3" /> Rétablir
                          </Button>
                        )}
                      </div>
                      <Input id="baseSalary" type="number" value={formState.baseSalary || 0} onChange={handleInputChange} />
                      {originalBaseSalary !== null && (
                        <p className="text-xs text-muted-foreground line-through">{formatCurrency(originalBaseSalary)}</p>
                      )}
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
              <AccordionItem value="item-4" className="border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden">
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50 transition-colors">
                  <div className="flex items-center text-base font-semibold">
                    <Landmark className="h-5 w-5 mr-3 text-orange-500" />
                    Cotisations & Totaux (Estimations)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-5 pt-4 px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">CNPS Employé</Label>
                      <p className="font-mono text-sm font-medium">{formatCurrency(cnpsEmploye)}</p>
                    </div>
                    <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">CNPS Employeur</Label>
                      <p className="font-mono text-sm font-medium">{formatCurrency(cnpsEmployeur)}</p>
                    </div>
                    <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Base de calcul</Label>
                      <p className="font-mono text-sm font-medium">{formatCurrency(baseCalculCotisations)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <Label className="text-blue-600 text-sm font-semibold uppercase tracking-wider">Salaire Brut Imposable</Label>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(brutImposable)}</p>
                    </div>
                    <div className="space-y-2 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl shadow-sm">
                      <Label className="text-emerald-600 text-sm font-semibold uppercase tracking-wider">Net à Payer</Label>
                      <p className="text-3xl font-black text-emerald-700 tracking-tight">{formatCurrency(netAPayer)}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden">
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50 transition-colors">
                  <div className="flex items-center text-base font-semibold">
                    <FileText className="h-5 w-5 mr-3 text-purple-500" />
                    Détails du Bulletin de Paie
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-5 pt-4 px-4 pb-4">
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
                      <Input id="anciennete" value={seniorityInfo.text} readOnly className="font-mono bg-muted" />
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
          <DialogFooter className="px-6 py-4 bg-white border-t border-slate-100 shrink-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="px-6 border-slate-200">Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting} className="px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
              {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
