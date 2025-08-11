
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
import type { Department } from "@/lib/data";

interface DepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
  department?: Department | null;
}

export function DepartmentDialog({ isOpen, onClose, onConfirm, department }: DepartmentDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!department;

  useEffect(() => {
    if (department) {
      setName(department.name);
    } else {
      setName("");
    }
  }, [department]);

  const handleClose = () => {
    setName("");
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Le nom du département est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onConfirm(name);
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
            <DialogTitle>{isEditMode ? 'Modifier le département' : 'Ajouter un département'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Modifiez le nom de ce département.' : 'Ajoutez un nouveau département à la liste.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name" className="sr-only">Nom</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du département"
            />
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
