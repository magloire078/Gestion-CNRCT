
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
import type { Employee } from "@/lib/data";

interface EditEmployeeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateEmployee: (employeeId: string, employee: Omit<Employee, "id">) => Promise<void>;
  employee: Employee;
}

export function EditEmployeeSheet({ isOpen, onClose, onUpdateEmployee, employee }: EditEmployeeSheetProps) {
  const [matricule, setMatricule] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<Employee['status']>('Active');
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setMatricule(employee.matricule);
      setName(employee.name);
      setEmail(employee.email || "");
      setRole(employee.role);
      setDepartment(employee.department);
      setStatus(employee.status);
      setPhotoUrl(employee.photoUrl);
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matricule || !name || !role || !department) {
      setError("Veuillez remplir tous les champs obligatoires (Matricule, Nom, Rôle, Département).");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onUpdateEmployee(employee.id, { matricule, name, email, role, department, status, photoUrl: photoUrl || `https://placehold.co/100x100.png` });
      onClose();
    } catch(err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour de l'employé. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Modifier l'employé</SheetTitle>
            <SheetDescription>
              Mettez à jour les informations de l'employé ci-dessous.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="matricule" className="text-right">
                Matricule
              </Label>
              <Input id="matricule" value={matricule} onChange={(e) => setMatricule(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom Complet
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
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
                  <SelectItem value="Informatique">Informatique</SelectItem>
                  <SelectItem value="Secretariat Général">Secrétariat Général</SelectItem>
                  <SelectItem value="Communication">Communication</SelectItem>
                  <SelectItem value="Direction Administrative">Direction Administrative</SelectItem>
                  <SelectItem value="Direction des Affaires financières et du patrimoine">Direction des Affaires financières et du patrimoine</SelectItem>
                  <SelectItem value="Protocole">Protocole</SelectItem>
                  <SelectItem value="Cabinet">Cabinet</SelectItem>
                  <SelectItem value="Direction des Affaires sociales">Direction des Affaires sociales</SelectItem>
                  <SelectItem value="Directoire">Directoire</SelectItem>
                  <SelectItem value="Comités Régionaux">Comités Régionaux</SelectItem>
                   <SelectItem value="Engineering">Ingénierie</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Ventes</SelectItem>
                  <SelectItem value="HR">RH</SelectItem>
                  <SelectItem value="Operations">Opérations</SelectItem>
                  <SelectItem value="Other">Autre</SelectItem>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="photoUrl" className="text-right">
                URL de la photo
              </Label>
              <Input id="photoUrl" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="col-span-3" placeholder="https://example.com/photo.png"/>
            </div>
            {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
