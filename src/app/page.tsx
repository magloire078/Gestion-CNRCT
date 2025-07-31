
"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Users, FileWarning, Laptop, Car, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmployeeDistributionChart } from '@/components/charts/employee-distribution-chart';
import { AssetStatusChart } from '@/components/charts/asset-status-chart';
import { EmployeeActivityReport } from '@/components/reports/employee-activity-report';
import { subscribeToEmployees } from '@/services/employee-service';
import { subscribeToLeaves } from '@/services/leave-service';
import { subscribeToAssets } from '@/services/asset-service';
import { subscribeToVehicles } from '@/services/fleet-service';
import type { Employee, Leave, Asset, Fleet } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

export default function DashboardPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [fleet, setFleet] = useState<Fleet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const unsubscribers = [
            subscribeToEmployees(setEmployees, console.error),
            subscribeToLeaves(setLeaves, console.error),
            subscribeToAssets(setAssets, console.error),
            subscribeToVehicles(setFleet, console.error),
        ];
        
        // A simple way to check if all initial data has loaded.
        // This could be improved with more granular loading states.
        const loadingTimeout = setTimeout(() => setLoading(false), 2000);

        return () => {
            unsubscribers.forEach(unsub => unsub());
            clearTimeout(loadingTimeout);
        };
    }, []);

  const onLeaveCount = employees.filter(e => e.status === 'On Leave').length;
  const pendingLeaveCount = leaves.filter(l => l.status === 'Pending').length;
  const recentLeaves = leaves.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 3);
  const newHires = employees.sort((a,b) => (a.id > b.id ? -1 : 1)).slice(0,3);
  
  const totalPayroll = employees.reduce((acc, entry) => acc + (entry.baseSalary || 0), 0);
  const totalDeductions = employees.reduce((acc, entry) => acc + ((entry.baseSalary || 0) * 0.2), 0); // Approximation

  const stats = [
    {
      title: 'Total des employés',
      value: employees.length,
      icon: Users,
      description: `${onLeaveCount} en congé`,
    },
    {
      title: 'Approbations en attente',
      value: pendingLeaveCount,
      icon: FileWarning,
      description: 'Demandes de congé',
    },
    {
      title: 'Actifs Informatiques',
      value: assets.length,
      icon: Laptop,
      description: 'Matériel et logiciels suivis',
    },
    {
      title: 'Véhicules de la Flotte',
      value: fleet.length,
      icon: Car,
      description: 'Voitures et camionnettes de société',
    },
  ];

  return (
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
            <Button size="sm" variant="outline" className="h-7 gap-1">
                <Download className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Télécharger
                </span>
            </Button>
            </div>
        </div>
        <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    {loading ? <Skeleton className="h-10 w-16 mt-1"/> : <div className="text-4xl font-bold">{stat.value}</div>}
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                </Card>
                ))}
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
                    <CardTitle>État des Actifs Informatiques</CardTitle>
                    <CardDescription>Aperçu du statut actuel de tous les actifs informatiques.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AssetStatusChart />
                </CardContent>
                </Card>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                <CardHeader>
                    <CardTitle>Demandes de Congé Récentes</CardTitle>
                    <CardDescription>Un aperçu rapide des dernières demandes de congé.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-24 w-full" /> : (
                    <div className="space-y-4">
                    {recentLeaves.map(leave => (
                        <div key={leave.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                            <AvatarImage
                                src={`https://placehold.co/40x40.png`}
                                data-ai-hint="user avatar"
                            />
                            <AvatarFallback>{leave.employee.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <p className="font-medium">{leave.employee}</p>
                            <p className="text-sm text-muted-foreground">{leave.type}</p>
                            </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{leave.status}</span>
                        </div>
                    ))}
                    </div>
                    )}
                </CardContent>
                </Card>
                <Card>
                <CardHeader>
                    <CardTitle>Nouvelles Recrues</CardTitle>
                    <CardDescription>Bienvenue aux nouveaux membres de notre équipe.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-24 w-full" /> : (
                    <div className="space-y-4">
                    {newHires.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                            <AvatarImage
                                src={emp.photoUrl}
                                alt={emp.firstName}
                                data-ai-hint="user avatar"
                            />
                            <AvatarFallback>{emp.firstName?.charAt(0) || emp.name?.charAt(0) || 'E'}</AvatarFallback>
                            </Avatar>
                            <div>
                            <p className="font-medium">{emp.firstName ? `${emp.firstName} ${emp.lastName}` : emp.name}</p>
                            <p className="text-sm text-muted-foreground">{emp.poste}</p>
                            </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{emp.department}</span>
                        </div>
                    ))}
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
                    <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                        <p className="mt-4 text-muted-foreground">Contenu des analyses à venir.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
            <EmployeeActivityReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
