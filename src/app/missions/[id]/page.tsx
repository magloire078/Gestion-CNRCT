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
        <div className="container mx-auto py-8 space-y-8 pb-20">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/missions")} className="rounded-full h-10 w-10">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight">{mission.title}</h1>
                            <Badge className={cn("rounded-full px-4 py-1 flex items-center gap-2 border shadow-none", statusColors[mission.status])}>
                                {statusIcons[mission.status]}
                                {mission.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Dossier N° {mission.numeroMission}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-lg h-10" onClick={() => setShowGroupPrint(true)}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimer
                    </Button>
                    {canEdit && (
                        <Button onClick={() => router.push(`/missions/${id}/edit`)} className="bg-slate-900 rounded-lg h-10">
                            <Pencil className="mr-2 h-4 w-4" /> Modifier la mission
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-none shadow-sm bg-blue-50/50">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Période</p>
                                    <p className="text-sm font-bold">
                                        {format(parseISO(mission.startDate), "dd MMM", { locale: fr })} - {format(parseISO(mission.endDate), "dd MMM yyyy", { locale: fr })}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-emerald-50/50">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Destination</p>
                                    <p className="text-sm font-bold">{mission.lieuMission || "Non spécifié"}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-purple-50/50">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Équipe</p>
                                    <p className="text-sm font-bold">{(mission.participants || []).length} Participant(s)</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto">
                                <Info className="h-4 w-4 mr-2" /> Présentation
                            </TabsTrigger>
                            <TabsTrigger value="team" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto">
                                <Users className="h-4 w-4 mr-2" /> Participants
                            </TabsTrigger>
                            <TabsTrigger value="logistics" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto">
                                <Car className="h-4 w-4 mr-2" /> Logistique & Budget
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="py-6 space-y-8">
                            <Card className="border-none shadow-sm bg-slate-50">
                                <CardHeader>
                                    <CardTitle className="text-lg">Description de la mission</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {mission.description || "Aucune description fournie pour cette mission."}
                                    </p>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <ListChecks className="h-4 w-4 text-primary" /> Objectifs Clés
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-start gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                                                Réalisation des objectifs définis dans l'ordre de mission.
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                                                Rapportage quotidien ou hebdomadaire selon la durée.
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                                                Respect des délais et des procédures internes.
                                            </li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Landmark className="h-4 w-4 text-primary" /> Cadre Institutionnel
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                                <Building2 className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold leading-none">Organisation</p>
                                                <p className="text-sm font-medium">CNRCT</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                                <Shield className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold leading-none">Niveau de Confidentialité</p>
                                                <p className="text-sm font-medium">Usage Interne</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="team" className="py-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(mission.participants || []).map((p, i) => (
                                    <Card key={i} className="border shadow-none hover:shadow-md transition-shadow">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                                {p.employeeName.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm">{p.employeeName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] h-5 py-0 px-2 rounded-full font-medium">
                                                        {p.numeroOrdre || "Sans N° d'ordre"}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Car className="h-3 w-3" /> {p.moyenTransport}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-full text-blue-500 hover:text-blue-700 hover:bg-blue-50" 
                                                    title="Imprimer Fiche"
                                                    onClick={() => {
                                                        setSelectedParticipant(p);
                                                        setShowIndividualPrint(true);
                                                    }}
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => router.push(`/employees/${p.employeeId}`)}>
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {(!mission.participants || mission.participants.length === 0) && (
                                    <div className="col-span-2 py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed">
                                        <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-400">Aucun participant n'a encore été assigné.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="logistics" className="py-6 space-y-8">
                            <Card className="border-none shadow-sm bg-slate-900 text-white">
                                <CardHeader>
                                    <CardTitle className="text-slate-300 flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" /> Estimation Budgétaire Totale
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-extrabold">
                                        {mission.participants?.reduce((total, p) => 
                                            total + (p.coutTransport || 0) + (p.coutHebergement || 0) + (p.totalIndemnites || 0), 0
                                        ).toLocaleString()} F
                                    </div>
                                    <p className="text-slate-400 text-sm mt-1">Saisie prévisionnelle des charges directes</p>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border shadow-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Car className="h-4 w-4 text-blue-500" /> Frais de Transport
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {mission.participants?.reduce((total, p) => total + (p.coutTransport || 0), 0).toLocaleString()} F
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border shadow-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Hotel className="h-4 w-4 text-emerald-500" /> Frais d'Hébergement
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {mission.participants?.reduce((total, p) => total + (p.coutHebergement || 0), 0).toLocaleString()} F
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar / Info Card */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg overflow-hidden">
                        <div className="h-2 bg-primary" />
                        <CardHeader>
                            <CardTitle>Documents & Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-between h-12 rounded-xl group hover:border-primary">
                                    <span className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" /> Ordre de Mission
                                    </span>
                                    <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                </Button>
                                <Button variant="outline" className="w-full justify-between h-12 rounded-xl group hover:border-primary">
                                    <span className="flex items-center gap-2">
                                        <Share2 className="h-4 w-4 text-primary" /> Partager les détails
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                </Button>
                            </div>

                            <div className="pt-4 border-t space-y-4">
                                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Dernière mise à jour</h4>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Clock className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <p className="text-xs font-medium">Initialisé par l'Administration le {format(parseISO(mission.startDate), "dd/MM/yyyy")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-50/50 border-none shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-yellow-600" /> Rappel Règlementaire
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[11px] text-yellow-800 leading-relaxed italic">
                                Toute mission effectuée pour le compte de la CNRCT doit faire l'objet d'un rapport de mission 
                                déposé au plus tard 48 heures après le retour effectif de l'agent.
                            </p>
                        </CardContent>
                    </Card>
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
