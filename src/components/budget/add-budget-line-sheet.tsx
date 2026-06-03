
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BudgetLine } from "@/lib/data";

interface AddBudgetLineSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBudgetLine: (line: Omit<BudgetLine, "id">) => Promise<void>;
}

export function AddBudgetLineSheet({
  isOpen,
  onClose,
  onAddBudgetLine,
}: AddBudgetLineSheetProps) {
  const [type, setType] = useState<'emploi' | 'ressource'>('emploi');
  const [paragraphe, setParagraphe] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [allocatedAmount, setAllocatedAmount] = useState<number | string>("");
  const [previousAmount, setPreviousAmount] = useState<number | string>("");
  const [year, setYear] = useState<number | string>(new Date().getFullYear());
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setType('emploi');
    setParagraphe("");
    setCode("");
    setName("");
    setAllocatedAmount("");
    setPreviousAmount("");
    setYear(new Date().getFullYear());
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !allocatedAmount || !year) {
      setError("Veuillez remplir tous les champs obligatoires (Code, Nom, Montant, Année).");
      return;
    }
    const amountNumber = Number(allocatedAmount);
    const prevAmountNumber = previousAmount ? Number(previousAmount) : 0;
    
    if (isNaN(amountNumber)) {
        setError("Le montant alloué doit être un nombre.");
        return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      await onAddBudgetLine({ 
        type,
        paragraphe,
        code,
        name,
        allocatedAmount: amountNumber,
        previousAmount: prevAmountNumber,
        year: Number(year),
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de la ligne budgétaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-xl border-l border-slate-200 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] p-0 flex flex-col gap-0">
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
          <SheetHeader className="p-6 bg-slate-950 text-white shrink-0 text-left relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] p-5 opacity-20 rotate-12">
               <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-500 to-rose-500" />
            
            <div className="relative z-10 space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <div>
                     <SheetTitle className="text-2xl font-black tracking-tight text-white uppercase italic leading-none">Nouvelle Dotation</SheetTitle>
                     <div className="h-1 w-12 bg-primary mt-2 rounded-full" />
                  </div>
               </div>
               <SheetDescription className="text-slate-400 font-bold italic text-sm">
                 Configuration d'une nouvelle ligne budgétaire pour l'exercice {year}
               </SheetDescription>
            </div>
          </SheetHeader>

          <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto custom-scrollbar bg-slate-50/30">
            {/* Section Type & Code */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-3 group">
                  <Label htmlFor="type-add" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 transition-colors group-focus-within:text-primary">Nature de la Ligne</Label>
                  <Select value={type} onValueChange={(val: 'emploi' | 'ressource') => setType(val)}>
                    <SelectTrigger id="type-add" className="h-14 border-slate-200 bg-white rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-black text-slate-700 shadow-sm">
                      <SelectValue placeholder="Choisir le type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 p-2 shadow-2xl">
                      <SelectItem value="emploi" className="rounded-xl focus:bg-rose-50 focus:text-rose-600 font-black uppercase text-[10px] tracking-widest py-3 cursor-pointer">Emploi (Dépense)</SelectItem>
                      <SelectItem value="ressource" className="rounded-xl focus:bg-emerald-50 focus:text-emerald-600 font-black uppercase text-[10px] tracking-widest py-3 cursor-pointer">Ressource (Recette)</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <div className="space-y-3 group">
                  <Label htmlFor="year-add" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 transition-colors group-focus-within:text-primary">Exercice (Année)</Label>
                  <Input 
                    id="year-add" 
                    type="number"
                    value={year} 
                    onChange={(e) => setYear(e.target.value)} 
                    className="h-14 border-slate-200 bg-white rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-black text-xl px-5 shadow-sm text-slate-900"
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-3 group">
                  <Label htmlFor="paragraphe-add" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 transition-colors group-focus-within:text-primary">Paragraphe</Label>
                  <Input 
                    id="paragraphe-add" 
                    placeholder="ex: 231"
                    value={paragraphe} 
                    onChange={(e) => setParagraphe(e.target.value)} 
                    className="h-14 border-slate-200 bg-white rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold px-5 shadow-sm text-slate-900"
                  />
               </div>
               <div className="space-y-3 group">
                  <Label htmlFor="code-add" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 transition-colors group-focus-within:text-primary">Code Ligne</Label>
                  <Input 
                    id="code-add" 
                    placeholder="ex: 2310"
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                    className="h-14 border-slate-200 bg-white rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-black text-xl px-5 shadow-sm text-slate-900"
                  />
               </div>
            </div>

            {/* Section Libellé */}
            <div className="space-y-3 group">
              <Label htmlFor="name-add" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 transition-colors group-focus-within:text-primary">Désignation du Poste</Label>
              <Input 
                id="name-add" 
                placeholder="Libellé complet de la ligne budgétaire..."
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="h-14 border-slate-200 bg-white rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold px-5 shadow-sm text-slate-900"
              />
            </div>

            {/* Section Montants */}
            <div className="p-5 bg-slate-950 rounded-xl space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden group/card">
               <div className="absolute inset-0 bg-gradient-to-br from-slate-950 to-slate-900" />
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full transition-all group-hover/card:scale-110" />
               
               <div className="relative z-10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7"/><path d="M16 19h6"/><path d="M19 16v6"/><circle cx="16" cy="9.5" r="1.5"/><circle cx="10" cy="9.5" r="1.5"/><circle cx="7" cy="9.5" r="1.5"/><path d="M22 12v3a2 2 0 0 1-2 2h-8"/></svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Initialisation Financière</span>
               </div>
               
               <div className="relative z-10 grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="allocatedAmount-add" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-2">Dotation N ({year})</Label>
                    <div className="relative group/input">
                      <Input 
                        id="allocatedAmount-add" 
                        type="number" 
                        value={allocatedAmount} 
                        onChange={(e) => setAllocatedAmount(e.target.value)} 
                        className="h-16 border-white/5 bg-white/5 text-white rounded-[1.25rem] focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all font-black text-2xl pl-6 pr-14"
                        placeholder="0"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary/40 tracking-tighter">CFA</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="previousAmount-add" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-2">Réalisé N-1</Label>
                    <div className="relative">
                      <Input 
                        id="previousAmount-add" 
                        type="number" 
                        value={previousAmount} 
                        onChange={(e) => setPreviousAmount(e.target.value)} 
                        className="h-16 border-white/5 bg-white/5 text-slate-400 rounded-[1.25rem] focus:ring-4 focus:ring-white/5 focus:border-white/10 transition-all font-bold text-xl pl-6 pr-14"
                        placeholder="0"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/10 tracking-tighter">CFA</span>
                    </div>
                  </div>
               </div>
            </div>

            {error && (
              <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600 text-sm font-black uppercase tracking-tight shadow-sm animate-in fade-in slide-in-from-top-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}
          </div>

          <SheetFooter className="p-6 border-t border-slate-100 bg-white flex flex-row items-center justify-end gap-4 shrink-0">
            <SheetClose asChild>
              <Button type="button" variant="outline" onClick={handleClose} className="h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95">
                Annuler
              </Button>
            </SheetClose>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="h-14 px-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] bg-slate-950 hover:bg-slate-900 text-white shadow-2xl shadow-slate-300 transition-all active:scale-95 hover:shadow-primary/10"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                   <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   <span>Configuration...</span>
                </div>
              ) : "Inscrire la Ligne"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
