
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
import type { Department } from "@/lib/data";

interface DepartmentDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onConfirmAction: (name: string) => Promise<void>;
  department?: Department | null;
}

export function DepartmentDialog({ isOpen, onCloseAction, onConfirmAction, department }: DepartmentDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!department;

  useEffect(() => {
    if (department) {
      setName(department.name);
    } else {
      setName("");
    }
  }, [department]);

  const handleClose = () => {
    setName("");
    setError("");
    onCloseAction();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Le nom du département est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onConfirmAction(name);
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
                <div className="h-1 w-12 bg-blue-500 rounded-full" />
                <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2 opacity-80 leading-loose">
                  {isEditMode 
                    ? 'Ajustement du libellé du département institutionnel pour maintenir la cohérence administrative.' 
                    : 'Définition d\'une nouvelle unité stratégique de haut niveau au sein du directoire.'}
                </DialogDescription>
            </div>
          </DialogHeader>
          <div className="p-10 space-y-8 flex-1">
            <div className="space-y-3">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Libellé Officiel du Pôle</Label>
                <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="EX: DÉPARTEMENT DES RESSOURCES HUMAINES"
                className="h-14 rounded-2xl bg-white/60 border-white/40 shadow-sm focus:ring-slate-900 font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 placeholder:text-slate-300"
                />
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
              {isSubmitting ? "ENREGISTREMENT..." : "CONFIRMER L'UNITÉ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
