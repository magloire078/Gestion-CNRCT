
"use client";

import { useState, useEffect } from "react";
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
import type { Conflict, Employe, ConflictType } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";

interface EditConflictSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateConflict: (id: string, data: Partial<Omit<Conflict, 'id'>>) => Promise<void>;
  conflict: Conflict;
}

const conflictTypes: ConflictType[] = ["Foncier", "Succession", "Intercommunautaire", "Politique", "Autre"];

export function EditConflictSheet({
  isOpen,
  onClose,
  onUpdateConflict,
  conflict
}: EditConflictSheetProps) {
  const [description, setDescription] = useState("");
  const [conflictType, setConflictType] = useState<ConflictType>("Autre");
  const [status, setStatus] = useState<Conflict['status']>('En cours');
  const [mediatorName, setMediatorName] = useState<string | undefined>(undefined);
  const [allEmployees, setAllEmployees] = useState<Employe[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (conflict) {
      setDescription(conflict.description);
      setConflictType(conflict.type);
      setStatus(conflict.status);
      setMediatorName(conflict.mediatorName);
    }
  }, [conflict]);

  useEffect(() => {
    if (isOpen) {
        getEmployees()
            .then(employees => setAllEmployees(employees.filter(e => e.status === 'Actif')))
            .catch(() => setError("Impossible de charger les employés."));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conflict) return;

    setIsSubmitting(true);
    setError("");

    try {
        const dataToUpdate: Partial<Omit<Conflict, 'id'>> = {
            description,
            type: conflictType,
            status,
            mediatorName,
        };
        await onUpdateConflict(conflict.id, dataToUpdate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour du conflit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Modifier le Conflit</SheetTitle>
            <SheetDescription>
              Mettez à jour les informations pour le conflit à <span className="font-semibold">{conflict?.village}</span>.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
              <Label htmlFor="edit-conflictType">Type de Conflit</Label>
               <Select value={conflictType} onValueChange={(value: ConflictType) => setConflictType(value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type..." />
                  </SelectTrigger>
                  <SelectContent>
                      {conflictTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-mediatorName">Médiateur / Gestionnaire</Label>
                <Select value={mediatorName} onValueChange={setMediatorName}>
                    <SelectTrigger><SelectValue placeholder="Assigner un responsable..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">Non assigné</SelectItem>
                        {allEmployees.map(emp => (
                            <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="edit-status">Statut</Label>
               <Select value={status} onValueChange={(value: Conflict['status']) => setStatus(value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="En cours">En cours</SelectItem>
                      <SelectItem value="En médiation">En médiation</SelectItem>
                      <SelectItem value="Résolu">Résolu</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            {error && (
              <p className="col-span-4 text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">
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
