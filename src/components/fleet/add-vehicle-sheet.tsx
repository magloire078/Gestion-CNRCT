
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
import type { Fleet } from "@/lib/data";

interface AddVehicleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVehicle: (vehicle: Omit<Fleet, "id"> & { plate: string }) => Promise<void>;
}

export function AddVehicleSheet({
  isOpen,
  onClose,
  onAddVehicle,
}: AddVehicleSheetProps) {
  const [plate, setPlate] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [maintenanceDue, setMaintenanceDue] = useState("");
  const [status, setStatus] = useState<Fleet['status']>('Disponible');
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setPlate("");
    setMakeModel("");
    setAssignedTo("");
    setMaintenanceDue("");
    setStatus("Disponible");
    setError("");
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !makeModel || !maintenanceDue) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
        await onAddVehicle({ plate, makeModel, assignedTo, maintenanceDue, status });
        handleClose();
    } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'ajout du véhicule. Veuillez réessayer.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter un nouveau véhicule</SheetTitle>
            <SheetDescription>
              Remplissez les détails ci-dessous pour ajouter un nouveau véhicule à la
              flotte.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plate" className="text-right">
                Plaque
              </Label>
              <Input
                id="plate"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="col-span-3"
                placeholder="Ex: ABC 123"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="makeModel" className="text-right">
                Marque & Modèle
              </Label>
              <Input
                id="makeModel"
                value={makeModel}
                onChange={(e) => setMakeModel(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Toyota Camry 2023"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignedTo" className="text-right">
                Assigné à
              </Label>
              <Input
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="col-span-3"
                placeholder="Nom de l'employé ou 'Véhicule de pool'"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Statut
              </Label>
              <Select value={status} onValueChange={(value: Fleet['status']) => setStatus(value)}>
                  <SelectTrigger className="col-span-3">
                      <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Disponible">Disponible</SelectItem>
                      <SelectItem value="En mission">En mission</SelectItem>
                      <SelectItem value="En maintenance">En maintenance</SelectItem>
                      <SelectItem value="Hors service">Hors service</SelectItem>
                  </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maintenanceDue" className="text-right">
                Entretien prévu
              </Label>
              <Input
                id="maintenanceDue"
                type="date"
                value={maintenanceDue}
                onChange={(e) => setMaintenanceDue(e.target.value)}
                className="col-span-3"
                placeholder="AAAA-MM-JJ"
              />
            </div>
            {error && (
              <p className="col-span-4 text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer le Véhicule"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
