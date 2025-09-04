
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import type { User, Employe } from "@/lib/data";

interface LinkUserEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string, employeeId: string) => Promise<void>;
  user: User | null;
  employees: Employe[];
}

export function LinkUserEmployeeDialog({ isOpen, onClose, onConfirm, user, employees }: LinkUserEmployeeDialogProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  useEffect(() => {
    if (user?.employeeId) {
      setSelectedEmployeeId(user.employeeId);
    } else {
      // Try to find a match by email or name as a default suggestion
      const matchingEmployee = employees.find(e => e.email === user?.email || e.name === user?.name);
      if (matchingEmployee) {
          setSelectedEmployeeId(matchingEmployee.id);
      } else {
        setSelectedEmployeeId("");
      }
    }
  }, [user, employees]);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedEmployeeId) {
      setError("Veuillez sélectionner un profil employé.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onConfirm(user.id, selectedEmployeeId);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getDisplayName = (emp: Employe | undefined) => {
    if (!emp) return "Sélectionnez un employé...";
    return `${emp.lastName || ''} ${emp.firstName || ''} (${emp.matricule})`.trim();
  }

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Lier un Utilisateur à un Employé</DialogTitle>
            <DialogDescription>
              Associez le compte de <span className="font-semibold">{user.name}</span> à un profil employé existant.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div>
                <Label>Compte Utilisateur</Label>
                <p className="text-sm text-muted-foreground">{user.name} ({user.email})</p>
             </div>
             <div>
                <Label htmlFor="employee">Profil Employé</Label>
                 <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isComboboxOpen}
                            className="w-full justify-between font-normal mt-1"
                        >
                            {getDisplayName(employees.find(e => e.id === selectedEmployeeId))}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder="Rechercher un employé..." />
                            <CommandList>
                                <CommandEmpty>Aucun employé trouvé.</CommandEmpty>
                                <CommandGroup>
                                    {employees.map((emp) => (
                                        <CommandItem
                                            key={emp.id}
                                            value={`${emp.lastName} ${emp.firstName} ${emp.matricule}`}
                                            onSelect={() => {
                                                setSelectedEmployeeId(emp.id);
                                                setIsComboboxOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedEmployeeId === emp.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {getDisplayName(emp)}
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
              {isSubmitting ? "Enregistrement..." : "Lier le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
