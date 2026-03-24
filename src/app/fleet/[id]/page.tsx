"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ChevronLeft, Pencil, Car, 
    Gauge, Fuel, Calendar, 
    Wrench, User, Shield, 
    Info, History, MapPin,
    AlertTriangle, CheckCircle2,
    FileText, UserCog, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getVehicle } from "@/services/fleet-service";
import type { Fleet } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function VehicleDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [vehicle, setVehicle] = useState<Fleet | null>(null);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = useAuth();

    const canEdit = hasPermission('page:fleet:view');

    useEffect(() => {
        async function fetchVehicle() {
            try {
                const data = await getVehicle(id);
                if (data) {
                    setVehicle(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchVehicle();
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto py-8 space-y-8">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-80 w-full" />
                    </div>
                    <Skeleton className="h-[500px] w-full" />
                </div>
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="container mx-auto py-20 text-center">
                <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h1 className="text-2xl font-bold">Véhicule non trouvé</h1>
                <Button variant="link" onClick={() => router.push("/fleet")}>
                    Retour à la flotte
                </Button>
            </div>
        );
    }

    const statusColors = {
        'Disponible': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'En mission': 'bg-blue-100 text-blue-800 border-blue-200',
        'En maintenance': 'bg-amber-100 text-amber-800 border-amber-200',
        'Hors service': 'bg-rose-100 text-rose-800 border-rose-200',
    };

    return (
        <div className="container mx-auto py-8 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/fleet")} className="rounded-full h-10 w-10">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight">{vehicle.makeModel}</h1>
                            <Badge className={cn("rounded-full px-4 py-1 border shadow-none", statusColors[vehicle.status])}>
                                {vehicle.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            <Car className="h-4 w-4" /> Plaque: {vehicle.plate} • {vehicle.assignedTo || "Direction Générale"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-lg h-10">
                        <FileText className="mr-2 h-4 w-4" /> Fiche Technique
                    </Button>
                    {canEdit && (
                        <Button onClick={() => router.push(`/fleet/${vehicle.plate}/edit`)} className="bg-slate-900 rounded-lg h-10 text-white hover:bg-slate-800">
                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-none shadow-sm bg-slate-900 text-white">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-400">
                                    <Gauge className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kilométrage</p>
                                    <p className="text-sm font-bold">124,500 km</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-blue-50/80">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                                    <Fuel className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Carburant</p>
                                    <p className="text-sm font-bold">Diesel</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-amber-50/80">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                                    <Wrench className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Entretien</p>
                                    <p className="text-sm font-bold">{vehicle.maintenanceDue}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
                            <TabsTrigger value="info" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto">
                                <Info className="h-4 w-4 mr-2" /> Informations
                            </TabsTrigger>
                            <TabsTrigger value="maintenance" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto">
                                <Wrench className="h-4 w-4 mr-2" /> Maintenance
                            </TabsTrigger>
                            <TabsTrigger value="docs" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto">
                                <FileText className="h-4 w-4 mr-2" /> Documents
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="py-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-none shadow-sm bg-slate-50">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                                            <Shield className="h-4 w-4" /> Spécifications Véhicule
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-sm text-muted-foreground">Marque / Modèle</span>
                                            <span className="text-sm font-medium">{vehicle.makeModel}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-sm text-muted-foreground">Immatriculation</span>
                                            <span className="text-sm font-medium font-mono uppercase">{vehicle.plate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Année</span>
                                            <span className="text-sm font-medium">2021</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-slate-50">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                                            <UserCog className="h-4 w-4" /> Affectation Actuelle
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-sm text-muted-foreground">Utilisateur</span>
                                            <span className="text-sm font-medium">{vehicle.assignedTo || "Pool Véhicule"}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-sm text-muted-foreground">Service</span>
                                            <span className="text-sm font-medium font-mono text-xs uppercase">Moyens Généraux</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Date d'affectation</span>
                                            <span className="text-sm font-medium">05 Janv. 2024</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Détails Additionnels</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 leading-relaxed italic border-l-4 border-slate-200 pl-4">
                                        Véhicule de fonction haut de gamme utilisé principalement pour les missions protocolaires. 
                                        Équipé de GPS, climatisation automatique et options de sécurité avancées. 
                                        Dernière inspection visuelle effectuée le mois dernier.
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="maintenance" className="py-6">
                            <div className="space-y-8 relative before:absolute before:inset-0 before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="h-6 w-6 rounded-full bg-amber-500 border-4 border-white shadow-sm ring-1 ring-slate-100 flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-white p-0.5" />
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border-l-4 border-l-amber-500 border shadow-sm flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-sm">Entretien périodique prévu</p>
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">À venir</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Prévu le : {vehicle.maintenanceDue}</p>
                                        <p className="text-[11px] mt-2 text-slate-500 italic">Vérification des freins, vidange et filtres.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-6 relative z-10 opacity-60">
                                    <div className="h-6 w-6 rounded-full bg-emerald-500 border-4 border-white shadow-sm ring-1 ring-slate-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-white p-0.5" />
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border shadow-sm flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-sm">Dernière Maintenance</p>
                                            <span className="text-[10px] text-muted-foreground mr-2">15/09/2023</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Vidange complète effectuée.</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="docs" className="py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold group-hover:text-primary transition-colors">Carte Grise</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">Format PDF • 2.4 MB</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><History className="h-4 w-4" /></Button>
                            </div>
                            <div className="p-4 border rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold group-hover:text-primary transition-colors">Assurance 2024</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">Valide jusqu'au 31/12/2024</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><History className="h-4 w-4" /></Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg overflow-hidden">
                         <div className="h-1.5 bg-gradient-to-r from-blue-600 to-emerald-500 w-full" />
                        <CardHeader>
                            <CardTitle className="text-lg">Statut Global</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                                <div className={cn("h-20 w-20 rounded-full flex items-center justify-center shadow-inner border-4 border-white", statusColors[vehicle.status])}>
                                    <Car className="h-10 w-10" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{vehicle.status}</p>
                                    <p className="text-xs text-muted-foreground">Depuis le 12 Février 2024</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Localisation
                                    </span>
                                    <span className="text-sm font-bold">Garage Central</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Settings className="h-4 w-4" /> Prochain CT
                                    </span>
                                    <span className="text-sm font-bold text-rose-600">15 Jours</span>
                                </div>
                            </div>

                            <Button className="w-full bg-slate-900 text-white rounded-xl h-11">
                                Planifier une mission
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50 border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Log Consommation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <p className="text-xs font-bold">Plein Diesel (45L)</p>
                                        <span className="text-[10px] text-muted-foreground">Hier</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-mono">ID: TK-889021</p>
                                </div>
                            </div>
                            <Button variant="link" className="text-xs p-0 h-auto text-blue-600 font-bold" onClick={() => router.push("/fleet/fuel")}>
                                Voir tout l'historique carburant
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
