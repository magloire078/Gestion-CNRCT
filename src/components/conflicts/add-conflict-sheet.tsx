
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Conflict } from "@/lib/data";

interface AddConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddConflict: (conflict: Omit<Conflict, "id">) => Promise<void>;
}

export function AddConflictSheet({
  isOpen,
  onClose,
  onAddConflict,
}: AddConflictDialogProps) {
  const [village, setVillage] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Conflict['status']>('En cours');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setVillage("");
    setDescription("");
    setStatus("En cours");
    setLatitude('');
    setLongitude('');
    setError("");
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!village || !description) {
      setError("Le nom du village et la description sont obligatoires.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
        const reportedDate = new Date().toISOString().split('T')[0];
        const conflictData: Omit<Conflict, "id"> = { 
            village, 
            description, 
            status, 
            reportedDate 
        };

        if (latitude && longitude) {
            conflictData.latitude = parseFloat(latitude);
            conflictData.longitude = parseFloat(longitude);
        }

        await onAddConflict(conflictData);
        handleClose();
    } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'ajout du conflit.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Signaler un nouveau conflit</SheetTitle>
            <SheetDescription>
              Remplissez les détails ci-dessous pour enregistrer un nouveau conflit. Les coordonnées sont optionnelles.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="village" className="text-right">
                Village
              </Label>
              <Input
                id="village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="col-span-3"
                placeholder="Nom du village"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                rows={5}
                placeholder="Décrivez la nature du conflit..."
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Statut Initial
              </Label>
               <Select value={status} onValueChange={(value: Conflict['status']) => setStatus(value)}>
                  <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="En cours">En cours</SelectItem>
                      <SelectItem value="En médiation">En médiation</SelectItem>
                      <SelectItem value="Résolu">Résolu</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="latitude">Latitude (Optionnel)</Label>
                    <Input id="latitude" type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="Ex: 5.345" />
                </div>
                 <div>
                    <Label htmlFor="longitude">Longitude (Optionnel)</Label>
                    <Input id="longitude" type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="Ex: -4.028" />
                </div>
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
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
