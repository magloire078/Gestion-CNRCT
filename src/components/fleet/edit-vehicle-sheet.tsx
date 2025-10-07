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
import type { Fleet } from "@/lib/data";

interface EditVehicleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateVehicle: (plate: string, vehicle: Partial<Fleet>) => Promise<void>;
  vehicle: Fleet;
}

const fleetStatuses: Fleet['status'][] = ['Disponible', 'En mission', 'En maintenance', 'Hors service'];

export function EditVehicleSheet({ isOpen, onClose, onUpdateVehicle, vehicle }: EditVehicleSheetProps) {
  const [formData, setFormData] = useState<Partial<Fleet>>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
    }
  }, [vehicle]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await onUpdateVehicle(vehicle.plate, formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour du véhicule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Modifier le véhicule : {vehicle.plate}</SheetTitle>
            <SheetDescription>
              Mettez à jour les détails de ce véhicule.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-plate" className="text-right">Plaque</Label>
              <Input id="edit-plate" value={formData.plate || ''} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-makeModel" className="text-right">Marque & Modèle</Label>
              <Input id="edit-makeModel" name="makeModel" value={formData.makeModel || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-assignedTo" className="text-right">Assigné à</Label>
              <Input id="edit-assignedTo" name="assignedTo" value={formData.assignedTo || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">Statut</Label>
              <Select value={formData.status} onValueChange={(value: Fleet['status']) => handleSelectChange('status', value)}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>{fleetStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-maintenanceDue" className="text-right">Entretien Prévu</Label>
              <Input id="edit-maintenanceDue" name="maintenanceDue" type="date" value={formData.maintenanceDue || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
            {error && <p className="col-span-4 text-center text-sm text-destructive">{error}</p>}
          </div>
          <SheetFooter>
            <SheetClose asChild><Button type="button" variant="outline">Annuler</Button></SheetClose>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
    