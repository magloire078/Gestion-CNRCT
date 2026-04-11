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
        <div className="min-h-screen bg-transparent">
            {/* Header Institutionnel Glass */}
            <div className="sticky top-0 z-30 w-full bg-white/40 backdrop-blur-xl border-b border-white/10 pb-6 pt-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => router.push("/fleet")} 
                                className="rounded-2xl h-12 w-12 bg-white/50 backdrop-blur-md shadow-sm border border-white/20 hover:bg-white/80 transition-all active:scale-95"
                            >
                                <ChevronLeft className="h-6 w-6 text-slate-600" />
                            </Button>
                            <div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                                        {vehicle.makeModel}
                                    </h1>
                                    <Badge className={cn(
                                        "rounded-full px-5 py-1.5 border font-black uppercase text-[10px] tracking-[0.15em] shadow-lg shadow-current/10", 
                                        statusColors[vehicle.status]
                                    )}>
                                        {vehicle.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-lg">
                                        <Car className="h-3.5 w-3.5" />
                                        <span className="text-[11px] font-black uppercase tracking-wider">{vehicle.plate}</span>
                                    </div>
                                    <span className="h-4 w-px bg-slate-200" />
                                    <span className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                                        Affectation : {vehicle.assignedTo || "Direction Générale"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 bg-white shadow-sm font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">
                                <FileText className="mr-2 h-4 w-4 text-blue-500" /> Fiche Technique
                            </Button>
                            {canEdit && (
                                <Button 
                                    onClick={() => router.push(`/fleet/${vehicle.plate}/edit`)} 
                                    className="h-12 px-6 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                                >
                                    <Pencil className="mr-2 h-4 w-4 text-orange-400" /> Paramétrage
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Colonne Principale (8 cols) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* KPI Grid Premium */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="group relative overflow-hidden border-none bg-slate-900 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:translate-y-[-4px]">
                                <div className="absolute top-0 right-0 p-6 opacity-10 transition-opacity group-hover:opacity-20">
                                    <Gauge className="h-16 w-16 text-white" />
                                </div>
                                <CardContent className="p-7">
                                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4">
                                        <Gauge className="h-6 w-6" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Kilométrage Actuel</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-white tracking-tighter">124,500</span>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">KM</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="group relative overflow-hidden border-none bg-white rounded-[2.5rem] shadow-xl border border-slate-100 transition-all duration-500 hover:translate-y-[-4px]">
                                <CardContent className="p-7">
                                    <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
                                        <Fuel className="h-6 w-6" />
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Source Énergie</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter">Diesel</span>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">80%</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="group relative overflow-hidden border-none bg-white rounded-[2.5rem] shadow-xl border border-slate-100 transition-all duration-500 hover:translate-y-[-4px]">
                                <CardContent className="p-7">
                                    <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                                        <Wrench className="h-6 w-6" />
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Maintenance</p>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-black text-slate-900 leading-tight">15 Octobre</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider italic">Dans approx. 1200 km</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Galerie Image (Mockup Premium) */}
                        <Card className="border-none bg-card/40 backdrop-blur-md rounded-[2.5rem] shadow-xl overflow-hidden group">
                            <div className="relative aspect-[21/9] w-full bg-slate-200 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                                <div className="absolute bottom-6 left-8 z-20">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:bg-white/40 transition-all">
                                            <Info className="h-5 w-5" />
                                        </div>
                                        <span className="text-white font-black uppercase text-xs tracking-widest">Vue Panoramique Extérieure</span>
                                    </div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center transition-transform duration-700 group-hover:scale-105 bg-[url('https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
                                </div>
                            </div>
                            <div className="p-4 flex gap-4 overflow-x-auto custom-scrollbar bg-white/40 border-t border-white/20">
                                {[1,2,3,4].map((i) => (
                                    <div key={i} className="min-w-[120px] aspect-square rounded-2xl bg-slate-100 border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer overflow-hidden flex items-center justify-center text-slate-400 italic text-[10px]">
                                         Photo {i}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <div className="bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-white/20 p-8 shadow-xl">
                            <Tabs defaultValue="info" className="w-full">
                                <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl w-full justify-start h-auto gap-1">
                                    <TabsTrigger value="info" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg">
                                        <Info className="h-4 w-4 mr-2" /> Spécifications
                                    </TabsTrigger>
                                    <TabsTrigger value="maintenance" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg">
                                        <History className="h-4 w-4 mr-2" /> Historique
                                    </TabsTrigger>
                                    <TabsTrigger value="docs" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg">
                                        <FileText className="h-4 w-4 mr-2" /> Documents
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="info" className="pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <Shield className="h-4 w-4" />
                                                </div>
                                                <h3 className="font-black uppercase tracking-widest text-xs text-slate-500">Données Techniques</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Constructeur</span>
                                                    <span className="text-sm font-black text-slate-800 tracking-tight">{vehicle.makeModel.split(' ')[0]}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Immatriculation</span>
                                                    <span className="text-sm font-black text-blue-600 tracking-wider font-mono">{vehicle.plate}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Millésime</span>
                                                    <span className="text-sm font-black text-slate-800 tracking-tight">2021 (Phase 2)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                                    <UserCog className="h-4 w-4" />
                                                </div>
                                                <h3 className="font-black uppercase tracking-widest text-xs text-slate-500">Affectation</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Utilisateur Actuel</span>
                                                    <span className="text-sm font-black text-slate-800 tracking-tight uppercase leading-none">{vehicle.assignedTo || "Pool CG"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Service</span>
                                                    <span className="text-xs font-black text-slate-500 tracking-widest uppercase">Moyens Généraux</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Mise en service</span>
                                                    <span className="text-sm font-black text-slate-800 tracking-tight">05 Janv. 2022</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="maintenance" className="pt-8">
                                    <div className="space-y-6">
                                        <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm flex items-center justify-between border-l-8 border-l-blue-600 relative overflow-hidden group">
                                            <div className="absolute right-0 top-0 h-full w-32 bg-blue-50/50 skew-x-12 translate-x-16 transition-transform group-hover:translate-x-12" />
                                            <div className="flex items-center gap-5 relative z-10">
                                                <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                                                    <Calendar className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase text-xs tracking-tight text-slate-900">Prochaine visite programmée</p>
                                                    <p className="text-2xl font-black text-blue-600 tracking-tighter mt-1">{vehicle.maintenanceDue}</p>
                                                </div>
                                            </div>
                                            <Button className="rounded-xl h-10 px-5 bg-blue-600 font-bold uppercase tracking-widest text-[10px] text-white hover:bg-blue-700 relative z-10">
                                                Détails techniques
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Interventions Récentes</h4>
                                            {[1, 2].map((i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between">
                                                            <p className="text-xs font-black uppercase tracking-tight text-slate-800">Révision Périodique</p>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">15 Sept 2023</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 font-medium">Garage CNRCT - Intervenant : A. Traore</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="docs" className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {[
                                        { label: "Carte Grise", format: "PDF • 2.4 MB", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
                                        { label: "Assurance 2024", format: "PDF • 1.1 MB", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
                                        { label: "Visit Technique", format: "IMAGE • 0.8 MB", icon: CheckCircle2, color: "text-orange-600", bg: "bg-orange-50" },
                                     ].map((doc, idx) => (
                                        <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between hover:shadow-xl hover:translate-y-[-2px] transition-all cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", doc.bg, doc.color)}>
                                                    <doc.icon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">{doc.label}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5">{doc.format}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-blue-600 transition-colors">
                                                <History className="h-5 w-5" />
                                            </Button>
                                        </div>
                                     ))}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Sidebar de Commande (4 cols) */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Statut Card Institutional */}
                        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                            <div className={cn("h-3 bg-gradient-to-r", 
                                vehicle.status === 'Disponible' ? "from-emerald-500 to-teal-400" :
                                vehicle.status === 'En mission' ? "from-blue-600 to-indigo-400" :
                                "from-rose-500 to-orange-400"
                            )} />
                            <CardHeader className="text-center pb-0">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Positionnement</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "h-32 w-32 rounded-full flex items-center justify-center border-[8px] border-slate-50 shadow-inner",
                                        statusColors[vehicle.status]
                                    )}>
                                        <Car className="h-14 w-14" />
                                    </div>
                                    <div className="mt-6 text-center">
                                        <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{vehicle.status}</h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Depuis le 12 Février</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-rose-500" /> Localisation
                                        </span>
                                        <span className="text-xs font-black text-slate-700 uppercase">Garage Central</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Settings className="h-4 w-4 text-blue-500" /> Prochain CT 
                                        </span>
                                        <span className="text-xs font-black text-rose-600 uppercase">15 Jours</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4">
                                    <Button className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-slate-900/40 active:scale-95">
                                        Assigner une Mission
                                    </Button>
                                    <Button variant="ghost" className="w-full h-14 border border-slate-100 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50">
                                        Rapports de consommation
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
