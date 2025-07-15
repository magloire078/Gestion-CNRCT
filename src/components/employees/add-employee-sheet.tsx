
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
import type { Employee } from "@/lib/data";

interface AddEmployeeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: Omit<Employee, "id">) => void;
}

export function AddEmployeeSheet({ isOpen, onClose, onAddEmployee }: AddEmployeeSheetProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<Employee['status']>('Active');
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name || !role || !department) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    onAddEmployee({ name, role, department, status });
    setError("");
    onClose();
    // Reset form
    setName("");
    setRole("");
    setDepartment("");
    setStatus("Active");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Ajouter un nouvel employé</SheetTitle>
          <SheetDescription>
            Remplissez les détails ci-dessous pour ajouter un nouvel employé au système.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Rôle
            </Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              Département
            </Label>
             <Select value={department} onValueChange={(value) => setDepartment(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionnez..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Engineering">Ingénierie</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Sales">Ventes</SelectItem>
                <SelectItem value="HR">RH</SelectItem>
                <SelectItem value="Operations">Opérations</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Statut
            </Label>
             <Select value={status} onValueChange={(value: Employee['status']) => setStatus(value)}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Active">Actif</SelectItem>
                    <SelectItem value="On Leave">En congé</SelectItem>
                    <SelectItem value="Terminated">Licencié</SelectItem>
                </SelectContent>
             </Select>
          </div>
          {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </SheetClose>
          <Button type="submit" onClick={handleSubmit}>Enregistrer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
