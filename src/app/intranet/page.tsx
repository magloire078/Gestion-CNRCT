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
    ArrowRight, MapPin, Search, Calendar,
    Zap, Heart, Award, Laptop, FileText
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Employe, Leave, Department, Chief } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInYears, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { getEmployeeGroup } from '@/services/employee-service';
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';

const DirectoireMap = dynamic(() => import('@/components/employees/directoire-map').then(m => m.DirectoireMap), {
    ssr: false,
    loading: () => <Skeleton className="h-[1240px] w-full rounded-xl" />,
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
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("birthdays");
    const [isPending, startTransition] = React.useTransition();
    const router = useRouter();
    const { toast } = useToast();
    const {
        globalStats,
        loading,
        summary,
        loadingSummary,
        seniorityAnniversaries,
        birthdayAnniversaries,
    } = useDashboardData(user);
    const { formatDate } = useFormat();

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
            {/* Immersive Welcome Section */}
            <div className="relative rounded-2xl bg-slate-900 p-6 md:p-10 overflow-hidden group shadow-2xl shadow-slate-200">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent)] transition-opacity group-hover:opacity-60" />
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transition-transform group-hover:scale-110 duration-1000">
                    <Zap className="h-64 w-64 text-blue-400" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="max-w-3xl space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20">
                            <Rocket className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Portail Collaborateurs CNRCT</span>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <Avatar className="h-20 w-20 md:h-28 md:w-28 border-4 border-white/10 shadow-2xl">
                                <AvatarImage src={user?.photoUrl} alt={user?.name} />
                                <AvatarFallback className="bg-blue-600 text-white text-2xl font-black">
                                    {user?.name?.split(' ').map(n => n[0]).join('') || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight">
                                Bonjour, {user?.name?.split(' ')[0]} 👋<br />
                                <span className="text-slate-400 font-medium text-2xl md:text-3xl">Prêt pour les défis d'aujourd'hui ?</span>
                            </h1>
                        </div>
                    </div>
                    
                    {/* Quick AI Insight */}
                    <Card className="md:w-80 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-white/80">CNRCT Intelligence</span>
                        </div>
                        {loadingSummary ? (
                            <div className="space-y-2"><Skeleton className="h-3 w-full bg-white/10" /><Skeleton className="h-3 w-4/5 bg-white/10" /></div>
                        ) : (
                            <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-4">
                                "{summary?.split('.')[0] || "Explorez vos services dédiés et restez connecté à votre communauté."}."
                            </p>
                        )}
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                <QuickTile 
                    title="Intelligence & Rapports" 
                    description="Accédez aux analyses, statistiques et rapports DISA/Nominatifs."
                    icon={FileText}
                    href="/reports"
                    color="bg-indigo-600"
                    permission="group:reports:view"
                />
                <QuickTile 
                    title="Gestion Opérationnelle" 
                    description="Pilotage de la logistique, du patrimoine TI et de la flotte."
                    icon={Zap}
                    href="/management"
                    color="bg-slate-900"
                    permission="group:operations:view"
                />
                <QuickTile 
                    title="Ma Rémunération" 
                    description="Consultez et téléchargez vos bulletins de paie mensuels."
                    icon={Receipt}
                    onClick={() => handleActionClick('/payroll')}
                    color="bg-emerald-500"
                    permission="page:payroll:view"
                />
                <QuickTile 
                    title="Mes Congés" 
                    description="Planifiez et demandez vos congés ou absences."
                    icon={CalendarOff}
                    onClick={() => handleActionClick('/leave')}
                    color="bg-rose-500"
                    permission="page:leaves:view"
                />
                <QuickTile 
                    title="Support Technique" 
                    description="Un souci matériel ou logiciel ? Nos techniciens vous aident."
                    icon={Laptop}
                    href="/helpdesk"
                    color="bg-blue-500"
                />
                <QuickTile 
                    title="Missions" 
                    description="Consultez vos ordres de mission et le calendrier."
                    icon={Briefcase}
                    onClick={() => handleActionClick('/missions')}
                    color="bg-amber-500"
                    permission="page:missions:view"
                />
            </div>

            {/* Directoire Map Section - Full Width */}
            <div className="space-y-10 px-2 mt-8 mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#006039] flex items-center justify-center shadow-xl shadow-[#006039]/20">
                            <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Répartition Géographique du Directoire</h2>
                            <p className="text-slate-500 font-medium text-sm mt-1">Aperçu global et stratégique de l'institution sur le territoire</p>
                        </div>
                    </div>
                </div>
                <div className="relative group w-full rounded-2xl shadow-xl border border-slate-100/50 p-2 bg-slate-50">
                    <DirectoireMap 
                        className="min-h-[600px] lg:min-h-[1240px] w-full shadow-md rounded-xl"
                        members={directoireMembers} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-2">
                {/* Sidebar Community - Ecosystem */}
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl bg-indigo-900 text-white overflow-hidden relative h-full">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                    <CardHeader className="relative p-6">
                        <CardTitle className="text-xl flex items-center gap-3">
                            <Zap className="h-6 w-6 text-indigo-400" /> Écosystème CNRCT
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative p-6 pt-0 space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-indigo-400" />
                                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Collègues Actifs</span>
                            </div>
                            <span className="text-2xl font-black">{globalStats.activeEmployees}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <Building className="h-5 w-5 text-indigo-400" />
                                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Départements</span>
                            </div>
                            <span className="text-2xl font-black">{globalStats.departments.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Projets & Missions</span>
                            </div>
                            <span className="text-2xl font-black">En cours</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Community - Celebrations */}
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden h-full">
                    <CardHeader className="bg-rose-50/50 border-b border-rose-100 p-6">
                        <CardTitle className="text-xl flex items-center gap-3 text-rose-900">
                            <Sparkles className="h-6 w-6 text-rose-500" /> Célébrations
                        </CardTitle>
                        <CardDescription className="text-rose-700/60 font-medium text-xs mt-1">Les événements marquants de l'institution.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-rose-50/50 mb-6 rounded-lg h-10">
                                <TabsTrigger value="birthdays" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 transition-all rounded-md h-full">
                                    <Cake className="h-3.5 w-3.5 mr-2" /> Anniversaires
                                </TabsTrigger>
                                <TabsTrigger value="seniority" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all rounded-md h-full">
                                    <Award className="h-3.5 w-3.5 mr-2" /> Ancienneté
                                </TabsTrigger>
                            </TabsList>

                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                                </div>
                            ) : (
                                <>
                                    <TabsContent value="birthdays" className="space-y-3 focus-visible:outline-none">
                                        {birthdayAnniversaries.length > 0 ? (
                                            birthdayAnniversaries.map(emp => (
                                                <div key={`birth-${emp.id}`} className="flex items-center gap-4 group p-1.5 hover:bg-rose-50/40 rounded-xl transition-all">
                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                                                        <AvatarImage src={emp.photoUrl} alt={emp.name} />
                                                        <AvatarFallback className="bg-rose-50 text-rose-500 font-bold text-sm">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate text-sm">{emp.name}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Cake className="h-3 w-3 text-rose-300" />
                                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest truncate">Jour de naissance</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center">
                                                <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                                                    <Cake className="h-6 w-6 text-rose-200" />
                                                </div>
                                                <p className="text-sm text-slate-400 italic">Aucun anniversaire ce mois-ci.</p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="seniority" className="space-y-3 focus-visible:outline-none">
                                        {seniorityAnniversaries.length > 0 ? (
                                            seniorityAnniversaries.map(emp => (
                                                <div key={`senior-${emp.id}`} className="flex items-center gap-4 group p-1.5 hover:bg-blue-50/40 rounded-xl transition-all">
                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                                                        <AvatarImage src={emp.photoUrl} alt={emp.name} />
                                                        <AvatarFallback className="bg-blue-50 text-blue-500 font-bold text-sm">{emp.lastName?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate text-sm">{emp.name}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Award className="h-3 w-3 text-blue-300" />
                                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest truncate">Années d'excellence</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center">
                                                <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                                                    <Award className="h-6 w-6 text-blue-200" />
                                                </div>
                                                <p className="text-sm text-slate-400 italic">Aucun jubilé ce mois-ci.</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </>
                            )}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
