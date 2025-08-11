
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
import { Textarea } from "@/components/ui/textarea";
import type { Employe } from "@/lib/data";

interface EditEmployeeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateEmployee: (id: string, data: Partial<Employe>) => Promise<void>;
  employee: Employe;
}

const departmentList = ["Informatique", "Secretariat Général", "Communication", "Direction Administrative", "Direction des Affaires financières et du patrimoine", "Protocole", "Cabinet", "Direction des Affaires sociales", "Directoire", "Comités Régionaux", "Engineering", "Marketing", "Sales", "HR", "Operations", "Other"];
type Status = 'Actif' | 'En congé' | 'Licencié' | 'Retraité' | 'Décédé';

export function EditEmployeeSheet({ isOpen, onClose, onUpdateEmployee, employee }: EditEmployeeSheetProps) {
  const [formState, setFormState] = useState<Partial<Employe>>({});
  const [skillsString, setSkillsString] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormState(employee);
      setSkillsString(employee.skills?.join(', ') || "");
    }
  }, [employee]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const fullName = `${formState.firstName || ''} ${formState.lastName || ''}`.trim();
      const updatedData: Partial<Employe> = {
        ...formState,
        name: fullName,
        skills: skillsString.split(',').map(s => s.trim()).filter(Boolean)
      };
      await onUpdateEmployee(employee.id, updatedData);
      onClose();
    } catch(err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <SheetHeader className="text-center">
            <SheetTitle>Modifier l'Employé</SheetTitle>
            <SheetDescription>
              Mettez à jour les informations de {employee.name}.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4 max-h-[85vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" name="lastName" value={formState.lastName || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom(s)</Label>
                    <Input id="firstName" name="firstName" value={formState.firstName || ''} onChange={handleInputChange} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formState.email || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mobile">Téléphone</Label>
                    <Input id="mobile" name="mobile" value={formState.mobile || ''} onChange={handleInputChange} />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="matricule">Matricule</Label>
                    <Input id="matricule" name="matricule" value={formState.matricule || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="poste">Poste</Label>
                    <Input id="poste" name="poste" value={formState.poste || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="dateEmbauche">Date d'embauche</Label>
                    <Input id="dateEmbauche" name="dateEmbauche" type="date" value={formState.dateEmbauche || ''} onChange={handleInputChange} />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="department">Département</Label>
                    <Select name="department" value={formState.department || ''} onValueChange={(v) => handleSelectChange('department', v)}>
                        <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                        <SelectContent>
                            {departmentList.sort().map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                     <Select name="status" value={formState.status || ''} onValueChange={(v) => handleSelectChange('status', v)}>
                        <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Actif">Actif</SelectItem>
                            <SelectItem value="En congé">En congé</SelectItem>
                            <SelectItem value="Licencié">Licencié</SelectItem>
                            <SelectItem value="Retraité">Retraité</SelectItem>
                            <SelectItem value="Décédé">Décédé</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="skills">Compétences</Label>
                <Textarea 
                    id="skills"
                    name="skills"
                    value={skillsString}
                    onChange={(e) => setSkillsString(e.target.value)}
                    rows={3}
                    placeholder="Gestion de projet, Leadership, Communication..."
                 />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </div>
          <SheetFooter className="border-t pt-4">
            <SheetClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
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
