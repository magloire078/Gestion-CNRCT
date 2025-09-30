
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
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeEvent } from "@/lib/data";
import { addEmployeeHistoryEvent, updateEmployeeHistoryEvent } from "@/services/employee-history-service";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";

interface AddHistoryEventSheetProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  eventToEdit?: EmployeeEvent | null;
  onEventSaved: (savedEvent: EmployeeEvent) => void;
}

const eventTypes: EmployeeEvent['eventType'][] = ['Promotion', 'Augmentation', 'Changement de poste', 'Départ', 'Autre'];
const indemnityFields = [
    { id: 'indemniteTransportImposable', label: 'Ind. Transport (Imposable)' },
    { id: 'indemniteSujetion', label: 'Ind. Sujétion' },
    { id: 'indemniteCommunication', label: 'Ind. Communication' },
    { id: 'indemniteRepresentation', label: 'Ind. Représentation' },
    { id: 'indemniteResponsabilite', label: 'Ind. Responsabilité' },
    { id: 'indemniteLogement', label: 'Ind. Logement' },
    { id: 'transportNonImposable', label: 'Transport (Non Imposable)' },
];


export function AddHistoryEventSheet({ isOpen, onClose, employeeId, eventToEdit, onEventSaved }: AddHistoryEventSheetProps) {
  const [eventType, setEventType] = useState<EmployeeEvent['eventType'] | "">("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!eventToEdit;

  useEffect(() => {
    if (isOpen) {
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
        setDetails({});
        setError("");
      }
    }
  }, [isOpen, eventToEdit]);

  const handleClose = () => {
    onClose();
  };
  
  const handleDetailChange = (key: string, value: string | number) => {
      setDetails(prev => ({...prev, [key]: value}));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventType || !effectiveDate || !description) {
      setError("Le type d'événement, la date et la description sont obligatoires.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
        if (isEditMode) {
            const updatedData: Partial<EmployeeEvent> = { eventType, effectiveDate, description, details };
            const updatedEvent = await updateEmployeeHistoryEvent(employeeId, eventToEdit.id, updatedData);
            onEventSaved(updatedEvent);
            toast({ title: "Événement mis à jour", description: "L'historique a été modifié avec succès." });
        } else {
            const newEventData: Omit<EmployeeEvent, "id" | "employeeId"> = {
                eventType: eventType as EmployeeEvent['eventType'],
                effectiveDate,
                description,
                details
            };
            const newEvent = await addEmployeeHistoryEvent(employeeId, newEventData);
            onEventSaved(newEvent);
            toast({ title: "Événement ajouté", description: "L'historique de l'employé a été mis à jour." });
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
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{isEditMode ? "Modifier un événement" : "Ajouter un événement de carrière"}</SheetTitle>
            <SheetDescription>
              {isEditMode ? "Modifiez les détails de cet événement." : "Enregistrez un nouvel événement dans l'historique professionnel de l'employé."}
            </SheetDescription>
          </SheetHeader>
           <ScrollArea className="h-[calc(100vh-150px)] p-1 -mx-1">
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
                
                {eventType === 'Augmentation' && (
                    <div className="col-span-4 space-y-4 pt-4 border-t">
                        <p className="text-sm font-medium text-center">Détails de l'Augmentation</p>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="newSalary" className="text-right">Nouveau Salaire de Base</Label>
                            <Input id="newSalary" type="number" value={details.newSalary || ''} placeholder="ex: 1200000" onChange={e => handleDetailChange('newSalary', e.target.value)} className="col-span-3" />
                        </div>
                         {indemnityFields.map(field => (
                            <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={field.id} className="text-right text-xs">{field.label}</Label>
                                <Input id={field.id} type="number" value={details[field.id] || ''} placeholder="0" onChange={e => handleDetailChange(field.id, e.target.value)} className="col-span-3" />
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

                {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
              </div>
          </ScrollArea>
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
