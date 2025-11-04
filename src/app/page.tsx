"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardData } from '@/hooks/use-dashboard-data';
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
    <Card className="hover:shadow-lg transition-shadow">
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

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try { return format(parseISO(dateString), 'dd/MM/yyyy'); } catch { return dateString; }
    }

    const categoriesWithRecruits = Object.entries(recruitsByCategory)
        .filter(([_, recruits]) => recruits.length > 0)
        .sort(([groupA], [groupB]) => (categoryLabels[groupA] || groupA).localeCompare(categoryLabels[groupB] || groupB));


    return (
        <Card className="lg:col-span-1 xl:col-span-1">
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
                                    <TabsTrigger key={group} value={group} className="text-xs">{categoryLabels[group] || group}</TabsTrigger>
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
    <div className={(isPrintingAnniversaries || isPrintingRetirements) ? 'print-hidden' : ''}>
        <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
        
        <Tabs defaultValue="overview">
            <div className="flex items-center">
                <TabsList>
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                {isManagerView && <TabsTrigger value="analytics">Analyses</TabsTrigger>}
                {isManagerView && <TabsTrigger value="reports">Rapports</TabsTrigger>}
                </TabsList>
            </div>
            <TabsContent value="overview" className="space-y-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Bot className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Aperçu de l'Assistant</CardTitle>
                            <CardDescription>Un résumé rapide de la situation actuelle.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingSummary ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <LoaderIcon className="h-4 w-4 animate-spin"/>
                                <span>Génération du résumé en cours...</span>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">{summary}</p>
                        )}
                    </CardContent>
                </Card>

                {isManagerView ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Employés Actifs" value={globalStats.activeEmployees} icon={Users} href="/employees" loading={loading} description={getGenderBreakdown(globalStats.employees)} />
                        <StatCard title="Déclarés à la CNPS" value={globalStats.cnpsEmployees} icon={ShieldCheck} href="/employees?cnps=true" loading={loading} description={getGenderBreakdown(globalStats.employees.filter(e => e.CNPS))} />
                        <StatCard title="Rois & Chefs" value={globalStats.chiefs} icon={Crown} href="/chiefs" loading={loading} description={getGenderBreakdown(globalStats.allChiefs)} />
                        <StatCard title="Missions en Cours" value={globalStats.missionsInProgress} icon={Briefcase} href="/missions" loading={loading} />
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                         <StatCard title="Solde de Congés" value={personalStats.leaveBalance !== null ? `${personalStats.leaveBalance} jours` : <Skeleton className="h-8 w-16" />} icon={CalendarOff} loading={loading} />
                         <StatCard title="Dernière Évaluation" value={personalStats.latestEvaluation ? personalStats.latestEvaluation.reviewPeriod : "N/A"} icon={Eye} description={personalStats.latestEvaluation ? `Statut: ${personalStats.latestEvaluation.status}` : ''} href={personalStats.latestEvaluation ? `/evaluations/${personalStats.latestEvaluation.id}`: undefined} loading={loading} />
                         <StatCard title="Missions à Venir" value={personalStats.upcomingMissions} icon={Rocket} loading={loading} />
                    </div>
                )}
                
                {!isManagerView && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Actions Rapides</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-4">
                            <Button onClick={() => setIsSheetOpen(true)}>
                                <FilePlus2 className="mr-2 h-4 w-4" /> Nouvelle Demande de Congé
                            </Button>
                            {user?.id && (
                                <Button variant="outline" asChild>
                                    <Link href={`/payroll/${user.id}?payslipDate=${lastPayslip.dateParam}`}>
                                        <Receipt className="mr-2 h-4 w-4" /> Voir mon Dernier Bulletin
                                    </Link>
                                </Button>
                            )}
                            {personalStats.latestEvaluation && (
                            <Button variant="outline" asChild>
                                <Link href={`/evaluations/${personalStats.latestEvaluation.id}`}>
                                    <Eye className="mr-2 h-4 w-4" /> Consulter ma Dernière Évaluation
                                </Link>
                            </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {isManagerView && (
                    <>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Répartition des Employés</CardTitle>
                                    <CardDescription>Distribution des employés par département.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <EmployeeDistributionChart />
                                </CardContent>
                            </Card>
                             <LatestRecruitsCard employees={globalStats.employees} loading={loading} departments={globalStats.departments}/>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                            <Card>
                                <CardHeader>
                                <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>Anniversaires d'Ancienneté</CardTitle>
                                            <CardDescription>Employés fêtant une date d'embauche.</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-28"><Select value={selectedAnniversaryMonth} onValueChange={setSelectedAnniversaryMonth}><SelectTrigger id="anniversary-month" aria-label="Mois" className="h-8"><SelectValue/></SelectTrigger><SelectContent>{monthsForSelect.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></div>
                                            <div className="w-24"><Select value={selectedAnniversaryYear} onValueChange={setSelectedAnniversaryYear}><SelectTrigger id="anniversary-year" aria-label="Année" className="h-8"><SelectValue/></SelectTrigger><SelectContent>{anniversaryYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrintAnniversaries} disabled={seniorityAnniversaries.length === 0}><Printer className="h-4 w-4" /><span className="sr-only">Imprimer</span></Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {loading ? <Skeleton className="h-24 w-full" /> : (
                                    <div className="space-y-4">
                                    {seniorityAnniversaries.length > 0 ? seniorityAnniversaries.map(emp => {
                                        const years = differenceInYears(new Date(parseInt(selectedAnniversaryYear), parseInt(selectedAnniversaryMonth)), parseISO(emp.dateEmbauche!));
                                        return (
                                        <div key={emp.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                            <Avatar><AvatarImage src={emp.photoUrl} alt={emp.name} data-ai-hint="user avatar"/><AvatarFallback><Cake className="h-4 w-4" /></AvatarFallback></Avatar>
                                            <div><p className="font-medium">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p><p className="text-sm text-muted-foreground">{emp.poste}</p></div>
                                            </div>
                                            <Badge>{years} an{years > 1 ? 's' : ''}</Badge>
                                        </div>
                                        )
                                    }) : <p className="text-sm text-muted-foreground text-center py-8">Aucun anniversaire pour cette période.</p>}
                                    </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="lg:col-span-2 xl:col-span-1">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div><CardTitle>Départs à la Retraite</CardTitle><CardDescription>Employés partant pour l'année choisie.</CardDescription></div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-28"><Select value={selectedRetirementYear} onValueChange={setSelectedRetirementYear}><SelectTrigger id="retirement-year" className="h-8"><SelectValue/></SelectTrigger><SelectContent>{retirementYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrintRetirements} disabled={upcomingRetirements.length === 0}><Printer className="h-4 w-4" /><span className="sr-only">Imprimer</span></Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? <Skeleton className="h-24 w-full" /> : (
                                <div className="space-y-4">
                                {upcomingRetirements.length > 0 ? upcomingRetirements.map(emp => (
                                    <div key={emp.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar><AvatarImage src={emp.photoUrl} alt={emp.name} data-ai-hint="user avatar"/><AvatarFallback>{emp.lastName?.charAt(0) || 'E'}</AvatarFallback></Avatar>
                                        <div><p className="font-medium">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p><p className="text-sm text-muted-foreground">{emp.poste}</p></div>
                                    </div>
                                    <Badge variant="secondary">{emp.calculatedRetirementDate && format(emp.calculatedRetirementDate, 'dd/MM/yyyy')}</Badge>
                                    </div>
                                )) : <p className="text-sm text-muted-foreground text-center py-8">Aucun départ prévu pour {selectedRetirementYear}.</p>}
                                </div>
                                )}
                            </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </TabsContent>
            <TabsContent value="analytics" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Analyses</CardTitle>
                        <CardDescription>
                            Cette section contiendra des analyses détaillées et des visualisations de données.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <AssetStatusChart />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="reports" className="space-y-4">
                <EmployeeActivityReport />
            </TabsContent>
        </Tabs>
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
                dateEmbauche: emp.dateEmbauche,
                seniority: `${differenceInYears(new Date(parseInt(selectedAnniversaryYear), parseInt(selectedAnniversaryMonth)), parseISO(emp.dateEmbauche!))} ans`,
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
                dateOfBirth: emp.Date_Naissance,
                retirementDate: format(emp.calculatedRetirementDate, 'dd/MM/yyyy'),
            }))}
        />
    )}
    </>
  );
}
