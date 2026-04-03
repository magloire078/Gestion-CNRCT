"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useFormat } from '@/hooks/use-format';
import { 
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
    CardFooter
} from '@/components/ui/card';
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Users, FileWarning, Laptop, Car, Download, 
    ShieldCheck, User as UserIcon, Building, 
    Cake, Printer, Crown, LogOut as LogOutIcon, 
    Globe, Bot, Loader2 as LoaderIcon, Briefcase, 
    CalendarOff, PlusCircle, Eye, Receipt, 
    FilePlus2, Rocket, TrendingUp, Sparkles,
    LayoutDashboard, ArrowUpRight, Activity, Award,
    History, Map as MapIcon, HelpCircle,    ChevronDown, 
    MoreHorizontal, 
    AlertTriangle,
    Plus,
    Trash2,
    FileText,
    Database,
    ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmployeeDistributionChart } from '@/components/charts/employee-distribution-chart';
import { AssetStatusChart } from '@/components/charts/asset-status-chart';
import { ConflictHeatmap } from '@/components/charts/conflict-heatmap';
import { EmployeeActivityReport } from '@/components/reports/employee-activity-report';
import { NewsFeed } from '@/components/news/news-feed';
import type { Employe, Leave, Asset, Fleet, OrganizationSettings, Chief, Department, Mission, Evaluation } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInYears, parseISO, format, addMonths, isAfter, lastDayOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrintLayout } from '@/components/reports/print-layout';
import { Badge } from '@/components/ui/badge';
import { AddLeaveRequestSheet } from "@/components/leave/add-leave-request-sheet";
import { addLeave } from "@/services/leave-service";
import { useToast } from "@/hooks/use-toast";
import { getEmployeeGroup, type EmployeeGroup } from '@/services/employee-service';
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: number | string | React.ReactNode;
    icon: React.ElementType;
    description?: string;
    href?: string;
    loading: boolean;
    color?: 'primary' | 'success' | 'warning' | 'info' | 'rose' | 'amber';
    trend?: { value: string, up: boolean };
}

const StatCard = ({ title, value, icon: Icon, description, href, loading, color = 'primary', trend }: StatCardProps) => {
    const colorClasses: Record<string, string> = {
        primary: "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/50",
        success: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50",
        warning: "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/50",
        info: "bg-slate-50 text-slate-600 border-slate-100 shadow-slate-100/50",
        rose: "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/50",
        amber: "bg-orange-50 text-orange-600 border-orange-100 shadow-orange-100/50"
    };

    const cardContent = (
        <Card className="group relative overflow-hidden border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-500 rounded-[2rem]">
            <div className={cn("absolute top-0 right-0 p-6 opacity-5 transition-transform group-hover:scale-125 duration-700")}>
                <Icon className="h-24 w-24" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className={cn("p-2 rounded-xl border shrink-0", colorClasses[color])}>
                    <Icon className="h-5 w-5" />
                </div>
                {trend && (
                    <div className={cn("flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full", trend.up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                        {trend.value} <TrendingUp className={cn("h-3 w-3", !trend.up && "rotate-180")} />
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex flex-col pt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
                    {loading ? <Skeleton className="h-10 w-24 mt-2" /> : <div className="text-3xl font-black text-slate-900 mt-1">{value}</div>}
                    {description && <p className="text-[10px] text-slate-400 font-medium mt-1 italic">{description}</p>}
                </div>
            </CardContent>
        </Card>
    );

    if (href) return <Link href={href}>{cardContent}</Link>;
    return cardContent;
};

const categoryLabels: Record<EmployeeGroup, string> = {
    'personnel-siege': "Siège",
    'chauffeur-directoire': "Chauffeurs",
    'garde-republicaine': "Garde",
    'gendarme': "Gendarmes",
    'directoire': "Directoire",
    'regional': "Régional",
    'all': 'Tous'
};

const LatestRecruitsCard = ({ employees, loading, departments }: { employees: Employe[], loading: boolean, departments: Department[] }) => {
    const { formatDate } = useFormat();
    const recruitsByCategory = employees
        .filter(e => e.dateEmbauche)
        .reduce((acc, emp) => {
            const group = getEmployeeGroup(emp, departments);
            if (!acc[group]) acc[group] = [];
            acc[group].push(emp);
            return acc;
        }, {} as Record<EmployeeGroup, Employe[]>);

    Object.values(recruitsByCategory).forEach(group => {
        group.sort((a, b) => new Date(b.dateEmbauche!).getTime() - new Date(a.dateEmbauche!).getTime());
    });

    const categoriesWithRecruits = Object.entries(recruitsByCategory)
        .filter(([_, recruits]) => recruits.length > 0)
        .sort(([groupA], [groupB]) => (categoryLabels[groupA as EmployeeGroup] || groupA).localeCompare(categoryLabels[groupB as EmployeeGroup] || groupB));

    return (
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Activity className="h-5 w-5 text-slate-400" />
                    Flux de Recrutement
                </CardTitle>
                <CardDescription>Dernières intégrations par catégorie métier.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
                {loading ? <Skeleton className="h-64 w-full" /> : (
                    categoriesWithRecruits.length > 0 ? (
                        <Tabs defaultValue={categoriesWithRecruits[0][0]} className="space-y-6">
                            <TabsList className="flex flex-wrap h-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                {categoriesWithRecruits.map(([group, _]) => (
                                    <TabsTrigger key={group} value={group} className="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        {categoryLabels[group as EmployeeGroup] || group}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {categoriesWithRecruits.map(([group, recruits]) => (
                                <TabsContent key={group} value={group} className="focus-visible:outline-none">
                                    <div className="space-y-4">
                                        {recruits.slice(0, 4).map(emp => (
                                            <div key={emp.id} className="flex items-center gap-4 group p-1 hover:bg-slate-50 rounded-2xl transition-all">
                                                <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                                    <AvatarImage src={emp.photoUrl} alt={emp.name} />
                                                    <AvatarFallback className="bg-slate-100 font-bold text-slate-400">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{emp.poste}</p>
                                                    <p className="text-[10px] text-slate-400 italic">Entrée : {formatDate(emp.dateEmbauche)}</p>
                                                </div>
                                                <Badge variant="outline" className="font-mono text-[9px] font-black opacity-40 group-hover:opacity-100 transition-opacity">{emp.matricule}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                        <div className="py-20 text-center text-slate-300 italic">Aucune donnée de recrutement récente.</div>
                    )
                )}
            </CardContent>
        </Card>
    );
};

export default function DashboardPage() {
    const { user, hasPermission } = useAuth();
    const { toast } = useToast();
    const {
        globalStats,
        loading,
        seniorityAnniversaries,
        birthdayAnniversaries,
        upcomingRetirements,
        selectedAnniversaryMonth,
        setSelectedAnniversaryMonth,
        selectedAnniversaryYear,
        setSelectedAnniversaryYear,
        selectedRetirementYear,
        setSelectedRetirementYear,
    } = useDashboardData(user);
    const { formatDate } = useFormat();

    const [isPrintingAnniversaries, setIsPrintingAnniversaries] = useState(false);
    const [isPrintingRetirements, setIsPrintingRetirements] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const anniversaryYears = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
    const retirementYears = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + i).toString());

    const monthsForSelect = [
        { value: "0", label: "Janvier" }, { value: "1", label: "Février" }, { value: "2", label: "Mars" },
        { value: "3", label: "Avril" }, { value: "4", label: "Mai" }, { value: "5", label: "Juin" },
        { value: "6", label: "Juillet" }, { value: "7", label: "Août" }, { value: "8", label: "Septembre" },
        { value: "9", label: "Octobre" }, { value: "10", label: "Novembre" }, { value: "11", label: "Décembre" },
    ];

    return (
        <PermissionGuard permission="page:dashboard:view">
            <div className="pb-20">
                <div className="flex flex-col gap-10">
                    {/* Hero Welcome */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <Avatar className="h-20 w-20 md:h-28 md:w-28 border-4 border-white shadow-2xl">
                                <AvatarImage src={user?.photoUrl || undefined} alt={user?.name || ''} />
                                <AvatarFallback className="bg-slate-100 font-bold text-slate-400 text-2xl">
                                    {user?.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-6 w-1 bg-slate-900 rounded-full" />
                                    <Badge variant="outline" className="border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">Système de Pilotage v3.0</Badge>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Bienvenue, <span className="text-slate-500 font-medium">{user?.name}</span></h1>
                                <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-2xl">
                                    Votre centre de commandement centralisé pour la gestion du Directoire et des instances régionales.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" className="h-14 rounded-2xl px-6 border-slate-200 font-bold bg-white text-slate-600 shadow-xl shadow-slate-100 hover:bg-slate-50 transition-all">
                                <Download className="h-5 w-5 mr-3 text-slate-300" />
                                Rapport Mensuel
                            </Button>
                            <Button className="h-14 rounded-2xl px-8 bg-slate-900 font-bold shadow-2xl shadow-slate-200 hover:shadow-slate-300 transition-all">
                                <Sparkles className="h-5 w-5 mr-3 text-amber-400" />
                                Analyses IA
                            </Button>
                        </div>
                    </div>

                    {/* Dashboard Content */}
                    <Tabs defaultValue="overview" className="space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <TabsList className="bg-transparent gap-8 h-auto p-0">
                                <TabsTrigger value="overview" className="px-0 py-4 h-auto rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent shadow-none text-sm font-black uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">
                                    Vue Stratégique
                                </TabsTrigger>
                                <TabsTrigger value="alerts" className="px-0 py-4 h-auto rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent shadow-none text-sm font-black uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">
                                    Alertes Événementielles
                                </TabsTrigger>
                                <TabsTrigger value="stability" className="px-0 py-4 h-auto rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent shadow-none text-sm font-black uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">
                                    Territoires & Stabilité
                                </TabsTrigger>
                            </TabsList>
                            <div className="hidden md:flex items-center gap-4 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                {user?.role?.name === 'Super Administrateur' && (
                                    <>
                                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Serveurs OK</div>
                                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> Synchro Firestore</div>
                                    </>
                                )}
                            </div>
                        </div>

                        <TabsContent value="overview" className="space-y-10 focus-visible:outline-none focus-visible:ring-0">
                            {/* Key Performance Indicators */}
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <StatCard loading={loading} title="Effectifs Opérationnels" value={globalStats.activeEmployees.toString()} icon={Users} color="primary" trend={{ value: "+2.4%", up: true }} />
                                <StatCard loading={loading} title="Membres du Directoire" value={globalStats.employees.filter(e => getEmployeeGroup(e, globalStats.departments) === 'directoire' && e.status === 'Actif').length.toString()} icon={Crown} color="amber" trend={{ value: "Stable", up: true }} />
                                <StatCard loading={loading} title="Tensions Actives" value={globalStats.conflicts.filter(c => c.status !== 'Résolu').length.toString()} icon={AlertTriangle} color="rose" trend={{ value: "-4%", up: false }} description="Dossiers en cours/médiation" />
                                <StatCard loading={loading} title="Unités Administratives" value={globalStats.departments.length.toString()} icon={Building} color="info" trend={{ value: "+1", up: true }} />
                            </div>

                            {/* Charts Section */}
                            <div className="grid gap-8 lg:grid-cols-7">
                                <Card className="lg:col-span-4 border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-slate-400" />
                                            Répartition des Ressources
                                        </CardTitle>
                                        <CardDescription>Analyse structurelle par type de personnel.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-8 pb-8 pt-4">
                                        {loading ? <Skeleton className="h-[400px] w-full" /> : <EmployeeDistributionChart />}
                                    </CardContent>
                                </Card>
                                <div className="lg:col-span-3">
                                    <LatestRecruitsCard employees={globalStats.employees} loading={loading} departments={globalStats.departments} />
                                </div>
                            </div>

                            {/* Secondary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-slate-900 text-white overflow-hidden relative group">
                                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                                     <CardHeader className="relative z-10">
                                         <CardTitle className="text-lg flex items-center gap-2">
                                             <Globe className="h-5 w-5 text-blue-400" /> Rayonnement Régional
                                         </CardTitle>
                                     </CardHeader>
                                     <CardContent className="relative z-10">
                                         <div className="flex items-center gap-4 mb-4">
                                            <div className="text-4xl font-black">{globalStats.employees.filter(e => getEmployeeGroup(e, globalStats.departments) === 'regional').length}</div>
                                            <div className="text-xs text-slate-400 font-medium">Représentants territoriaux actifs dans 31 régions.</div>
                                         </div>
                                         <Button variant="outline" className="w-full border-slate-700 bg-white/5 hover:bg-white/10 text-white font-bold h-11 rounded-xl transition-all" asChild>
                                             <Link href="/mapping">Explorer la carte <MapIcon className="ml-2 h-4 w-4" /></Link>
                                         </Button>
                                     </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-emerald-50 overflow-hidden relative group">
                                     <CardHeader>
                                         <CardTitle className="text-lg text-emerald-900 flex items-center gap-2">
                                             <FilePlus2 className="h-5 w-5 text-emerald-600" /> Support & Maintenance
                                         </CardTitle>
                                     </CardHeader>
                                     <CardContent>
                                         <div className="flex items-center gap-4 mb-4">
                                            <div className="text-4xl font-black text-emerald-900">98%</div>
                                            <div className="text-xs text-emerald-700 font-medium italic">Taux de résolution des incidents Helpdesk à J+1.</div>
                                         </div>
                                         <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-200" asChild>
                                             <Link href="/helpdesk">Accéder au Support <HelpCircle className="ml-2 h-4 w-4" /></Link>
                                         </Button>
                                     </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-blue-50 overflow-hidden relative">
                                     <CardHeader>
                                         <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                                             <Briefcase className="h-5 w-5 text-blue-600" /> Missions & Logistique
                                         </CardTitle>
                                     </CardHeader>
                                     <CardContent>
                                         <div className="flex items-center gap-4 mb-4">
                                            <div className="text-4xl font-black text-blue-900">12</div>
                                            <div className="text-xs text-blue-700 font-medium italic">Missions diplomatiques ou territoriales prévues ce mois.</div>
                                         </div>
                                         <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-blue-200" asChild>
                                             <Link href="/missions">Planning des Missions <ChevronRight className="ml-2 h-4 w-4" /></Link>
                                         </Button>
                                     </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="alerts" className="space-y-10 focus-visible:outline-none focus-visible:ring-0">
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
                                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                <Sparkles className="h-5 w-5 text-rose-500" /> Célébrations & Milestones
                                            </CardTitle>
                                            <CardDescription className="text-xs font-medium uppercase tracking-widest text-slate-400">Événements mensuels du personnel</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Select value={selectedAnniversaryMonth} onValueChange={setSelectedAnniversaryMonth}>
                                                <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-slate-50 w-[120px] font-bold text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl">{monthsForSelect.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                                            </Select>
                                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-100 shadow-sm hover:bg-slate-50 transition-all" onClick={() => setIsPrintingAnniversaries(true)}>
                                                <Printer className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <Tabs defaultValue="seniority" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2 bg-slate-50 mb-6 rounded-xl p-1">
                                                <TabsTrigger value="seniority" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all rounded-lg">
                                                    <Award className="h-3.5 w-3.5 mr-2" /> Ancienneté
                                                </TabsTrigger>
                                                <TabsTrigger value="birthdays" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 transition-all rounded-lg">
                                                    <Cake className="h-3.5 w-3.5 mr-2" /> Naissances
                                                </TabsTrigger>
                                            </TabsList>

                                            {loading ? <Skeleton className="h-[300px] w-full rounded-2xl" /> : (
                                                <>
                                                    <TabsContent value="seniority" className="space-y-6 focus-visible:outline-none">
                                                        {seniorityAnniversaries.length > 0 ? seniorityAnniversaries.map(emp => {
                                                            const years = emp.dateEmbauche ? differenceInYears(new Date(parseInt(selectedAnniversaryYear), parseInt(selectedAnniversaryMonth)), parseISO(emp.dateEmbauche)) : 0;
                                                            return (
                                                                <div key={`senior-${emp.id}`} className="flex items-center justify-between group p-3 hover:bg-blue-50/50 rounded-2xl transition-all border border-transparent hover:border-blue-100">
                                                                    <div className="flex items-center gap-4">
                                                                        <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                                                            <AvatarImage src={emp.photoUrl} alt={emp.name} />
                                                                            <AvatarFallback className="bg-blue-50 text-blue-400 font-bold"><Award className="h-5 w-5" /></AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <p className="font-bold text-slate-900">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.poste}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100 border-none font-black px-3 py-1 rounded-lg">{years} ans</Badge>
                                                                        <span className="text-[10px] text-slate-300 font-bold italic">Ancienneté</span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        }) : (
                                                            <div className="py-20 text-center flex flex-col items-center gap-4 text-slate-300">
                                                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                                                    <Award className="h-8 w-8 opacity-20" />
                                                                </div>
                                                                <p className="text-sm italic font-medium">Aucun jubilé pour cette période.</p>
                                                            </div>
                                                        )}
                                                    </TabsContent>

                                                    <TabsContent value="birthdays" className="space-y-6 focus-visible:outline-none">
                                                        {birthdayAnniversaries.length > 0 ? birthdayAnniversaries.map(emp => (
                                                            <div key={`birth-${emp.id}`} className="flex items-center justify-between group p-3 hover:bg-rose-50/50 rounded-2xl transition-all border border-transparent hover:border-rose-100">
                                                                <div className="flex items-center gap-4">
                                                                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                                                        <AvatarImage src={emp.photoUrl} alt={emp.name} />
                                                                        <AvatarFallback className="bg-rose-50 text-rose-400 font-bold"><Cake className="h-5 w-5" /></AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="font-bold text-slate-900">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.poste}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <Badge className="bg-rose-100 text-rose-600 hover:bg-rose-100 border-none font-black px-3 py-1 rounded-lg">
                                                                        {emp.Date_Naissance ? format(parseISO(emp.Date_Naissance), 'dd MMMM', { locale: fr }) : '-'}
                                                                    </Badge>
                                                                    <span className="text-[10px] text-slate-300 font-bold italic">Anniversaire</span>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="py-20 text-center flex flex-col items-center gap-4 text-slate-300">
                                                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                                                    <Cake className="h-8 w-8 opacity-20" />
                                                                </div>
                                                                <p className="text-sm italic font-medium">Aucun anniversaire pour cette période.</p>
                                                            </div>
                                                        )}
                                                    </TabsContent>
                                                </>
                                            )}
                                        </Tabs>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                                     <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                <History className="h-5 w-5 text-amber-500" /> Départs à la Retraite
                                            </CardTitle>
                                            <CardDescription className="text-xs font-medium uppercase tracking-widest text-slate-400">Archivage & fin de carrière</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Select value={selectedRetirementYear} onValueChange={setSelectedRetirementYear}>
                                                <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-slate-50 w-[100px] font-bold text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl">{retirementYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                            </Select>
                                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-100 shadow-sm hover:bg-slate-50 transition-all" onClick={() => setIsPrintingRetirements(true)}>
                                                <Printer className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        {loading ? <Skeleton className="h-[300px] w-full" /> : (
                                            <div className="space-y-6">
                                                {upcomingRetirements.length > 0 ? upcomingRetirements.map(emp => (
                                                    <div key={emp.id} className="flex items-center justify-between group p-3 hover:bg-amber-50/50 rounded-2xl transition-all border border-transparent hover:border-amber-100">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                                                <AvatarImage src={emp.photoUrl} alt={emp.name} />
                                                                <AvatarFallback className="bg-amber-50 text-amber-400 font-bold">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.poste}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-black px-3 py-1 rounded-lg">
                                                                {emp.calculatedRetirementDate && format(new Date(emp.calculatedRetirementDate), 'MMM yyyy', { locale: fr })}
                                                            </Badge>
                                                            <span className="text-[10px] text-slate-300 font-bold italic">Passage Relais</span>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="py-20 text-center flex flex-col items-center gap-4 text-slate-300">
                                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                                            <LogOutIcon className="h-8 w-8 opacity-20" />
                                                        </div>
                                                        <p className="text-sm italic font-medium">Aucun départ à la retraite prévu pour {selectedRetirementYear}.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="stability" className="space-y-10 focus-visible:outline-none focus-visible:ring-0">
                            {/* Territorial Heatmap Integration */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <ConflictHeatmap conflicts={globalStats.conflicts} className="h-full border-2 border-slate-100" />
                                </div>
                                <div className="space-y-8">
                                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden p-8">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4" /> Analyse de Sûreté
                                        </h3>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Dossiers Résolus</p>
                                                    <p className="text-2xl font-black">{globalStats.conflicts.filter(c => c.status === 'Résolu').length}</p>
                                                </div>
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black">Success</Badge>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Médiations en cours</p>
                                                    <p className="text-2xl font-black">{globalStats.conflicts.filter(c => c.status === 'En médiation').length}</p>
                                                </div>
                                                <Badge className="bg-amber-500/20 text-amber-400 border-none font-black text-[10px]">Alerte</Badge>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Zones Rouges</p>
                                                    <p className="text-2xl font-black">2 Régions</p>
                                                </div>
                                                <Badge className="bg-rose-500/20 text-rose-400 border-none font-black text-[10px]">Critique</Badge>
                                            </div>
                                        </div>
                                        <Button className="w-full mt-8 bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30" asChild>
                                            <Link href="/conflicts/analytics">Rapport Complet <TrendingUp className="ml-2 h-4 w-4" /></Link>
                                        </Button>
                                    </Card>

                                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white p-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Dernières Alertes SIG</h3>
                                        <div className="space-y-4">
                                            {globalStats.conflicts.slice(0, 3).map(c => (
                                                <div key={c.id} className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", c.status === 'Résolu' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500")}>
                                                        <AlertTriangle className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{c.village} ({c.region})</p>
                                                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{c.parties}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </PermissionGuard>
    );
}
