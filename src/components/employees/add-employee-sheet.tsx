
"use client";

import { useState, useRef } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";

interface AddEmployeeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: Omit<Employee, "id">) => Promise<void>;
}

export function AddEmployeeSheet({ isOpen, onClose, onAddEmployee }: AddEmployeeSheetProps) {
  const [matricule, setMatricule] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<Employee['status']>('Active');
  const [photoUrl, setPhotoUrl] = useState(`https://placehold.co/100x100.png`);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setMatricule("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole("");
    setDepartment("");
    setStatus("Active");
    setPhotoUrl(`https://placehold.co/100x100.png`);
    setError("");
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matricule || !firstName || !lastName || !role || !department) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onAddEmployee({ matricule, firstName, lastName, email, role, department, status, photoUrl, name: `${firstName} ${lastName}` });
      handleClose();
    } catch(err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de l'employé. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter un nouvel employé</SheetTitle>
            <SheetDescription>
              Remplissez les détails ci-dessous pour ajouter un nouvel employé au système.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Photo
              </Label>
              <div className="col-span-3 flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                     <AvatarImage src={photoUrl} alt="Aperçu de la photo" data-ai-hint="employee photo" />
                     <AvatarFallback>{firstName ? firstName.charAt(0) : 'E'}</AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Télécharger
                  </Button>
                  <Input 
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="matricule" className="text-right">
                Matricule
              </Label>
              <Input id="matricule" value={matricule} onChange={(e) => setMatricule(e.target.value)} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Nom
              </Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                Prénom(s)
              </Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="col-span-3" />
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
            {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
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
