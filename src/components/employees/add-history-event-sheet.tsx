

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
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeEvent, Employe } from "@/lib/data";
import { addEmployeeHistoryEvent, updateEmployeeHistoryEvent } from "@/services/employee-history-service";
import { getEmployee } from "@/services/employee-service";
import { calculateSeniority } from "@/services/payslip-details-service";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { differenceInYears, parseISO, isValid } from "date-fns";
import { Calculator, Undo2 } from "lucide-react";

interface AddHistoryEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  eventToEdit?: EmployeeEvent | null;
  onEventSaved: (savedEvent: EmployeeEvent) => void;
}

const eventTypes: EmployeeEvent['eventType'][] = ['Promotion', 'Augmentation au Mérite', 'Ajustement de Marché', 'Revalorisation Salariale', 'Changement de poste', 'Départ', 'Autre'];
const salaryEventTypes: EmployeeEvent['eventType'][] = ['Augmentation au Mérite', 'Promotion', 'Ajustement de Marché', 'Revalorisation Salariale'];

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


export function AddHistoryEventSheet({ isOpen, onClose, employeeId, eventToEdit, onEventSaved }: AddHistoryEventDialogProps) {
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
    onClose();
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
            onEventSaved(updatedEvent);
            toast({ title: "Événement mis à jour", description: "L'historique a été modifié avec succès." });
        } else {
            const newEvent = await addEmployeeHistoryEvent(employeeId, dataToSave as Omit<EmployeeEvent, 'id' | 'employeeId'>);
            onEventSaved(newEvent);
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
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Modifier un événement" : "Ajouter un événement de carrière"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Modifiez les détails de cet événement." : "Enregistrez un nouvel événement dans l'historique professionnel de l'employé."}
            </DialogDescription>
          </DialogHeader>
           <ScrollArea className="h-[60vh] p-1 -mx-1">
             <div className="grid gap-4 py-4 px-1">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="eventType" className="text-right">Type</Label>
                  <Select value={eventType} onValueChange={(value: EmployeeEvent['eventType']) => setEventType(value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionnez un type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="effectiveDate" className="text-right">Date d'effet</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">Description</Label>
                    <Textarea 
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="col-span-3"
                        rows={3}
                        placeholder="Description de l'événement..."
                    />
                </div>
                
                {isSalaryEventType && (
                    <div className="col-span-4 space-y-4 pt-4 border-t">
                        <p className="text-sm font-medium text-center">Détails de l'Augmentation (nouvelles valeurs)</p>
                        
                         <div className="p-4 border rounded-md bg-muted/50 space-y-2">
                            <Label htmlFor="netSimulator">Simuler le Salaire de Base à partir du Net</Label>
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

                        {indemnityFields.map(field => (
                            <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={field.id} className="text-right text-xs">
                                     {field.label}
                                     {field.id === 'baseSalary' && originalBaseSalary !== null && (
                                         <Button type="button" variant="link" size="sm" className="h-auto p-0 pl-2 text-xs" onClick={handleRevertSalary}>
                                            <Undo2 className="mr-1 h-3 w-3" /> Rétablir
                                        </Button>
                                     )}
                                </Label>
                                <Input id={field.id} type="number" value={details[field.id] || ''} placeholder="0" onChange={e => handleDetailChange(field.id, e.target.value)} className="col-span-3" />
                                {field.id === 'baseSalary' && originalBaseSalary !== null && (
                                     <p className="col-start-2 col-span-3 text-xs text-muted-foreground line-through">{originalBaseSalary.toLocaleString('fr-FR')} FCFA</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {eventType === 'Promotion' && (
                    <div className="grid grid-cols-4 items-center gap-4 pt-4 border-t">
                        <Label htmlFor="newPoste" className="text-right">Nouveau Poste</Label>
                        <Input id="newPoste" type="text" value={details.newPoste || ''} placeholder="ex: Développeur Senior" onChange={e => handleDetailChange('newPoste', e.target.value)} className="col-span-3" />
                    </div>
                )}

                 {livePreview && (
                    <div className="col-span-4 space-y-4 pt-4 mt-4 border-t">
                        <p className="text-sm font-medium text-center flex items-center justify-center gap-2">
                           <Calculator className="h-4 w-4 text-muted-foreground"/> Aperçu en temps réel
                        </p>
                         <div className="grid grid-cols-2 gap-4">
                            <div><Label>Ancienneté</Label><Input value={livePreview.anciennete} readOnly className="font-mono bg-muted" /></div>
                            <div><Label>Cotisation CNPS</Label><Input value={`${livePreview.cnps.toLocaleString('fr-FR')} FCFA`} readOnly className="font-mono bg-muted" /></div>
                            <div><Label>Salaire Brut (Est.)</Label><Input value={`${livePreview.brut.toLocaleString('fr-FR')} FCFA`} readOnly className="font-mono bg-muted" /></div>
                            <div><Label>Salaire Net (Est.)</Label><Input value={`${livePreview.net.toLocaleString('fr-FR')} FCFA`} readOnly className="font-mono bg-muted" /></div>
                         </div>
                    </div>
                )}

                {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
              </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
