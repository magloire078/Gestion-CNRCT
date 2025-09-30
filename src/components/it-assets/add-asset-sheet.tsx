
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
import type { Asset, Employe } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { getEmployees } from "@/services/employee-service";

interface AddAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (asset: Omit<Asset, 'tag'> & { tag: string }) => Promise<void>;
}

const assetTypes: Asset['type'][] = ["Ordinateur", "Moniteur", "Imprimante", "Clavier", "Souris", "Logiciel", "Équipement Réseau", "Autre"];
const computerTypes: Asset['typeOrdinateur'][] = ["Portable", "De Bureau", "Serveur"];
const assetStatuses: Asset['status'][] = ['En utilisation', 'En stock', 'En réparation', 'Retiré'];

export function AddAssetSheet({ isOpen, onClose, onAddAsset }: AddAssetDialogProps) {
  const [tag, setTag] = useState("");
  const [type, setType] = useState<Asset['type'] | "">("");
  const [typeOrdinateur, setTypeOrdinateur] = useState<Asset['typeOrdinateur'] | undefined>(undefined);
  const [fabricant, setFabricant] = useState("");
  const [modele, setModele] = useState("");
  const [numeroDeSerie, setNumeroDeSerie] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [password, setPassword] = useState("");
  const [assignedTo, setAssignedTo] = useState("En stock");
  const [status, setStatus] = useState<Asset['status']>('En stock');
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
        async function fetchEmployees() {
            try {
                const fetchedEmployees = await getEmployees();
                setEmployees(fetchedEmployees);
            } catch(err) {
                console.error("Failed to fetch employees", err);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger la liste des employés." });
            }
        }
        fetchEmployees();
    }
  }, [isOpen, toast]);

  const resetForm = () => {
    setTag("");
    setType("");
    setTypeOrdinateur(undefined);
    setFabricant("");
    setModele("");
    setNumeroDeSerie("");
    setIpAddress("");
    setPassword("");
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
      const dataToSave = { 
        tag,
        type, 
        modele, 
        fabricant,
        numeroDeSerie,
        ipAddress,
        password: showPasswordField ? password : undefined,
        typeOrdinateur: type === 'Ordinateur' ? typeOrdinateur : undefined,
        assignedTo, 
        status 
      };

      // Ensure no undefined values are sent
      Object.keys(dataToSave).forEach(key => {
        const dataKey = key as keyof typeof dataToSave;
        if (dataToSave[dataKey] === undefined) {
          delete dataToSave[dataKey];
        }
      });
      
      await onAddAsset(dataToSave as Omit<Asset, 'tag'> & { tag: string });
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

  const showPasswordField = type === 'Équipement Réseau' || typeOrdinateur === 'Serveur';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel actif</DialogTitle>
            <DialogDescription>
              Remplissez les détails ci-dessous pour ajouter un nouvel actif à l'inventaire.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
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
                <Label htmlFor="ipAddress">Adresse IP</Label>
                <Input id="ipAddress" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} placeholder="Ex: 192.168.1.10" />
            </div>
            {showPasswordField && (
                <div className="space-y-2">
                    <Label htmlFor="password">Mot de Passe</Label>
                    <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe de l'équipement" />
                </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigné à</Label>
              <Input id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Nom de l'employé ou du groupe"/>
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
          <DialogFooter className="border-t pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer l'Actif"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
