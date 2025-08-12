
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

const assetTypes: Asset['type'][] = ["Ordinateur", "Moniteur", "Clavier", "Souris", "Logiciel", "Autre"];
const computerTypes: Asset['typeOrdinateur'][] = ["Portable", "De Bureau", "Serveur"];
const assetStatuses: Asset['status'][] = ['En utilisation', 'En stock', 'En réparation', 'Retiré'];

export function AddAssetSheet({ isOpen, onClose, onAddAsset }: AddAssetSheetProps) {
  const [tag, setTag] = useState("");
  const [type, setType] = useState<Asset['type'] | "">("");
  const [typeOrdinateur, setTypeOrdinateur] = useState<Asset['typeOrdinateur'] | undefined>(undefined);
  const [fabricant, setFabricant] = useState("");
  const [modele, setModele] = useState("");
  const [numeroDeSerie, setNumeroDeSerie] = useState("");
  const [assignedTo, setAssignedTo] = useState("En stock");
  const [status, setStatus] = useState<Asset['status']>('En stock');
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setTag("");
    setType("");
    setTypeOrdinateur(undefined);
    setFabricant("");
    setModele("");
    setNumeroDeSerie("");
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
    if (!tag || !type || !modele) {
      setError("Le N° d'inventaire, le type et le modèle sont obligatoires.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      await onAddAsset({ 
        tag,
        type, 
        modele, 
        fabricant,
        numeroDeSerie,
        typeOrdinateur: type === 'Ordinateur' ? typeOrdinateur : undefined,
        assignedTo, 
        status 
      });
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
          <div className="grid gap-4 py-4 max-h-[85vh] overflow-y-auto pr-4">
            <div className="space-y-2">
              <Label htmlFor="tag">N° d'Inventaire</Label>
              <Input id="tag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Ex: CNRCT-PC-001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type d'Actif</Label>
              <Select value={type} onValueChange={(value: Asset['type']) => setType(value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type..." />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {type === "Ordinateur" && (
              <div className="space-y-2">
                <Label htmlFor="typeOrdinateur">Type d'Ordinateur</Label>
                <Select value={typeOrdinateur} onValueChange={(value: Asset['typeOrdinateur']) => setTypeOrdinateur(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type d'ordinateur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {computerTypes.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
             <div className="space-y-2">
              <Label htmlFor="fabricant">Fabricant</Label>
              <Input id="fabricant" value={fabricant} onChange={(e) => setFabricant(e.target.value)} placeholder="Ex: Dell, HP, Apple..."/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modele">Modèle</Label>
              <Input id="modele" value={modele} onChange={(e) => setModele(e.target.value)} placeholder="Ex: Latitude 7490, MacBook Pro 16" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroDeSerie">N° de Série</Label>
              <Input id="numeroDeSerie" value={numeroDeSerie} onChange={(e) => setNumeroDeSerie(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigné à</Label>
              <Input id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
               <Select value={status} onValueChange={(value: Asset['status']) => setStatus(value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                     {assetStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </div>
          <SheetFooter className="border-t pt-4">
            <SheetClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>Annuler</Button>
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
