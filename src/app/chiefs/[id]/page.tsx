"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { 
    ChevronLeft, MapPin, Phone, Mail, 
    Calendar, Shield, User, FileText, 
    Pencil, ArrowRight, Share2, Printer,
    CheckCircle2, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getChief } from "@/services/chief-service";
import { subscribeToConflicts } from "@/services/conflict-service";
import type { Chief } from "@/lib/data";
import type { Conflict } from "@/types/common";
import { cn } from "@/lib/utils";
import { TrendingUp, AlertTriangle, Loader2 } from "lucide-react";

const GISMap = dynamic(() => import('@/components/common/gis-map-v3').then(m => m.GISMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed">
        <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Chargement de la carte...</p>
    </div>
  ),
});

export default function ChiefProfilePage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [chief, setChief] = useState<Chief | null>(null);
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        async function fetchChief() {
            try {
                const data = await getChief(id);
                setChief(data);
                
                // Subscribe to conflicts for this chief's area
                unsubscribe = subscribeToConflicts(
                    (allConflicts) => {
                        const related = allConflicts.filter(c => 
                            (c.village === data?.village) || 
                            (c.region === data?.region)
                        );
                        setConflicts(related);
                    },
                    (err) => console.error(err)
                );

            } catch (err) {
                console.error("Error fetching chief details:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchChief();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto py-8 space-y-8 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded mb-4" />
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <Skeleton className="h-48 w-48 rounded-2xl" />
                    <div className="space-y-4 flex-1">
                        <Skeleton className="h-10 w-2/3" />
                        <Skeleton className="h-6 w-1/3" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 col-span-2" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (!chief) {
        return (
            <div className="container mx-auto py-20 text-center space-y-4">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
                <h2 className="text-2xl font-bold">Chef non trouvé</h2>
                <p className="text-muted-foreground">L'autorité que vous recherchez n'existe pas ou a été déplacée.</p>
                <Button variant="outline" onClick={() => router.push("/chiefs")}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Retour au répertoire
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 pb-20 space-y-8">
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-slate-100">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <Printer className="mr-2 h-4 w-4" /> Imprimer la fiche
                    </Button>
                    <Button size="sm" asChild className="bg-slate-900 border-none">
                        <Link href={`/chiefs/${id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Chief Profile card */}
            <div className="relative overflow-hidden rounded-2xl bg-white border shadow-sm p-6 md:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left relative z-10">
                    <div className="relative group">
                        <Avatar className="h-48 w-48 rounded-xl border-4 border-white shadow-2xl transition-transform group-hover:scale-[1.02]">
                            <AvatarImage src={chief.photoUrl} alt={chief.name} className="object-cover" />
                            <AvatarFallback className="text-4xl font-bold bg-slate-100">{chief.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white border-2 border-white shadow-lg">
                            {chief.role}
                        </Badge>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                {chief.title} {chief.name}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-slate-500 font-medium pt-2">
                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    <MapPin className="h-4 w-4 text-blue-500" /> {chief.village}, {chief.region}
                                </span>
                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    <Shield className="h-4 w-4 text-amber-500" /> Registre CNRCT : {chief.CNRCTRegistrationNumber || "En attente"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-semibold uppercase tracking-wider">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400">Date de Désignation</span>
                                <span className="text-slate-800">{chief.designationDate || "Non renseignée"}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-100 hidden sm:block" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400">Mode de Désignation</span>
                                <span className="text-slate-800">{chief.designationMode || "Héritage"}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-100 hidden sm:block" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400">Degré d'autorité</span>
                                <Badge variant="secondary" className="mt-1 w-fit">{chief.role === 'Roi' ? 'SOUVERAIN' : 'NOTABILITÉ'}</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonne Gauche - Détails & Bio */}
                <div className="lg:col-span-2 space-y-8">
                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6 bg-slate-100/50 p-1 rounded-xl">
                            <TabsTrigger value="info" className="rounded-lg font-bold text-xs uppercase tracking-widest">Général</TabsTrigger>
                            <TabsTrigger value="territory" className="rounded-lg font-bold text-xs uppercase tracking-widest">Territoire</TabsTrigger>
                            <TabsTrigger value="tensions" className="rounded-lg font-bold text-xs uppercase tracking-widest relative">
                                Tensions
                                {conflicts.filter(c => c.status !== 'Résolu').length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white border-2 border-white animate-pulse">
                                        {conflicts.filter(c => c.status !== 'Résolu').length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="heritage" className="rounded-lg font-bold text-xs uppercase tracking-widest">Histoire</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="info" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="border-none shadow-sm bg-white overflow-hidden">
                                <CardHeader className="border-b bg-slate-50/50">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">Biographie & Mission</CardTitle>
                                            <CardDescription>Parcours et engagements officiels</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                                        {chief.bio || "Aucune biographie enregistrée pour cette autorité."}
                                    </p>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Card className="border-none shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="border-b bg-slate-50/50">
                                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Identité Civile</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-sm text-slate-500 font-medium">Nom complet</span>
                                            <span className="text-sm font-bold text-slate-800">{chief.lastName} {chief.firstName}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-sm text-slate-500 font-medium">Sexe</span>
                                            <span className="text-sm font-bold text-slate-800">{chief.sexe || "Masculin"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-sm text-slate-500 font-medium">Date de naissance</span>
                                            <span className="text-sm font-bold text-slate-800">{chief.dateOfBirth || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-sm text-slate-500 font-medium">Groupe Ethnique</span>
                                            <span className="text-sm font-bold text-slate-800">{chief.ethnicGroup || "N/A"}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="border-b bg-slate-50/50">
                                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Contact Officiel</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        {chief.phone && (
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-colors">
                                                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Téléphone Principal</p>
                                                    <p className="text-sm font-bold text-slate-800">{chief.phone}</p>
                                                </div>
                                            </div>
                                        )}
                                        {chief.contact && (
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-colors">
                                                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{chief.phone ? "Contact Secondaire" : "Contact"}</p>
                                                    <p className="text-sm font-bold text-slate-800">{chief.contact}</p>
                                                </div>
                                            </div>
                                        )}
                                        {!chief.phone && !chief.contact && (
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-slate-400">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Coordonnées</p>
                                                    <p className="text-sm font-bold text-slate-400 italic">Non renseigné</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-colors">
                                            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                                                <p className="text-sm font-bold text-slate-800">{chief.email || "Non renseigné"}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="territory" className="space-y-6">
                            <Card className="border-none shadow-sm overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="aspect-video w-full rounded-xl overflow-hidden shadow-inner border border-slate-100">
                                        <GISMap 
                                          chiefs={[chief]} 
                                          conflicts={conflicts}
                                          selectedId={chief.id}
                                          showFilters={false}
                                          height="100%"
                                        />
                                    </div>
                                    
                                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 rounded-xl bg-white border shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Village</p>
                                            <p className="text-sm font-bold text-slate-800">{chief.village}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white border shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">S/Préfecture</p>
                                            <p className="text-sm font-bold text-slate-800">{chief.subPrefecture}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white border shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Département</p>
                                            <p className="text-sm font-bold text-slate-800">{chief.department}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white border shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Région</p>
                                            <p className="text-sm font-bold text-slate-800">{chief.region}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="tensions" className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                    <AlertCircle className="h-6 w-6 text-rose-500" /> Stabilité Territoriale
                                </h3>
                                <Badge variant="outline" className="font-black text-[10px] uppercase border-slate-200">
                                    {conflicts.length} Dossiers répertoriés
                                </Badge>
                            </div>

                            <Card className="border-none shadow-sm overflow-hidden">
                                <CardContent className="p-0">
                                    {conflicts.length === 0 ? (
                                        <div className="p-12 text-center space-y-4">
                                            <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                                                <CheckCircle2 className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-sm">Zone Pacifiée</p>
                                                <p className="text-xs text-slate-400">Aucun conflit répertorié dans le ressort de cette autorité.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {conflicts.map(conflict => (
                                                <div key={conflict.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-6">
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <Badge className={cn(
                                                                "font-black text-[9px] uppercase tracking-widest border-none",
                                                                conflict.status === 'Résolu' ? "bg-emerald-50 text-emerald-600" : 
                                                                conflict.status === 'En médiation' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                                                            )}>
                                                                {conflict.status}
                                                            </Badge>
                                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">ID: {conflict.trackingId || '—'}</span>
                                                        </div>
                                                        <h4 className="text-base font-black text-slate-900 leading-snug">
                                                            {conflict.type}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 font-medium line-clamp-2">
                                                            Parties : <span className="text-slate-700 font-bold">{conflict.parties}</span>
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col md:items-end justify-between gap-4">
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase text-right">
                                                            Signalé le : {conflict.reportedDate || 'N/A'}
                                                        </div>
                                                        <Button size="sm" variant="ghost" className="h-9 rounded-xl font-bold text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 group" asChild>
                                                            <Link href="/conflicts">
                                                                Détails du dossier <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-amber-900 text-sm uppercase">Rôle de Médiation</p>
                                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                            En tant qu'autorité traditionnelle, Sa Majesté est le premier garant de la paix sociale dans son ressort. 
                                            Tout nouveau dossier ouvert dans cette zone est automatiquement notifié au bureau de médiation territoriale.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Colonne Droite - Statut & Sidebar */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg bg-slate-900 text-white overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Statut Administratif</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-bold">Autorité Reconnue</p>
                                    <p className="text-xs text-slate-400">En règle avec le CNRCT</p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-white/10">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400 font-medium">Vérification Documents</span>
                                    <span className="text-emerald-400 font-bold">100%</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-full" />
                                </div>
                            </div>

                            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold" size="sm">
                                Télécharger l'Arrêté
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-indigo-50/50 border border-indigo-100">
                        <CardHeader>
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-900 flex items-center gap-2">
                                <User className="h-3.5 w-3.5" />
                                Hiérarchie Traditionnelle
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 rounded-xl bg-white border border-indigo-100 shadow-sm flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Autorité de tutelle</p>
                                    <p className="text-xs font-bold text-slate-800 truncate">Conseil des Rois de {chief.region}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-300" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
