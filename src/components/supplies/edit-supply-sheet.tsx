
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
import type { Supply, Asset } from "@/lib/data";
import { supplyCategories } from "@/app/supplies/page";
import { getAssets } from "@/services/asset-service";
import { useToast } from "@/hooks/use-toast";

interface EditSupplySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSupply: (id: string, data: Partial<Omit<Supply, 'id'>>) => Promise<void>;
  supply: Supply;
}

export function EditSupplySheet({
  isOpen,
  onClose,
  onUpdateSupply,
  supply
}: EditSupplySheetProps) {
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
    if (supply) {
        setName(supply.name);
        setCategory(supply.category);
        setInkType(supply.inkType || "");
        setQuantity(supply.quantity);
        setReorderLevel(supply.reorderLevel);
        setLinkedAssetTag(supply.linkedAssetTag || "");
    }
  }, [supply]);

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


  const handleClose = () => {
    setError("");
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
      await onUpdateSupply(supply.id, { 
        name, 
        category, 
        quantity, 
        reorderLevel,
        inkType: category === 'Cartouches d\'encre' ? inkType : undefined,
        linkedAssetTag: (category === 'Cartouches d\'encre' && linkedAssetTag !== 'none') ? linkedAssetTag : undefined,
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
            <SheetTitle>Modifier la fourniture</SheetTitle>
            <SheetDescription>
              Mettez à jour les informations de cet article.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-edit" className="text-right">Nom</Label>
              <Input id="name-edit" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category-edit" className="text-right">Catégorie</Label>
              <Select value={category} onValueChange={(value: Supply['category']) => setCategory(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supplyCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {category === 'Cartouches d\'encre' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="inkType-edit" className="text-right">Type/N° d'encre</Label>
                  <Input id="inkType-edit" value={inkType} onChange={(e) => setInkType(e.target.value)} className="col-span-3" placeholder="Ex: HP 651, Toner 12A"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="linkedAssetTag-edit" className="text-right">Imprimante</Label>
                  <Select value={linkedAssetTag || 'none'} onValueChange={setLinkedAssetTag}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Lier à une imprimante..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
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
              <Label htmlFor="quantity-edit" className="text-right">Quantité</Label>
              <Input id="quantity-edit" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reorderLevel-edit" className="text-right">Seuil</Label>
              <Input id="reorderLevel-edit" type="number" value={reorderLevel} onChange={(e) => setReorderLevel(Number(e.target.value))} className="col-span-3" />
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
