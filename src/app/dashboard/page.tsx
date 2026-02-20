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
                {/* --- HR Dashboard Section (Only Admin) --- */}
                {isHRAdmin ? (
                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-6">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <h2 className="text-2xl font-bold tracking-tight">Tableau de Bord Stratégique</h2>
                        </div>

                        <Tabs defaultValue="overview" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                                <TabsTrigger value="demographics" disabled>Démographie</TabsTrigger>
                                <TabsTrigger value="alerts" id="tab-anniversaries">Alertes & Événements</TabsTrigger>
                            </TabsList>
                            <TabsContent value="overview" className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <StatCard loading={loading} title="Total Employés" value={globalStats.employees.length.toString()} icon={Users} description="+2 ce mois" href="/employees" />
                                    <StatCard loading={loading} title="Membres Directoire" value={globalStats.employees.filter(e => getEmployeeGroup(e, globalStats.departments) === 'directoire').length.toString()} icon={UserIcon} description="Actifs" href="/employees?filter=directoire" />
                                    <StatCard loading={loading} title="Comités Régionaux" value={globalStats.employees.filter(e => getEmployeeGroup(e, globalStats.departments) === 'regional').length.toString()} icon={Globe} href="/employees?filter=regional" />
                                    <StatCard loading={loading} title="Services" value={globalStats.departments.length.toString()} icon={Building} description="Actifs" href="/organization-chart" />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                                    <Card className="lg:col-span-4">
                                        <CardHeader>
                                            <CardTitle>Répartition par Type de Personnel</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pl-2">
                                            {loading ? <Skeleton className="h-[350px] w-full" /> : <EmployeeDistributionChart />}
                                        </CardContent>
                                    </Card>
                                    <div className="lg:col-span-3">
                                        {loading ? <Skeleton className="h-[400px] w-full" /> : <LatestRecruitsCard employees={globalStats.employees} loading={loading} departments={globalStats.departments} />}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="demographics">
                                {/* Demographics Content */}
                            </TabsContent>

                            <TabsContent value="alerts" className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                                    <Card className="lg:col-span-1">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <div>
                                                <CardTitle className="text-base font-semibold">Seniorité & Anniversaires</CardTitle>
                                                <CardDescription>Période de {selectedAnniversaryPeriodText}</CardDescription>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-2">
                                                    <Select value={selectedAnniversaryMonth} onValueChange={setSelectedAnniversaryMonth}><SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger><SelectContent>{monthsForSelect.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
                                                    <Select value={selectedAnniversaryYear} onValueChange={setSelectedAnniversaryYear}><SelectTrigger className="h-8 w-[90px] text-xs"><SelectValue /></SelectTrigger><SelectContent>{anniversaryYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                                                </div>
                                                <Button variant="outline" size="sm" className="h-8" onClick={handlePrintAnniversaries} disabled={seniorityAnniversaries.length === 0}><Printer className="h-4 w-4 mr-2" /> Imprimer</Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {loading ? <Skeleton className="h-24 w-full" /> : (
                                                <div className="space-y-4">
                                                    {seniorityAnniversaries.length > 0 ? seniorityAnniversaries.map(emp => {
                                                        const years = emp.dateEmbauche ? differenceInYears(new Date(parseInt(selectedAnniversaryYear), parseInt(selectedAnniversaryMonth)), parseISO(emp.dateEmbauche)) : 0;
                                                        return (
                                                            <div key={emp.id} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar><AvatarImage src={emp.photoUrl} alt={emp.name} data-ai-hint="user avatar" /><AvatarFallback><Cake className="h-4 w-4" /></AvatarFallback></Avatar>
                                                                    <div><p className="font-medium text-sm">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p><p className="text-xs text-muted-foreground">{emp.poste}</p></div>
                                                                </div>
                                                                <Badge variant="outline">{years} ans</Badge>
                                                            </div>
                                                        )
                                                    }) : <p className="text-sm text-muted-foreground text-center py-8">Aucun événement pour cette période.</p>}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="lg:col-span-1">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <div>
                                                <CardTitle className="text-base font-semibold">Départs à la Retraite Prévus</CardTitle>
                                                <CardDescription>Pour l'année {selectedRetirementYear}</CardDescription>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Select value={selectedRetirementYear} onValueChange={setSelectedRetirementYear}><SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger><SelectContent>{retirementYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                                                <Button variant="outline" size="sm" className="h-8" onClick={handlePrintRetirements} disabled={upcomingRetirements.length === 0}><Printer className="h-4 w-4 mr-2" /> Imprimer</Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {loading ? <Skeleton className="h-24 w-full" /> : (
                                                <div className="space-y-4">
                                                    {upcomingRetirements.length > 0 ? upcomingRetirements.map(emp => (
                                                        <div key={emp.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar><AvatarImage src={emp.photoUrl} alt={emp.name} data-ai-hint="user avatar" /><AvatarFallback>{emp.lastName?.charAt(0) || 'E'}</AvatarFallback></Avatar>
                                                                <div><p className="font-medium text-sm">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p><p className="text-xs text-muted-foreground">{emp.poste}</p></div>
                                                            </div>
                                                            <Badge variant="secondary" className="w-fit">{emp.calculatedRetirementDate && formatDate(emp.calculatedRetirementDate)}</Badge>
                                                        </div>
                                                    )) : <p className="text-sm text-muted-foreground text-center py-8">Aucun départ prévu pour {selectedRetirementYear}.</p>}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                        <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                        <h2 className="text-2xl font-bold tracking-tight text-muted-foreground">Accès Restreint</h2>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            Vous n'avez pas les permissions nécessaires pour accéder à ce tableau de bord.
                        </p>
                    </div>
                )}
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
