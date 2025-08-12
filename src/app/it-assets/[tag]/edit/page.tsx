
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAsset, updateAsset } from "@/services/asset-service";
import type { Asset } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";
import type { Employe } from "@/lib/data";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const assetTypes = ["Ordinateur portable", "Moniteur", "Clavier", "Souris", "Logiciel", "Autre"];
const assetStatuses: Asset['status'][] = ['En Utilisation', 'En Stock', 'En Réparation', 'Retiré', 'Actif'];


export default function AssetEditPage() {
    const params = useParams();
    const router = useRouter();
    const { tag } = params;
    const { toast } = useToast();

    const [asset, setAsset] = useState<Partial<Asset> | null>(null);
    const [employees, setEmployees] = useState<Employe[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (typeof tag !== 'string') return;
        
        async function fetchAssetData() {
            try {
                const [assetData, employeesData] = await Promise.all([
                    getAsset(tag),
                    getEmployees()
                ]);

                if (!assetData) {
                    toast({ variant: "destructive", title: "Erreur", description: "Actif non trouvé." });
                    router.push('/it-assets');
                    return;
                }
                
                setAsset(assetData);
                setEmployees(employeesData);

            } catch (error) {
                console.error("Failed to fetch asset data", error);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données de l'actif." });
            } finally {
                setLoading(false);
            }
        }
        fetchAssetData();
    }, [tag, toast, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAsset(prev => (prev ? { ...prev, [name]: value } : null));
    };

    const handleSelectChange = (name: string, value: string) => {
        setAsset(prev => (prev ? { ...prev, [name]: value } : null));
    };

    const handleSave = async () => {
        if (!asset || typeof tag !== 'string') return;
        setIsSaving(true);
        
        try {
            await updateAsset(tag, asset);
            toast({ title: "Succès", description: "Les informations de l'actif ont été mises à jour." });
            router.push(`/it-assets`);
        } catch (error) {
            console.error("Failed to save asset", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les modifications." });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-xl mx-auto flex flex-col gap-6">
                <Skeleton className="h-10 w-48" />
                <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
            </div>
        );
    }

    if (!asset) {
        return <div className="text-center py-10">Actif non trouvé.</div>;
    }

    return (
         <div className="max-w-xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                 </Button>
                 <div>
                    <h1 className="text-2xl font-bold tracking-tight">Modifier l'Actif</h1>
                    <p className="text-muted-foreground">{asset.tag}</p>
                 </div>
                 <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                </Button>
            </div>
            
            <Card>
                <CardHeader><CardTitle>Détails de l'Actif</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="tag">Étiquette d'Actif</Label>
                        <Input id="tag" name="tag" value={asset.tag || ''} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={asset.type || ''} onValueChange={(v) => handleSelectChange('type', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {assetTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model">Modèle</Label>
                        <Input id="model" name="model" value={asset.model || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="assignedTo">Assigné à</Label>
                        <Select value={asset.assignedTo || ''} onValueChange={(v) => handleSelectChange('assignedTo', v)}>
                            <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Unassigned">Non assigné</SelectItem>
                                <SelectItem value="En Stock">En Stock</SelectItem>
                                {employees.map(emp => <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Statut</Label>
                         <Select value={asset.status || ''} onValueChange={(v) => handleSelectChange('status', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {assetStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
