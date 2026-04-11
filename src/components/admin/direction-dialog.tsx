
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
  onCloseAction: () => void;
  onConfirmAction: (name: string, departmentId: string) => Promise<void>;
  direction?: Direction | null;
  departments: Department[];
}

export function DirectionDialog({ isOpen, onCloseAction, onConfirmAction, direction, departments }: DirectionDialogProps) {
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
    onCloseAction();
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
      await onConfirmAction(name, departmentId);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <div className="h-1 w-12 bg-emerald-500 rounded-full" />
                <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2 opacity-80 leading-loose">
                  {isEditMode 
                    ? 'Ajustement des paramètres de l\'unité opérationnelle pour la maintenance structurelle.' 
                    : 'Création d\'une direction rattachée à un pôle stratégique du directoire.'}
                </DialogDescription>
            </div>
          </DialogHeader>
          <div className="p-10 space-y-8 flex-1">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Libellé de la Direction</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="EX: DIRECTION DES AFFAIRES JURIDIQUES"
                className="h-14 rounded-2xl bg-white/60 border-white/40 shadow-sm focus:ring-slate-900 font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 placeholder:text-slate-300"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="departmentId" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Pôle de Rattachement</Label>
               <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={isComboboxOpen} className="w-full justify-between h-14 px-6 rounded-2xl bg-white/60 border-white/40 shadow-sm font-black uppercase tracking-[0.2em] text-[11px] text-slate-900 transition-all duration-300">
                        <span className="truncate">
                            {departmentId ? departments.find(d => d.id === departmentId)?.name : "SÉLECTIONNER UN PÔLE..."}
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
                            {departments.map((dept) => (
                                <CommandItem
                                    key={dept.id}
                                    value={dept.name}
                                    onSelect={() => {
                                        setDepartmentId(dept.id);
                                        setIsComboboxOpen(false);
                                    }}
                                    className="py-4 font-black uppercase tracking-[0.2em] text-[9px] flex items-center gap-3 rounded-xl focus:bg-slate-900 focus:text-white transition-colors animate-in fade-in duration-300"
                                >
                                    <div className={cn("h-4 w-4 rounded-full border border-emerald-500/30 flex items-center justify-center transition-all", departmentId === dept.id ? "bg-emerald-500/10 border-emerald-500" : "opacity-30")}>
                                        <Check className={cn("h-2.5 w-2.5 text-emerald-600", departmentId === dept.id ? "opacity-100" : "opacity-0")} />
                                    </div>
                                    {dept.name}
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
              {isSubmitting ? "TRAITEMENT..." : "CONFIRMER LA DIRECTION"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
