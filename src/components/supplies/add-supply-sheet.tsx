
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Supply, Asset } from "@/lib/data";
import { supplyCategories } from "@/app/supplies/page";
import { getAssets } from "@/services/asset-service";
import { useToast } from "@/hooks/use-toast";

interface AddSupplyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSupply: (supply: Omit<Supply, "id">) => Promise<void>;
}

export function AddSupplySheet({
  isOpen,
  onClose,
  onAddSupply,
}: AddSupplyDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Supply['category'] | "">("");
  const [inkType, setInkType] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(10);
  const [linkedAssetTag, setLinkedAssetTag] = useState<string | "">("");
  const [printers, setPrinters] = useState<Asset[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPrinters() {
        if (category === 'Cartouches d\'encre') {
            try {
                const allAssets = await getAssets();
                const printerAssets = allAssets.filter(asset => asset.type === 'Imprimante');
                setPrinters(printerAssets);
            } catch (err) {
                console.error("Failed to fetch printers:", err);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger la liste des imprimantes." });
            }
        }
    }
    if(isOpen) {
        fetchPrinters();
    }
  }, [category, isOpen, toast]);

  const resetForm = () => {
    setName("");
    setCategory("");
    setInkType("");
    setQuantity(0);
    setReorderLevel(10);
    setLinkedAssetTag("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || quantity < 0 || reorderLevel < 0) {
      setError("Veuillez remplir tous les champs obligatoires avec des valeurs valides.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const lastRestockDate = new Date().toISOString().split('T')[0];
      await onAddSupply({ 
        name, 
        category, 
        quantity, 
        reorderLevel, 
        lastRestockDate,
        inkType: category === 'Cartouches d\'encre' ? inkType : undefined,
        linkedAssetTag: category === 'Cartouches d\'encre' ? linkedAssetTag : undefined,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de la fourniture.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter une nouvelle fourniture</DialogTitle>
            <DialogDescription>
              Remplissez les détails ci-dessous pour ajouter un nouvel article à l'inventaire.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nom</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Ex: Rame de papier A4"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Catégorie</Label>
              <Select value={category} onValueChange={(value: Supply['category']) => setCategory(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {supplyCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {category === 'Cartouches d\'encre' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="inkType" className="text-right">Type/N° d'encre</Label>
                  <Input id="inkType" value={inkType} onChange={(e) => setInkType(e.target.value)} className="col-span-3" placeholder="Ex: HP 651, Toner 12A"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="linkedAssetTag" className="text-right">Imprimante</Label>
                  <Select value={linkedAssetTag} onValueChange={setLinkedAssetTag}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Lier à une imprimante..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune</SelectItem>
                      {printers.map(printer => (
                          <SelectItem key={printer.tag} value={printer.tag}>
                              {printer.modele} ({printer.tag})
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantité en stock</Label>
              <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reorderLevel" className="text-right">Niveau de réapprovisionnement</Label>
              <Input id="reorderLevel" type="number" value={reorderLevel} onChange={(e) => setReorderLevel(Number(e.target.value))} className="col-span-3" />
            </div>
            {error && (
              <p className="col-span-4 text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
