
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
import type { Direction, Department } from "@/lib/data";

interface DirectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, departmentId: string) => Promise<void>;
  direction?: Direction | null;
  departments: Department[];
}

export function DirectionDialog({ isOpen, onClose, onConfirm, direction, departments }: DirectionDialogProps) {
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!direction;

  useEffect(() => {
    if (direction) {
      setName(direction.name);
      setDepartmentId(direction.departmentId);
    } else {
      setName("");
      setDepartmentId("");
    }
  }, [direction]);

  const handleClose = () => {
    setName("");
    setDepartmentId("");
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !departmentId) {
      setError("Le nom de la direction et le département sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onConfirm(name, departmentId);
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
            <DialogTitle>{isEditMode ? 'Modifier la direction' : 'Ajouter une direction'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Modifiez les informations de cette direction.' : 'Ajoutez une nouvelle direction à un département.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="name">Nom de la direction</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom de la direction"
              />
            </div>
            <div>
              <Label htmlFor="departmentId">Département</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger id="departmentId">
                  <SelectValue placeholder="Sélectionnez un département..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
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

    