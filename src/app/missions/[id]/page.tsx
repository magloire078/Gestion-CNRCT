"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ChevronLeft, Pencil, Calendar, 
    MapPin, Users, FileText, 
    CheckCircle2, Clock, XCircle, 
    ArrowRight, Printer,
    Shield, Building2,
    Info, ListChecks, Landmark,
    Car, Hotel, CreditCard, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getMission } from "@/services/mission-service";
import type { Mission } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings, MissionParticipant } from "@/lib/data";
import { GroupMissionRequestPrint, IndividualMissionSlipPrint, CollectiveMissionOrderPrint, GroupedIndividualMissionsPrint } from "@/components/missions/mission-print-templates";
import { usePermissions } from "@/hooks/use-permissions";

const AVATAR_GRADIENTS = [
    "from-blue-600 to-indigo-600 text-white shadow-blue-500/20",
    "from-emerald-600 to-teal-600 text-white shadow-emerald-500/20",
    "from-purple-600 to-violet-600 text-white shadow-purple-500/20",
    "from-amber-500 to-orange-600 text-white shadow-orange-500/20",
    "from-rose-500 to-pink-600 text-white shadow-rose-500/20",
    "from-cyan-600 to-blue-600 text-white shadow-cyan-500/20",
];

function getAvatarGradient(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export default function MissionDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [mission, setMission] = useState<Mission | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, hasPermission } = useAuth();
    const { can } = usePermissions();
    
    const [logos, setLogos] = useState<OrganizationSettings | null>(null);
    const [showGroupPrint, setShowGroupPrint] = useState(false);
    const [showCollectivePrint, setShowCollectivePrint] = useState(false);
    const [showIndividualPrint, setShowIndividualPrint] = useState(false);
    const [showGroupedIndividualPrint, setShowGroupedIndividualPrint] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<MissionParticipant | null>(null);
    const [employees, setEmployees] = useState<Record<string, any>>({});

    const canEdit = hasPermission('page:missions:view') && can('missions', 'update');

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

    useEffect(() => {
        if (!mission?.participants) return;
        const participantIds = mission.participants.map(p => p.employeeId).filter((id): id is string => !!id);
        if (participantIds.length > 0) {
            import("@/services/employee-service").then(({ getEmployee }) => {
                Promise.all(
                    participantIds.map(empId => 
                        getEmployee(empId)
                            .then(emp => ({ id: empId, emp }))
                            .catch(() => ({ id: empId, emp: null }))
                    )
                ).then(results => {
                    const map: Record<string, any> = {};
                    results.forEach(res => {
                        if (res.emp) map[res.id] = res.emp;
                    });
                    setEmployees(map);
                });
            });
        }
    }, [mission?.participants]);

    const durationDays = useMemo(() => {
        if (!mission?.startDate || !mission?.endDate) return 1;
        try {
            const start = parseISO(mission.startDate);
            const end = parseISO(mission.endDate);
            const diff = differenceInCalendarDays(end, start) + 1;
            return diff > 0 ? diff : 1;
        } catch {
            return 1;
        }
    }, [mission?.startDate, mission?.endDate]);

    const budgetStats = useMemo(() => {
        const parts = mission?.participants || [];
        const totalTransport = parts.reduce((t, p) => t + (p.coutTransport || 0), 0);
        const totalHebergement = parts.reduce((t, p) => t + (p.coutHebergement || 0), 0);
        const totalIndemnites = parts.reduce((t, p) => t + (p.totalIndemnites || 0), 0);
        const total = totalTransport + totalHebergement + totalIndemnites;
        const transportPct = total > 0 ? Math.round((totalTransport / total) * 100) : 0;
        const hebergementPct = total > 0 ? Math.round((totalHebergement / total) * 100) : 0;
        const indemnitesPct = total > 0 ? Math.max(0, 100 - transportPct - hebergementPct) : 0;
        return { total, totalTransport, totalHebergement, totalIndemnites, transportPct, hebergementPct, indemnitesPct };
    }, [mission?.participants]);

    if (loading) {
        return (
            <div className="space-y-6 pb-16">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-4">
                        <Skeleton className="h-[400px] rounded-2xl w-full" />
                    </div>
                    <div className="lg:col-span-4 space-y-4">
                        <Skeleton className="h-64 rounded-2xl w-full" />
                        <Skeleton className="h-48 rounded-2xl w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!mission) {
        return (
            <div className="py-16 text-center max-w-md mx-auto">
                <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
                    <AlertTriangle className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mission introuvable</h1>
                <p className="text-sm text-slate-500 mt-2 font-medium">Le dossier demandé n'existe pas ou a été déplacé.</p>
                <Button className="mt-6 rounded-2xl px-6" onClick={() => router.push("/missions")}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Retour au registre
                </Button>
            </div>
        );
    }

    const statusBadgeStyles = {
        'Planifiée': {
            bg: 'bg-sky-50 text-sky-700 border-sky-200/80',
            dot: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]',
            icon: <Clock className="h-3.5 w-3.5" />
        },
        'En cours': {
            bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
            dot: 'bg-amber-500 animate-ping shadow-[0_0_8px_rgba(245,158,11,0.5)]',
            icon: <Clock className="h-3.5 w-3.5" />
        },
        'Terminée': {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
            icon: <CheckCircle2 className="h-3.5 w-3.5" />
        },
        'Annulée': {
            bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
            dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
            icon: <XCircle className="h-3.5 w-3.5" />
        },
    };

    const currentStatusStyle = statusBadgeStyles[mission.status as keyof typeof statusBadgeStyles] || statusBadgeStyles['Planifiée'];

    return (
        <div className="space-y-6 pb-20">
            {/* Executive Hero Header */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-5 lg:p-6 shadow-sm space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                    {/* Identity & Badges */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => router.push("/missions")} 
                            className="rounded-xl h-10 w-10 shrink-0 border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95 mt-0.5"
                            title="Retour aux missions"
                        >
                            <ChevronLeft className="h-5 w-5 text-slate-700" />
                        </Button>

                        <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm">
                                    <FileText className="h-3 w-3 text-blue-400" />
                                    Dossier N° {mission.numeroMission || "N/A"}
                                </span>

                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shadow-sm",
                                    currentStatusStyle.bg
                                )}>
                                    <span className={cn("h-2 w-2 rounded-full", currentStatusStyle.dot)} />
                                    {mission.status}
                                </span>

                                {mission.dateSaisie && (
                                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                                        <Calendar className="h-3 w-3 text-slate-400" />
                                        Saisie le {format(parseISO(mission.dateSaisie), "dd MMM yyyy", { locale: fr })}
                                    </span>
                                )}

                                <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                                    <Building2 className="h-3 w-3 text-slate-400" />
                                    Administration Centrale
                                </span>
                            </div>

                            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug uppercase break-words pt-1">
                                {mission.title}
                            </h1>
                        </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start xl:self-center">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowCollectivePrint(true)}
                            className="h-10 px-3.5 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-xs hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-700"
                        >
                            <Printer className="mr-2 h-4 w-4 text-purple-600" /> Ordre Collectif
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            onClick={() => setShowGroupedIndividualPrint(true)}
                            className="h-10 px-3.5 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-xs hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-700"
                        >
                            <Printer className="mr-2 h-4 w-4 text-emerald-600" /> Impression Groupée
                        </Button>

                        <Button 
                            variant="outline" 
                            onClick={() => setShowGroupPrint(true)}
                            className="h-10 px-3.5 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-xs hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-700"
                        >
                            <FileText className="mr-2 h-4 w-4 text-blue-600" /> Demande d'Ordre
                        </Button>

                        {canEdit && (
                            <Button 
                                onClick={() => router.push(`/missions/${id}/edit`)} 
                                className="h-10 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-md shadow-slate-900/15 active:scale-95"
                            >
                                <Pencil className="mr-1.5 h-3.5 w-3.5 text-amber-400" /> Modifier
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* 4 Harmonized KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Période */}
                <div className="rounded-2xl bg-white p-4 lg:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                            Période de Mission
                        </span>
                        <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Calendar className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-sm font-black text-slate-900 tracking-tight uppercase mt-2">
                        {format(parseISO(mission.startDate), "dd MMM", { locale: fr })} - {format(parseISO(mission.endDate), "dd MMM yyyy", { locale: fr })}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            <Clock className="h-3 w-3" /> {durationDays} {durationDays > 1 ? 'jours' : 'jour'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                            Durée totale
                        </span>
                    </div>
                </div>

                {/* Destination */}
                <div className="rounded-2xl bg-white p-4 lg:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                            Destination
                        </span>
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <MapPin className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-sm font-black text-slate-900 tracking-tight uppercase mt-2 truncate" title={mission.lieuMission || "Territoire National"}>
                        {mission.lieuMission || "Territoire National"}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <Landmark className="h-3 w-3" /> Officiel
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                            Déplacement
                        </span>
                    </div>
                </div>

                {/* Effectif */}
                <div className="rounded-2xl bg-white p-4 lg:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                            Effectif Engagé
                        </span>
                        <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-xl font-black text-slate-900">
                            {(mission.participants || []).length}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase">
                            {(mission.participants || []).length > 1 ? 'Agents mobilisés' : 'Agent mobilisé'}
                        </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex -space-x-1.5">
                            {(mission.participants || []).slice(0, 3).map((p, idx) => (
                                <div 
                                    key={idx} 
                                    className={cn(
                                        "h-5 w-5 rounded-full border border-white flex items-center justify-center text-[8px] font-black bg-gradient-to-br",
                                        getAvatarGradient(p.employeeName)
                                    )}
                                    title={p.employeeName}
                                >
                                    {p.employeeName.charAt(0)}
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                            Équipage
                        </span>
                    </div>
                </div>

                {/* Budget */}
                <div className="rounded-2xl bg-white p-4 lg:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                            Budget Prévisionnel
                        </span>
                        <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <CreditCard className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-lg font-black text-slate-900 tracking-tight">
                            {budgetStats.total.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 uppercase">
                            FCFA
                        </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500">
                            Indemnités : {budgetStats.indemnitesPct}%
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                            {(mission.participants || []).length} p.
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Layout (8 cols + 4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Interactive Tabs (8 cols) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 lg:p-6 shadow-sm">
                    <Tabs defaultValue="team" className="w-full">
                        <TabsList className="bg-slate-100/90 p-1 rounded-xl w-full justify-start h-auto gap-1 border border-slate-200/40">
                            <TabsTrigger 
                                value="team" 
                                className="rounded-lg font-bold text-xs px-4 py-2.5 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
                            >
                                <Users className="h-3.5 w-3.5 mr-2 text-purple-600" /> 
                                Participants ({ (mission.participants || []).length })
                            </TabsTrigger>
                            <TabsTrigger 
                                value="overview" 
                                className="rounded-lg font-bold text-xs px-4 py-2.5 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
                            >
                                <Info className="h-3.5 w-3.5 mr-2 text-blue-600" /> 
                                Présentation & Cadre
                            </TabsTrigger>
                            <TabsTrigger 
                                value="logistics" 
                                className="rounded-lg font-bold text-xs px-4 py-2.5 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
                            >
                                <Car className="h-3.5 w-3.5 mr-2 text-emerald-600" /> 
                                Logistique & Budget
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB 1: PARTICIPANTS */}
                        <TabsContent value="team" className="pt-5 space-y-4 animate-in fade-in-50 duration-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                                        Composition de l'Équipage
                                    </span>
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        {(mission.participants || []).length} Agent(s)
                                    </Badge>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setShowGroupedIndividualPrint(true)}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg h-8"
                                >
                                    <Printer className="mr-1.5 h-3.5 w-3.5" /> Tout imprimer
                                </Button>
                            </div>

                            {(mission.participants || []).length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-500 uppercase">Aucun agent assigné pour l'instant</p>
                                    {canEdit && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => router.push(`/missions/${id}/edit`)}
                                            className="mt-3 text-xs font-bold rounded-xl"
                                        >
                                            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Adjoindre des agents
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {(mission.participants || []).map((p, i) => {
                                        const empPoste = p.employeeId && employees[p.employeeId]?.poste;
                                        const avatarGrad = getAvatarGradient(p.employeeName);
                                        const orderNum = p.numeroOrdre?.trim() || (mission.numeroMission ? (mission.participants?.length > 1 ? `N° ${mission.numeroMission}-${i + 1}` : `N° ${mission.numeroMission}`) : `N° ${i + 1}`);

                                        return (
                                            <div 
                                                key={i} 
                                                className="group bg-slate-50/50 rounded-xl border border-slate-200/80 p-4 shadow-sm hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                    {/* Avatar */}
                                                    <div className={cn(
                                                        "h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center font-black text-sm shadow-sm shrink-0 group-hover:scale-105 transition-transform",
                                                        avatarGrad
                                                    )}>
                                                        {p.employeeName.charAt(0)}
                                                    </div>

                                                    <div className="min-w-0 space-y-1 flex-1">
                                                        <p className="font-bold text-xs text-slate-900 uppercase leading-snug break-words" title={p.employeeName}>
                                                            {p.employeeName}
                                                        </p>

                                                        {empPoste ? (
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate">
                                                                {empPoste}
                                                            </p>
                                                        ) : (
                                                            <p className="text-[10px] font-medium text-slate-400 italic">
                                                                Agent participant
                                                            </p>
                                                        )}

                                                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white text-slate-700 font-bold text-[9px] tracking-wider uppercase border border-slate-200/60 shadow-xs">
                                                                {orderNum}
                                                            </span>

                                                            {p.moyenTransport && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-slate-500 font-medium text-[9px] border border-slate-200/40">
                                                                    <Car className="h-2.5 w-2.5 text-slate-400" />
                                                                    {p.moyenTransport}
                                                                    {p.immatriculation ? ` (${p.immatriculation})` : ""}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        className="h-8 w-8 rounded-lg border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-xs" 
                                                        title="Imprimer l'ordre de mission individuel"
                                                        onClick={() => {
                                                            setSelectedParticipant(p);
                                                            setShowIndividualPrint(true);
                                                        }}
                                                    >
                                                        <Printer className="h-3.5 w-3.5" />
                                                    </Button>

                                                    {p.employeeId && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
                                                            title="Voir la fiche de l'employé"
                                                            onClick={() => router.push(`/employees/${p.employeeId}`)}
                                                        >
                                                            <ArrowRight className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </TabsContent>

                        {/* TAB 2: PRÉSENTATION */}
                        <TabsContent value="overview" className="pt-5 space-y-6 animate-in fade-in-50 duration-200">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <ListChecks className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                                        Note & Objet de la Mission
                                    </h3>
                                </div>
                                
                                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                    {mission.description || "Aucune note explicative n'a été saisie pour ce dossier."}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                            <Landmark className="h-4 w-4" />
                                        </div>
                                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                                            Cadre Institutionnel
                                        </h3>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50/60 border border-slate-200/70">
                                            <span className="font-medium text-slate-500">Institution</span>
                                            <span className="font-bold text-slate-800 uppercase">CNRCT Côte d'Ivoire</span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50/60 border border-slate-200/70">
                                            <span className="font-medium text-slate-500">Enregistrement / Saisie</span>
                                            <span className="font-bold text-slate-800">
                                                {mission.dateSaisie ? format(parseISO(mission.dateSaisie), "dd MMMM yyyy", { locale: fr }) : "Non spécifiée"}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50/60 border border-slate-200/70">
                                            <span className="font-medium text-slate-500">Classification</span>
                                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                Ordre Administratif
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative overflow-hidden flex flex-col justify-between">
                                    <div className="space-y-2 relative z-10">
                                        <div className="flex items-center gap-2 text-indigo-300">
                                            <Shield className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                Conformité Opérationnelle
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            Tout déplacement hors du périmètre défini sans ordre modificatif préalable expose l'agent à l'annulation de la prise en charge.
                                        </p>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-indigo-200 relative z-10">
                                        <span>Réf : Règlement Intérieur CNRCT</span>
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 3: LOGISTIQUE & BUDGET */}
                        <TabsContent value="logistics" className="pt-5 space-y-5 animate-in fade-in-50 duration-200">
                            {/* Budget Hero Card */}
                            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 lg:p-6 relative overflow-hidden shadow-sm">
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-indigo-300">
                                            <CreditCard className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                Budget Prévisionnel Global
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl lg:text-4xl font-black tracking-tight text-white">
                                                {budgetStats.total.toLocaleString()}
                                            </span>
                                            <span className="text-sm font-bold text-indigo-300 uppercase">
                                                FCFA
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Calculé pour {(mission.participants || []).length} agent(s) assigné(s)
                                        </p>
                                    </div>

                                    {/* Percentage Breakdown Chips */}
                                    <div className="grid grid-cols-3 gap-2 shrink-0">
                                        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-center min-w-[75px]">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Indemnités</p>
                                            <p className="text-sm font-black text-amber-400 mt-0.5">{budgetStats.indemnitesPct}%</p>
                                        </div>
                                        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-center min-w-[75px]">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Transport</p>
                                            <p className="text-sm font-black text-blue-400 mt-0.5">{budgetStats.transportPct}%</p>
                                        </div>
                                        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-center min-w-[75px]">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Héberg.</p>
                                            <p className="text-sm font-black text-emerald-400 mt-0.5">{budgetStats.hebergementPct}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Rubrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Car className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Transport</p>
                                            <p className="text-xs font-black text-slate-900">{budgetStats.totalTransport.toLocaleString()} FCFA</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold text-blue-600">{budgetStats.transportPct}%</Badge>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <Hotel className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Hébergement</p>
                                            <p className="text-xs font-black text-slate-900">{budgetStats.totalHebergement.toLocaleString()} FCFA</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold text-emerald-600">{budgetStats.hebergementPct}%</Badge>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                            <CreditCard className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Indemnités</p>
                                            <p className="text-xs font-black text-slate-900">{budgetStats.totalIndemnites.toLocaleString()} FCFA</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold text-amber-600">{budgetStats.indemnitesPct}%</Badge>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Institutional Sidebar (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Documents & Acts Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3.5">
                        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                                Documentation & Actes
                            </h3>
                        </div>

                        <div className="space-y-2">
                            <div 
                                onClick={() => setShowCollectivePrint(true)} 
                                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-indigo-50/60 hover:border-indigo-200 flex items-center justify-between group cursor-pointer transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-white shadow-xs border border-slate-200/80 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 leading-tight">Ordre Collectif</p>
                                        <p className="text-[9px] text-slate-400 font-medium">Document officiel</p>
                                    </div>
                                </div>
                                <Printer className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                            </div>

                            <div 
                                onClick={() => setShowGroupedIndividualPrint(true)} 
                                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-emerald-50/60 hover:border-emerald-200 flex items-center justify-between group cursor-pointer transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-white shadow-xs border border-slate-200/80 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                                        <Printer className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 leading-tight">Ordres Individuels</p>
                                        <p className="text-[9px] text-slate-400 font-medium">Tous les équipages ({ (mission.participants || []).length })</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                            </div>

                            <div 
                                onClick={() => setShowGroupPrint(true)} 
                                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-blue-50/60 hover:border-blue-200 flex items-center justify-between group cursor-pointer transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-white shadow-xs border border-slate-200/80 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 leading-tight">Demande d'Ordre</p>
                                        <p className="text-[9px] text-slate-400 font-medium">Bordereau récapitulatif</p>
                                    </div>
                                </div>
                                <Printer className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Chronological Stepper Card */}
                    <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-4 lg:p-5 shadow-sm space-y-3.5">
                        <div className="flex items-center gap-2 pb-2.5 border-white/10 border-b">
                            <Clock className="h-4 w-4 text-indigo-400" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-200">
                                Chronologie du Dossier
                            </h3>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 font-black text-[9px]">
                                    1
                                </div>
                                <div>
                                    <p className="font-bold text-white text-xs">Saisie & Enregistrement</p>
                                    <p className="text-[10px] text-indigo-300 font-medium">
                                        {mission.dateSaisie ? format(parseISO(mission.dateSaisie), "dd MMMM yyyy", { locale: fr }) : "Date non renseignée"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-black text-[9px]">
                                    2
                                </div>
                                <div>
                                    <p className="font-bold text-white text-xs">Période d'Exécution</p>
                                    <p className="text-[10px] text-emerald-300 font-medium">
                                        Du {format(parseISO(mission.startDate), "dd/MM/yyyy")} au {format(parseISO(mission.endDate), "dd/MM/yyyy")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-black text-[9px]">
                                    3
                                </div>
                                <div>
                                    <p className="font-bold text-white text-xs">Statut Actuel</p>
                                    <p className="text-[10px] text-amber-300 font-bold uppercase">
                                        {mission.status}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Procedural Note Alert */}
                    <div className="rounded-2xl bg-amber-50/90 border border-amber-200/80 p-4 flex items-start gap-3 text-amber-900 shadow-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                            <p className="font-bold uppercase tracking-wider text-[10px] text-amber-800">
                                Note de Procédure
                            </p>
                            <p className="text-amber-800/90 text-[11px] leading-relaxed font-medium">
                                Le rapport de fin de mission doit être transmis aux services compétents dès le retour de l'équipe pour validation finale des frais.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Templates Modals */}
            {showGroupPrint && mission && logos && (
                <GroupMissionRequestPrint 
                    mission={mission} 
                    logos={logos} 
                    onCloseAction={() => setShowGroupPrint(false)} 
                />
            )}

            {showCollectivePrint && mission && logos && (
                <CollectiveMissionOrderPrint 
                    mission={mission} 
                    logos={logos} 
                    onCloseAction={() => setShowCollectivePrint(false)} 
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

            {showGroupedIndividualPrint && mission && logos && (
                <GroupedIndividualMissionsPrint
                    mission={mission}
                    logos={logos}
                    onCloseAction={() => setShowGroupedIndividualPrint(false)}
                />
            )}
        </div>
    );
}
