"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getVehicle, updateVehicle } from "@/services/fleet-service";
import type { Fleet } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Loader2, Save, X } from "lucide-react";
import Link from "next/link";

export default function EditVehiclePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { hasPermission } = useAuth();
    
    const [vehicle, setVehicle] = useState<Fleet | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { loading: authLoading } = useAuth();

    // Form fields
    const [makeModel, setMakeModel] = useState("");
    const [make, setMake] = useState("");
    const [modelType, setModelType] = useState("");
    const [initialPlate, setInitialPlate] = useState("");
    const [chassisNumber, setChassisNumber] = useState("");
    const [dateMiseService, setDateMiseService] = useState("");
    const [tutelle, setTutelle] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [status, setStatus] = useState<Fleet['status']>("Disponible");
    const [maintenanceDue, setMaintenanceDue] = useState("");

    const plateId = decodeURIComponent(params.id as string);

    useEffect(() => {
        if (authLoading) return;

        if (!hasPermission('page:fleet:view')) {
            toast({
                variant: "destructive",
                title: "Accès refusé",
                description: "Vous n'avez pas les permissions nécessaires pour modifier un véhicule."
            });
            router.push("/fleet");
            return;
        }

        if (!plateId) return;

        getVehicle(plateId)
            .then(veh => {
                if (veh) {
                    setVehicle(veh);
                    setMakeModel(veh.makeModel || "");
                    setMake(veh.make || "");
                    setModelType(veh.modelType || "");
                    setInitialPlate(veh.initialPlate || "");
                    setChassisNumber(veh.chassisNumber || "");
                    setDateMiseService(veh.dateMiseService || "");
                    setTutelle(veh.tutelle || "");
                    setAssignedTo(veh.assignedTo || "");
                    setStatus(veh.status || "Disponible");
                    setMaintenanceDue(veh.maintenanceDue || "");
                } else {
                    toast({
                        variant: "destructive",
                        title: "Erreur",
                        description: "Véhicule non trouvé."
                    });
                    router.push("/fleet");
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [plateId, router, toast, hasPermission, authLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!makeModel || !maintenanceDue) {
            toast({
                variant: "destructive",
                title: "Erreur de validation",
                description: "Veuillez remplir tous les champs obligatoires (Marque & Modèle, Prochain entretien)."
            });
            return;
        }

        setIsSaving(true);

        try {
            const updatedData: Partial<Fleet> = {
                makeModel,
                make,
                modelType,
                initialPlate,
                chassisNumber,
                dateMiseService,
                tutelle,
                assignedTo,
                status,
                maintenanceDue,
            };

            await updateVehicle(plateId, updatedData);

            toast({
                title: "Véhicule mis à jour",
                description: `Les données du véhicule ${plateId} ont été modifiées avec succès.`,
            });
            router.push(`/fleet/${encodeURIComponent(plateId)}`);
        } catch (err) {
            console.error(err);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible d'enregistrer les modifications."
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-4 animate-pulse pt-8">
                <div className="h-10 w-48 bg-slate-200 rounded-lg" />
                <div className="h-[600px] bg-slate-100 rounded-2xl" />
            </div>
        );
    }

    if (!vehicle) return null;

    return (
        <div className="flex flex-col gap-5 pb-10">
             {/* --- PREMIUM EDIT HEADER --- */}
            <div className="relative overflow-hidden rounded-xl bg-slate-900 p-5 md:p-12 shadow-2xl border border-white/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.15),transparent)] opacity-50" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4 text-left">
                        <Link 
                            href={`/fleet/${encodeURIComponent(vehicle.plate)}`} 
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-blue-400 hover:text-blue-300 transition-colors group"
                        >
                            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Retour à la fiche véhicule
                        </Link>
                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-tight">
                                Paramétrage <br/> 
                                <span className="text-slate-500 font-medium tracking-tight normal-case">{vehicle.makeModel}</span>
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> Édition sécurisée de la flotte automobile
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md hidden md:block text-right">
                         <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">IMMATRICULATION</div>
                         <div className="text-xl font-bold text-white tracking-wider uppercase">{vehicle.plate}</div>
                    </div>
                </div>
            </div>
            
            <div className="relative z-10 max-w-4xl mx-auto w-full">
                <Card className="border-none bg-white rounded-2xl shadow-xl overflow-hidden">
                    <CardHeader className="p-6 bg-slate-900/[0.02] border-b border-slate-100 text-left">
                        <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Formulaire de Modification</CardTitle>
                        <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Veuillez remplir les informations techniques du véhicule
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6 text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Plate */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                        Plaque d'Immatriculation Actuelle
                                    </Label>
                                    <Input
                                        value={vehicle.plate}
                                        disabled
                                        className="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-500 cursor-not-allowed"
                                    />
                                </div>

                                {/* Initial Plate */}
                                <div className="space-y-2">
                                    <Label htmlFor="initialPlate" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                        Plaque d'Immatriculation Initiale (Réimmatriculation)
                                    </Label>
                                    <Input
                                        id="initialPlate"
                                        value={initialPlate}
                                        onChange={(e) => setInitialPlate(e.target.value)}
                                        placeholder="Ex: 5678 CD 01"
                                        className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                                    />
                                </div>

                                {/* Marque & Modèle */}
                                <div className="space-y-2">
                                    <Label htmlFor="makeModel" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                        Désignation (Marque & Modèle) <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="makeModel"
                                        value={makeModel}
                                        onChange={(e) => setMakeModel(e.target.value)}
                                        placeholder="Ex: Toyota Land Cruiser"
                                        required
                                        className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                                    />
                                </div>

                                {/* Marque */}
                                <div className="space-y-2">
                                    <Label htmlFor="make" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                        Marque
                                    </Label>
                                    <Input
                                        id="make"
                                        value={make}
                                        onChange={(e) => setMake(e.target.value)}
                                        placeholder="Ex: Toyota"
                                        className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                                    />
                                </div>

                                {/* Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="modelType" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                        Type / Modèle
                                    </Label>
                                    <Input
                                        id="modelType"
                                        value={modelType}
                                        onChange={(e) => setModelType(e.target.value)}
                                        placeholder="Ex: SUV V8"
                                        className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                                    />
                                </div>

                                {/* Chassis */}
                                <div className="space-y-2">
                                    <Label htmlFor="chassisNumber" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                        Numéro de Châssis
                                    </Label>
                                    <Input
                                        id="chassisNumber"
                                        value={chassisNumber}
                                        onChange={(e) => setChassisNumber(e.target.value)}
                                        placeholder="Ex: JTEKB9FJ808..."
                                        className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                                    />
                                </div>

                                {/* Date mise en service */}
                                <div className="space-y-2">
                                    <Label htmlFor="dateMiseService" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                        Date de mise en service
                                    </Label>
                                    <Input
                                        id="dateMiseService"
                                        type="date"
                                        value={dateMiseService}
                                        onChange={(e) => setDateMiseService(e.target.value)}
                                        className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                                    />
                                </div>

                                {/* Tutelle */}
                                <div className="space-y-2">
                                    <Label htmlFor="tutelle" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                        Tutelle
                                    </Label>
                                    <Input
                                        id="tutelle"
                                        value={tutelle}
                                        onChange={(e) => setTutelle(e.target.value)}
                                        placeholder="Ex: CNRCT / Présidence"
                                        className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                                    />
                                </div>

                                {/* Affectation / Service / Utilisateur */}
                                <div className="space-y-2">
                                    <Label htmlFor="assignedTo" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                        Affectation (Service ou Utilisateur)
                                    </Label>
                                    <Input
                                        id="assignedTo"
                                        value={assignedTo}
                                        onChange={(e) => setAssignedTo(e.target.value)}
                                        placeholder="Ex: Secrétariat Général / M. Koffi"
                                        className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                                    />
                                </div>

                                {/* Statut Opérationnel */}
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                        Statut Opérationnel
                                    </Label>
                                    <Select value={status} onValueChange={(value: Fleet['status']) => setStatus(value)}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold uppercase text-[10px] tracking-widest">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-2xl">
                                            <SelectItem value="Disponible" className="font-bold py-3 uppercase text-[9px] tracking-widest text-emerald-600">Disponible</SelectItem>
                                            <SelectItem value="En mission" className="font-bold py-3 uppercase text-[9px] tracking-widest text-blue-600">En mission</SelectItem>
                                            <SelectItem value="En maintenance" className="font-bold py-3 uppercase text-[9px] tracking-widest text-orange-600">En maintenance</SelectItem>
                                            <SelectItem value="Hors service" className="font-bold py-3 uppercase text-[9px] tracking-widest text-rose-600">Hors service</SelectItem>
                                            <SelectItem value="Réformé" className="font-bold py-3 uppercase text-[9px] tracking-widest text-slate-500">Réformé</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Prochain entretien */}
                                <div className="space-y-2">
                                    <Label htmlFor="maintenanceDue" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                        Prochain Entretien <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="maintenanceDue"
                                        type="date"
                                        value={maintenanceDue}
                                        onChange={(e) => setMaintenanceDue(e.target.value)}
                                        required
                                        className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push(`/fleet/${encodeURIComponent(vehicle.plate)}`)}
                                    className="h-12 px-6 rounded-xl border-slate-200 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all text-slate-500 w-full sm:w-auto"
                                >
                                    <X className="mr-2 h-4 w-4" /> Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="h-12 px-6 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95 w-full sm:w-auto"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4 text-emerald-400" /> Enregistrer
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
