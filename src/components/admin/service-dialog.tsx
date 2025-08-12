
"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Service, Direction } from "@/lib/data";

interface ServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, directionId: string) => Promise<void>;
  service?: Service | null;
  directions: Direction[];
}

export function ServiceDialog({ isOpen, onClose, onConfirm, service, directions }: ServiceDialogProps) {
  const [name, setName] = useState("");
  const [directionId, setDirectionId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!service;

  useEffect(() => {
    if (service) {
      setName(service.name);
      setDirectionId(service.directionId);
    } else {
      setName("");
      setDirectionId("");
    }
  }, [service]);

  const handleClose = () => {
    setName("");
    setDirectionId("");
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !directionId) {
      setError("Le nom du service et la direction sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onConfirm(name, directionId);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Modifier le service' : 'Ajouter un service'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Modifiez les informations de ce service.' : 'Ajoutez un nouveau service à une direction.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="name">Nom du service</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du service"
              />
            </div>
            <div>
              <Label htmlFor="directionId">Direction</Label>
              <Select value={directionId} onValueChange={setDirectionId}>
                <SelectTrigger id="directionId">
                  <SelectValue placeholder="Sélectionnez une direction..." />
                </SelectTrigger>
                <SelectContent>
                  {directions.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>{dir.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    