"use client";

import { useState } from "react";
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
import { addEmployeeHistoryEvent } from "@/services/employee-history-service";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AddHistoryEventSheetProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  onEventAdded: (newEvent: EmployeeEvent) => void;
}

const eventTypes: EmployeeEvent['eventType'][] = ['Promotion', 'Augmentation', 'Changement de poste', 'Départ', 'Autre'];

export function AddHistoryEventSheet({ isOpen, onClose, employeeId, onEventAdded }: AddHistoryEventSheetProps) {
  const [eventType, setEventType] = useState<EmployeeEvent['eventType'] | "">("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setEventType("");
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setDescription("");
    setDetails({});
    setError("");
  };

  const handleClose = () => {
    resetForm();
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
      const newEventData: Omit<EmployeeEvent, "id" | "employeeId"> = {
          eventType: eventType as EmployeeEvent['eventType'],
          effectiveDate,
          description,
          details
      };
      const newEvent = await addEmployeeHistoryEvent(employeeId, newEventData);
      onEventAdded(newEvent);
      toast({ title: "Événement ajouté", description: "L'historique de l'employé a été mis à jour." });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de l'événement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter un événement de carrière</SheetTitle>
            <SheetDescription>
              Enregistrez un nouvel événement dans l'historique professionnel de l'employé.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
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
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newSalary" className="text-right">Nouveau Salaire</Label>
                    <Input id="newSalary" type="number" placeholder="ex: 1200000" onChange={e => handleDetailChange('newSalary', e.target.value)} className="col-span-3" />
                 </div>
            )}
            {eventType === 'Promotion' && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newPoste" className="text-right">Nouveau Poste</Label>
                    <Input id="newPoste" type="text" placeholder="ex: Développeur Senior" onChange={e => handleDetailChange('newPoste', e.target.value)} className="col-span-3" />
                 </div>
            )}

            {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
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
