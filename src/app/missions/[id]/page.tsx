"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ChevronLeft, Pencil, Calendar, 
    MapPin, Users, FileText, 
    CheckCircle2, Clock, XCircle, 
    ArrowRight, Printer, Share2,
    Shield, Building2, Briefcase,
    Info, ListChecks, Landmark,
    Car, Hotel, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getMission } from "@/services/mission-service";
import type { Mission } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings, MissionParticipant } from "@/lib/data";
import { GroupMissionRequestPrint, IndividualMissionSlipPrint } from "@/components/missions/mission-print-templates";

export default function MissionDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [mission, setMission] = useState<Mission | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, hasPermission } = useAuth();
    
    const [logos, setLogos] = useState<OrganizationSettings | null>(null);
    const [showGroupPrint, setShowGroupPrint] = useState(false);
    const [showIndividualPrint, setShowIndividualPrint] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<MissionParticipant | null>(null);

    const canEdit = hasPermission('page:missions:view');

    useEffect(() => {
        async function fetchMission() {
            try {
                const [data, orgSettings] = await Promise.all([
                    getMission(id),
                    getOrganizationSettings()
                ]);
                if (data) {
                    setMission(data);
                }
                if (orgSettings) {
                    setLogos(orgSettings);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchMission();
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

    if (!mission) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold">Mission non trouvée</h1>
                <Button variant="link" onClick={() => router.push("/missions")}>
                    Retour à la liste
                </Button>
            </div>
        );
    }

    const statusIcons = {
        'Planifiée': <Clock className="h-4 w-4" />,
        'En cours': <Clock className="h-4 w-4 animate-pulse" />,
        'Terminée': <CheckCircle2 className="h-4 w-4" />,
        'Annulée': <XCircle className="h-4 w-4" />,
    };

    const statusColors = {
        'Planifiée': 'bg-blue-100 text-blue-800 border-blue-200',
        'En cours': 'bg-amber-100 text-amber-800 border-amber-200',
        'Terminée': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'Annulée': 'bg-rose-100 text-rose-800 border-rose-200',
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
                                onClick={() => router.push("/missions")} 
                                className="rounded-2xl h-12 w-12 bg-white/50 backdrop-blur-md shadow-sm border border-white/20 hover:bg-white/80 transition-all active:scale-95"
                            >
                                <ChevronLeft className="h-6 w-6 text-slate-600" />
                            </Button>
                            <div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                                        {mission.title}
                                    </h1>
                                    <Badge className={cn(
                                        "rounded-full px-5 py-1.5 border font-black uppercase text-[10px] tracking-[0.15em] shadow-lg shadow-current/10 flex items-center gap-2", 
                                        statusColors[mission.status]
                                    )}>
                                        {statusIcons[mission.status]}
                                        {mission.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-lg shadow-lg shadow-slate-900/10">
                                        <FileText className="h-3.5 w-3.5" />
                                        <span className="text-[11px] font-black uppercase tracking-wider">Dossier N° {mission.numeroMission}</span>
                                    </div>
                                    <span className="h-4 w-px bg-slate-200" />
                                    <span className="text-slate-500 font-bold uppercase text-[11px] tracking-widest flex items-center gap-2">
                                        <Building2 className="h-3.5 w-3.5" /> Administration Centrale
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowGroupPrint(true)}
                                className="h-12 px-6 rounded-2xl border-slate-200 bg-white shadow-sm font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                            >
                                <Printer className="mr-2 h-4 w-4 text-blue-500" /> Imprimer Rapport
                            </Button>
                            {canEdit && (
                                <Button 
                                    onClick={() => router.push(`/missions/${id}/edit`)} 
                                    className="h-12 px-6 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                                >
                                    <Pencil className="mr-2 h-4 w-4 text-orange-400" /> Modifier
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
                                    <Calendar className="h-16 w-16 text-white" />
                                </div>
                                <CardContent className="p-7">
                                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Période de Mission</p>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-black text-white tracking-tight uppercase leading-none">
                                            {format(parseISO(mission.startDate), "dd MMM", { locale: fr })} - {format(parseISO(mission.endDate), "dd MMM yyyy", { locale: fr })}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="group relative overflow-hidden border-none bg-white rounded-[2.5rem] shadow-xl border border-slate-100 transition-all duration-500 hover:translate-y-[-4px]">
                                <CardContent className="p-7">
                                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Destination</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{mission.lieuMission || "National"}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="group relative overflow-hidden border-none bg-white rounded-[2.5rem] shadow-xl border border-slate-100 transition-all duration-500 hover:translate-y-[-4px]">
                                <CardContent className="p-7">
                                    <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Effectif Engagé</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{(mission.participants || []).length}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Agents</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-white/20 p-8 shadow-xl">
                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl w-full justify-start h-auto gap-1">
                                    <TabsTrigger value="overview" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg">
                                        <Info className="h-4 w-4 mr-2" /> Présentation
                                    </TabsTrigger>
                                    <TabsTrigger value="team" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg">
                                        <Users className="h-4 w-4 mr-2" /> Participants
                                    </TabsTrigger>
                                    <TabsTrigger value="logistics" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg">
                                        <Car className="h-4 w-4 mr-2" /> Logistique & Budget
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                <ListChecks className="h-4 w-4" />
                                            </div>
                                            <h3 className="font-black uppercase tracking-widest text-xs text-slate-500">Note de Mission</h3>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50/50 p-6 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                                            {mission.description || "Aucune description détaillée."}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                                    <Landmark className="h-4 w-4" />
                                                </div>
                                                <h3 className="font-black uppercase tracking-widest text-xs text-slate-500">Cadre Juridique</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 group transition-all hover:translate-x-1">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Organisation</span>
                                                    <span className="text-sm font-black text-slate-800 tracking-tight uppercase leading-none">CNRCT Administration</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 group transition-all hover:translate-x-1">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Niveau Sécurité</span>
                                                    <span className="text-sm font-black text-emerald-600 tracking-wider">USAGE INTERNE</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group">
                                             <div className="absolute right-0 top-0 h-full w-24 bg-white/5 skew-x-12 translate-x-12" />
                                             <div className="relative z-10">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Info className="h-4 w-4 text-blue-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rappel Procédural</span>
                                                </div>
                                                <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                                                    Tout frais engagé hors cadre doit être validé par la Direction Financière 
                                                    sous 72h. Le rapport de mission est obligatoire dès le retour.
                                                </p>
                                             </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="team" className="pt-8 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(mission.participants || []).map((p, i) => (
                                            <Card key={i} className="group border-none bg-white rounded-2xl shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all p-4 border border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                                                        {p.employeeName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black uppercase text-xs tracking-tight text-slate-900">{p.employeeName}</p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <div className="bg-slate-100 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-slate-500 uppercase">
                                                                {p.numeroOrdre || "No-00"}
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                                                                <Car className="h-3 w-3" /> {p.moyenTransport}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-9 w-9 rounded-xl text-blue-600 hover:bg-blue-50" 
                                                        onClick={() => {
                                                            setSelectedParticipant(p);
                                                            setShowIndividualPrint(true);
                                                        }}
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-100" onClick={() => router.push(`/employees/${p.employeeId}`)}>
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="logistics" className="pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative group">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
                                        <div className="absolute right-0 top-0 h-full w-48 bg-blue-500/5 -skew-x-12 translate-x-24 group-hover:translate-x-20 transition-transform duration-1000" />
                                        <CardContent className="p-10 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <CreditCard className="h-5 w-5 text-blue-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Plafond Budgétaire Prévisionnel</span>
                                                </div>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-6xl font-black tracking-tighter text-white leading-none">
                                                        {mission.participants?.reduce((total, p) => 
                                                            total + (p.coutTransport || 0) + (p.coutHebergement || 0) + (p.totalIndemnites || 0), 0
                                                        ).toLocaleString()}
                                                    </span>
                                                    <span className="text-xl font-black text-blue-500 uppercase tracking-widest">FCFA</span>
                                                </div>
                                                <p className="mt-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">Source : Dotation "Projets Spéciaux 2024"</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Engagé</p>
                                                    <p className="text-xl font-black text-white">45%</p>
                                                </div>
                                                <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Reste</p>
                                                    <p className="text-xl font-black text-emerald-400">55%</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-blue-500 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                                    <Car className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transport</p>
                                                    <p className="text-xl font-black text-slate-900 tracking-tight">
                                                        {mission.participants?.reduce((total, p) => total + (p.coutTransport || 0), 0).toLocaleString()} <span className="text-xs">F</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronLeft className="h-5 w-5 text-slate-300 rotate-180 group-hover:text-blue-500" />
                                        </div>

                                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-emerald-500 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                                                    <Hotel className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hébergement</p>
                                                    <p className="text-xl font-black text-slate-900 tracking-tight">
                                                        {mission.participants?.reduce((total, p) => total + (p.coutHebergement || 0), 0).toLocaleString()} <span className="text-xs">F</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronLeft className="h-5 w-5 text-slate-300 rotate-180 group-hover:text-emerald-500" />
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Sidebar de Commande (4 cols) */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Documents Institutional Card */}
                        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden relative">
                             <div className="h-3 bg-slate-900" />
                             <CardHeader className="pb-4">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Documentation & Actes</CardTitle>
                             </CardHeader>
                             <CardContent className="px-6 pb-8 space-y-3">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-blue-500 cursor-pointer transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 leading-none">Ordre de Mission</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-widest">Signé • PDF 1.4 MB</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-500 cursor-pointer transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Share2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 leading-none">Partage Sécurisé</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-widest">Lien Expiration 24h</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" />
                                </div>
                             </CardContent>
                        </Card>

                        {/* Timeline / Update Card */}
                        <div className="p-8 bg-indigo-900 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent)]" />
                             <div className="relative z-10 space-y-5">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-indigo-400" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Journal des Actions</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="border-l-2 border-indigo-500/50 pl-4 py-1">
                                        <p className="text-[11px] font-black uppercase tracking-tight leading-none mb-1">Mission Initialisée</p>
                                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest leading-none">
                                            Le {format(parseISO(mission.startDate), "dd/MM/yyyy")} par ADMIN-01
                                        </p>
                                    </div>
                                    <div className="border-l-2 border-emerald-500/50 pl-4 py-1 opacity-60 group cursor-default">
                                        <p className="text-[11px] font-black uppercase tracking-tight leading-none mb-1">Logistique Validée</p>
                                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Service Moyens Généraux</p>
                                    </div>
                                </div>
                                <Button variant="link" className="text-[9px] p-0 h-auto text-white/50 font-black uppercase tracking-[0.2em] hover:text-white transition-colors">
                                    Voir tout l'historique
                                </Button>
                             </div>
                        </div>

                        {/* Alerte Rappel contextuelle */}
                        <div className="flex items-start gap-4 p-6 bg-orange-50 rounded-[2rem] border border-orange-100">
                            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-orange-800 mb-1.5">Note Procédurale</h4>
                                <p className="text-[10px] text-orange-700 leading-relaxed font-medium italic">
                                    Le rapport de mission définitif doit être soumis via le portail interne 48h après la clôture de l'ordre de mission.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Templates */}
            {showGroupPrint && mission && logos && (
                <GroupMissionRequestPrint 
                    mission={mission} 
                    logos={logos} 
                    onCloseAction={() => setShowGroupPrint(false)} 
                />
            )}

            {showIndividualPrint && mission && logos && selectedParticipant && (
                <IndividualMissionSlipPrint 
                    mission={mission} 
                    participant={selectedParticipant} 
                    logos={logos} 
                    onCloseAction={() => {
                        setShowIndividualPrint(false);
                        setSelectedParticipant(null);
                    }} 
                />
            )}
        </div>
    );
}

function Download({ className }: { className?: string }) {
    return <FileText className={className} />;
}
