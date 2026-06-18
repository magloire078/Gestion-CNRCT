
"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeEvent, Employe } from "@/lib/data";
import { addEmployeeHistoryEvent, updateEmployeeHistoryEvent } from "@/services/employee-history-service";
import { getEmployee } from "@/services/employee-service";
import { calculateSeniority } from "@/services/payslip-details-service";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { differenceInYears, parseISO, isValid, isBefore, isEqual } from "date-fns";
import { Calculator, Undo2, History, Info, TrendingUp, Wallet, Clock, Activity, Save, XCircle, Briefcase, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddHistoryEventSheetProps {
  isOpen: boolean;
  onCloseAction: () => void;
  employeeId: string;
  eventToEdit?: EmployeeEvent | null;
  onEventSavedAction: (savedEvent: EmployeeEvent) => void;
}

const eventTypes: EmployeeEvent['eventType'][] = ['Promotion', 'Augmentation au Mérite', 'Ajustement de Marché', 'Revalorisation Salariale', 'Changement de poste', 'Départ', 'Autre'];
const salaryEventTypes: EmployeeEvent['eventType'][] = ['Augmentation au Mérite', 'Promotion', 'Ajustement de Marché', 'Revalorisation Salariale', 'Changement de poste', 'Autre'];

const indemnityFields = [
    { id: 'baseSalary', label: 'Salaire de Base' },
    { id: 'indemniteTransportImposable', label: 'Ind. Transport (Imposable)' },
    { id: 'indemniteSujetion', label: 'Ind. Sujétion' },
    { id: 'indemniteCommunication', label: 'Ind. Communication' },
    { id: 'indemniteRepresentation', label: 'Ind. Représentation' },
    { id: 'indemniteResponsabilite', label: 'Ind. Responsabilité' },
    { id: 'indemniteLogement', label: 'Ind. Logement' },
    { id: 'transportNonImposable', label: 'Transport (Non Imposable)' },
];

function calculatePreview(details: Record<string, any>, employee: Employe | null, effectiveDate: string) {
    if (!employee) return { brut: 0, net: 0, cnps: 0, anciennete: 'N/A' };

    const baseSalary = Number(details.baseSalary || 0);

    const seniorityInfo = calculateSeniority(employee.dateEmbauche, effectiveDate);
    const yearsOfService = seniorityInfo.years;
    
    let primeAnciennete = 0;
    if (yearsOfService >= 2) {
        const bonusRate = Math.min(25, yearsOfService);
        primeAnciennete = baseSalary * (bonusRate / 100);
    }
    
    const otherIndemnities = [
        'indemniteTransportImposable', 'indemniteSujetion', 'indemniteCommunication',
        'indemniteRepresentation', 'indemniteResponsabilite', 'indemniteLogement'
    ].reduce((sum, key) => sum + Number(details[key] || 0), 0);

    const brutImposable = baseSalary + primeAnciennete + otherIndemnities;
    const transportNonImposable = Number(details.transportNonImposable || 0);
    const cnps = employee.CNPS ? brutImposable * 0.063 : 0;
    const net = brutImposable + transportNonImposable - cnps;
    
    return {
        brut: Math.round(brutImposable),
        net: Math.round(net),
        cnps: Math.round(cnps),
        anciennete: seniorityInfo.text,
    };
}


export function AddHistoryEventSheet({ isOpen, onCloseAction, employeeId, eventToEdit, onEventSavedAction }: AddHistoryEventSheetProps) {
  const [eventType, setEventType] = useState<EmployeeEvent['eventType'] | "">("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employee, setEmployee] = useState<Employe | null>(null);
  const { toast } = useToast();

  const [desiredNetSalary, setDesiredNetSalary] = useState<number | string>('');
  const [originalBaseSalary, setOriginalBaseSalary] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();

  const isEditMode = !!eventToEdit;
  const isSalaryEventType = eventType ? salaryEventTypes.includes(eventType as any) : false;


  useEffect(() => {
    async function loadInitialData() {
        if (isOpen) {
          try {
            const emp = await getEmployee(employeeId);
            setEmployee(emp);

            if (eventToEdit) {
              setEventType(eventToEdit.eventType);
              setEffectiveDate(eventToEdit.effectiveDate);
              setDescription(eventToEdit.description);
              setDetails(eventToEdit.details || {});
            } else {
              // Reset form for adding new event
              setEventType("");
              setEffectiveDate(new Date().toISOString().split('T')[0]);
              setDescription("");
              setDetails(emp || {}); // Pre-fill with current employee data
              setError("");
              setDesiredNetSalary('');
              setOriginalBaseSalary(null);
            }
          } catch(err) {
            setError("Impossible de charger les données de l'employé.");
            console.error(err);
          }
        }
    }
    loadInitialData();
  }, [isOpen, eventToEdit, employeeId]);
  
   const livePreview = useMemo(() => {
        if (isSalaryEventType) {
            return calculatePreview(details, employee, effectiveDate);
        }
        return null;
    }, [details, employee, effectiveDate, eventType, isSalaryEventType]);


  const handleClose = () => {
    onCloseAction();
  };
  
  const handleDetailChange = (key: string, value: string | number) => {
      setDetails(prev => ({...prev, [key]: value}));
  }

  const handleSimulation = () => {
    const netTarget = typeof desiredNetSalary === 'string' ? parseFloat(desiredNetSalary) : desiredNetSalary;
    if (!netTarget || netTarget <= 0 || !employee) {
        toast({ variant: "destructive", title: "Valeur Invalide", description: "Veuillez entrer un salaire net valide." });
        return;
    }
    
    setOriginalBaseSalary(details.baseSalary || 0);

    const years = calculateSeniority(employee.dateEmbauche, effectiveDate).years;
    const primeRate = years >= 2 ? Math.min(25, years) / 100 : 0;
    const cnpsRate = employee.CNPS ? 0.063 : 0;

    const otherIndemnities = indemnityFields
      .filter(f => f.id !== 'baseSalary' && f.id !== 'transportNonImposable')
      .reduce((sum, key) => sum + Number(details[key.id] || 0), 0);
      
    const transportNonImposable = Number(details.transportNonImposable || 0);

    let baseSalary = 0;
    const denominator = (1 + primeRate) * (1 - cnpsRate);

    if (denominator > 0) {
        const numerator = (netTarget - transportNonImposable) - (otherIndemnities * (1-cnpsRate));
        baseSalary = numerator / denominator;
    }

    if (baseSalary < 0) {
        toast({ variant: "destructive", title: "Calcul Impossible", description: "Le salaire net souhaité est trop bas." });
        setOriginalBaseSalary(null);
        return;
    }
    
    setDetails(prev => ({...prev, baseSalary: Math.round(baseSalary) }));
    toast({ title: "Simulation Réussie", description: `Salaire de base ajusté à ${Math.round(baseSalary).toLocaleString('fr-FR')} FCFA.` });
  };
  
  const handleRevertSalary = () => {
    if (originalBaseSalary !== null) {
      setDetails(prev => ({ ...prev, baseSalary: originalBaseSalary }));
      setOriginalBaseSalary(null);
      setDesiredNetSalary('');
      toast({ title: "Annulé", description: "Le salaire de base a été rétabli." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventType || !effectiveDate || !description) {
      setError("Le type d'événement, la date et la description sont obligatoires.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
        const dataToSave: Partial<EmployeeEvent> = { eventType, effectiveDate, description, details };
        if (isEditMode && eventToEdit) {
            const updatedEvent = await updateEmployeeHistoryEvent(employeeId, eventToEdit.id, dataToSave);
            onEventSavedAction(updatedEvent);
            toast({ title: "Événement mis à jour", description: "L'historique a été modifié avec succès." });
        } else {
            const newEvent = await addEmployeeHistoryEvent(employeeId, dataToSave as Omit<EmployeeEvent, 'id' | 'employeeId'>);
            onEventSavedAction(newEvent);
            toast({ title: "Événement ajouté", description: "L'historique et la paie de l'employé ont été mis à jour." });
        }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement de l'événement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl bg-slate-50/50 p-0 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit} className="h-full flex flex-col overflow-hidden">
          <DialogHeader className="px-6 py-5 bg-white border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <History className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-800 text-left">
                  {isEditMode ? "Édition Événement" : "Nouvel Événement"}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1 text-left">
                  {isEditMode ? "Modification d'une étape de carrière existante" : "Enregistrement d'une mutation ou revalorisation dans le parcours agent"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="grid gap-6">
                {/* Main Fields */}
                <div className="space-y-5 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    <h3 className="text-base font-semibold text-slate-800">Classification de l'acte</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="eventType" className="text-slate-700 font-medium">Type d'acte professionnel</Label>
                      <Select value={eventType} onValueChange={(value: EmployeeEvent['eventType']) => {
                        startTransition(() => {
                          setEventType(value);
                        });
                      }}>
                        <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white focus-visible:ring-blue-500/50">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {eventTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="effectiveDate" className="text-slate-700 font-medium">Date d'effet</Label>
                      <Input
                        id="effectiveDate"
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="h-11 rounded-lg border-slate-200 bg-white focus-visible:ring-blue-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-700 font-medium">Libellé / Description de l'acte</Label>
                    <Textarea 
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-xl border-slate-200 bg-white min-h-[80px] p-4 text-sm focus-visible:ring-blue-500/50"
                      placeholder="Précisez la nature et le contexte de cet événement (ex: Décision N°...)"
                    />
                  </div>
                </div>

                {/* Salary Simulation Section */}
                {isSalaryEventType && (
                  <div className="space-y-5 bg-white p-6 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-5 w-5 text-indigo-500" />
                      <h3 className="text-base font-semibold text-slate-800">Composantes de Rémunération</h3>
                    </div>
                    
                    <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden group">
                      <div className="space-y-3">
                        <Label htmlFor="netSimulator" className="text-sm font-semibold text-slate-800">Calculateur de net vers brut</Label>
                        <div className="flex gap-3">
                          <Input 
                            id="netSimulator" 
                            type="number" 
                            placeholder="Salaire Net Requis (ex: 500000)" 
                            value={desiredNetSalary}
                            onChange={(e) => setDesiredNetSalary(e.target.value)}
                            className="h-11 rounded-lg border-blue-200 bg-white focus-visible:ring-blue-500"
                          />
                          <Button 
                            type="button" 
                            onClick={handleSimulation}
                            className="h-11 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all"
                          >
                            <Calculator className="mr-2 h-4 w-4" /> Simuler
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      {indemnityFields.map(field => (
                        <div key={field.id} className="space-y-2">
                          <div className="flex items-center justify-between pr-2">
                            <Label htmlFor={field.id} className="text-slate-700 font-medium">
                              {field.label}
                            </Label>
                            {field.id === 'baseSalary' && originalBaseSalary !== null && (
                              <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs font-semibold text-blue-600 hover:text-blue-800" onClick={handleRevertSalary}>
                                <Undo2 className="mr-1 h-3 w-3" /> Rétablir
                              </Button>
                            )}
                          </div>
                          <div className="relative">
                            <Input 
                              id={field.id} 
                              type="number" 
                              value={details[field.id] || ''} 
                              placeholder="0" 
                              onChange={e => handleDetailChange(field.id, e.target.value)} 
                              className={cn(
                                "h-11 rounded-lg border-slate-200 bg-white focus-visible:ring-blue-500/50",
                                field.id === 'baseSalary' ? "border-blue-200 font-semibold text-blue-700 bg-blue-50" : ""
                              )}
                            />
                            {field.id === 'baseSalary' && originalBaseSalary !== null && (
                              <div className="absolute -top-3 -right-2 bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold text-slate-500 line-through border border-slate-200 shadow-sm">
                                {originalBaseSalary.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(eventType === 'Promotion' || eventType === 'Changement de poste') && (
                  <div className="space-y-5 bg-white p-6 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-5 w-5 text-emerald-500" />
                      <h3 className="text-base font-semibold text-slate-800">Nouvelles Fonctions</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPoste" className="text-slate-700 font-medium">Nouvel Intitulé de Poste</Label>
                      <Input id="newPoste" type="text" value={details.newPoste || ''} placeholder="ex: Chef de Service..." onChange={e => handleDetailChange('newPoste', e.target.value)} className="h-11 rounded-lg border-slate-200 bg-white font-medium" />
                    </div>
                  </div>
                )}

                {livePreview && (
                  <div className="p-6 bg-slate-900 rounded-xl shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-50" />
                    <div className="relative z-10 space-y-5">
                       <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-400" />
                          <h4 className="text-sm font-semibold text-slate-300">Impact Financier Estimé</h4>
                        </div>
                        <div className="text-xs font-semibold px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">Aperçu Live</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400">Ancienneté d'effet</p>
                          <p className="text-base font-semibold text-white">{livePreview.anciennete}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400">Part CNPS</p>
                          <p className="text-base font-semibold text-white">{livePreview.cnps.toLocaleString('fr-FR')} <span className="text-xs text-slate-500">FCFA</span></p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400">Brut Imposable</p>
                          <p className="text-base font-semibold text-blue-300">{livePreview.brut.toLocaleString('fr-FR')} <span className="text-xs text-blue-300/50">FCFA</span></p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400">Net à Payer</p>
                          <p className="text-xl font-bold text-emerald-400">{livePreview.net.toLocaleString('fr-FR')} <span className="text-sm text-emerald-400/50">FCFA</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 shadow-sm">
                    <XCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-white border-t border-slate-100 shrink-0">
            <div className="flex gap-3 w-full justify-end">
              <DialogClose asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  className="h-10 px-6 border-slate-200 text-slate-700 font-medium"
                >
                  Annuler
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> 
                    {isEditMode ? "Mettre à jour" : "Valider l'acte"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
