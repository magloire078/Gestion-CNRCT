
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
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [allocatedAmount, setAllocatedAmount] = useState<number | string>("");
  const [year, setYear] = useState<number | string>(new Date().getFullYear());
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCode("");
    setName("");
    setAllocatedAmount("");
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
      await onAddBudgetLine({ 
        code,
        name,
        allocatedAmount: amountNumber,
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
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter une nouvelle ligne budgétaire</SheetTitle>
            <SheetDescription>
              Remplissez les détails ci-dessous pour créer une nouvelle ligne dans le budget.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">Code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} className="col-span-3" placeholder="Ex: 601100"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nom</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Ex: Achat de fournitures de bureau"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="allocatedAmount" className="text-right">Montant Alloué</Label>
              <Input id="allocatedAmount" type="number" value={allocatedAmount} onChange={(e) => setAllocatedAmount(e.target.value)} className="col-span-3" placeholder="En FCFA"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">Année</Label>
              <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} className="col-span-3"/>
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
