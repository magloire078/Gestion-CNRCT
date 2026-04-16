
"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from 'react';
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
    Zap,
    Scale,
    BarChart3
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
        primary: "bg-blue-600 text-white shadow-blue-500/20",
        success: "bg-emerald-500 text-white shadow-emerald-500/20",
        warning: "bg-amber-500 text-white shadow-amber-500/20",
        info: "bg-slate-900 text-white shadow-slate-900/20",
        rose: "bg-rose-500 text-white shadow-rose-500/20",
        amber: "bg-orange-600 text-white shadow-orange-600/20"
    };

    const gradientClasses: Record<string, string> = {
        primary: "from-blue-500/10 to-transparent",
        success: "from-emerald-500/10 to-transparent",
        warning: "from-amber-500/10 to-transparent",
        info: "from-slate-900/10 to-transparent",
        rose: "from-rose-500/10 to-transparent",
        amber: "from-orange-600/10 to-transparent"
    };

    const cardContent = (
        <Card className="group relative overflow-hidden border-white/20 shadow-2xl bg-white/40 backdrop-blur-md rounded-[2.5rem] hover:-translate-y-2 transition-all duration-700">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700", gradientClasses[color])} />
            <div className={cn("absolute top-0 right-0 p-8 opacity-[0.03] transition-transform group-hover:scale-150 group-hover:opacity-[0.08] duration-1000 pointer-events-none")}>
                <Icon className="h-32 w-32 rotate-12" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10 px-8 pt-8">
                <div className={cn("p-4 rounded-2xl shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", colorClasses[color])}>
                    <Icon className="h-6 w-6" />
                </div>
                {trend && (
                    <div className={cn("flex items-center gap-1.5 text-[9px] font-black uppercase px-3 py-1 rounded-full border shadow-sm", trend.up ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>
                        {trend.value} <TrendingUp className={cn("h-3 w-3", !trend.up && "rotate-180")} />
                    </div>
                )}
            </CardHeader>
            <CardContent className="relative z-10 px-8 pb-8 pt-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 pl-0.5">{title}</span>
                    {loading ? <Skeleton className="h-10 w-24 mt-2 rounded-lg" /> : (
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">
                            {value}
                        </div>
                    )}
                    {description && <p className="text-[10px] text-slate-400 font-bold mt-3 italic border-l-2 border-slate-200 pl-4">{description}</p>}
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
        <Card className="border-white/10 shadow-3xl bg-white/50 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border/50 py-8 px-8">
                <div className="flex items-center gap-4 mb-1">
                    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Flux de Recrutement</CardTitle>
                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Dernières intégrations par catégorie métier.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                {loading ? <Skeleton className="h-64 w-full rounded-3xl" /> : (
                    categoriesWithRecruits.length > 0 ? (
                        <Tabs defaultValue={categoriesWithRecruits[0][0]} className="space-y-8">
                            <TabsList className="flex flex-wrap h-auto bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 w-full overflow-x-auto no-scrollbar">
                                {categoriesWithRecruits.map(([group, _]) => (
                                    <TabsTrigger key={group} value={group} className="flex-1 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all whitespace-nowrap">
                                        {categoryLabels[group as EmployeeGroup] || group}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {categoriesWithRecruits.map(([group, recruits]) => (
                                <TabsContent key={group} value={group} className="focus-visible:outline-none">
                                    <div className="space-y-6">
                                        {recruits.slice(0, 4).map(emp => (
                                            <div key={emp.id} className="flex items-center gap-5 group p-3 hover:bg-white/60 rounded-2xl transition-all border border-transparent hover:border-white/40 shadow-sm hover:shadow-xl">
                                                <Avatar className="h-14 w-14 border-[3px] border-white shadow-2xl ring-1 ring-slate-100">
                                                    <AvatarImage src={emp.photoUrl} alt={emp.name} className="object-cover" />
                                                    <AvatarFallback className="bg-slate-100 font-black text-slate-400 text-sm">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-slate-900 group-hover:text-primary transition-colors truncate text-sm uppercase tracking-tight">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1">{emp.poste}</p>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest opacity-60">ID : {emp.matricule}</span>
                                                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                                                        <span className="text-[9px] text-slate-400 font-bold italic tracking-widest opacity-60">Entrée {formatDate(emp.dateEmbauche)}</span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full opacity-0 group-hover:opacity-100 group-hover:bg-slate-900 group-hover:text-white transition-all" asChild>
                                                    <Link href="/employees"><ArrowUpRight className="h-5 w-5" /></Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center gap-6 text-slate-300">
                             <div className="h-20 w-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100">
                                <Users className="h-10 w-10 opacity-10" />
                            </div>
                            <p className="text-sm font-black uppercase tracking-widest opacity-60">Aucune intégration récente.</p>
                        </div>
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
    const [activeTab, setActiveTab] = useState("overview");
    const [isPending, startTransition] = useTransition();

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
            <div className="pb-20 space-y-12">
                <div className="flex flex-col gap-10">
                    {/* Hero Welcome Ultra-Premium */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 p-10 rounded-[3rem] bg-card/40 backdrop-blur-md border border-white/10 shadow-3xl relative overflow-hidden group">
                        {/* Institutional Background Element */}
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000 pointer-events-none">
                            <Scale className="h-96 w-96 rotate-12" />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-10 relative z-10 font-black">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-125 animate-pulse" />
                                <Avatar className="h-32 w-32 md:h-44 md:w-44 border-[6px] border-white shadow-3xl flex-shrink-0 relative z-10 transition-transform duration-700 group-hover:scale-110">
                                    <AvatarImage src={user?.photoUrl || undefined} alt={user?.name || ''} className="object-cover" />
                                    <AvatarFallback className="bg-slate-900 text-white font-black text-5xl">
                                        {user?.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-3 -right-3 h-12 w-12 bg-blue-600 border-[5px] border-white rounded-2xl shadow-3xl z-20 flex items-center justify-center transform rotate-12 group-hover:rotate-0 transition-transform">
                                    <ShieldCheck className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="px-4 py-1.5 rounded-full bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                                        Observatoire National
                                    </div>
                                    <div className="px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                                        v3.2.0-ELITE
                                    </div>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase">
                                    Gouvernance <br/> <span className="text-slate-400">& Pilotage</span>
                                </h1>
                                <p className="text-slate-500 text-base md:text-xl font-bold leading-relaxed max-w-2xl opacity-80 uppercase tracking-tight">
                                    Bonjour, <span className="text-slate-900 font-black decoration-blue-500/30 decoration-8 underline underline-offset-8">{user?.name}</span>. 
                                    Synchronisation des indicateurs du Directoire National terminée.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                            <Link href="/reports">
                                <Button variant="outline" className="h-16 rounded-2xl px-10 border-slate-200 font-black bg-white text-slate-900 shadow-2xl hover:bg-slate-50 hover:shadow-primary/10 transition-all uppercase text-[11px] tracking-widest active:scale-95">
                                    <Download className="h-5 w-5 mr-4 text-blue-600" />
                                    Reportings d'Audit
                                </Button>
                            </Link>
                            <Link href="/mapping">
                                <Button className="h-16 rounded-2xl px-10 bg-slate-900 font-black shadow-3xl shadow-slate-900/40 hover:bg-black transition-all uppercase text-[11px] tracking-widest border-t border-white/10 active:scale-95">
                                    <Zap className="h-5 w-5 mr-4 text-blue-400 fill-blue-400 animate-pulse" />
                                    Plateforme SIG
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Dashboard Content Ultra-Premium */}
                    <Tabs value={activeTab} onValueChange={(val) => startTransition(() => setActiveTab(val))} className="space-y-12">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b-[3px] border-slate-100 pb-4 px-4">
                            <TabsList className="bg-transparent gap-16 h-auto p-0 flex flex-wrap lg:flex-nowrap">
                                <TabsTrigger 
                                    value="overview" 
                                    className="px-0 py-4 h-auto rounded-none border-b-[5px] border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent shadow-none text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 data-[state=active]:text-slate-900 transition-all"
                                >
                                    Flux Stratégiques
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="alerts" 
                                    className="px-0 py-4 h-auto rounded-none border-b-[5px] border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent shadow-none text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 data-[state=active]:text-slate-900 transition-all"
                                >
                                    Ressources Humaines
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="stability" 
                                    className="px-0 py-4 h-auto rounded-none border-b-[5px] border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent shadow-none text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 data-[state=active]:text-slate-900 transition-all"
                                >
                                    Intégrité & Territoires
                                </TabsTrigger>
                            </TabsList>
                            <div className="flex items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.7)] animate-pulse" /> 
                                    Système Opérationnel
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" /> 
                                    Audit Temps-Réel
                                </div>
                            </div>
                        </div>

                        <TabsContent value="overview" className="space-y-12 focus-visible:outline-none focus-visible:ring-0">
                            {/* Key Performance Indicators Upgraded */}
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                                <StatCard loading={loading} title="Effectifs Total" value={globalStats.activeEmployees.toString()} icon={Users} color="primary" trend={{ value: "+2.4%", up: true }} />
                                <StatCard loading={loading} title="Conseil des Sages" value={globalStats.employees.filter(e => getEmployeeGroup(e, globalStats.departments) === 'directoire' && e.status === 'Actif').length.toString()} icon={Crown} color="amber" trend={{ value: "Stable", up: true }} />
                                <StatCard loading={loading} title="Incidents SIG" value={globalStats.conflicts.filter(c => c.status !== 'Résolu').length.toString()} icon={AlertTriangle} color="rose" trend={{ value: "-4%", up: false }} description="Alertes territoriales actives" />
                                <StatCard loading={loading} title="Pôles d'Action" value={globalStats.departments.length.toString()} icon={Building} color="info" trend={{ value: "+1", up: true }} />
                            </div>

                            {/* Charts Section */}
                            <div className="grid gap-10 lg:grid-cols-7">
                                <Card className="lg:col-span-4 border-white/10 shadow-3xl bg-white/50 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="p-8 pb-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-4">
                                                   <TrendingUp className="h-6 w-6 text-blue-600" />
                                                   Analyse Structurelle
                                                </CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Répartition géostratégique des effectifs</CardDescription>
                                            </div>
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                <BarChart3 className="h-6 w-6 text-slate-400" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-10 pb-10 pt-4">
                                        {loading ? <Skeleton className="h-[450px] w-full rounded-[2.5rem]" /> : <EmployeeDistributionChart />}
                                    </CardContent>
                                </Card>
                                <div className="lg:col-span-3">
                                    <LatestRecruitsCard employees={globalStats.employees} loading={loading} departments={globalStats.departments} />
                                </div>
                            </div>

                            {/* Triple Bottom Panels */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-6">
                                <Card className="border-white/10 shadow-3xl rounded-[2.5rem] bg-slate-950 text-white overflow-hidden relative group p-8 min-h-[300px] flex flex-col justify-between">
                                     <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-blue-600/20 to-transparent pointer-events-none" />
                                     <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                                         <Globe className="h-64 w-64" />
                                     </div>
                                     <div className="relative z-10 space-y-8">
                                         <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-blue-600 shadow-xl flex items-center justify-center">
                                                <Globe className="h-6 w-6 text-white" />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-blue-400">Rayonnement</h3>
                                         </div>
                                         <div className="space-y-2">
                                            <div className="text-6xl font-black tracking-tighter">{globalStats.employees.filter(e => getEmployeeGroup(e, globalStats.departments) === 'regional').length}</div>
                                            <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Représentants territoriaux répartis sur l'ensemble du territoire national.</div>
                                         </div>
                                     </div>
                                     <Button variant="outline" className="w-full relative z-10 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black h-14 rounded-2xl transition-all uppercase text-[10px] tracking-widest shadow-2xl" asChild>
                                         <Link href="/mapping">Cartographie SIG <MapIcon className="ml-3 h-5 w-5" /></Link>
                                     </Button>
                                </Card>

                                <Card className="border-white/10 shadow-3xl rounded-[2.5rem] bg-emerald-50 overflow-hidden relative group p-8 min-h-[300px] flex flex-col justify-between">
                                     <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                         <HelpCircle className="h-64 w-64" />
                                     </div>
                                     <div className="relative z-10 space-y-8">
                                         <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-emerald-600 shadow-xl flex items-center justify-center">
                                                <HelpCircle className="h-6 w-6 text-white" />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600">Maintenance</h3>
                                         </div>
                                         <div className="space-y-2">
                                            <div className="text-6xl font-black tracking-tighter text-emerald-950">98%</div>
                                            <div className="text-[11px] text-emerald-800 font-black uppercase tracking-widest leading-relaxed">Taux moyen de disponibilité des ressources numériques & applicatives.</div>
                                         </div>
                                     </div>
                                     <Button className="w-full relative z-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl transition-all uppercase text-[10px] tracking-widest shadow-2xl shadow-emerald-500/30" asChild>
                                         <Link href="/helpdesk">Support Technique <Briefcase className="ml-3 h-5 w-5" /></Link>
                                     </Button>
                                </Card>

                                <Card className="border-white/10 shadow-3xl rounded-[2.5rem] bg-blue-50 overflow-hidden relative group p-8 min-h-[300px] flex flex-col justify-between border-2 border-blue-100">
                                     <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-6 group-hover:rotate-12 transition-transform duration-1000">
                                         <Rocket className="h-64 w-64" />
                                     </div>
                                     <div className="relative z-10 space-y-8">
                                         <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-blue-600 shadow-xl flex items-center justify-center font-black">
                                                <Rocket className="h-6 w-6 text-white" />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Opérations</h3>
                                         </div>
                                         <div className="space-y-2">
                                            <div className="text-6xl font-black tracking-tighter text-blue-950">12</div>
                                            <div className="text-[11px] text-blue-800 font-black uppercase tracking-widest leading-relaxed">Missions diplomatiques & territoriales inscrites à l'ordre du jour.</div>
                                         </div>
                                     </div>
                                     <Button className="w-full relative z-10 bg-blue-600 hover:bg-blue-700 text-white font-black h-14 rounded-2xl transition-all uppercase text-[10px] tracking-widest shadow-2xl shadow-blue-500/30" asChild>
                                         <Link href="/missions">Ordre de Mission <ChevronRight className="ml-3 h-5 w-5" /></Link>
                                     </Button>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="alerts" className="space-y-12 focus-visible:outline-none focus-visible:ring-0">
                            <div className="grid gap-10 md:grid-cols-2">
                                <Card className="border-white/10 shadow-3xl bg-white/50 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="p-10 border-b border-border/50 bg-primary/5">
                                        <div className="flex items-center justify-between gap-6">
                                            <div className="space-y-2">
                                                <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-5 text-slate-900">
                                                    <Sparkles className="h-8 w-8 text-rose-500" /> Célébrations & Milestones
                                                </CardTitle>
                                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registre événementiel du personnel</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Select value={selectedAnniversaryMonth} onValueChange={setSelectedAnniversaryMonth}>
                                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white w-[160px] font-black text-[10px] uppercase tracking-widest shadow-md"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">{monthsForSelect.map(m => <SelectItem key={m.value} value={m.value} className="font-bold py-3 uppercase text-[9px]">{m.label}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-slate-200 bg-white shadow-md hover:bg-slate-50 transition-all active:scale-95" onClick={() => setIsPrintingAnniversaries(true)}>
                                                    <Printer className="h-5 w-5 text-slate-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-10">
                                        <Tabs defaultValue="seniority" className="w-full space-y-10">
                                            <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 rounded-2xl p-1.5 border border-slate-200/50">
                                                <TabsTrigger value="seniority" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all rounded-xl py-4">
                                                    <Award className="h-4 w-4 mr-3" /> Ancienneté
                                                </TabsTrigger>
                                                <TabsTrigger value="birthdays" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-lg transition-all rounded-xl py-4">
                                                    <Cake className="h-4 w-4 mr-3" /> Naissances
                                                </TabsTrigger>
                                            </TabsList>
                                            {loading ? <Skeleton className="h-[400px] w-full rounded-[2.5rem]" /> : (
                                                <>
                                                    <TabsContent value="seniority" className="space-y-8 focus-visible:outline-none">
                                                        {seniorityAnniversaries.length > 0 ? (
                                                            <div className="space-y-6">
                                                                {seniorityAnniversaries.map(emp => (
                                                                    <div key={`senior-${emp.id}`} className="flex items-center justify-between group p-4 hover:bg-white rounded-[1.5rem] transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-xl">
                                                                        <div className="flex items-center gap-6">
                                                                            <Avatar className="h-16 w-16 border-[3px] border-white shadow-2xl ring-1 ring-blue-100">
                                                                                <AvatarImage src={emp.photoUrl} alt={emp.name} className="object-cover" />
                                                                                <AvatarFallback className="bg-blue-50 text-blue-400 font-black"><Award className="h-6 w-6" /></AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <p className="font-black text-slate-900 text-base uppercase tracking-tight">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">{emp.poste}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-2">
                                                                            <Badge className="bg-slate-900 text-white border-none font-black px-5 py-2 rounded-xl shadow-xl shadow-slate-900/10 text-[10px] uppercase tracking-widest whitespace-nowrap">{emp.seniorityYears} ANS DE SERVICE</Badge>
                                                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em] italic opacity-60">Fidélité Institutionalisée</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="py-24 text-center flex flex-col items-center gap-8 text-slate-300">
                                                                <div className="h-24 w-24 bg-slate-50 rounded-[3rem] flex items-center justify-center border border-slate-100">
                                                                    <Award className="h-12 w-12 opacity-15" />
                                                                </div>
                                                                <p className="text-xs font-black uppercase tracking-widest opacity-60">Aucun jubilé archivé pour ce mois.</p>
                                                            </div>
                                                        )}
                                                    </TabsContent>
                                                    <TabsContent value="birthdays" className="space-y-8 focus-visible:outline-none">
                                                        {birthdayAnniversaries.length > 0 ? (
                                                            <div className="space-y-6">
                                                                {birthdayAnniversaries.map(emp => (
                                                                    <div key={`birth-${emp.id}`} className="flex items-center justify-between group p-4 hover:bg-white rounded-[1.5rem] transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-xl">
                                                                        <div className="flex items-center gap-6">
                                                                            <Avatar className="h-16 w-16 border-[3px] border-white shadow-2xl ring-1 ring-rose-100">
                                                                                <AvatarImage src={emp.photoUrl} alt={emp.name} className="object-cover" />
                                                                                <AvatarFallback className="bg-rose-50 text-rose-400 font-black"><Cake className="h-6 w-6" /></AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <p className="font-black text-slate-900 text-base uppercase tracking-tight">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mt-1">{emp.poste}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-2">
                                                                            <Badge className="bg-rose-500 text-white border-none font-black px-5 py-2 rounded-xl shadow-xl shadow-rose-500/20 text-[10px] uppercase tracking-widest uppercase">
                                                                                Célébré le {emp.birthDayFormatted}
                                                                            </Badge>
                                                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em] italic opacity-60">Fraternité CNRCT</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="py-24 text-center flex flex-col items-center gap-8 text-slate-300">
                                                                <div className="h-24 w-24 bg-slate-50 rounded-[3rem] flex items-center justify-center border border-slate-100">
                                                                    <Cake className="h-12 w-12 opacity-15" />
                                                                </div>
                                                                <p className="text-xs font-black uppercase tracking-widest opacity-60">Aucun anniversaire identifié.</p>
                                                            </div>
                                                        )}
                                                    </TabsContent>
                                                </>
                                            )}
                                        </Tabs>
                                    </CardContent>
                                </Card>
                                <Card className="border-white/10 shadow-3xl bg-white/50 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="p-10 border-b border-border/50 bg-primary/5">
                                        <div className="flex items-center justify-between gap-6">
                                            <div className="space-y-2">
                                                <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-5 text-slate-900">
                                                    <History className="h-8 w-8 text-amber-600" /> Passations de Relais
                                                </CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Planification des fins de carrières</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Select value={selectedRetirementYear} onValueChange={setSelectedRetirementYear}>
                                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white w-[130px] font-black text-[10px] uppercase tracking-widest shadow-md"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">{retirementYears.map(y => <SelectItem key={y} value={y} className="font-bold py-3 uppercase text-[9px]">{y}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-slate-200 bg-white shadow-md hover:bg-slate-50 transition-all active:scale-95" onClick={() => setIsPrintingRetirements(true)}>
                                                    <Printer className="h-5 w-5 text-slate-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-10">
                                        {loading ? <Skeleton className="h-[500px] w-full rounded-[2.5rem]" /> : (
                                            <div className="space-y-8">
                                                {upcomingRetirements.length > 0 ? (
                                                    <div className="space-y-6">
                                                        {upcomingRetirements.map(emp => (
                                                            <div key={emp.id} className="flex items-center justify-between group p-4 hover:bg-white rounded-[1.5rem] transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-xl">
                                                                <div className="flex items-center gap-6">
                                                                    <Avatar className="h-16 w-16 border-[3px] border-white shadow-2xl ring-1 ring-amber-100">
                                                                        <AvatarImage src={emp.photoUrl} alt={emp.name} className="object-cover" />
                                                                        <AvatarFallback className="bg-amber-50 text-amber-500 font-black text-xs">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="font-black text-slate-900 text-base uppercase tracking-tight">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mt-1">{emp.poste}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <Badge className="bg-amber-500 text-white border-none font-black px-5 py-2 rounded-xl shadow-xl shadow-amber-500/20 text-[10px] uppercase tracking-widest whitespace-nowrap">
                                                                        DÉPART PREVU EN {emp.formattedRetirementDate.split(' ').pop()}
                                                                    </Badge>
                                                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em] italic opacity-60">Reconnaissance de l'État</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-32 text-center flex flex-col items-center gap-8 text-slate-300">
                                                        <div className="h-24 w-24 bg-slate-50 rounded-[3rem] flex items-center justify-center border border-slate-100">
                                                            <LogOutIcon className="h-12 w-12 opacity-15" />
                                                        </div>
                                                        <p className="text-xs font-black uppercase tracking-widest opacity-60">Aucun départ à la retraite imminent.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="stability" className="space-y-12 focus-visible:outline-none focus-visible:ring-0">
                            {/* Territorial Heatmap Integration Premium */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 relative">
                                    <div className="absolute top-10 left-10 z-20 bg-slate-900/90 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-3xl border border-white/20 flex items-center gap-4 scale-90 md:scale-100">
                                        <div className="h-3 w-3 rounded-full bg-rose-500 animate-ping shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Live Monitor : Sûreté Nationale</span>
                                    </div>
                                    <ConflictHeatmap conflicts={globalStats.conflicts} className="h-full border-4 border-white shadow-3xl rounded-[3rem] overflow-hidden bg-white min-h-[600px]" />
                                </div>
                                <div className="space-y-10">
                                    <Card className="border-white/10 shadow-3xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden p-10 relative group border-t border-white/10">
                                         <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-blue-600/20 to-transparent pointer-events-none" />
                                         <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform duration-1000 group-hover:scale-110 pointer-events-none">
                                            <ShieldCheck className="h-64 w-64" />
                                         </div>
                                         <h3 className="text-xs font-black uppercase tracking-[0.25em] text-blue-400 mb-10 flex items-center gap-4 relative z-10">
                                            <div className="h-1 lg:h-8 w-1 lg:w-1 bg-blue-500 rounded-full" />
                                            Analyse de Stabilité
                                         </h3>
                                         <div className="space-y-10 relative z-10">
                                            <div className="flex justify-between items-end border-b border-white/10 pb-8 group/item hover:translate-x-2 transition-transform cursor-pointer">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dossiers Résolus</p>
                                                    <p className="text-5xl font-black tracking-tight">{globalStats.conflicts.filter(c => c.status === 'Résolu').length}</p>
                                                </div>
                                                <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] px-4 py-1.5 rounded-xl mb-2 shadow-2xl shadow-emerald-500/40 uppercase tracking-widest">SUCCESS 100%</Badge>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-white/10 pb-8 group/item hover:translate-x-2 transition-transform cursor-pointer">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Médiations actives</p>
                                                    <p className="text-5xl font-black tracking-tight text-amber-400">{globalStats.conflicts.filter(c => c.status === 'En médiation').length}</p>
                                                </div>
                                                <Badge className="bg-amber-500 text-white border-none font-black text-[9px] px-4 py-1.5 rounded-xl mb-2 shadow-2xl shadow-amber-500/40 uppercase tracking-widest">ALERTE MOYENNE</Badge>
                                            </div>
                                            <div className="flex justify-between items-end pb-2 group/item hover:translate-x-2 transition-transform cursor-pointer">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tensions Ouvertes</p>
                                                    <p className="text-5xl font-black tracking-tight text-rose-500">{globalStats.conflicts.filter(c => c.status === 'Ouvert').length}</p>
                                                </div>
                                                <Badge className="bg-rose-600 text-white border-none font-black text-[9px] px-4 py-1.5 rounded-xl mb-2 shadow-2xl shadow-rose-600/40 uppercase tracking-widest">URGENCE CRITIQUE</Badge>
                                            </div>
                                         </div>
                                         <Button className="w-full mt-10 bg-blue-600 hover:bg-blue-700 h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-3xl shadow-blue-500/40 transition-all border-none relative z-10 active:scale-95" asChild>
                                             <Link href="/conflicts/analytics">Lancer Audit de Terrain <TrendingUp className="ml-4 h-5 w-5" /></Link>
                                         </Button>
                                    </Card>

                                    <Card className="border-white/10 shadow-3xl rounded-[2.5rem] bg-white/60 backdrop-blur-md p-10 flex flex-col justify-between group">
                                        <div>
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-10 flex items-center gap-4">
                                                <MapIcon className="h-5 w-5 text-slate-400" /> SIG : Flux de Proximité
                                            </h3>
                                            <div className="space-y-8">
                                                {globalStats.conflicts.slice(0, 3).map(c => (
                                                    <div key={c.id} className="flex gap-6 p-4 rounded-3xl hover:bg-white transition-all group border border-transparent hover:border-slate-100 shadow-sm hover:shadow-2xl translate-z-0">
                                                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all group-hover:rotate-6", c.status === 'Résolu' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500")}>
                                                            <AlertTriangle className="h-7 w-7" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 opacity-60 leading-none">{c.village} · {c.region}</p>
                                                            <p className="text-base font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1 truncate uppercase tracking-tight">{c.parties}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 italic tracking-widest mt-1 opacity-60 uppercase">Dossier N°SIG-{c.id.substring(0,4)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <Button variant="ghost" className="w-full mt-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] text-slate-400 hover:bg-slate-900 hover:text-white transition-all" asChild>
                                            <Link href="/village-repository">Voir toute la base SIG <ArrowUpRight className="ml-3 h-4 w-4" /></Link>
                                        </Button>
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
