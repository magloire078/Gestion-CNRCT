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
    Zap
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
        <Card className="group relative overflow-hidden border-none shadow-2xl shadow-slate-200/50 hover:shadow-primary/10 transition-all duration-700 rounded-[2.5rem] bg-white hover:-translate-y-2">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700", gradientClasses[color])} />
            <div className={cn("absolute top-0 right-0 p-10 opacity-[0.03] transition-transform group-hover:scale-150 group-hover:opacity-[0.08] duration-1000")}>
                <Icon className="h-32 w-32" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10 px-8 pt-8">
                <div className={cn("p-4 rounded-2xl shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", colorClasses[color])}>
                    <Icon className="h-6 w-6" />
                </div>
                {trend && (
                    <div className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-full border shadow-sm", trend.up ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>
                        {trend.value} <TrendingUp className={cn("h-3 w-3", !trend.up && "rotate-180")} />
                    </div>
                )}
            </CardHeader>
            <CardContent className="relative z-10 px-8 pb-8 pt-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</span>
                    {loading ? <Skeleton className="h-12 w-32 mt-2 rounded-xl" /> : <div className="text-4xl font-black text-slate-900 tracking-tighter">{value}</div>}
                    {description && <p className="text-[10px] text-slate-400 font-bold mt-3 italic border-l-2 border-slate-100 pl-3">{description}</p>}
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
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-10">
                <div className="flex items-center gap-3 mb-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Flux de Recrutement</CardTitle>
                </div>
                <CardDescription className="font-medium">Dernières intégrations par catégorie métier.</CardDescription>
            </CardHeader>
            <CardContent className="p-10">
                {loading ? <Skeleton className="h-64 w-full rounded-2xl" /> : (
                    categoriesWithRecruits.length > 0 ? (
                        <Tabs defaultValue={categoriesWithRecruits[0][0]} className="space-y-8">
                            <TabsList className="flex flex-wrap h-auto bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
                                {categoriesWithRecruits.map(([group, _]) => (
                                    <TabsTrigger key={group} value={group} className="rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all">
                                        {categoryLabels[group as EmployeeGroup] || group}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {categoriesWithRecruits.map(([group, recruits]) => (
                                <TabsContent key={group} value={group} className="focus-visible:outline-none">
                                    <div className="space-y-5">
                                        {recruits.slice(0, 4).map(emp => (
                                            <div key={emp.id} className="flex items-center gap-5 group p-2 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                                                <Avatar className="h-14 w-14 border-4 border-white shadow-xl ring-1 ring-slate-100">
                                                    <AvatarImage src={emp.photoUrl} alt={emp.name} className="object-cover" />
                                                    <AvatarFallback className="bg-slate-100 font-black text-slate-400 text-sm">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-slate-900 group-hover:text-primary transition-colors truncate text-sm">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">{emp.poste}</p>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] text-slate-400 font-bold italic">Entrée : {formatDate(emp.dateEmbauche)}</span>
                                                        <Badge variant="outline" className="h-4 px-2 text-[8px] font-black opacity-40 border-slate-200 uppercase tracking-tighter">{emp.matricule}</Badge>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center gap-4 text-slate-300">
                             <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                <Users className="h-8 w-8 opacity-20" />
                            </div>
                            <p className="text-sm italic font-medium">Aucune donnée de recrutement récente.</p>
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
    const [isSheetOpen, setIsSheetOpen] = useState(false);
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
            <div className="pb-20 space-y-10">
                <div className="flex flex-col gap-10">
                    {/* Hero Welcome Premium */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 pt-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-8">
                            <div className="relative">
                                <Avatar className="h-24 w-24 md:h-36 md:w-36 border-8 border-white shadow-2xl flex-shrink-0">
                                    <AvatarImage src={user?.photoUrl || undefined} alt={user?.name || ''} className="object-cover" />
                                    <AvatarFallback className="bg-slate-100 font-black text-slate-400 text-4xl">
                                        {user?.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 border-4 border-white rounded-full shadow-lg flex items-center justify-center">
                                    <ShieldCheck className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[10px] font-black uppercase tracking-[0.2em] text-primary px-3 py-1">
                                        Observatoire National
                                    </Badge>
                                    <Badge variant="outline" className="border-slate-200 bg-white text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-3 py-1">
                                        v3.2.0-STABLE
                                    </Badge>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-tight">
                                    Statistiques <br/> <span className="text-slate-400 font-medium">& Centre de Pilotage</span>
                                </h1>
                                <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-3xl">
                                    Bienvenue, <span className="text-slate-900 font-black decoration-primary/30 decoration-4 underline underline-offset-4">{user?.name}</span>. 
                                    Accédez aux indicateurs stratégiques temps-réel du Directoire National.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <Button variant="outline" className="h-16 rounded-2xl px-8 border-slate-200 font-black bg-white text-slate-900 shadow-xl shadow-slate-200/50 hover:bg-slate-50 hover:shadow-2xl transition-all uppercase text-xs tracking-widest">
                                <Download className="h-5 w-5 mr-3 text-primary" />
                                Reporting Mensuel
                            </Button>
                            <Button className="h-16 rounded-2xl px-10 bg-slate-900 font-black shadow-2xl shadow-primary/20 hover:bg-slate-800 transition-all uppercase text-xs tracking-widest border-none">
                                <Zap className="h-5 w-5 mr-3 text-yellow-400 fill-yellow-400" />
                                Intelligence Analytique
                            </Button>
                        </div>
                    </div>

                    {/* Dashboard Content Premium */}
                    <Tabs defaultValue="overview" className="space-y-12">
                        <div className="flex items-center justify-between border-b-2 border-slate-100/50 pb-2">
                            <TabsList className="bg-transparent gap-10 h-auto p-0">
                                <TabsTrigger 
                                    value="overview" 
                                    onClick={() => startTransition(() => {})}
                                    className="px-0 py-5 h-auto rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none text-xs font-black uppercase tracking-[0.2em] text-slate-400 data-[state=active]:text-slate-900 transition-all"
                                >
                                    Vue Stratégique
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="alerts" 
                                    onClick={() => startTransition(() => {})}
                                    className="px-0 py-5 h-auto rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none text-xs font-black uppercase tracking-[0.2em] text-slate-400 data-[state=active]:text-slate-900 transition-all"
                                >
                                    Alertes Événementielles
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="stability" 
                                    onClick={() => startTransition(() => {})}
                                    className="px-0 py-5 h-auto rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none text-xs font-black uppercase tracking-[0.2em] text-slate-400 data-[state=active]:text-slate-900 transition-all"
                                >
                                    Territoires & Stabilité
                                </TabsTrigger>
                            </TabsList>
                            <div className="hidden xl:flex items-center gap-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                {user?.role?.name === 'Super Administrateur' && (
                                    <>
                                        <div className="flex items-center gap-2 group cursor-help">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" /> 
                                            <span className="group-hover:text-emerald-500 transition-colors">Infrastructure OK</span>
                                        </div>
                                        <div className="flex items-center gap-2 group cursor-help">
                                            <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> 
                                            <span className="group-hover:text-blue-500 transition-colors">Sync Firestore active</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <TabsContent value="overview" className="space-y-12 focus-visible:outline-none focus-visible:ring-0">
                            {/* Key Performance Indicators Upgraded */}
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                                <StatCard loading={loading} title="Effectifs Opérationnels" value={globalStats.activeEmployees.toString()} icon={Users} color="primary" trend={{ value: "+2.4%", up: true }} />
                                <StatCard loading={loading} title="Membres du Directoire" value={globalStats.employees.filter(e => getEmployeeGroup(e, globalStats.departments) === 'directoire' && e.status === 'Actif').length.toString()} icon={Crown} color="amber" trend={{ value: "Stable", up: true }} />
                                <StatCard loading={loading} title="Tensions Actives" value={globalStats.conflicts.filter(c => c.status !== 'Résolu').length.toString()} icon={AlertTriangle} color="rose" trend={{ value: "-4%", up: false }} description="Dossiers en cours / médiation" />
                                <StatCard loading={loading} title="Unités Administratives" value={globalStats.departments.length.toString()} icon={Building} color="info" trend={{ value: "+1", up: true }} />
                            </div>

                            {/* Charts Section */}
                            <div className="grid gap-8 lg:grid-cols-7">
                                <Card className="lg:col-span-4 border-none shadow-2xl shadow-slate-200/50 rounded-xl overflow-hidden">
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
                                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl bg-slate-900 text-white overflow-hidden relative group">
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
                                         <Button variant="outline" className="w-full border-slate-700 bg-white/5 hover:bg-white/10 text-white font-bold h-11 rounded-lg transition-all" asChild>
                                             <Link href="/mapping">Explorer la carte <MapIcon className="ml-2 h-4 w-4" /></Link>
                                         </Button>
                                     </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl bg-emerald-50 overflow-hidden relative group">
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
                                         <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-lg shadow-lg shadow-emerald-200" asChild>
                                             <Link href="/helpdesk">Accéder au Support <HelpCircle className="ml-2 h-4 w-4" /></Link>
                                         </Button>
                                     </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl bg-blue-50 overflow-hidden relative">
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
                                         <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-lg shadow-lg shadow-blue-200" asChild>
                                             <Link href="/missions">Planning des Missions <ChevronRight className="ml-2 h-4 w-4" /></Link>
                                         </Button>
                                     </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="alerts" className="space-y-12 focus-visible:outline-none focus-visible:ring-0">
                            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-2">
                                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                                    <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/30">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                                <Sparkles className="h-5 w-5 text-rose-500" /> Célébrations & Milestones
                                            </CardTitle>
                                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Événements mensuels du personnel</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Select value={selectedAnniversaryMonth} onValueChange={setSelectedAnniversaryMonth}>
                                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white w-[130px] font-black text-[10px] uppercase tracking-widest shadow-sm"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl">{monthsForSelect.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                                            </Select>
                                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 shadow-sm hover:bg-slate-50 transition-all" onClick={() => setIsPrintingAnniversaries(true)}>
                                                <Printer className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-10">
                                        <Tabs defaultValue="seniority" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 mb-10 rounded-2xl p-1.5 border border-slate-100">
                                                <TabsTrigger value="seniority" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all rounded-xl py-3 px-6">
                                                    <Award className="h-4 w-4 mr-2" /> Ancienneté
                                                </TabsTrigger>
                                                <TabsTrigger value="birthdays" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-lg transition-all rounded-xl py-3 px-6">
                                                    <Cake className="h-4 w-4 mr-2" /> Naissances
                                                </TabsTrigger>
                                            </TabsList>
                                            {loading ? <Skeleton className="h-[300px] w-full rounded-[2rem]" /> : (
                                                <>
                                                    <TabsContent value="seniority" className="space-y-8 focus-visible:outline-none">
                                                        {seniorityAnniversaries.length > 0 ? seniorityAnniversaries.map(emp => {
                                                            const years = emp.dateEmbauche ? differenceInYears(new Date(parseInt(selectedAnniversaryYear), parseInt(selectedAnniversaryMonth)), parseISO(emp.dateEmbauche)) : 0;
                                                            return (
                                                                <div key={`senior-${emp.id}`} className="flex items-center justify-between group p-3 hover:bg-blue-50/50 rounded-2xl transition-all border border-transparent hover:border-blue-100/50">
                                                                    <div className="flex items-center gap-5">
                                                                        <Avatar className="h-14 w-14 border-4 border-white shadow-xl ring-1 ring-blue-100">
                                                                            <AvatarImage src={emp.photoUrl} alt={emp.name} className="object-cover" />
                                                                            <AvatarFallback className="bg-blue-50 text-blue-400 font-black"><Award className="h-6 w-6" /></AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <p className="font-black text-slate-900 text-sm">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{emp.poste}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1.5">
                                                                        <Badge className="bg-blue-600 text-white hover:bg-blue-600 border-none font-black px-4 py-1.5 rounded-lg shadow-lg shadow-blue-500/20 text-[10px] uppercase tracking-widest">{years} ANS</Badge>
                                                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic opacity-60">Jubilé d'Art</span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        }) : (
                                                            <div className="py-20 text-center flex flex-col items-center gap-6 text-slate-300">
                                                                <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100">
                                                                    <Award className="h-10 w-10 opacity-10" />
                                                                </div>
                                                                <p className="text-sm italic font-medium">Aucun jubilé pour cette période.</p>
                                                            </div>
                                                        )}
                                                    </TabsContent>
                                                    <TabsContent value="birthdays" className="space-y-8 focus-visible:outline-none">
                                                        {birthdayAnniversaries.length > 0 ? birthdayAnniversaries.map(emp => (
                                                            <div key={`birth-${emp.id}`} className="flex items-center justify-between group p-3 hover:bg-rose-50/50 rounded-2xl transition-all border border-transparent hover:border-rose-100/50">
                                                                <div className="flex items-center gap-5">
                                                                    <Avatar className="h-14 w-14 border-4 border-white shadow-xl ring-1 ring-rose-100">
                                                                        <AvatarImage src={emp.photoUrl} alt={emp.name} className="object-cover" />
                                                                        <AvatarFallback className="bg-rose-50 text-rose-400 font-black"><Cake className="h-6 w-6" /></AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="font-black text-slate-900 text-sm">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">{emp.poste}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1.5">
                                                                    <Badge className="bg-rose-500 text-white hover:bg-rose-500 border-none font-black px-4 py-1.5 rounded-lg shadow-lg shadow-rose-500/20 text-[10px] uppercase tracking-widest">
                                                                        {emp.Date_Naissance ? format(parseISO(emp.Date_Naissance), 'dd MMMM', { locale: fr }) : '-'}
                                                                    </Badge>
                                                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic opacity-60">Félicitations</span>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="py-20 text-center flex flex-col items-center gap-6 text-slate-300">
                                                                <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100">
                                                                    <Cake className="h-10 w-10 opacity-10" />
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
                                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                                     <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/30">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                                <History className="h-5 w-5 text-amber-600" /> Passations de Relais
                                            </CardTitle>
                                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Archivage & Planification fin de carrière</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Select value={selectedRetirementYear} onValueChange={setSelectedRetirementYear}>
                                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white w-[110px] font-black text-[10px] uppercase tracking-widest shadow-sm"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl">{retirementYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                            </Select>
                                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 shadow-sm hover:bg-slate-50 transition-all" onClick={() => setIsPrintingRetirements(true)}>
                                                <Printer className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-10">
                                        {loading ? <Skeleton className="h-[400px] w-full rounded-[2rem]" /> : (
                                            <div className="space-y-8">
                                                {upcomingRetirements.length > 0 ? upcomingRetirements.map(emp => (
                                                    <div key={emp.id} className="flex items-center justify-between group p-3 hover:bg-amber-50/50 rounded-2xl transition-all border border-transparent hover:border-amber-100/50">
                                                        <div className="flex items-center gap-5">
                                                            <Avatar className="h-14 w-14 border-4 border-white shadow-xl ring-1 ring-amber-100">
                                                                <AvatarImage src={emp.photoUrl} alt={emp.name} className="object-cover" />
                                                                <AvatarFallback className="bg-amber-50 text-amber-500 font-black text-sm">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-black text-slate-900 text-sm">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">{emp.poste}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <Badge className="bg-amber-500 text-white hover:bg-amber-500 border-none font-black px-4 py-1.5 rounded-lg shadow-lg shadow-amber-500/20 text-[10px] uppercase tracking-widest">
                                                                {emp.calculatedRetirementDate && format(new Date(emp.calculatedRetirementDate), 'MMM yyyy', { locale: fr })}
                                                            </Badge>
                                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic opacity-60">Retraite Dorée</span>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="py-20 text-center flex flex-col items-center gap-6 text-slate-300">
                                                        <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100">
                                                            <LogOutIcon className="h-10 w-10 opacity-10" />
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

                        <TabsContent value="stability" className="space-y-12 focus-visible:outline-none focus-visible:ring-0">
                            {/* Territorial Heatmap Integration Premium */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 relative">
                                    <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-white/50 flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Live: Sûreté Nationale</span>
                                    </div>
                                    <ConflictHeatmap conflicts={globalStats.conflicts} className="h-full border-2 border-slate-100/50 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50" />
                                </div>
                                <div className="space-y-10">
                                    <Card className="border-none shadow-2xl shadow-slate-300/30 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden p-10 relative group">
                                         <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-blue-600/20 to-transparent pointer-events-none" />
                                         <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-8 flex items-center gap-3 relative z-10">
                                            <ShieldCheck className="h-5 w-5" /> Analyse de Sûreté
                                         </h3>
                                         <div className="space-y-8 relative z-10">
                                            <div className="flex justify-between items-end border-b border-white/10 pb-6 group/item hover:translate-x-1 transition-transform">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dossiers Résolus</p>
                                                    <p className="text-3xl font-black">{globalStats.conflicts.filter(c => c.status === 'Résolu').length}</p>
                                                </div>
                                                <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] px-3 py-1 rounded-md mb-1 shadow-lg shadow-emerald-500/20 uppercase tracking-tighter">Success</Badge>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-white/10 pb-6 group/item hover:translate-x-1 transition-transform">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Médiations actives</p>
                                                    <p className="text-3xl font-black">{globalStats.conflicts.filter(c => c.status === 'En médiation').length}</p>
                                                </div>
                                                <Badge className="bg-amber-500 text-white border-none font-black text-[9px] px-3 py-1 rounded-md mb-1 shadow-lg shadow-amber-500/20 uppercase tracking-tighter">Alerte</Badge>
                                            </div>
                                            <div className="flex justify-between items-end group/item hover:translate-x-1 transition-transform">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Foyers Ouverts</p>
                                                    <p className="text-3xl font-black">{globalStats.conflicts.filter(c => c.status === 'Ouvert').length}</p>
                                                </div>
                                                <Badge className="bg-rose-500 text-white border-none font-black text-[9px] px-3 py-1 rounded-md mb-1 shadow-lg shadow-rose-500/20 uppercase tracking-tighter">Critique</Badge>
                                            </div>
                                         </div>
                                         <Button className="w-full mt-10 bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 transition-all border-none relative z-10" asChild>
                                             <Link href="/conflicts/analytics">Rapport Stratégique Complet <TrendingUp className="ml-3 h-4 w-4" /></Link>
                                         </Button>
                                    </Card>

                                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white p-10">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
                                            <MapIcon className="h-4 w-4" /> Alertes de Terrain (SIG)
                                        </h3>
                                        <div className="space-y-6">
                                            {globalStats.conflicts.slice(0, 3).map(c => (
                                                <div key={c.id} className="flex gap-5 p-3 rounded-2xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100">
                                                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", c.status === 'Résolu' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500")}>
                                                        <AlertTriangle className="h-6 w-6" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-0.5">{c.village} ({c.region})</p>
                                                        <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1 truncate">{c.parties}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 italic">Signalé le {c.reportedDate}</p>
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
