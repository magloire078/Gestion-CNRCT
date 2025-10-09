
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
  Command,
  CommandEmpty,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

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
               <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={isComboboxOpen} className="w-full justify-between font-normal mt-1">
                        {departmentId ? departments.find(d => d.id === departmentId)?.name : "Sélectionnez un département..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Rechercher un département..." />
                        <CommandList>
                          <CommandEmpty>Aucun département trouvé.</CommandEmpty>
                          <CommandGroup>
                            {departments.map((dept) => (
                                <CommandItem
                                    key={dept.id}
                                    value={dept.name}
                                    onSelect={() => {
                                        setDepartmentId(dept.id);
                                        setIsComboboxOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", departmentId === dept.id ? "opacity-100" : "opacity-0")} />
                                    {dept.name}
                                </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
              </Popover>
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
