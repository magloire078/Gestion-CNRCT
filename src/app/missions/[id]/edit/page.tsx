

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMission, updateMission } from "@/services/mission-service";
import type { Mission, Employe, MissionParticipant, Fleet } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";
import { getVehicles } from "@/services/fleet-service";
import { cn } from "@/lib/utils";

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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save, X, Check, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

type Status = "Planifiée" | "En cours" | "Terminée" | "Annulée";

export default function MissionEditPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { toast } = useToast();

    const [mission, setMission] = useState<Partial<Mission> | null>(null);
    const [allEmployees, setAllEmployees] = useState<Employe[]>([]);
    const [fleetVehicles, setFleetVehicles] = useState<Fleet[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (typeof id !== 'string') return;
        async function fetchMissionData() {
            try {
                const [data, employees, vehicles] = await Promise.all([
                    getMission(id),
                    getEmployees(),
                    getVehicles(),
                ]);
                setMission(data);
                setAllEmployees(employees.filter(e => e.status === 'Actif'));
                setFleetVehicles(vehicles);
            } catch (error) {
                console.error("Failed to fetch mission data", error);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données de la mission." });
            } finally {
                setLoading(false);
            }
        }
        fetchMissionData();
    }, [id, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setMission(prev => prev ? { ...prev, [name]: value } : null);
    };
    
    const handleSelectChange = (name: string, value: string) => {
        setMission(prev => prev ? { ...prev, [name]: value } : null);
    };

    const toggleParticipant = (employeeName: string) => {
        setMission(prev => {
            if (!prev) return null;
            const currentParticipants = prev.participants || [];
            const isAssigned = currentParticipants.some(p => p.employeeName === employeeName);

            if (isAssigned) {
                return { ...prev, participants: currentParticipants.filter(p => p.employeeName !== employeeName) };
            } else {
                return { ...prev, participants: [...currentParticipants, { employeeName, moyenTransport: undefined, immatriculation: '' }] };
            }
        });
    };
    
    const handleParticipantVehicleChange = (employeeName: string, field: keyof Omit<MissionParticipant, 'employeeName' | 'numeroOrdre'>, value: string) => {
        setMission(prev => {
            if (!prev || !prev.participants) return prev;
            const newParticipants = prev.participants.map(p => 
                p.employeeName === employeeName ? { ...p, [field]: value } : p
            );
            return { ...prev, participants: newParticipants };
        });
    };

    const handleSave = async () => {
        if (!mission || typeof id !== 'string') return;
        setIsSaving(true);
        try {
            await updateMission(id, mission);
            toast({ title: "Succès", description: "Les informations de la mission ont été mises à jour." });
            router.back();
        } catch (error) {
            console.error("Failed to save mission", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les modifications." });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return (
             <div className="max-w-2xl mx-auto flex flex-col gap-6">
                <Skeleton className="h-10 w-48" />
                <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
            </div>
        );
    }

    if (!mission) {
        return <div className="text-center py-10">Mission non trouvée.</div>;
    }

    return (
         <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                 </Button>
                 <div>
                    <h1 className="text-2xl font-bold tracking-tight">Modifier la Mission</h1>
                    <p className="text-muted-foreground">{mission.title}</p>
                 </div>
                 <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                </Button>
            </div>
            
            <Card>
                <CardHeader><CardTitle>Détails de la Mission</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="numeroMission">N° Mission</Label>
                        <Input id="numeroMission" name="numeroMission" value={mission.numeroMission || ''} className="bg-muted" readOnly />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre</Label>
                        <Input id="title" name="title" value={mission.title || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Description / Objectifs</Label>
                        <Textarea id="description" name="description" value={mission.description || ''} onChange={handleInputChange} rows={4} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="lieuMission">Lieu</Label>
                        <Input id="lieuMission" name="lieuMission" value={mission.lieuMission || ''} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Date de début</Label>
                            <Input id="startDate" name="startDate" type="date" value={mission.startDate || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">Date de fin</Label>
                            <Input id="endDate" name="endDate" type="date" value={mission.endDate || ''} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Statut</Label>
                         <Select value={mission.status || ''} onValueChange={(v) => handleSelectChange('status', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Planifiée">Planifiée</SelectItem>
                                <SelectItem value="En cours">En cours</SelectItem>
                                <SelectItem value="Terminée">Terminée</SelectItem>
                                <SelectItem value="Annulée">Annulée</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <Label>Participants & Véhicules</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start font-normal">
                                Ajouter / Retirer des participants...
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Rechercher un employé..."/>
                                <CommandList>
                                <CommandEmpty>Aucun employé trouvé.</CommandEmpty>
                                <CommandGroup>
                                    {allEmployees.map(emp => (
                                    <CommandItem key={emp.id} onSelect={() => toggleParticipant(emp.name)}>
                                        <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", mission.participants?.some(p => p.employeeName === emp.name) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                          <Check className="h-4 w-4" />
                                        </div>
                                        <span>{emp.name}</span>
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                            </PopoverContent>
                        </Popover>

                        <div className="space-y-4">
                            {mission.participants?.map(p => (
                                <div key={p.employeeName} className="p-3 border rounded-md space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium">{p.employeeName}</p>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleParticipant(p.employeeName)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label htmlFor={`transport-${p.employeeName}`} className="text-xs">Moyen de Transport</Label>
                                            <Select value={p.moyenTransport} onValueChange={(value: MissionParticipant['moyenTransport']) => handleParticipantVehicleChange(p.employeeName, 'moyenTransport', value!)}>
                                                <SelectTrigger id={`transport-${p.employeeName}`}>
                                                    <SelectValue placeholder="Sélectionnez..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Véhicule personnel">Véhicule personnel</SelectItem>
                                                    <SelectItem value="Véhicule CNRCT">Véhicule CNRCT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`immat-${p.employeeName}`} className="text-xs">Immatriculation</Label>
                                            <Select value={p.immatriculation} onValueChange={(value) => handleParticipantVehicleChange(p.employeeName, 'immatriculation', value)}>
                                                <SelectTrigger id={`immat-${p.employeeName}`}>
                                                    <SelectValue placeholder="Sélectionnez un véhicule..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">Aucun</SelectItem>
                                                    {fleetVehicles.map(v => (
                                                        <SelectItem key={v.plate} value={v.plate}>{v.plate} ({v.makeModel})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
