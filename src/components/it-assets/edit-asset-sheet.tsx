
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Asset, Employe } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { getEmployees } from "@/services/employee-service";

interface EditAssetSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateAsset: (tag: string, assetData: Partial<Asset>) => Promise<void>;
  asset: Asset;
}

const assetTypes: Asset['type'][] = ["Ordinateur", "Moniteur", "Imprimante", "Clavier", "Souris", "Logiciel", "Équipement Réseau", "Autre"];
const computerTypes: Asset['typeOrdinateur'][] = ["Portable", "De Bureau", "Serveur"];
const assetStatuses: Asset['status'][] = ['En utilisation', 'En stock', 'En réparation', 'Retiré'];

export function EditAssetSheet({ isOpen, onClose, onUpdateAsset, asset }: EditAssetSheetProps) {
    const [formData, setFormData] = useState<Partial<Asset>>({});
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (asset) {
            setFormData(asset);
        }
    }, [asset]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        const newState = { ...(formData || {}), [name]: value };
        if (name === 'type' && value !== 'Ordinateur') {
            newState.typeOrdinateur = undefined;
        }
        setFormData(newState as Partial<Asset>);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.tag || !formData.type || !formData.modele) {
          setError("Le N° d'inventaire, le type et le modèle sont obligatoires.");
          return;
        }
        
        setIsSubmitting(true);
        setError("");

        try {
          await onUpdateAsset(asset.tag, formData);
          toast({ title: "Actif mis à jour", description: "Les informations de l'actif ont été modifiées." });
          onClose();
        } catch(err) {
          const errorMessage = err instanceof Error ? err.message : "Échec de la mise à jour de l'actif.";
          setError(errorMessage);
          toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
        } finally {
          setIsSubmitting(false);
        }
    };
    
    const showPasswordField = formData.type === 'Équipement Réseau' || formData.typeOrdinateur === 'Serveur';

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-lg">
            <form onSubmit={handleSubmit}>
            <SheetHeader>
                <SheetTitle>Modifier l'actif : {asset.tag}</SheetTitle>
                <SheetDescription>
                Mettez à jour les détails de cet actif.
                </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4 max-h-[85vh] overflow-y-auto pr-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-tag">N° d'Inventaire</Label>
                    <Input id="edit-tag" value={formData.tag || ''} disabled />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="edit-type">Type d'Actif</Label>
                    <Select value={formData.type} onValueChange={(value: Asset['type']) => handleSelectChange('type', value)} required>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{assetTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                 {formData.type === "Ordinateur" && (
                    <div className="space-y-2">
                        <Label htmlFor="edit-typeOrdinateur">Type d'Ordinateur</Label>
                        <Select value={formData.typeOrdinateur} onValueChange={(value: Asset['typeOrdinateur']) => handleSelectChange('typeOrdinateur', value)}>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                            <SelectContent>{computerTypes.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                )}
                 <div className="space-y-2">
                    <Label htmlFor="edit-fabricant">Fabricant</Label>
                    <Input id="edit-fabricant" name="fabricant" value={formData.fabricant || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="edit-modele">Modèle</Label>
                    <Input id="edit-modele" name="modele" value={formData.modele || ''} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-numeroDeSerie">N° de Série</Label>
                    <Input id="edit-numeroDeSerie" name="numeroDeSerie" value={formData.numeroDeSerie || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="edit-ipAddress">Adresse IP</Label>
                    <Input id="edit-ipAddress" name="ipAddress" value={formData.ipAddress || ''} onChange={handleInputChange} />
                </div>
                {showPasswordField && (
                    <div className="space-y-2">
                        <Label htmlFor="edit-password">Mot de Passe</Label>
                        <Input id="edit-password" name="password" value={formData.password || ''} onChange={handleInputChange} />
                    </div>
                )}
                 <div className="space-y-2">
                    <Label htmlFor="edit-assignedTo">Assigné à</Label>
                    <Input id="edit-assignedTo" name="assignedTo" value={formData.assignedTo || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="edit-status">Statut</Label>
                    <Select value={formData.status} onValueChange={(value: Asset['status']) => handleSelectChange('status', value)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{assetStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </div>
            <SheetFooter className="border-t pt-4">
                <SheetClose asChild><Button type="button" variant="outline">Annuler</Button></SheetClose>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</Button>
            </SheetFooter>
            </form>
        </SheetContent>
        </Sheet>
    );
}
