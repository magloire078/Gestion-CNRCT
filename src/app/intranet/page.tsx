"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useFormat } from '@/hooks/use-format';
import { PermissionGuard } from "@/components/auth/permission-guard";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
    CardFooter
} from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Users, ShieldCheck, Crown, Building, 
    Cake, Bot, Briefcase, CalendarOff, 
    PlusCircle, Receipt, Rocket, Sparkles,
    Bell, MessageSquare, 
    ArrowRight, Search, Calendar,
    Zap, Heart, Award, Laptop, FileText,
    Map as MapIcon, Palmtree
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Employe, Leave, Department, Chief } from '@/lib/data';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInYears, parseISO, format } from 'date-fns';
import { ALL_MENU_ITEMS, MenuItem, SubMenuItem } from "@/constants/navigation";
import { fr } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { getEmployeeGroup } from '@/services/employee-service';
import { divisions } from "@/lib/ivory-coast-divisions";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';

const DirectoireMap = dynamic(() => import('@/components/employees/directoire-map').then(m => m.DirectoireMap), {
    ssr: false,
    loading: () => <Skeleton className="h-[1000px] w-full rounded-xl" />,
});

interface QuickTileProps {
    title: string;
    description: string;
    icon: React.ElementType;
    href?: string;
    onClick?: () => void;
    color: string;
    permission?: string;
}

const QuickTile = ({ title, description, icon: Icon, href, onClick, color, permission }: QuickTileProps) => {
    const { hasPermission } = useAuth();
    if (permission && !hasPermission(permission)) return null;

    const content = (
        <div className="group relative flex flex-col p-5 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-500 hover:-translate-y-1 overflow-hidden h-full">
            <div className={cn("absolute top-0 right-0 p-6 opacity-5 transition-transform group-hover:scale-125 duration-700", color)}>
                <Icon className="h-16 w-16" />
            </div>
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4 shadow-lg", color)}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">{title}</h3>
            <p className="text-xs text-slate-400 font-medium mb-4 leading-relaxed italic line-clamp-2">{description}</p>
            <div className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">
                Accéder <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    );

    if (href) return <Link href={href} className="h-full">{content}</Link>;
    return <button onClick={onClick} className="text-left w-full h-full">{content}</button>;
};

export default function IntranetPage() {
    return (
        <PermissionGuard permission="page:intranet:view">
            <IntranetContent />
        </PermissionGuard>
    );
}

function IntranetContent() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("leaves");
    const [isPending, startTransition] = React.useTransition();
    const router = useRouter();
    const { toast } = useToast();
    const {
        globalStats,
        personalStats,
        loading,
        summary,
        loadingSummary,
        seniorityAnniversaries,
        birthdayAnniversaries,
        employeesOnLeave,
    } = useDashboardData(user);
    const { formatDate } = useFormat();

    const getValidPhotoUrl = (url: string | undefined | null) => {
        if (!url) return undefined;
        // Check if it's just an extension or a legacy broken path from port 9002
        if (url === '.jpg' || url === '/photos/.jpg' || url.endsWith('/.jpg')) return undefined;
        return url;
    };

    const departmentMap = useMemo(() => {
        const map = new Map<string, Department>();
        if (globalStats.departments) {
            globalStats.departments.forEach(d => map.set(d.id, d));
        }
        return map;
    }, [globalStats.departments]);

    const directoireMembers = useMemo(() => {
        return globalStats.employees.filter(emp => 
            emp.status === 'Actif' && 
            getEmployeeGroup(emp, departmentMap) === 'directoire'
        );
    }, [globalStats.employees, departmentMap]);

    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleActionClick = (path: string) => {
        if (!user?.employeeId && path !== '/helpdesk') {
            toast({
                variant: "destructive",
                title: "Accès limité",
                description: "Votre compte utilisateur n'est pas encore lié à une fiche employé officielle.",
            });
            return;
        }
        toast({
            title: "Chargement...",
            description: "Veuillez patienter pendant la redirection.",
        });
        router.push(path);
    };

    const handleTabChange = (value: string) => {
        startTransition(() => {
            setActiveTab(value);
        });
    };

    return (
        <div className="pb-20 space-y-12">
            {/* Immersive Welcome Section - Hyper-Premium Masterpiece */}
            <div className="relative rounded-[2.5rem] bg-slate-950 px-10 py-16 overflow-hidden group shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
                {/* Advanced Animated Gradients */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.25),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.2),transparent_50%)]" />
                <div className="absolute -bottom-24 -right-24 h-96 w-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -top-24 -left-24 h-64 w-64 bg-indigo-600/10 rounded-full blur-[80px]" />
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-16 opacity-[0.03] rotate-12 transition-transform duration-[2000ms] group-hover:rotate-[25deg] group-hover:scale-110 pointer-events-none">
                    <Rocket className="h-64 w-64 text-white" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="flex items-center gap-10">
                        <div className="relative">
                            <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 via-indigo-400 to-emerald-500 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-60 transition duration-1000" />
                            <Avatar className="h-32 w-32 border-4 border-white/10 shadow-2xl shrink-0 transition-all duration-1000 group-hover:scale-105 group-hover:border-white/20 relative z-10">
                                <AvatarImage src={getValidPhotoUrl(user?.photoUrl)} alt={user?.name} className="object-cover" />
                                <AvatarFallback className="bg-slate-900 text-white text-3xl font-black">
                                    {user?.name?.split(' ').map(n => n[0]).join('') || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white border-4 border-slate-950 shadow-xl z-20">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
                                     <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Station de Pilotage Alpha</span>
                                </div>
                                <div className="hidden sm:flex px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md items-center gap-3">
                                    <Sparkles className="h-3 w-3 text-amber-400" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">{format(new Date(), 'EEEE dd MMMM', { locale: fr })}</span>
                                </div>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                                Bonjour, <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-200 animate-gradient-x">{user?.name?.split(' ')[0]}</span>
                            </h1>
                            <p className="text-slate-400 text-xl font-medium max-w-xl leading-relaxed">
                                Votre interface stratégique est <span className="text-white font-black underline decoration-blue-500/50 decoration-4 underline-offset-8">synchronisée</span>. Prêt pour les opérations territoriales ?
                            </p>
                        </div>
                    </div>
                    
                    {/* Immersive AI Hub Status - Hyper Style */}
                    <div className="hidden xl:flex items-center gap-6 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 max-w-md shadow-2xl relative group/ai overflow-hidden transition-all duration-700 hover:bg-white/[0.05] hover:border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 opacity-0 group-hover/ai:opacity-100 transition-opacity duration-1000" />
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-2xl shadow-blue-500/30 relative z-10 group-hover/ai:scale-110 transition-transform duration-700">
                            <Bot className="h-8 w-8 text-white animate-bounce-slow" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Assistant Stratégique Alpha</span>
                                <Badge className="bg-blue-500/20 text-blue-400 border-none text-[8px] animate-pulse">V2.8</Badge>
                            </div>
                            <div className="text-sm text-slate-300 font-medium leading-relaxed italic">
                                "Analyse temporelle terminée. Taux de conformité administrative : 98.4%. Stabilité du directoire confirmée."
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-2">
                {/* Left: Sidebar Mini-Widgets - Ultra Modern Masterpiece */}
                <div className="lg:col-span-3 order-2 lg:order-1 space-y-8">
                    <Card className="border-none shadow-[0_20px_50px_rgba(30,41,59,0.3)] rounded-[2rem] bg-slate-950 text-white overflow-hidden group/stats relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-transparent" />
                        <div className="p-8 space-y-10 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400/80 italic">Data Architecture</span>
                                    <h3 className="text-xl font-black tracking-tight leading-none">Global Metrics</h3>
                                </div>
                                <div className="h-14 w-14 rounded-[1.25rem] bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-3xl transition-all duration-700 group-hover/stats:rotate-[15deg] group-hover/stats:scale-110 shadow-2xl">
                                    <Zap className="h-6 w-6 text-indigo-400 fill-indigo-400/20" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-5">
                                <div className="p-6 rounded-[1.75rem] bg-white/[0.02] border border-white/5 shadow-inner group/item transition-all duration-500 hover:bg-white/[0.05] hover:border-white/10">
                                    <div className="flex items-center gap-3 mb-4 opacity-40 transition-opacity group-hover/item:opacity-100">
                                        <Users className="h-4 w-4 text-indigo-400" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Effectif</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-white leading-none tracking-tighter">{globalStats.activeEmployees}</span>
                                        <span className="text-[10px] font-bold text-emerald-400">+2.4%</span>
                                    </div>
                                </div>
                                
                                <div className="p-6 rounded-[1.75rem] bg-white/[0.02] border border-white/5 shadow-inner group/item transition-all duration-500 hover:bg-white/[0.05] hover:border-white/10">
                                    <div className="flex items-center gap-3 mb-4 opacity-40 transition-opacity group-hover/item:opacity-100">
                                        <Building className="h-4 w-4 text-purple-400" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Pôles</span>
                                    </div>
                                    <span className="text-4xl font-black text-white leading-none tracking-tighter">{globalStats.departments.length}</span>
                                </div>

                                <div className="p-6 rounded-[1.75rem] bg-white/[0.02] border border-white/5 shadow-inner group/item transition-all duration-500 hover:bg-white/[0.05] hover:border-white/10">
                                    <div className="flex items-center gap-3 mb-4 text-amber-400/40 group-hover/item:text-amber-400/100 transition-colors">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Directoire</span>
                                    </div>
                                    <span className="text-4xl font-black text-white leading-none tracking-tighter">{directoireMembers.length}</span>
                                </div>

                                <div className="p-6 rounded-[1.75rem] bg-white/[0.02] border border-white/5 shadow-inner group/item transition-all duration-500 hover:bg-white/[0.05] hover:border-white/10">
                                    <div className="flex items-center gap-3 mb-4 text-blue-400/40 group-hover/item:text-blue-400/100 transition-colors">
                                        <MapIcon className="h-4 w-4" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Comités</span>
                                    </div>
                                    <span className="text-4xl font-black text-white leading-none tracking-tighter">{Object.keys(divisions).length}</span>
                                </div>

                                <div className="col-span-2 p-8 rounded-[2rem] bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/5 border border-emerald-500/20 shadow-2xl flex items-center justify-between group/status transition-all duration-700 hover:from-emerald-500/20 hover:border-emerald-500/40">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3 opacity-60 text-emerald-400">
                                            <Palmtree className="h-4 w-4 animate-bounce-slow" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Taux de Disponibilité</span>
                                        </div>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-3xl font-black text-white tracking-tighter">{globalStats.activeEmployees - employeesOnLeave.length}</span>
                                            <span className="text-[10px] font-bold text-slate-500">/ {globalStats.activeEmployees} opérationnels</span>
                                        </div>
                                    </div>
                                    {(() => {
                                        const activeCount = globalStats.activeEmployees || 0;
                                        const leaveCount = employeesOnLeave?.length || 0;
                                        const rawRatio = activeCount > 0 
                                            ? Math.max(0, Math.min(1, (activeCount - leaveCount) / activeCount))
                                            : 0;
                                        
                                        // Ensure availabilityRatio is a valid number to prevent "NaN" in SVG attributes
                                        const availabilityRatio = isNaN(rawRatio) ? 0 : rawRatio;

                                        const radius = 36;
                                        const circumference = 2 * Math.PI * radius;
                                        return (
                                            <div className="relative h-20 w-20">
                                                <svg className="h-full w-full -rotate-90 transform">
                                                    <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                                    <circle 
                                                        cx="40" cy="40" r={radius} 
                                                        stroke="currentColor" 
                                                        strokeWidth="8" 
                                                        fill="transparent" 
                                                        strokeDasharray={circumference.toString()} 
                                                        strokeDashoffset={(circumference * (1 - availabilityRatio)).toString()} 
                                                        className="text-emerald-500 transition-all duration-1000 ease-out" 
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-emerald-400">
                                                    {Math.round(availabilityRatio * 100)}%
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Personal Leave Status - Premium Card */}
                    {personalStats.latestLeave && (
                        <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2rem] bg-white overflow-hidden border border-emerald-100/50 group/leave relative">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 transition-transform duration-700 group-hover/leave:rotate-0 group-hover/leave:scale-125">
                                <Palmtree className="h-24 w-24 text-emerald-600" />
                            </div>
                            <div className="p-8 space-y-6 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Prochain Congé</span>
                                    </div>
                                    <Badge className={cn(
                                        "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                                        personalStats.latestLeave.status === 'Approuvé' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                                        personalStats.latestLeave.status === 'Rejeté' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'
                                    )}>
                                        {personalStats.latestLeave.status}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-lg font-black text-slate-900 tracking-tight leading-none">{personalStats.latestLeave.type}</div>
                                    <div className="text-[11px] text-slate-500 font-medium italic flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Du {formatDate(personalStats.latestLeave.startDate)} au {formatDate(personalStats.latestLeave.endDate)}
                                    </div>
                                    {personalStats.latestLeave.num_decision && (
                                        <div className="inline-flex items-center gap-2 text-[10px] text-emerald-700 font-black mt-4 bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                            <FileText className="h-3 w-3" />
                                            DÉCISION : {personalStats.latestLeave.num_decision}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Celebrations & Attendance - Premium Dashboard Style */}
                    <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl border border-slate-100">
                        <div className="bg-slate-50/80 backdrop-blur-md p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                    <Search className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Mouvements RH</span>
                            </div>
                            {employeesOnLeave.length > 0 && (
                                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100">
                                     <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] font-black uppercase">{employeesOnLeave.length} en pause</span>
                                </div>
                            )}
                        </div>
                        <div className="p-8">
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 mb-8 h-12 p-1.5 rounded-[1.25rem]">
                                    <TabsTrigger value="leaves" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-lg rounded-xl transition-all">
                                        Congés
                                    </TabsTrigger>
                                    <TabsTrigger value="birthdays" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-lg rounded-xl transition-all">
                                        Fêtes
                                    </TabsTrigger>
                                    <TabsTrigger value="seniority" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg rounded-xl transition-all">
                                        Success
                                    </TabsTrigger>
                                </TabsList>

                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                                    </div>
                                ) : (
                                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                                        <TabsContent value="leaves" className="space-y-4 focus-visible:outline-none mt-0">
                                            {employeesOnLeave.length > 0 ? (
                                                employeesOnLeave.map(emp => (
                                                    <div key={`leave-${emp.id}`} className="group/item flex items-center gap-5 p-4 bg-slate-50/50 hover:bg-white rounded-[1.5rem] transition-all duration-500 border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
                                                        <div className="relative">
                                                            <Avatar className="h-14 w-14 border-2 border-white shadow-md shrink-0 transition-transform group-hover/item:scale-110 duration-500">
                                                                <AvatarImage src={getValidPhotoUrl(emp.photoUrl)} alt={emp.name} className="object-cover" />
                                                                <AvatarFallback className="bg-emerald-100 text-emerald-600 text-lg font-black">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-2 border-white" />
                                                        </div>
                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                <span className="text-base font-black text-slate-900 truncate tracking-tight">{emp.name}</span>
                                                                {emp.Region && (
                                                                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest text-slate-400 border-slate-200">
                                                                        {emp.Region}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-emerald-600 font-black uppercase bg-emerald-50 px-2 py-0.5 rounded-lg tracking-widest border border-emerald-100/50">{emp.leaveType}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold italic">Retour : {formatDate(emp.returnDate)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                                                        <Palmtree className="h-8 w-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-bold text-center italic">Tout l'effectif est mobilisé sur le terrain ! ✅</p>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="birthdays" className="space-y-4 focus-visible:outline-none mt-0">
                                            {birthdayAnniversaries.length > 0 ? (
                                                birthdayAnniversaries.map(emp => (
                                                    <div key={`birth-${emp.id}`} className="group/item flex items-center gap-5 p-4 bg-rose-50/30 hover:bg-white rounded-[1.5rem] transition-all duration-500 border border-transparent hover:border-rose-100 hover:shadow-xl hover:shadow-rose-200/50">
                                                        <div className="relative">
                                                            <Avatar className="h-14 w-14 border-2 border-white shadow-md shrink-0 transition-transform group-hover/item:scale-110 duration-500">
                                                                <AvatarImage src={getValidPhotoUrl(emp.photoUrl)} alt={emp.name} className="object-cover" />
                                                                <AvatarFallback className="bg-rose-100 text-rose-600 text-lg font-black">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-rose-500 rounded-full border-2 border-white animate-bounce" />
                                                        </div>
                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                            <span className="text-base font-black text-slate-900 truncate tracking-tight">{emp.name}</span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Cake className="h-3 w-3 text-rose-500" />
                                                                <span className="text-[10px] text-rose-500 font-black uppercase tracking-[0.2em]">C'est son jour ! Joyeux Anniversaire 🎂</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                                                        <Cake className="h-8 w-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-bold text-center italic">Aucune célébration prévue pour aujourd'hui.</p>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="seniority" className="space-y-4 focus-visible:outline-none mt-0">
                                            {seniorityAnniversaries.length > 0 ? (
                                                seniorityAnniversaries.map(emp => (
                                                    <div key={`senior-${emp.id}`} className="group/item flex items-center gap-5 p-4 bg-indigo-50/30 hover:bg-white rounded-[1.5rem] transition-all duration-500 border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-200/50">
                                                        <div className="relative">
                                                            <Avatar className="h-14 w-14 border-2 border-white shadow-md shrink-0 transition-transform group-hover/item:scale-110 duration-500">
                                                                <AvatarImage src={getValidPhotoUrl(emp.photoUrl)} alt={emp.name} className="object-cover" />
                                                                <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg font-black">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-indigo-500 rounded-full border-2 border-white" />
                                                        </div>
                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                            <span className="text-base font-black text-slate-900 truncate tracking-tight">{emp.name}</span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Award className="h-3 w-3 text-indigo-500" />
                                                                <span className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em]">Félicitations pour vos années de service 🎖️</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                                                        <Award className="h-8 w-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-bold text-center italic">Aucun jubilé à célébrer ce mois-ci.</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </div>
                                )}
                            </Tabs>
                        </div>
                    </Card>
                </div>

                {/* Right: Directoire Map Section - Increased to 9 columns for maximum width */}
                <div className="lg:col-span-9 order-1 lg:order-2 space-y-6">
                    <div className="relative group w-full rounded-2xl shadow-xl border border-slate-100/50 p-2 bg-slate-50">
                        <DirectoireMap 
                            className="min-h-[1000px] w-full shadow-md rounded-xl"
                            members={directoireMembers} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
