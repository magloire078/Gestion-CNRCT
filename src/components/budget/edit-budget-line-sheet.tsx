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
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [allocatedAmount, setAllocatedAmount] = useState<number | string>("");
  const [year, setYear] = useState<number | string>("");
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (budgetLine) {
        setCode(budgetLine.code);
        setName(budgetLine.name);
        setAllocatedAmount(budgetLine.allocatedAmount);
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
      setError("Veuillez remplir tous les champs.");
      return;
    }
    const amountNumber = Number(allocatedAmount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
        setError("Le montant alloué doit être un nombre positif.");
        return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      await onUpdateBudgetLine(budgetLine.id, { 
        code,
        name,
        allocatedAmount: amountNumber,
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
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Modifier la ligne budgétaire</SheetTitle>
            <SheetDescription>
              Mettez à jour les détails de la ligne budgétaire.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code-edit" className="text-right">Code</Label>
              <Input id="code-edit" value={code} onChange={(e) => setCode(e.target.value)} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-edit" className="text-right">Nom</Label>
              <Input id="name-edit" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount-edit" className="text-right">Montant Alloué</Label>
              <Input id="amount-edit" type="number" value={allocatedAmount} onChange={(e) => setAllocatedAmount(e.target.value)} className="col-span-3"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year-edit" className="text-right">Année</Label>
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
