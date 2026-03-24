"use client";

import { useState, useEffect, useMemo } from 'react';
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
    Bell, MessageSquare, Newspaper, 
    ArrowRight, MapPin, Search, Calendar,
    Zap, Heart, Award
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NewsFeed } from '@/components/news/news-feed';
import type { Employe, Leave, Department, Chief } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInYears, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { getEmployeeGroup } from '@/services/employee-service';
import { cn } from "@/lib/utils";

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
        <div className="group relative flex flex-col p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-500 hover:-translate-y-1 overflow-hidden h-full">
            <div className={cn("absolute top-0 right-0 p-8 opacity-5 transition-transform group-hover:scale-125 duration-700", color)}>
                <Icon className="h-20 w-20" />
            </div>
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg", color)}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">{title}</h3>
            <p className="text-xs text-slate-400 font-medium mb-6 leading-relaxed italic">{description}</p>
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
    const router = useRouter();
    const { toast } = useToast();
    const {
        globalStats,
        loading,
        summary,
        loadingSummary,
        seniorityAnniversaries,
    } = useDashboardData(user);
    const { formatDate } = useFormat();

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
        router.push(path);
    };

    return (
        <div className="pb-20 space-y-12">
            {/* Immersive Welcome Section */}
            <div className="relative rounded-[3rem] bg-slate-900 p-8 md:p-14 overflow-hidden group shadow-2xl shadow-slate-200">
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
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight">
                            Bonjour, {user?.name?.split(' ')[0]} 👋<br />
                            <span className="text-slate-400 font-medium text-2xl md:text-3xl">Prêt pour les défis d'aujourd'hui ?</span>
                        </h1>
                    </div>
                    
                    {/* Quick AI Insight */}
                    <Card className="md:w-80 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
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

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
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
                    permission="page:leave:view"
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                {/* News Section */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                                <Newspaper className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Actualités du Directoire</h2>
                        </div>
                        <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Tout voir</Button>
                    </div>
                    <NewsFeed />
                </div>

                {/* Sidebar Community */}
                <div className="space-y-12">
                     {/* Birthdays Widget */}
                     <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-rose-50/50 border-b border-rose-100 p-8">
                            <CardTitle className="text-lg flex items-center gap-3 text-rose-900">
                                <Heart className="h-5 w-5 text-rose-500" /> Célébrations
                            </CardTitle>
                            <CardDescription className="text-rose-700/60 font-medium">Les anniversaires de vos collègues ce mois-ci.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-2xl" />)
                                ) : seniorityAnniversaries.length > 0 ? (
                                    seniorityAnniversaries.slice(0, 5).map(emp => (
                                        <div key={emp.id} className="flex items-center gap-4 group p-1 hover:bg-rose-50/30 rounded-2xl transition-all">
                                            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                                <AvatarImage src={emp.photoUrl} alt={emp.name} />
                                                <AvatarFallback className="bg-rose-50 text-rose-400 font-bold">{emp.lastName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate">{emp.name}</p>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest truncate">{emp.poste}</p>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Award className="h-4 w-4 text-rose-500" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-300 italic py-10">Aucun événement ce mois-ci.</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-rose-50/20 p-6 flex justify-center border-t border-rose-50">
                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Bonne fête à tous !</span>
                        </CardFooter>
                    </Card>

                    {/* Quick Stats Summary */}
                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                        <CardHeader className="relative p-8">
                            <CardTitle className="text-lg flex items-center gap-3">
                                <Zap className="h-5 w-5 text-indigo-400" /> Écosystème CNRCT
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative p-8 pt-0 space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-indigo-400" />
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Collègues</span>
                                </div>
                                <span className="text-xl font-black">{globalStats.activeEmployees}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <Building className="h-5 w-5 text-indigo-400" />
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Départements</span>
                                </div>
                                <span className="text-xl font-black">{globalStats.departments.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 text-indigo-400" />
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Projets Actifs</span>
                                </div>
                                <span className="text-xl font-black">100%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
