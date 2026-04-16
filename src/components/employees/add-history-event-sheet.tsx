
"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
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
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-2xl bg-white/40 backdrop-blur-2xl border-l border-white/20 p-0 shadow-3xl overflow-hidden rounded-l-[3rem]">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-transparent pointer-events-none" />
          
          <SheetHeader className="p-10 pb-6 relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                <History className="h-6 w-6 text-white" />
              </div>
              <SheetTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">
                {isEditMode ? "Édition Événement" : "Nouvel Événement"}
              </SheetTitle>
            </div>
            <SheetDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isEditMode ? "Modification d'une étape de carrière existante" : "Enregistrement d'une mutation ou revalorisation dans le parcours agent"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-hidden relative z-10">
            <ScrollArea className="h-full w-full px-10">
              <div className="grid gap-10 pb-10">
                {/* Main Fields */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <Info className="h-4 w-4 text-slate-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Classification de l'acte</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="eventType" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Type d'acte professionnel</Label>
                      <Select value={eventType} onValueChange={(value: EmployeeEvent['eventType']) => {
                        startTransition(() => {
                          setEventType(value);
                        });
                      }}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 shadow-sm">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-3xl">
                          {eventTypes.map(type => (
                            <SelectItem key={type} value={type} className="font-bold py-3 uppercase text-[9px] tracking-widest">{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="effectiveDate" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Date d'effet</Label>
                      <Input
                        id="effectiveDate"
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="h-12 rounded-xl border-slate-200 bg-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Libellé / Description de l'acte</Label>
                    <Textarea 
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-2xl border-slate-200 bg-white/60 min-h-[100px] p-6 text-sm font-medium focus-visible:ring-blue-500/50 shadow-inner"
                      placeholder="Précisez la nature et le contexte de cet événement (ex: Décision N°...)"
                    />
                  </div>
                </div>

                {/* Salary Simulation Section */}
                {isSalaryEventType && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                      <Wallet className="h-4 w-4 text-blue-500" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Composantes de Rémunération</h3>
                    </div>

                    <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-500/5 items-center justify-between group relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="h-16 w-16" />
                      </div>
                      <div className="space-y-4">
                        <Label htmlFor="netSimulator" className="text-[10px] font-black uppercase tracking-widest text-slate-700">Calculateur de net vers brut</Label>
                        <div className="flex gap-3">
                          <Input 
                            id="netSimulator" 
                            type="number" 
                            placeholder="Salaire Net Requis (ex: 500000)" 
                            value={desiredNetSalary}
                            onChange={(e) => setDesiredNetSalary(e.target.value)}
                            className="h-14 rounded-2xl border-blue-200 bg-white/60 font-black tracking-widest focus-visible:ring-blue-500 shadow-inner"
                          />
                          <Button 
                            type="button" 
                            onClick={handleSimulation}
                            className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[9px] shadow-xl shadow-blue-200 hover:scale-105 transition-all"
                          >
                            <Calculator className="mr-2 h-5 w-5" /> Simuler
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {indemnityFields.map(field => (
                        <div key={field.id} className="space-y-2">
                          <div className="flex items-center justify-between pr-2">
                            <Label htmlFor={field.id} className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                              {field.label}
                            </Label>
                            {field.id === 'baseSalary' && originalBaseSalary !== null && (
                              <Button type="button" variant="link" size="sm" className="h-auto p-0 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800" onClick={handleRevertSalary}>
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
                                "h-12 rounded-xl border-slate-200 bg-white font-black tracking-widest",
                                field.id === 'baseSalary' ? "border-blue-200 text-blue-600 bg-blue-50/20" : ""
                              )}
                            />
                            {field.id === 'baseSalary' && originalBaseSalary !== null && (
                              <div className="absolute -top-1 -right-1 bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black uppercase text-slate-400 line-through tracking-widest border border-slate-200 bg-white shadow-sm">
                                {originalBaseSalary.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {eventType === 'Promotion' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nouvelles Fonctions</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPoste" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Nouvel Intitulé de Poste</Label>
                      <Input id="newPoste" type="text" value={details.newPoste || ''} placeholder="ex: Chef de Service..." onChange={e => handleDetailChange('newPoste', e.target.value)} className="h-14 rounded-2xl border-slate-200 bg-white font-black uppercase text-blue-600 tracking-wider shadow-sm" />
                    </div>
                  </div>
                )}

                {livePreview && (
                  <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent)] opacity-50" />
                    <div className="relative z-10 space-y-8">
                       <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-400" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Impact Financier Estimé</h4>
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Aperçu Live</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Ancienneté d'effet</p>
                          <p className="text-sm font-bold text-white uppercase">{livePreview.anciennete}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Part Patronale/Salariale CNPS</p>
                          <p className="text-sm font-bold text-white tracking-widest">{livePreview.cnps.toLocaleString('fr-FR')} <span className="text-[10px] opacity-40">FCFA</span></p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Salaire Brut Imposable</p>
                          <p className="text-sm font-bold text-blue-400 tracking-widest">{livePreview.brut.toLocaleString('fr-FR')} <span className="text-[10px] opacity-40">FCFA</span></p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Salaire Net à Payer</p>
                          <p className="text-lg font-black text-emerald-400 tracking-widest">{livePreview.net.toLocaleString('fr-FR')} <span className="text-xs opacity-40">FCFA</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600 shadow-lg shadow-rose-200/50">
                    <XCircle className="h-6 w-6" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <SheetFooter className="p-10 bg-white/40 border-t border-white/20 backdrop-blur-md relative z-10">
            <div className="flex gap-4 w-full">
              <SheetClose asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  className="h-14 flex-1 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 hover:text-slate-900 shadow-lg"
                >
                  Annuler
                </Button>
              </SheetClose>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-14 flex-1 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-black shadow-2xl shadow-black/20 group"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="mr-3 h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" /> 
                    {isEditMode ? "Mettre à jour" : "Valider l'acte"}
                  </>
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
