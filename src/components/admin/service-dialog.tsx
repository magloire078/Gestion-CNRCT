
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
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
            setParentType(directions.length > 0 ? 'direction' : 'department');
            setParentId('');
        }
      } else {
        setName("");
        setParentType(directions.length > 0 ? 'direction' : 'department');
        setParentId("");
      }
    }
  }, [service, isOpen, directions]);

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
      const dataToSave: { name: string; directionId?: string; departmentId?: string; } = {
        name,
        directionId: parentType === 'direction' ? parentId : undefined,
        departmentId: parentType === 'department' ? parentId : undefined,
      };
      
      if(parentType === 'direction') {
          const selectedDirection = directions.find(d => d.id === parentId);
          dataToSave.departmentId = selectedDirection?.departmentId;
      }

      if (isEditMode) {
        await updateService(service.id, dataToSave);
        toast({ title: "Service mis à jour" });
      } else {
        await addService(dataToSave as Omit<Service, 'id'>);
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
    setParentId("");
  };
  
  const parentOptions = parentType === 'direction' ? directions : departments;
  const selectedParent = parentOptions.find(p => p.id === parentId);

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
                className="mt-1"
              />
            </div>
             <div>
                <Label>Dépend de</Label>
                <RadioGroup value={parentType} onValueChange={handleParentTypeChange} className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="direction" id="r-direction" disabled={directions.length === 0} />
                        <Label htmlFor="r-direction">Direction</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="department" id="r-department" disabled={departments.length === 0} />
                        <Label htmlFor="r-department">Département</Label>
                    </div>
                </RadioGroup>
            </div>
            <div>
                <Label htmlFor="parentId">{parentType === 'direction' ? 'Direction' : 'Département'}</Label>
                <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={isComboboxOpen} className="w-full justify-between font-normal mt-1">
                            {selectedParent ? selectedParent.name : `Sélectionnez ${parentType === 'direction' ? 'une direction' : 'un département'}...`}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Rechercher..." />
                            <CommandList>
                                <CommandEmpty>Aucun résultat.</CommandEmpty>
                                <CommandGroup>
                                    {parentOptions.map((opt) => (
                                        <CommandItem
                                            key={opt.id}
                                            value={opt.name}
                                            onSelect={() => {
                                                setParentId(opt.id);
                                                setIsComboboxOpen(false);
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", parentId === opt.id ? "opacity-100" : "opacity-0")} />
                                            {opt.name}
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
