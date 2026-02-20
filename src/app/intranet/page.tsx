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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileWarning, Laptop, Car, Download, ShieldCheck, User as UserIcon, Building, Cake, Printer, Crown, LogOut as LogOutIcon, Globe, Bot, Loader2 as LoaderIcon, Briefcase, CalendarOff, PlusCircle, Eye, Receipt, FilePlus2, Rocket } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmployeeDistributionChart } from '@/components/charts/employee-distribution-chart';
import { AssetStatusChart } from '@/components/charts/asset-status-chart';
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

interface StatCardProps {
    title: string;
    value: number | string | React.ReactNode;
    icon: React.ElementType;
    description?: string;
    href?: string;
    loading: boolean;
}

const StatCard = ({ title, value, icon: Icon, description, href, loading }: StatCardProps) => {
    const cardContent = (
        <Card variant="premium" className="transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-10 w-16 mt-1" /> : <div className="text-4xl font-bold">{value}</div>}
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href}>{cardContent}</Link>;
    }
    return cardContent;
};


const categoryLabels: Record<EmployeeGroup, string> = {
    'personnel-siege': "Personnel Siège",
    'chauffeur-directoire': "Chauffeurs Directoire",
    'garde-republicaine': "Garde Républicaine",
    'gendarme': "Gendarmes",
    'directoire': "Membres du Directoire",
    'regional': "Comités Régionaux",
    'all': 'Tous'
};

const LatestRecruitsCard = ({ employees, loading, departments }: { employees: Employe[], loading: boolean, departments: Department[] }) => {

    const { formatDate } = useFormat();

    const recruitsByCategory = employees
        .filter(e => e.dateEmbauche)
        .reduce((acc, emp) => {
            const group = getEmployeeGroup(emp, departments);
            if (!acc[group]) {
                acc[group] = [];
            }
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
        <Card variant="premium" className="lg:col-span-1 xl:col-span-1">
            <CardHeader>
                <CardTitle>Derniers Arrivants par Catégorie</CardTitle>
                <CardDescription>Aperçu des nouveaux employés et de leurs matricules.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-48 w-full" /> : (
                    categoriesWithRecruits.length > 0 ? (
                        <Tabs defaultValue={categoriesWithRecruits[0][0]}>
                            <TabsList className="grid w-full grid-cols-2 h-auto flex-wrap">
                                {categoriesWithRecruits.map(([group, _]) => (
                                    <TabsTrigger key={group} value={group} className="text-xs">{categoryLabels[group as EmployeeGroup] || group}</TabsTrigger>
                                ))}
                            </TabsList>
                            {categoriesWithRecruits.map(([group, recruits]) => (
                                <TabsContent key={group} value={group}>
                                    <div className="space-y-3 pt-4">
                                        {recruits.slice(0, 3).map(emp => (
                                            <div key={emp.id} className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9"><AvatarImage src={emp.photoUrl} alt={emp.name} data-ai-hint="employee photo" /><AvatarFallback>{emp.lastName?.charAt(0)}</AvatarFallback></Avatar>
                                                <div className="text-xs flex-1">
                                                    <p className="font-medium text-sm">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                                    <p className="text-muted-foreground">{emp.poste}</p>
                                                    <p className="text-muted-foreground">Embauché le : {formatDate(emp.dateEmbauche)}</p>
                                                </div>
                                                <Badge variant="secondary" className="font-mono">{emp.matricule}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                        <p className="text-sm text-muted-foreground italic text-center py-10">Aucun nouvel employé récemment.</p>
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
        personalStats,
        loading,
        summary,
        loadingSummary,
        organizationLogos,
        seniorityAnniversaries,
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

    const anniversaryYears = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
    const retirementYears = Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() - 5 + i).toString()).reverse();

    const monthsForSelect = [
        { value: "0", label: "Janvier" }, { value: "1", label: "Février" }, { value: "2", label: "Mars" },
        { value: "3", label: "Avril" }, { value: "4", label: "Mai" }, { value: "5", label: "Juin" },
        { value: "6", label: "Juillet" }, { value: "7", label: "Août" }, { value: "8", label: "Septembre" },
        { value: "9", label: "Octobre" }, { value: "10", label: "Novembre" }, { value: "11", label: "Décembre" },
    ];
    const selectedAnniversaryPeriodText = `${monthsForSelect[parseInt(selectedAnniversaryMonth)].label} ${selectedAnniversaryYear}`;

    useEffect(() => {
        if (isPrintingAnniversaries || isPrintingRetirements) {
            document.body.classList.add('print-landscape');
            setTimeout(() => {
                window.print();
                document.body.classList.remove('print-landscape');
                setIsPrintingAnniversaries(false);
                setIsPrintingRetirements(false);
            }, 500);
        }
    }, [isPrintingAnniversaries, isPrintingRetirements]);


    const handlePrintAnniversaries = () => setIsPrintingAnniversaries(true);
    const handlePrintRetirements = () => setIsPrintingRetirements(true);

    const isHRAdmin = hasPermission('page:dashboard:view'); // Assuming this implies HR view

    // Quick Actions
    const quickActions = [
        { icon: CalendarOff, label: "Congés", onClick: () => setIsSheetOpen(true) },
        { icon: Receipt, label: "Ma Paie", href: "/payroll" },
        { icon: Briefcase, label: "Missions", href: "/missions" },
        { icon: Laptop, label: "Support TI", href: "/helpdesk" },
    ];

    const handleAddLeaveRequest = async (newLeaveRequest: Omit<Leave, 'id' | 'status'>) => {
        try {
            const newRequest = await addLeave(newLeaveRequest);
            setIsSheetOpen(false);
            toast({
                title: "Demande de congé envoyée",
                description: `Votre demande de ${newRequest.type} a été soumise.`,
            });
        } catch (err) {
            console.error("Failed to add leave request:", err);
            throw err;
        }
    };

    const getGenderBreakdown = (list: (Employe | Chief)[]) => {
        if (!list) return '';
        const men = list.filter(p => p.sexe === 'Homme').length;
        const women = list.filter(p => p.sexe === 'Femme').length;
        return `${men} Hommes / ${women} Femmes`;
    };

    const isManagerView = hasPermission('page:admin:view');
    const lastPayslip = useMemo(() => {
        const date = new Date();
        const lastDay = lastDayOfMonth(date);
        return {
            period: format(date, "MMMM yyyy", { locale: fr }),
            dateParam: lastDay.toISOString().split('T')[0],
        };
    }, []);

    return (
        <>
            <div className={`p-4 sm:p-6 sm:pt-0 max-w-7xl mx-auto space-y-6 ${isPrintingAnniversaries || isPrintingRetirements ? 'print-hidden' : ''}`}>

                {/* Greeting & Quick Links */}
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary">Bonjour, {user?.name.split(' ')[0]} 👋</h1>
                        <p className="text-muted-foreground mt-1">Bienvenue sur l'intranet de la CNRCT. Voici les dernières informations.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {quickActions.map((action, i) => action.href ? (
                            <Link key={i} href={action.href}>
                                <Button variant="secondary" className="gap-2 bg-background/50 hover:bg-background">
                                    <action.icon className="h-4 w-4" /> <span className="hidden sm:inline">{action.label}</span>
                                </Button>
                            </Link>
                        ) : (
                            <Button key={i} variant="secondary" className="gap-2 bg-background/50 hover:bg-background" onClick={action.onClick}>
                                <action.icon className="h-4 w-4" /> <span className="hidden sm:inline">{action.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Main Content Area (News) */}
                    <div className="xl:col-span-2 space-y-6">
                        <NewsFeed />
                    </div>

                    {/* Right Sidebar (Shortcuts, AI, Reminders) */}
                    <div className="space-y-6">
                        {/* AI Summary Widget */}
                        <Card variant="premium" className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
                            <div className="absolute -right-8 -top-8 p-4 opacity-10 pointer-events-none">
                                <Bot className="w-32 h-32" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Bot className="w-5 h-5" />
                                    Synthèse de l'Activité
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loadingSummary ? (
                                    <div className="flex flex-col space-y-2 py-2">
                                        <Skeleton className="h-4 w-full bg-primary-foreground/20" />
                                        <Skeleton className="h-4 w-[80%] bg-primary-foreground/20" />
                                        <Skeleton className="h-4 w-[90%] bg-primary-foreground/20" />
                                    </div>
                                ) : (
                                    <div className="text-sm prose prose-sm prose-invert max-w-none">
                                        {(summary || '').split('\n').filter(s => s.trim()).map((paragraph, index) => (
                                            <p key={index} className="mb-2 last:mb-0 leading-relaxed opacity-90">{paragraph.replace(/\*\*/g, '')}</p>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Birthdays Reminder */}
                        <Card>
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Cake className="w-4 h-4 text-pink-500" />
                                        Anniversaires du Mois
                                    </CardTitle>
                                </div>
                                <Badge variant="secondary">{format(new Date(), 'MMMM', { locale: fr })}</Badge>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                                ) : (
                                    <div className="space-y-3">
                                        {seniorityAnniversaries.length > 0 ? seniorityAnniversaries.slice(0, 4).map(emp => (
                                            <div key={emp.id} className="flex items-center gap-3 text-sm">
                                                <Avatar className="h-8 w-8"><AvatarFallback className="bg-pink-100 text-pink-700">{emp.lastName?.charAt(0)}</AvatarFallback></Avatar>
                                                <div>
                                                    <p className="font-medium leading-none">{emp.firstName} {emp.lastName}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{emp.poste}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-muted-foreground italic text-center py-2">Aucun anniversaire ce mois-ci.</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => document.getElementById('tab-anniversaries')?.click()}>Voir tout</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>

            </div>

            <AddLeaveRequestSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onAddLeaveRequest={handleAddLeaveRequest}
            />

            {isPrintingAnniversaries && organizationLogos && (
                <PrintLayout
                    logos={organizationLogos}
                    title="LISTE DES EMPLOYÉS ATTEIGNANT UN ANNIVERSAIRE D'ANCIENNETÉ"
                    subtitle={`Période de ${selectedAnniversaryPeriodText}`}
                    columns={[
                        { header: 'N°', key: 'index' },
                        { header: 'Nom & Prénoms', key: 'name' },
                        { header: 'Poste', key: 'poste' },
                        { header: 'Date d\'embauche', key: 'dateEmbauche' },
                        { header: 'Ancienneté', key: 'seniority', align: 'center' },
                    ]}
                    data={seniorityAnniversaries.map((emp, index) => ({
                        index: index + 1,
                        name: `${emp.lastName || ''} ${emp.firstName || ''}`.trim(),
                        poste: emp.poste,
                        dateEmbauche: formatDate(emp.dateEmbauche),
                        seniority: `${emp.dateEmbauche ? differenceInYears(new Date(parseInt(selectedAnniversaryYear), parseInt(selectedAnniversaryMonth)), parseISO(emp.dateEmbauche)) : 0} ans`,
                    }))}
                />
            )}
            {isPrintingRetirements && organizationLogos && (
                <PrintLayout
                    logos={organizationLogos}
                    title={`LISTE DES EMPLOYÉS PARTANT À LA RETRAITE EN ${selectedRetirementYear}`}
                    columns={[
                        { header: 'N°', key: 'index' },
                        { header: 'Nom & Prénoms', key: 'name' },
                        { header: 'Poste', key: 'poste' },
                        { header: 'Date de Naissance', key: 'dateOfBirth' },
                        { header: 'Date de Départ', key: 'retirementDate', align: 'center' },
                    ]}
                    data={upcomingRetirements.map((emp, index) => ({
                        index: index + 1,
                        name: `${emp.lastName || ''} ${emp.firstName || ''}`.trim(),
                        poste: emp.poste,
                        dateOfBirth: formatDate(emp.Date_Naissance),
                        retirementDate: formatDate(emp.calculatedRetirementDate),
                    }))}
                />
            )}
        </>
    );
}
