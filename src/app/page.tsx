
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileWarning, Laptop, Car, Download, ShieldCheck, User as UserIcon, Building, Cake, Printer, Crown, LogOut as LogOutIcon, Globe, Bot, Loader2 as LoaderIcon, Briefcase, CalendarOff, PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmployeeDistributionChart } from '@/components/charts/employee-distribution-chart';
import { AssetStatusChart } from '@/components/charts/asset-status-chart';
import { EmployeeActivityReport } from '@/components/reports/employee-activity-report';
import { subscribeToEmployees, getEmployeeGroup, type EmployeeGroup } from '@/services/employee-service';
import { getOrganizationSettings } from '@/services/organization-service';
import { subscribeToLeaves } from '@/services/leave-service';
import { subscribeToAssets } from '@/services/asset-service';
import { subscribeToVehicles } from '@/services/fleet-service';
import { subscribeToChiefs } from '@/services/chief-service';
import { subscribeToMissions } from '@/services/mission-service';
import { subscribeToDepartments } from '@/services/department-service';
import { checkAndNotifyForUpcomingRetirements } from '@/services/notification-service';
import type { Employe, Leave, Asset, Fleet, OrganizationSettings, Chief, Department, Mission } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInYears, parseISO, format, addMonths } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDashboardSummary } from '@/ai/flows/dashboard-summary-flow';
import { PrintLayout } from '@/components/reports/print-layout';
import { Badge } from '@/components/ui/badge';


interface StatCardProps {
  title: string;
  value: number;
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
    const [employees, setEmployees] = useState<Employe[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [fleet, setFleet] = useState<Fleet[]>([]);
    const [chiefs, setChiefs] = useState<Chief[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [seniorityAnniversaries, setSeniorityAnniversaries] = useState<Employe[]>([]);
    const [upcomingRetirements, setUpcomingRetirements] = useState<(Employe & { calculatedRetirementDate: Date })[]>([]);
    
    const [selectedAnniversaryMonth, setSelectedAnniversaryMonth] = useState<string>((new Date().getMonth()).toString());
    const [selectedAnniversaryYear, setSelectedAnniversaryYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedRetirementYear, setSelectedRetirementYear] = useState<string>(new Date().getFullYear().toString());

    const [isPrintingAnniversaries, setIsPrintingAnniversaries] = useState(false);
    const [isPrintingRetirements, setIsPrintingRetirements] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [organizationLogos, setOrganizationLogos] = useState<OrganizationSettings | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const [summary, setSummary] = useState<string | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(true);

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
        setLoading(true);
        const unsubscribers = [
            subscribeToEmployees(setEmployees, console.error),
            subscribeToDepartments(setDepartments, console.error),
            subscribeToLeaves(setLeaves, console.error),
            subscribeToAssets(setAssets, console.error),
            subscribeToVehicles(setFleet, console.error),
            subscribeToChiefs(setChiefs, console.error),
            subscribeToMissions(setMissions, console.error),
        ];
        
        getOrganizationSettings().then(setOrganizationLogos);
        
        getDashboardSummary()
            .then(setSummary)
            .catch(err => {
                console.error("Failed to get dashboard summary:", err);
                setSummary("Impossible de charger le résumé de l'assistant.");
            })
            .finally(() => setLoadingSummary(false));
            
        // Trigger retirement check
        checkAndNotifyForUpcomingRetirements().catch(console.error);

        const loadingTimeout = setTimeout(() => setLoading(false), 2000);

        return () => {
            unsubscribers.forEach(unsub => unsub());
            clearTimeout(loadingTimeout);
        };
    }, []);

    useEffect(() => {
        // Anniversaries
        const month = parseInt(selectedAnniversaryMonth);
        const year = parseInt(selectedAnniversaryYear);
        const referenceDate = new Date(year, month);

        const anniversaries = employees.filter(emp => {
            if (!emp.dateEmbauche || emp.CNPS !== true) return false;
            try {
                const hireDate = parseISO(emp.dateEmbauche);
                const hireMonth = hireDate.getMonth();
                const isAnniversaryMonth = hireMonth === month;
                
                const yearsOfService = differenceInYears(referenceDate, hireDate);
                if (yearsOfService < 2) return false;

                return isAnniversaryMonth;

            } catch {
                return false;
            }
        });
        setSeniorityAnniversaries(anniversaries);

        // Retirements
        const yearToFilter = parseInt(selectedRetirementYear);
        const retirements = employees
          .map(emp => {
              if (!emp.Date_Naissance) return null;
              try {
                  const birthDate = parseISO(emp.Date_Naissance);
                  const retirementYear = birthDate.getFullYear() + 60;
                  const retirementDate = new Date(retirementYear, 11, 31); // Dec 31
                  return { ...emp, calculatedRetirementDate: retirementDate };
              } catch {
                  return null;
              }
          })
          .filter((emp): emp is Employe & { calculatedRetirementDate: Date } => {
              if (!emp || emp.status === 'Retraité' || emp.status === 'Décédé') return false;
              return emp.calculatedRetirementDate.getFullYear() === yearToFilter;
          })
          .sort((a,b) => a.calculatedRetirementDate.getTime() - b.calculatedRetirementDate.getTime());
        
        setUpcomingRetirements(retirements);

    }, [employees, selectedAnniversaryMonth, selectedAnniversaryYear, selectedRetirementYear]);
    
    const recentActivity = useMemo(() => {
        if (loading) return [];

        const hireActivities = employees.map(emp => ({
            id: emp.id,
            type: 'embauche',
            date: parseISO(emp.dateEmbauche || '1970-01-01'),
            icon: PlusCircle,
            title: `Nouvelle embauche: ${emp.name}`,
            description: `Poste: ${emp.poste}`,
            href: `/employees/${emp.id}`,
        }));

        const leaveActivities = leaves.map(leave => ({
            id: leave.id,
            type: 'conge',
            date: parseISO(leave.startDate),
            icon: CalendarOff,
            title: `Demande de congé: ${leave.employee}`,
            description: `${leave.type} - Statut: ${leave.status}`,
            href: `/leave`,
        }));

        const missionActivities = missions.map(mission => ({
            id: mission.id,
            type: 'mission',
            date: parseISO(mission.startDate),
            icon: Briefcase,
            title: `Mission: ${mission.title}`,
            description: `Participants: ${mission.participants.length}`,
            href: `/missions/${mission.id}`,
        }));

        return [...hireActivities, ...leaveActivities, ...missionActivities]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 5);

    }, [employees, leaves, missions, loading]);
    
    useEffect(() => {
      if (isPrintingAnniversaries) {
          document.body.classList.add('print-landscape');
      } else {
          document.body.classList.remove('print-landscape');
      }

      if (isPrintingAnniversaries || isPrintingRetirements) {
          setTimeout(() => {
              window.print();
              setIsPrintingAnniversaries(false);
              setIsPrintingRetirements(false);
          }, 500);
      }
    }, [isPrintingAnniversaries, isPrintingRetirements]);

    const handlePrintAnniversaries = async () => {
        setIsPrintingAnniversaries(true);
    };
    
    const handlePrintRetirements = async () => {
        setIsPrintingRetirements(true);
    };

    const handleDownload = async () => {
        const reportElement = printRef.current;
        if (!reportElement) return;

        setIsDownloading(true);
        try {
            const canvas = await html2canvas(reportElement, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save(`rapport-dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const getGenderBreakdown = (list: (Employe | Chief)[]) => {
      const men = list.filter(p => p.sexe === 'Homme').length;
      const women = list.filter(p => p.sexe === 'Femme').length;
      return `${men} Hommes / ${women} Femmes`;
    };
    
    const activeEmployees = employees.filter(e => e.status === 'Actif');
    const cnpsEmployees = activeEmployees.filter(e => e.CNPS === true);
    const directoireEmployees = activeEmployees.filter(e => getEmployeeGroup(e, departments) === 'directoire');
    const pendingLeavesCount = leaves.filter(l => l.status === "En attente").length;
    const missionsInProgressCount = missions.filter(m => m.status === "En cours").length;

    const recentLeaves = leaves.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 3);
  
  return (
    <>
    <div className={(isPrintingAnniversaries || isPrintingRetirements) ? 'print-hidden' : ''}>
        <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
        
        <Tabs defaultValue="overview">
            <div className="flex items-center">
                <TabsList>
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="analytics">Analyses</TabsTrigger>
                <TabsTrigger value="reports">Rapports</TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                <Button onClick={handleDownload} disabled={isDownloading} size="sm" variant="outline" className="h-7 gap-1">
                    {isDownloading ? <LoaderIcon className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        {isDownloading ? "Génération..." : "Télécharger"}
                    </span>
                </Button>
                </div>
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

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard 
                        title="Employés Actifs"
                        value={activeEmployees.length}
                        icon={Users}
                        href="/employees?filter=personnel"
                        loading={loading}
                        description={getGenderBreakdown(activeEmployees)}
                    />
                    <StatCard 
                        title="Déclarés à la CNPS"
                        value={cnpsEmployees.length}
                        icon={ShieldCheck}
                        href="/employees?filter=personnel"
                        loading={loading}
                        description={getGenderBreakdown(cnpsEmployees)}
                    />
                    <StatCard 
                        title="Rois & Chefs"
                        value={chiefs.length}
                        icon={Crown}
                        href="/chiefs"
                        loading={loading}
                        description={getGenderBreakdown(chiefs)}
                    />
                    <StatCard 
                        title="Membres du Directoire"
                        value={directoireEmployees.length}
                        icon={Building}
                        href="/employees?filter=directoire"
                        loading={loading}
                        description={getGenderBreakdown(directoireEmployees)}
                    />
                </div>
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
                     <Card>
                        <CardHeader>
                            <CardTitle>Activité Récente</CardTitle>
                            <CardDescription>Un aperçu des derniers événements dans l'entreprise.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-48 w-full" /> : (
                                <div className="space-y-4">
                                {recentActivity.map(activity => (
                                    <Link key={activity.id} href={activity.href} className="flex items-center gap-4 group">
                                        <div className="bg-muted rounded-full p-2">
                                            <activity.icon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium group-hover:underline">{activity.title}</p>
                                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{format(activity.date, 'dd/MM/yy')}</span>
                                    </Link>
                                ))}
                                {recentActivity.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-10">Aucune activité récente.</p>
                                )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                     <LatestRecruitsCard employees={employees} loading={loading} departments={departments}/>
                    <Card>
                        <CardHeader>
                           <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Anniversaires d'Ancienneté</CardTitle>
                                    <CardDescription>Employés fêtant une date d'embauche.</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-28">
                                        <Select value={selectedAnniversaryMonth} onValueChange={setSelectedAnniversaryMonth}>
                                            <SelectTrigger id="anniversary-month" aria-label="Mois" className="h-8"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                {monthsForSelect.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-24">
                                        <Select value={selectedAnniversaryYear} onValueChange={setSelectedAnniversaryYear}>
                                            <SelectTrigger id="anniversary-year" aria-label="Année" className="h-8"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                {anniversaryYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrintAnniversaries} disabled={seniorityAnniversaries.length === 0}>
                                        <Printer className="h-4 w-4" />
                                        <span className="sr-only">Imprimer</span>
                                    </Button>
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
                                    <Avatar>
                                        <AvatarImage src={emp.photoUrl} alt={emp.name} data-ai-hint="user avatar"/>
                                        <AvatarFallback><Cake className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                        <p className="text-sm text-muted-foreground">{emp.poste}</p>
                                    </div>
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
                            <div>
                                <CardTitle>Départs à la Retraite</CardTitle>
                                <CardDescription>Employés partant pour l'année choisie.</CardDescription>
                            </div>
                             <div className="flex items-center gap-2">
                                <div className="w-28">
                                    <Select value={selectedRetirementYear} onValueChange={setSelectedRetirementYear}>
                                        <SelectTrigger id="retirement-year" className="h-8"><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            {retirementYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrintRetirements} disabled={upcomingRetirements.length === 0}>
                                    <Printer className="h-4 w-4" />
                                    <span className="sr-only">Imprimer</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-24 w-full" /> : (
                        <div className="space-y-4">
                        {upcomingRetirements.length > 0 ? upcomingRetirements.map(emp => (
                            <div key={emp.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                <AvatarImage src={emp.photoUrl} alt={emp.name} data-ai-hint="user avatar"/>
                                <AvatarFallback>{emp.lastName?.charAt(0) || 'E'}</AvatarFallback>
                                </Avatar>
                                <div>
                                <p className="font-medium">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
                                <p className="text-sm text-muted-foreground">{emp.poste}</p>
                                </div>
                            </div>
                            <Badge variant="secondary">{emp.calculatedRetirementDate && format(emp.calculatedRetirementDate, 'dd/MM/yyyy')}</Badge>
                            </div>
                        )) : <p className="text-sm text-muted-foreground text-center py-8">Aucun départ prévu pour {selectedRetirementYear}.</p>}
                        </div>
                        )}
                    </CardContent>
                    </Card>
                </div>
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
    
    <div className="absolute -z-10 -left-[9999px]">
        <div ref={printRef}>
            <PrintLayout
                logos={organizationLogos || { organizationName: "Rapport", mainLogoUrl: "", secondaryLogoUrl: "", faviconUrl: ""}}
                title="Rapport d'Activité du Tableau de Bord"
                subtitle={`Généré le ${new Date().toLocaleDateString('fr-FR')}`}
                columns={[
                    { header: "Métrique", key: "metric" },
                    { header: "Valeur", key: "value", align: "center" }
                ]}
                data={[
                    { metric: "Employés Actifs", value: activeEmployees.length },
                    { metric: "Congés en Attente", value: pendingLeavesCount },
                    { metric: "Missions en Cours", value: missionsInProgressCount },
                    { metric: "Actifs Informatiques", value: assets.length },
                    { metric: "Véhicules dans la Flotte", value: fleet.length },
                ]}
            />
        </div>
    </div>

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

    