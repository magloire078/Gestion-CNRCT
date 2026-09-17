"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    return <IntranetContent />;
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
        <div className="pb-10 space-y-6">
            {/* Immersive Welcome Section - Hyper-Premium Masterpiece */}
            <div className="relative rounded-2xl bg-slate-950 px-6 py-6 md:px-5 md:py-4 overflow-hidden group shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
                {/* Advanced Animated Gradients */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.25),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.2),transparent_50%)]" />
                <div className="absolute -bottom-24 -right-24 h-96 w-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -top-24 -left-24 h-64 w-64 bg-indigo-600/10 rounded-full blur-[80px]" />
                
                {/* Decorative Elements */}
                <div className="hidden md:block absolute top-0 right-0 p-16 opacity-[0.03] rotate-12 transition-transform duration-[2000ms] group-hover:rotate-[25deg] group-hover:scale-110 pointer-events-none">
                    <Rocket className="h-64 w-64 text-white" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 via-indigo-400 to-emerald-500 rounded-xl blur-xl opacity-20 group-hover:opacity-60 transition duration-1000" />
                            <Avatar className="h-32 w-32 border-4 border-white/10 shadow-2xl shrink-0 transition-all duration-1000 group-hover:scale-105 group-hover:border-white/20 relative z-10">
                                <AvatarImage src={getValidPhotoUrl(user?.photoUrl)} alt={user?.name} className="object-cover" />
                                <AvatarFallback className="bg-slate-900 text-white text-3xl font-black">
                                    {user?.name?.split(' ').map(n => n[0]).join('') || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white border-4 border-slate-950 shadow-xl z-20">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
                                     <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Station de Pilotage Alpha</span>
                                </div>
                                <div className="hidden sm:flex px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md items-center gap-3">
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
                    <div className="hidden xl:flex items-center gap-4 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-xl p-5 max-w-md shadow-2xl relative group/ai overflow-hidden transition-all duration-700 hover:bg-white/[0.05] hover:border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 opacity-0 group-hover/ai:opacity-100 transition-opacity duration-1000" />
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-2xl shadow-blue-500/30 relative z-10 group-hover/ai:scale-110 transition-transform duration-700">
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

            {/* Top KPI Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1">
                {/* 1. Effectif Opérationnel */}
                <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white border border-slate-200/70 overflow-hidden group">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Effectif Actif</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                                    {loading ? <Skeleton className="h-8 w-14" /> : globalStats.activeEmployees}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+2.4%</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-400">Collaborateurs en poste</p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            <Users className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Pôles & Directions */}
                <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white border border-slate-200/70 overflow-hidden group">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Pôles & Directions</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                                    {loading ? <Skeleton className="h-8 w-10" /> : globalStats.departments.length}
                                </span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-400">Structures d'organisation</p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            <Building className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Directoire Central */}
                <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white border border-slate-200/70 overflow-hidden group">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Directoire</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                                    {loading ? <Skeleton className="h-8 w-10" /> : directoireMembers.length}
                                </span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-400">Membres de l'exécutif</p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Réseau Territorial */}
                <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white border border-slate-200/70 overflow-hidden group">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Comités Régionaux</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                                    {Object.keys(divisions).length}
                                </span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-400">31 Régions & 2 Districts</p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            <MapIcon className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-1">
                {/* Left: Directoire Map Section */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                    <Card className="border-none shadow-sm rounded-2xl bg-white border border-slate-200/70 overflow-hidden">
                        <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">
                                    Déploiement Territorial du Directoire
                                </CardTitle>
                                <CardDescription className="text-xs font-semibold text-slate-500">
                                    Cartographie interactive et géolocalisation des membres
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white font-black text-[9px] uppercase tracking-widest px-3 py-1">
                                {directoireMembers.length} Représentants
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-4 bg-slate-50/30">
                            <DirectoireMap 
                                className="min-h-[780px] w-full shadow-sm rounded-xl"
                                members={directoireMembers} 
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Tactical Sidebar & RH Feeds */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-5">
                    {/* Disponibilité Opérationnelle */}
                    <Card className="border-none shadow-sm rounded-2xl bg-slate-950 text-white overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-transparent" />
                        <CardContent className="p-5 relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400">Présence & Mobilité</span>
                                    <h3 className="text-base font-black text-white">Disponibilité Globale</h3>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                                    <Palmtree className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                <div className="space-y-1">
                                    <div className="text-3xl font-black text-white tracking-tight">
                                        {globalStats.activeEmployees - employeesOnLeave.length}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        sur {globalStats.activeEmployees} opérationnels
                                    </span>
                                </div>

                                {(() => {
                                    const activeCount = globalStats.activeEmployees || 0;
                                    const leaveCount = employeesOnLeave?.length || 0;
                                    const rawRatio = activeCount > 0 
                                        ? Math.max(0, Math.min(1, (activeCount - leaveCount) / activeCount))
                                        : 0;
                                    
                                    const availabilityRatio = isNaN(rawRatio) ? 0 : rawRatio;
                                    const radius = 30;
                                    const circumference = 2 * Math.PI * radius;
                                    return (
                                        <div className="relative h-16 w-16 shrink-0">
                                            <svg className="h-full w-full -rotate-90 transform">
                                                <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
                                                <circle 
                                                    cx="32" cy="32" r={radius} 
                                                    stroke="currentColor" 
                                                    strokeWidth="6" 
                                                    fill="transparent" 
                                                    strokeDasharray={circumference.toString()} 
                                                    strokeDashoffset={(circumference * (1 - availabilityRatio)).toString()} 
                                                    className="text-emerald-400 transition-all duration-1000 ease-out" 
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-emerald-400">
                                                {Math.round(availabilityRatio * 100)}%
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Leave Status */}
                    {personalStats.latestLeave && (
                        <Card className="border-none shadow-sm rounded-2xl bg-white border border-slate-200/70 overflow-hidden group/leave relative">
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-900">Mon Prochain Congé</span>
                                    </div>
                                    <Badge className={cn(
                                        "text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                                        personalStats.latestLeave.status === 'Approuvé' ? 'bg-emerald-500 text-white' : 
                                        personalStats.latestLeave.status === 'Rejeté' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'
                                    )}>
                                        {personalStats.latestLeave.status}
                                    </Badge>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="text-base font-black text-slate-900">{personalStats.latestLeave.type}</div>
                                    <div className="text-xs text-slate-500 font-medium italic flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Du {formatDate(personalStats.latestLeave.startDate)} au {formatDate(personalStats.latestLeave.endDate)}
                                    </div>
                                    {personalStats.latestLeave.num_decision && (
                                        <div className="inline-flex items-center gap-2 text-[10px] text-emerald-700 font-black mt-2 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                            <FileText className="h-3 w-3" />
                                            DÉCISION : {personalStats.latestLeave.num_decision}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Mouvements RH & Célébrations */}
                    <Card className="border-none shadow-sm rounded-2xl bg-white border border-slate-200/70 overflow-hidden">
                        <div className="bg-slate-50/80 p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
                                    <Search className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900">Mouvements RH</span>
                            </div>
                            {employeesOnLeave.length > 0 && (
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-black uppercase">
                                    {employeesOnLeave.length} en absence
                                </Badge>
                            )}
                        </div>
                        <div className="p-4 sm:p-5">
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl mb-4 h-10">
                                    <TabsTrigger value="leaves" className="text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-lg transition-all">
                                        Congés
                                    </TabsTrigger>
                                    <TabsTrigger value="birthdays" className="text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm rounded-lg transition-all">
                                        Fêtes
                                    </TabsTrigger>
                                    <TabsTrigger value="seniority" className="text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-lg transition-all">
                                        Fidélité
                                    </TabsTrigger>
                                </TabsList>

                                {loading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                                    </div>
                                ) : (
                                    <div className="max-h-[420px] overflow-y-auto pr-1 space-y-3">
                                        <TabsContent value="leaves" className="space-y-3 focus-visible:outline-none mt-0">
                                            {employeesOnLeave.length > 0 ? (
                                                employeesOnLeave.map(emp => (
                                                    <div key={`leave-${emp.id}`} className="flex items-center gap-3.5 p-3.5 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl transition-all border border-slate-100">
                                                        <Avatar className="h-11 w-11 border border-white shadow-sm shrink-0">
                                                            <AvatarImage src={getValidPhotoUrl(emp.photoUrl)} alt={emp.name} className="object-cover" />
                                                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-black">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                                <span className="text-sm font-black text-slate-900 truncate">{emp.name}</span>
                                                                {emp.Region && (
                                                                    <span className="text-[8px] font-bold text-slate-400 uppercase truncate">
                                                                        {emp.Region}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] text-emerald-700 font-bold uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{emp.leaveType}</span>
                                                                <span className="text-[9px] text-slate-400 font-medium">Retour : {formatDate(emp.returnDate)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                                    <Palmtree className="h-6 w-6 text-slate-300 mb-2" />
                                                    <p className="text-xs text-slate-400 font-semibold text-center italic">Aucun agent en congé actuellement.</p>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="birthdays" className="space-y-3 focus-visible:outline-none mt-0">
                                            {birthdayAnniversaries.length > 0 ? (
                                                birthdayAnniversaries.map(emp => (
                                                    <div key={`birth-${emp.id}`} className="flex items-center gap-3.5 p-3.5 bg-rose-50/40 hover:bg-rose-50/70 rounded-xl transition-all border border-rose-100/60">
                                                        <Avatar className="h-11 w-11 border border-white shadow-sm shrink-0">
                                                            <AvatarImage src={getValidPhotoUrl(emp.photoUrl)} alt={emp.name} className="object-cover" />
                                                            <AvatarFallback className="bg-rose-100 text-rose-700 text-sm font-black">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                            <span className="text-sm font-black text-slate-900 truncate">{emp.name}</span>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <Cake className="h-3 w-3 text-rose-500" />
                                                                <span className="text-[9px] text-rose-600 font-bold">Joyeux Anniversaire 🎂</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                                    <Cake className="h-6 w-6 text-slate-300 mb-2" />
                                                    <p className="text-xs text-slate-400 font-semibold text-center italic">Aucun anniversaire aujourd'hui.</p>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="seniority" className="space-y-3 focus-visible:outline-none mt-0">
                                            {seniorityAnniversaries.length > 0 ? (
                                                seniorityAnniversaries.map(emp => (
                                                    <div key={`senior-${emp.id}`} className="flex items-center gap-3.5 p-3.5 bg-indigo-50/40 hover:bg-indigo-50/70 rounded-xl transition-all border border-indigo-100/60">
                                                        <Avatar className="h-11 w-11 border border-white shadow-sm shrink-0">
                                                            <AvatarImage src={getValidPhotoUrl(emp.photoUrl)} alt={emp.name} className="object-cover" />
                                                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-black">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                            <span className="text-sm font-black text-slate-900 truncate">{emp.name}</span>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <Award className="h-3 w-3 text-indigo-600" />
                                                                <span className="text-[9px] text-indigo-600 font-bold">Félicitations pour vos années de service 🎖️</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                                    <Award className="h-6 w-6 text-slate-300 mb-2" />
                                                    <p className="text-xs text-slate-400 font-semibold text-center italic">Aucun jubilé ce mois-ci.</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </div>
                                )}
                            </Tabs>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
