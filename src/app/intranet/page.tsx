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
            {/* Immersive Welcome Section - Premium Masterpiece */}
            <div className="relative rounded-2xl bg-slate-950 px-10 py-12 overflow-hidden group shadow-2xl shadow-slate-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.2),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.15),transparent_50%)]" />
                <div className="absolute -bottom-24 -right-24 h-64 w-64 bg-blue-600/10 rounded-full blur-[100px]" />
                
                <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 transition-transform duration-1000 group-hover:rotate-[30deg] group-hover:scale-110">
                    <Rocket className="h-40 w-40 text-white" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                            <Avatar className="h-24 w-24 border-2 border-white/20 shadow-2xl shrink-0 transition-transform group-hover:scale-105 duration-700 relative z-10">
                                <AvatarImage src={getValidPhotoUrl(user?.photoUrl)} alt={user?.name} />
                                <AvatarFallback className="bg-slate-900 text-white text-2xl font-black">
                                    {user?.name?.split(' ').map(n => n[0]).join('') || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                                     <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Live • CNRCT Control</span>
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
                                Bonjour, <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">{user?.name?.split(' ')[0]}</span> 👋
                            </h1>
                            <p className="text-slate-400 text-base font-medium max-w-lg leading-relaxed">
                                Le centre de pilotage est opérationnel. Vos <span className="text-slate-200 underline decoration-blue-500/50 underline-offset-4">indicateurs territoriaux</span> sont à jour.
                            </p>
                        </div>
                    </div>
                    
                    {/* Immersive AI Hub Status */}
                    <div className="hidden lg:flex items-center gap-5 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl p-6 max-w-sm shadow-2xl relative group/ai overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover/ai:opacity-100 transition-opacity duration-700" />
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 relative z-10">
                            <Bot className="h-6 w-6 text-white animate-pulse" />
                        </div>
                        <div className="relative z-10">
                            <span className="text-[10px] font-black text-blue-400 block mb-1 uppercase tracking-widest">Assistant Stratégique Alpha</span>
                            <div className="text-xs text-slate-300 font-medium leading-relaxed italic">
                                "Analyse des effectifs complétée. Stabilité organisationnelle optimale."
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-2">
                {/* Left: Sidebar Mini-Widgets - Moved to Left as per clarification */}
                <div className="lg:col-span-3 order-2 lg:order-1 space-y-6">
                    {/* Ecosystem Stats - Ultra Modern Grid */}
                    <Card className="border-none shadow-2xl shadow-indigo-900/20 rounded-2xl bg-indigo-950 text-white overflow-hidden group/stats relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.1),transparent)] flex flex-col" />
                        <div className="p-8 space-y-8 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 italic">Core Metrics</span>
                                    <h3 className="text-lg font-black tracking-tight">Ecosystème CNRCT</h3>
                                </div>
                                <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl transition-transform group-hover/stats:rotate-12">
                                    <Zap className="h-5 w-5 text-indigo-400" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 shadow-inner group/item transition-all hover:bg-white/[0.07] hover:border-white/10">
                                    <div className="flex items-center gap-2 mb-3 opacity-50 transition-opacity group-hover/item:opacity-80">
                                        <Users className="h-3 w-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Effectif</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-white leading-none">{globalStats.activeEmployees}</span>
                                        <span className="text-[10px] font-bold text-emerald-400">+2%</span>
                                    </div>
                                </div>
                                
                                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 shadow-inner group/item transition-all hover:bg-white/[0.07] hover:border-white/10">
                                    <div className="flex items-center gap-2 mb-3 opacity-50 transition-opacity group-hover/item:opacity-80">
                                        <Building className="h-3 w-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Pôles</span>
                                    </div>
                                    <span className="text-3xl font-black text-white leading-none">{globalStats.departments.length}</span>
                                </div>

                                <div className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 shadow-inner group transition-all hover:bg-white/[0.07] hover:border-white/10">
                                    <div className="flex items-center gap-2 mb-3 text-amber-400/60">
                                        <ShieldCheck className="h-3 w-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Directoire</span>
                                    </div>
                                    <span className="text-3xl font-black text-white leading-none">{directoireMembers.length}</span>
                                </div>

                                <div className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 shadow-inner group transition-all hover:bg-white/[0.07] hover:border-white/10">
                                    <div className="flex items-center gap-2 mb-3 text-blue-400/60">
                                        <MapIcon className="h-3 w-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Comités</span>
                                    </div>
                                    <span className="text-3xl font-black text-white leading-none">{Object.keys(divisions).length}</span>
                                </div>

                                <div className="col-span-2 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 shadow-inner flex items-center justify-between group transition-all hover:from-emerald-500/20 hover:to-teal-500/10 hover:border-emerald-500/40">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 opacity-60 text-emerald-400">
                                            <Palmtree className="h-3 w-3" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Disponibilité Alpha</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-white">{globalStats.activeEmployees - employeesOnLeave.length}</span>
                                            <span className="text-[10px] font-bold text-slate-400">/ {globalStats.activeEmployees} actifs</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 flex items-center justify-center font-black text-[10px] text-emerald-400 bg-emerald-500/5">
                                        {Math.round(((globalStats.activeEmployees - employeesOnLeave.length) / globalStats.activeEmployees) * 100)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Personal Leave Status - New Dynamic Widget */}
                    {personalStats.latestLeave && (
                        <Card className="border-none shadow-xl shadow-emerald-100/50 rounded-2xl bg-white overflow-hidden border border-emerald-50">
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Palmtree className="h-4 w-4 text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Mon Prochain Congé</span>
                                    </div>
                                    <Badge 
                                        variant={personalStats.latestLeave.status === 'Approuvé' ? 'default' : personalStats.latestLeave.status === 'Rejeté' ? 'destructive' : 'secondary'}
                                        className="text-[9px] font-black px-2 py-0"
                                    >
                                        {personalStats.latestLeave.status}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs font-bold text-slate-900">{personalStats.latestLeave.type}</div>
                                    <div className="text-[10px] text-slate-500 font-medium italic">
                                        Du {formatDate(personalStats.latestLeave.startDate)} au {formatDate(personalStats.latestLeave.endDate)}
                                    </div>
                                    {personalStats.latestLeave.num_decision && (
                                        <div className="text-[9px] text-emerald-600 font-bold mt-2 bg-emerald-50 w-fit px-1.5 rounded">
                                            Réf: {personalStats.latestLeave.num_decision}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Celebrations & Attendance - Enlarged Content */}
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                        <div className="bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Search className="h-5 w-5 text-slate-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900">Mouvements RH</span>
                            </div>
                            {employeesOnLeave.length > 0 && (
                                <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-black">{employeesOnLeave.length} en pause</span>
                            )}
                        </div>
                        <div className="p-5">
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 mb-6 h-10 p-1 rounded-xl">
                                    <TabsTrigger value="leaves" className="text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-emerald-600 rounded-lg">
                                        Congés
                                    </TabsTrigger>
                                    <TabsTrigger value="birthdays" className="text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-rose-600 rounded-lg">
                                        Anniv.
                                    </TabsTrigger>
                                    <TabsTrigger value="seniority" className="text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-lg">
                                        Pôles
                                    </TabsTrigger>
                                </TabsList>

                                {loading ? (
                                    <Skeleton className="h-32 w-full rounded-2xl" />
                                ) : (
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-3">
                                        <TabsContent value="leaves" className="space-y-3 focus-visible:outline-none">
                                            {employeesOnLeave.length > 0 ? (
                                                employeesOnLeave.map(emp => (
                                                    <div key={`leave-${emp.id}`} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md">
                                                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                                                            <AvatarImage src={getValidPhotoUrl(emp.photoUrl)} alt={emp.name} />
                                                            <AvatarFallback className="bg-emerald-100 text-emerald-600 text-sm font-black">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-black text-slate-900 truncate leading-tight">{emp.name}</span>
                                                                {emp.Region && (
                                                                    <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1 rounded uppercase tracking-tighter shrink-0">{emp.Region}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="text-[9px] text-emerald-600 font-bold uppercase bg-emerald-50 px-1 rounded tracking-tighter">{emp.leaveType}</span>
                                                                <span className="text-[9px] text-slate-400 font-medium">Retour : {formatDate(emp.returnDate)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400 text-center py-8 italic bg-slate-50/50 rounded-2xl">Tout le monde est au poste ! ✅</p>
                                            )}
                                        </TabsContent>
                                        <TabsContent value="birthdays" className="space-y-3 focus-visible:outline-none">
                                            {birthdayAnniversaries.length > 0 ? (
                                                birthdayAnniversaries.map(emp => (
                                                    <div key={`birth-${emp.id}`} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md">
                                                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                                                            <AvatarImage src={getValidPhotoUrl(emp.photoUrl)} alt={emp.name} />
                                                            <AvatarFallback className="bg-rose-100 text-rose-600 text-sm font-black">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-sm font-black text-slate-900 truncate leading-tight">{emp.name}</span>
                                                            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter">C'est son jour 🎂</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400 text-center py-8 italic bg-slate-50/50 rounded-2xl">Aucun anniversaire aujourd'hui.</p>
                                            )}
                                        </TabsContent>
                                        <TabsContent value="seniority" className="space-y-3 focus-visible:outline-none">
                                            {seniorityAnniversaries.length > 0 ? (
                                                seniorityAnniversaries.map(emp => (
                                                    <div key={`senior-${emp.id}`} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md">
                                                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                                                            <AvatarImage src={getValidPhotoUrl(emp.photoUrl)} alt={emp.name} />
                                                            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-black">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-sm font-black text-slate-900 truncate leading-tight">{emp.name}</span>
                                                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">Année(s) de succès 🎖️</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400 text-center py-8 italic bg-slate-50/50 rounded-2xl">Aucun jubilé ce mois-ci.</p>
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
