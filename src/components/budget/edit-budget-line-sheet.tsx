
"use client";

import { useState, useEffect } from "react";
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

interface EditBudgetLineSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateBudgetLine: (id: string, data: Partial<Omit<BudgetLine, 'id'>>) => Promise<void>;
  budgetLine: BudgetLine;
}

export function EditBudgetLineSheet({
  isOpen,
  onClose,
  onUpdateBudgetLine,
  budgetLine,
}: EditBudgetLineSheetProps) {
  const [type, setType] = useState<'emploi' | 'ressource'>('emploi');
  const [paragraphe, setParagraphe] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [allocatedAmount, setAllocatedAmount] = useState<number | string>("");
  const [previousAmount, setPreviousAmount] = useState<number | string>("");
  const [year, setYear] = useState<number | string>("");
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (budgetLine) {
        setType(budgetLine.type || 'emploi');
        setParagraphe(budgetLine.paragraphe || "");
        setCode(budgetLine.code);
        setName(budgetLine.name);
        setAllocatedAmount(budgetLine.allocatedAmount);
        setPreviousAmount(budgetLine.previousAmount || "");
        setYear(budgetLine.year);
    }
  }, [budgetLine]);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !allocatedAmount || !year) {
      setError("Veuillez remplir tous les champs obligatoires.");
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
      await onUpdateBudgetLine(budgetLine.id, { 
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
      setError(err instanceof Error ? err.message : "Échec de la mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Modifier la ligne budgétaire</SheetTitle>
            <SheetDescription>
              Mettez à jour les détails de la ligne budgétaire (Annexe).
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type-edit" className="text-right">Type</Label>
              <Select value={type} onValueChange={(val: 'emploi' | 'ressource') => setType(val)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Choisir le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emploi">Emploi (Dépense)</SelectItem>
                  <SelectItem value="ressource">Ressource (Recette)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paragraphe-edit" className="text-right">Paragraphe</Label>
              <Input id="paragraphe-edit" value={paragraphe} onChange={(e) => setParagraphe(e.target.value)} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code-edit" className="text-right">Ligne (Code)</Label>
              <Input id="code-edit" value={code} onChange={(e) => setCode(e.target.value)} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-edit" className="text-right">Libellé</Label>
              <Input id="name-edit" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount-edit" className="text-right text-xs">Montant {year} (N)</Label>
              <Input id="amount-edit" type="number" value={allocatedAmount} onChange={(e) => setAllocatedAmount(e.target.value)} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prev-amount-edit" className="text-right text-xs">Montant Précédent (N-1)</Label>
              <Input id="prev-amount-edit" type="number" value={previousAmount} onChange={(e) => setPreviousAmount(e.target.value)} className="col-span-3"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year-edit" className="text-right">Année Budget</Label>
              <Input id="year-edit" type="number" value={year} onChange={(e) => setYear(e.target.value)} className="col-span-3"/>
            </div>

            {error && (
              <p className="col-span-4 text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>Annuler</Button>
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
