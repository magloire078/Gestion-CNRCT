
"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Asset } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

interface AddAssetSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (asset: Omit<Asset, 'tag'>) => Promise<void>;
}

const assetTypes: Asset['type'][] = ["Ordinateur portable", "Moniteur", "Clavier", "Souris", "Logiciel", "Autre"];
const assetStatuses: Asset['status'][] = ['En utilisation', 'En stock', 'En réparation', 'Retiré'];

export function AddAssetSheet({ isOpen, onClose, onAddAsset }: AddAssetSheetProps) {
  const [type, setType] = useState<Asset['type'] | "">("");
  const [model, setModel] = useState("");
  const [assignedTo, setAssignedTo] = useState("En stock");
  const [status, setStatus] = useState<Asset['status']>('En stock');
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setType("");
    setModel("");
    setAssignedTo("En stock");
    setStatus("En stock");
    setError("");
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !model) {
      setError("Le type et le modèle sont des champs obligatoires.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      await onAddAsset({ type, model, assignedTo, status });
      handleClose();
    } catch(err) {
      const errorMessage = err instanceof Error ? err.message : "Échec de l'ajout de l'actif. Veuillez réessayer.";
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter un nouvel actif</SheetTitle>
            <SheetDescription>
              Remplissez les détails ci-dessous pour ajouter un nouvel actif à l'inventaire.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={type} onValueChange={(value: Asset['type']) => setType(value)} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionnez un type..." />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">
                Modèle
              </Label>
              <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} className="col-span-3" placeholder="Ex: Dell XPS 15" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignedTo" className="text-right">
                Assigné à
              </Label>
              <Input id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Statut
              </Label>
               <Select value={status} onValueChange={(value: Asset['status']) => setStatus(value)}>
                  <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                     {assetStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>
            {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer l'Actif"}
              </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
