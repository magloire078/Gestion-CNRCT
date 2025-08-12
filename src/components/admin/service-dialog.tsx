
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Service, Direction, Department } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { addService, updateService } from "@/services/service-service";


interface ServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service | null;
  directions: Direction[];
  departments: Department[];
}

export function ServiceDialog({ isOpen, onClose, service, directions, departments }: ServiceDialogProps) {
  const [name, setName] = useState("");
  const [parentType, setParentType] = useState<'direction' | 'department'>('direction');
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!service;

  useEffect(() => {
    if (isOpen) {
      if (service) {
        setName(service.name);
        if (service.directionId) {
          setParentType('direction');
          setParentId(service.directionId);
        } else if (service.departmentId) {
          setParentType('department');
          setParentId(service.departmentId);
        } else {
            setParentType('direction');
            setParentId('');
        }
      } else {
        setName("");
        setParentType('direction');
        setParentId("");
      }
    }
  }, [service, isOpen]);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !parentId) {
      setError("Le nom du service et son entité parente sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      const dataToSave: Omit<Service, 'id'> = {
        name,
        directionId: parentType === 'direction' ? parentId : undefined,
        departmentId: parentType === 'department' ? parentId : undefined,
      };

      if (isEditMode) {
        await updateService(service.id, dataToSave);
        toast({ title: "Service mis à jour" });
      } else {
        await addService(dataToSave);
        toast({ title: "Service ajouté" });
      }
      
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement.";
      setError(message);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParentTypeChange = (value: 'direction' | 'department') => {
    setParentType(value);
    setParentId(""); // Reset parent ID when type changes
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Modifier le service' : 'Ajouter un service'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Modifiez les informations de ce service.' : 'Ajoutez un nouveau service.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="name">Nom du service</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du service"
              />
            </div>
             <div>
                <Label>Dépend de</Label>
                <RadioGroup value={parentType} onValueChange={handleParentTypeChange} className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="direction" id="r-direction" />
                        <Label htmlFor="r-direction">Direction</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="department" id="r-department" />
                        <Label htmlFor="r-department">Département</Label>
                    </div>
                </RadioGroup>
            </div>
            <div>
                <Label htmlFor="parentId">{parentType === 'direction' ? 'Direction' : 'Département'}</Label>
                <Select value={parentId} onValueChange={setParentId}>
                    <SelectTrigger id="parentId">
                    <SelectValue placeholder={`Sélectionnez ${parentType === 'direction' ? 'une direction' : 'un département'}...`} />
                    </SelectTrigger>
                    <SelectContent>
                    {parentType === 'direction' ?
                        directions.map((dir) => (
                            <SelectItem key={dir.id} value={dir.id}>{dir.name}</SelectItem>
                        )) :
                        departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))
                    }
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
