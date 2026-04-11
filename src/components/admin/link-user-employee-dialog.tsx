
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
  onCloseAction: () => void;
  onConfirmAction: (userId: string, employeeId: string) => Promise<void>;
  user: User | null;
  employees: Employe[];
}

export function LinkUserEmployeeDialog({ isOpen, onCloseAction, onConfirmAction, user, employees }: LinkUserEmployeeDialogProps) {
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
    onCloseAction();
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
      await onConfirmAction(user.id, selectedEmployeeId);
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
      <DialogContent className="sm:max-w-lg border-white/20 p-0 overflow-hidden bg-white/40 backdrop-blur-3xl shadow-3xl rounded-[3rem]">
        <form onSubmit={handleSubmit} className="flex flex-col relative">
          <DialogHeader className="bg-slate-900 p-10 text-white text-left relative overflow-hidden">
            {/* Institutional Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="relative z-10 space-y-2">
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Référencement</DialogTitle>
                <div className="h-1 w-12 bg-amber-500 rounded-full" />
                <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2 opacity-80 leading-loose">
                    Liaison sécurisée du compte digital à un matricule de la base de données RH institutionnelle.
                </DialogDescription>
            </div>
          </DialogHeader>
          <div className="p-10 space-y-8 flex-1">
             <div className="space-y-3 p-6 rounded-[2rem] bg-slate-900/10 border border-white/40 shadow-xl backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Compte Digital</Label>
                <div className="space-y-1 relative z-10">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{user.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-70">{user.email}</p>
                </div>
             </div>
             <div className="space-y-3">
                <Label htmlFor="employee" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Collaborateur Titulaire</Label>
                 <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isComboboxOpen}
                            className="w-full justify-between h-14 px-6 rounded-2xl bg-white/60 border-white/40 shadow-sm font-black uppercase tracking-[0.2em] text-[11px] text-slate-900 transition-all duration-300"
                        >
                            <span className="truncate">
                                {getDisplayName(employees.find(e => e.id === selectedEmployeeId))}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-white/20 shadow-3xl bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden mt-2">
                        <Command>
                            <CommandInput placeholder="RECHERCHER PAR NOM OU MATRICULE..." className="h-14 border-none font-black uppercase tracking-widest text-[10px]" />
                            <CommandList className="custom-scrollbar">
                                <CommandEmpty className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Aucun collaborateur identifié.</CommandEmpty>
                                <CommandGroup className="p-2">
                                    {employees.map((emp) => (
                                        <CommandItem
                                            key={emp.id}
                                            value={`${emp.lastName} ${emp.firstName} ${emp.matricule}`}
                                            onSelect={() => {
                                                setSelectedEmployeeId(emp.id);
                                                setIsComboboxOpen(false);
                                            }}
                                            className="py-4 font-black uppercase tracking-[0.2em] text-[9px] flex items-center gap-3 rounded-xl focus:bg-slate-900 focus:text-white transition-colors animate-in fade-in duration-300"
                                        >
                                            <div className={cn("h-4 w-4 rounded-full border border-amber-500/30 flex items-center justify-center transition-all", selectedEmployeeId === emp.id ? "bg-amber-500/10 border-amber-500" : "opacity-30")}>
                                                <Check className={cn("h-2.5 w-2.5 text-amber-600", selectedEmployeeId === emp.id ? "opacity-100" : "opacity-0")} />
                                            </div>
                                            {getDisplayName(emp)}
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
              {isSubmitting ? "LIAISON..." : "CONFIRMER L'AFFILIATION"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
