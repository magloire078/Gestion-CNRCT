
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
  onCloseAction: () => void;
  onConfirmAction: (data: { name: string; directionId?: string; departmentId?: string }) => Promise<void>;
  service?: Service | null;
  directions: Direction[];
  departments: Department[];
}

export function ServiceDialog({ isOpen, onCloseAction, onConfirmAction, service, directions, departments }: ServiceDialogProps) {
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
    onCloseAction();
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

      await onConfirmAction(dataToSave);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement.";
      setError(message);
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
      <DialogContent className="sm:max-w-lg border-white/20 p-0 overflow-hidden bg-white/40 backdrop-blur-3xl shadow-3xl rounded-[3rem]">
        <form onSubmit={handleSubmit} className="flex flex-col relative">
          <DialogHeader className="bg-slate-900 p-10 text-white text-left relative overflow-hidden">
            {/* Institutional Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="relative z-10 space-y-2">
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter">
                    {isEditMode ? 'Rectification' : 'Architecture'}
                </DialogTitle>
                <div className="h-1 w-12 bg-sky-500 rounded-full" />
                <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2 opacity-80 leading-loose">
                  {isEditMode 
                    ? 'Ajustement des paramètres de l\'unité d\'exécution pour garantir la précision opérationnelle.' 
                    : 'Création d\'un service rattaché à une direction ou à un pôle stratégique du directoire.'}
                </DialogDescription>
            </div>
          </DialogHeader>
          <div className="p-10 space-y-8 flex-1 overflow-auto custom-scrollbar">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Libellé du Service</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="EX: SERVICE COMPTABILITÉ"
                className="h-14 rounded-2xl bg-white/60 border-white/40 shadow-sm focus:ring-slate-900 font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 placeholder:text-slate-300"
              />
            </div>
             <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Structure de Rattachement</Label>
                <RadioGroup value={parentType} onValueChange={handleParentTypeChange} className="grid grid-cols-2 gap-4 p-2 rounded-[2rem] bg-slate-900/5 border border-white/40 shadow-inner">
                    <div className="flex items-center">
                        <RadioGroupItem value="direction" id="r-direction" disabled={directions.length === 0} className="peer sr-only" />
                        <Label htmlFor="r-direction" className="flex-1 text-[9px] font-black uppercase tracking-widest text-center py-4 rounded-xl cursor-pointer transition-all peer-data-[state=checked]:bg-white peer-data-[state=checked]:text-slate-900 peer-data-[state=checked]:shadow-md text-slate-400 hover:text-slate-600">
                            Direction
                        </Label>
                    </div>
                    <div className="flex items-center">
                        <RadioGroupItem value="department" id="r-department" disabled={departments.length === 0} className="peer sr-only" />
                        <Label htmlFor="r-department" className="flex-1 text-[9px] font-black uppercase tracking-widest text-center py-4 rounded-xl cursor-pointer transition-all peer-data-[state=checked]:bg-white peer-data-[state=checked]:text-slate-900 peer-data-[state=checked]:shadow-md text-slate-400 hover:text-slate-600">
                            Pôle
                        </Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="space-y-3">
                <Label htmlFor="parentId" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                    {parentType === 'direction' ? 'Direction Titulaire' : 'Pôle Titulaire'}
                </Label>
                <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={isComboboxOpen} className="w-full justify-between h-14 px-6 rounded-2xl bg-white/60 border-white/40 shadow-sm font-black uppercase tracking-[0.2em] text-[11px] text-slate-900 transition-all duration-300">
                            <span className="truncate">
                                {selectedParent ? selectedParent.name : `SÉLECTIONNER...`}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-white/20 shadow-3xl bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden mt-2">
                        <Command>
                            <CommandInput placeholder="RECHERCHER..." className="h-14 border-none font-black uppercase tracking-widest text-[10px]" />
                            <CommandList className="custom-scrollbar">
                                <CommandEmpty className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Aucun résultat trouvé.</CommandEmpty>
                                <CommandGroup className="p-2">
                                    {parentOptions.map((opt) => (
                                        <CommandItem
                                            key={opt.id}
                                            value={opt.name}
                                            onSelect={() => {
                                                setParentId(opt.id);
                                                setIsComboboxOpen(false);
                                            }}
                                            className="py-4 font-black uppercase tracking-[0.2em] text-[9px] flex items-center gap-3 rounded-xl focus:bg-slate-900 focus:text-white transition-colors animate-in fade-in duration-300"
                                        >
                                            <div className={cn("h-4 w-4 rounded-full border border-sky-500/30 flex items-center justify-center transition-all", parentId === opt.id ? "bg-sky-500/10 border-sky-500" : "opacity-30")}>
                                                <Check className={cn("h-2.5 w-2.5 text-sky-600", parentId === opt.id ? "opacity-100" : "opacity-0")} />
                                            </div>
                                            {opt.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            {error && (
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center shadow-inner">
                    {error}
                </div>
            )}
          </div>
          <DialogFooter className="p-10 bg-white/20 backdrop-blur-md border-t border-white/40 flex-row gap-4">
            <Button type="button" variant="ghost" onClick={handleClose} className="h-14 px-8 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 hover:text-slate-900 transition-all">
                Annuler
            </Button>
            <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-3xl shadow-slate-900/40 active:scale-95 transition-all flex-1"
            >
              {isSubmitting ? "TRAITEMENT..." : "CONFIRMER LE SERVICE"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
