
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Asset, Employe } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { getEmployeeDirectory } from "@/services/employee-service";
import { updateAsset } from "@/services/asset-service";
import { Save, X, Loader2 } from "lucide-react";

interface EditAssetFormProps {
  asset: Asset;
}

const assetTypes: Asset['type'][] = ["Ordinateur", "Moniteur", "Imprimante", "Clavier", "Souris", "Logiciel", "Équipement Réseau", "Autre"];
const computerTypes: Asset['typeOrdinateur'][] = ["Portable", "De Bureau", "Serveur"];
const assetStatuses: Asset['status'][] = ['En utilisation', 'En stock', 'En réparation', 'Retiré'];

export function EditAssetForm({ asset }: EditAssetFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [type, setType] = useState<Asset['type']>(asset.type);
  const [typeOrdinateur, setTypeOrdinateur] = useState<Asset['typeOrdinateur'] | undefined>(asset.typeOrdinateur);
  const [fabricant, setFabricant] = useState(asset.fabricant || "");
  const [modele, setModele] = useState(asset.modele);
  const [numeroDeSerie, setNumeroDeSerie] = useState(asset.numeroDeSerie || "");
  const [ipAddress, setIpAddress] = useState(asset.ipAddress || "");
  const [password, setPassword] = useState(asset.password || "");
  const [assignedTo, setAssignedTo] = useState(asset.assignedTo || "En stock");
  const [status, setStatus] = useState<Asset['status']>(asset.status);
  
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const fetchedEmployees = await getEmployeeDirectory();
        setEmployees(fetchedEmployees);
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    }
    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !modele) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Le type et le modèle sont obligatoires." 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToUpdate: Partial<Asset> = {
        type,
        modele,
        fabricant,
        numeroDeSerie,
        ipAddress,
        password: showPasswordField ? password : (asset.password || ""),
        typeOrdinateur: type === 'Ordinateur' ? typeOrdinateur : undefined,
        assignedTo,
        status
      };

      // Clean undefined fields
      Object.keys(dataToUpdate).forEach(key => {
        const dataKey = key as keyof typeof dataToUpdate;
        if (dataToUpdate[dataKey] === undefined) {
          delete dataToUpdate[dataKey];
        }
      });

      await updateAsset(asset.tag, dataToUpdate);
      
      toast({ 
        title: 'Actif mis à jour', 
        description: `L'actif ${asset.tag} a été modifié avec succès.` 
      });
      
      router.push(`/it-assets/${asset.tag}`);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Échec de la mise à jour de l'actif.";
      toast({ 
        variant: 'destructive', 
        title: 'Erreur', 
        description: errorMessage 
      });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showPasswordField = type === 'Équipement Réseau' || typeOrdinateur === 'Serveur';

  return (
    <Card className="max-w-2xl mx-auto shadow-xl border-white/20 bg-white/80 backdrop-blur-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Détails de l'actif</CardTitle>
          <CardDescription>
            Modifier les informations techniques et d'assignation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tag">N° d'Inventaire (Lecture seule)</Label>
              <Input id="tag" value={asset.tag} disabled className="bg-slate-50 font-mono" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-bold">Type d'Actif</Label>
              <Select value={type} onValueChange={(value: Asset['type']) => setType(value)}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Sélectionnez un type..." />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {type === "Ordinateur" && (
              <div className="space-y-2">
                <Label htmlFor="typeOrdinateur" className="text-sm font-bold">Type d'Ordinateur</Label>
                <Select value={typeOrdinateur} onValueChange={(value) => setTypeOrdinateur(value as Asset['typeOrdinateur'])}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Sélectionnez un type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {computerTypes.map(ct => <SelectItem key={ct as string} value={ct as string}>{ct}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-bold">Statut</Label>
              <Select value={status} onValueChange={(value: Asset['status']) => setStatus(value)}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  {assetStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fabricant" className="text-sm font-bold">Fabricant</Label>
              <Input 
                id="fabricant" 
                value={fabricant} 
                onChange={(e) => setFabricant(e.target.value)} 
                placeholder="Ex: Dell, HP, Apple..."
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modele" className="text-sm font-bold">Modèle</Label>
              <Input 
                id="modele" 
                value={modele} 
                onChange={(e) => setModele(e.target.value)} 
                required 
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroDeSerie" className="text-sm font-bold">N° de Série</Label>
              <Input 
                id="numeroDeSerie" 
                value={numeroDeSerie} 
                onChange={(e) => setNumeroDeSerie(e.target.value)}
                className="rounded-xl border-slate-200 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ipAddress" className="text-sm font-bold">Adresse IP</Label>
              <Input 
                id="ipAddress" 
                value={ipAddress} 
                onChange={(e) => setIpAddress(e.target.value)} 
                placeholder="Ex: 192.168.1.10"
                className="rounded-xl border-slate-200 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo" className="text-sm font-bold">Assigné à</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                 <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Choisir un employé..." />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="En stock">En stock (Aucun)</SelectItem>
                    {employees.map(emp => (
                        <SelectItem key={emp.id} value={`${emp.lastName} ${emp.firstName}`}>
                            {emp.lastName} {emp.firstName}
                        </SelectItem>
                    ))}
                 </SelectContent>
              </Select>
            </div>
            {showPasswordField && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold">Mot de Passe</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="rounded-xl border-slate-200"
                />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50 rounded-b-xl">
          <Button type="button" variant="ghost" onClick={() => router.back()} className="rounded-xl">
            <X className="mr-2 h-4 w-4" /> Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 px-8">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Enregistrer les modifications
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
