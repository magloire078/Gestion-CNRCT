
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getVehicle, updateVehicle } from "@/services/fleet-service";
import type { Fleet, Employe } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VehicleEditPage() {
    const params = useParams();
    const router = useRouter();
    const { plate } = params;
    const { toast } = useToast();

    const [vehicle, setVehicle] = useState<Partial<Fleet> | null>(null);
    const [employees, setEmployees] = useState<Employe[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (typeof plate !== 'string') return;
        
        async function fetchVehicleData() {
            try {
                const [vehicleData, employeesData] = await Promise.all([
                    getVehicle(plate as string),
                    getEmployees()
                ]);

                if (!vehicleData) {
                    toast({ variant: "destructive", title: "Erreur", description: "Véhicule non trouvé." });
                    router.push('/fleet');
                    return;
                }
                
                setVehicle(vehicleData);
                setEmployees(employeesData);

            } catch (error) {
                console.error("Failed to fetch vehicle data", error);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données du véhicule." });
            } finally {
                setLoading(false);
            }
        }
        fetchVehicleData();
    }, [plate, toast, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVehicle(prev => (prev ? { ...prev, [name]: value } : null));
    };

    const handleSelectChange = (name: string, value: string) => {
        setVehicle(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSave = async () => {
        if (!vehicle || typeof plate !== 'string') return;
        setIsSaving(true);
        
        try {
            await updateVehicle(plate, vehicle);
            toast({ title: "Succès", description: "Les informations du véhicule ont été mises à jour." });
            router.back();
        } catch (error) {
            console.error("Failed to save vehicle", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les modifications." });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-xl mx-auto flex flex-col gap-6">
                <Skeleton className="h-10 w-48" />
                <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
            </div>
        );
    }

    if (!vehicle) {
        return <div className="text-center py-10">Véhicule non trouvé.</div>;
    }

    return (
         <div className="max-w-xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                 </Button>
                 <div>
                    <h1 className="text-2xl font-bold tracking-tight">Modifier le Véhicule</h1>
                    <p className="text-muted-foreground">{vehicle.plate}</p>
                 </div>
                 <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                </Button>
            </div>
            
            <Card>
                <CardHeader><CardTitle>Détails du Véhicule</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="plate">Plaque d'immatriculation</Label>
                        <Input id="plate" name="plate" value={vehicle.plate || ''} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="makeModel">Marque & Modèle</Label>
                        <Input id="makeModel" name="makeModel" value={vehicle.makeModel || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="assignedTo">Assigné à</Label>
                        <Select value={vehicle.assignedTo || ''} onValueChange={(v) => handleSelectChange('assignedTo', v)}>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Aucun">Aucun / Véhicule de pool</SelectItem>
                                {employees.map(emp => (
                                    <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Statut</Label>
                         <Select value={vehicle.status || ''} onValueChange={(v) => handleSelectChange('status', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Disponible">Disponible</SelectItem>
                                <SelectItem value="En mission">En mission</SelectItem>
                                <SelectItem value="En maintenance">En maintenance</SelectItem>
                                <SelectItem value="Hors service">Hors service</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceDue">Date du prochain entretien</Label>
                      <Input
                        id="maintenanceDue"
                        name="maintenanceDue"
                        type="date"
                        value={vehicle.maintenanceDue || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
