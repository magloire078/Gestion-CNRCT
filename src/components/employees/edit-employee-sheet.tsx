
"use client";

import { useState, useEffect, useMemo } from "react";
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
import type { Employe, Department, Direction, Service } from "@/lib/data";
import { getDepartments } from "@/services/department-service";
import { getDirections } from "@/services/direction-service";
import { getServices } from "@/services/service-service";

interface EditEmployeeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateEmployee: (id: string, data: Partial<Employe>) => Promise<void>;
  employee: Employe;
}

export function EditEmployeeSheet({ isOpen, onClose, onUpdateEmployee, employee }: EditEmployeeSheetProps) {
  const [formState, setFormState] = useState<Partial<Employe>>({});
  const [skillsString, setSkillsString] = useState("");
  
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [directionList, setDirectionList] = useState<Direction[]>([]);
  const [serviceList, setServiceList] = useState<Service[]>([]);
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormState(employee);
      setSkillsString(employee.skills?.join(', ') || "");
    }
    if (isOpen) {
      async function fetchOrgData() {
        try {
          const [depts, dirs, svcs] = await Promise.all([
            getDepartments(),
            getDirections(),
            getServices(),
          ]);
          setDepartmentList(depts);
          setDirectionList(dirs);
          setServiceList(svcs);
        } catch (err) {
          console.error("Failed to fetch organizational data", err);
          setError("Impossible de charger les listes de l'organisation.");
        }
      }
      fetchOrgData();
    }
  }, [employee, isOpen]);
  
  const filteredDirections = useMemo(() => {
    if (!formState.department) return [];
    const selectedDept = departmentList.find(d => d.name === formState.department);
    return selectedDept ? directionList.filter(d => d.departmentId === selectedDept.id) : [];
  }, [formState.department, directionList, departmentList]);

  const filteredServices = useMemo(() => {
    if (!formState.direction) return [];
    const selectedDir = directionList.find(d => d.name === formState.direction);
    return selectedDir ? serviceList.filter(s => s.directionId === selectedDir.id) : [];
  }, [formState.direction, serviceList, directionList]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    const newState: Partial<Employe> = { ...formState, [name]: value };
    if (name === 'department') {
        newState.direction = '';
        newState.service = '';
    }
    if (name === 'direction') {
        newState.service = '';
    }
    setFormState(newState);
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
                <div className="space-y-2"><Label htmlFor="lastName">Nom</Label><Input id="lastName" name="lastName" value={formState.lastName || ''} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="firstName">Prénom(s)</Label><Input id="firstName" name="firstName" value={formState.firstName || ''} onChange={handleInputChange} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={formState.email || ''} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="mobile">Téléphone</Label><Input id="mobile" name="mobile" value={formState.mobile || ''} onChange={handleInputChange} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="poste">Poste</Label><Input id="poste" name="poste" value={formState.poste || ''} onChange={handleInputChange} /></div>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="department">Département</Label><Select name="department" value={formState.department || ''} onValueChange={(v) => handleSelectChange('department', v)}><SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent>{departmentList.map(dep => <SelectItem key={dep.id} value={dep.name}>{dep.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="direction">Direction</Label><Select name="direction" value={formState.direction || ''} onValueChange={(v) => handleSelectChange('direction', v)} disabled={!formState.department}><SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent>{filteredDirections.map(dir => <SelectItem key={dir.id} value={dir.name}>{dir.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="service">Service</Label><Select name="service" value={formState.service || ''} onValueChange={(v) => handleSelectChange('service', v)} disabled={!formState.direction}><SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent>{filteredServices.map(svc => <SelectItem key={svc.id} value={svc.name}>{svc.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="matricule">Matricule</Label><Input id="matricule" name="matricule" value={formState.matricule || ''} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="status">Statut</Label><Select name="status" value={formState.status || ''} onValueChange={(v) => handleSelectChange('status', v)}><SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent><SelectItem value="Actif">Actif</SelectItem><SelectItem value="En congé">En congé</SelectItem><SelectItem value="Licencié">Licencié</SelectItem><SelectItem value="Retraité">Retraité</SelectItem><SelectItem value="Décédé">Décédé</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="sexe">Sexe</Label><Select name="sexe" value={formState.sexe || ''} onValueChange={(v) => handleSelectChange('sexe', v)}><SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent></Select></div>
            </div>
             <div className="space-y-2"><Label htmlFor="skills">Compétences</Label><Textarea id="skills" name="skills" value={skillsString} onChange={(e) => setSkillsString(e.target.value)} rows={3} placeholder="Gestion de projet, Leadership, Communication..."/></div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </div>
          <SheetFooter className="border-t pt-4">
            <SheetClose asChild><Button type="button" variant="outline">Annuler</Button></SheetClose>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

    