
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { Leave, Evaluation, Asset, Mission } from "@/lib/data";
import { addLeave } from "@/services/leave-service";
import { useMySpaceData } from "@/hooks/use-my-space-data";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AddLeaveRequestSheet } from "@/components/leave/add-leave-request-sheet";
import { Mail, Phone, Calendar, Briefcase, ChevronRight, Landmark, Eye, Laptop, Rocket, PlusCircle, CheckCircle, FileClock, Hourglass, FilePlus2, Receipt, Loader2 } from "lucide-react";
import { lastDayOfMonth, format, subMonths, parseISO, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from "next/link";


type Status = "Approuvé" | "En attente" | "Rejeté";
type EvaluationStatus = "Draft" | "Pending Manager Review" | "Pending Employee Sign-off" | "Completed";

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> =
  {
    "Approuvé": "default",
    "En attente": "secondary",
    "Rejeté": "destructive",
  };
  
const evalStatusVariantMap: Record<EvaluationStatus, "secondary" | "default" | "outline" | "destructive"> = {
  'Draft': 'secondary',
  'Pending Manager Review': 'default',
  'Pending Employee Sign-off': 'outline',
  'Completed': 'default', 
};

const missionStatusVariantMap: Record<Mission['status'], "secondary" | "default" | "outline" | "destructive"> = {
  'Planifiée': 'secondary',
  'En cours': 'default',
  'Terminée': 'outline',
  'Annulée': 'destructive',
};


export default function MySpacePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const {
        employeeDetails,
        leaves,
        evaluations,
        assets,
        missions,
        leaveBalance,
        loading: dataLoading,
        isSheetOpen,
        setIsSheetOpen
    } = useMySpaceData(user);
    
    const loading = authLoading || dataLoading;
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy');
        } catch (error) {
            return dateString; // Fallback to original string if parsing fails
        }
    };

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
    
    const payslipHistory = Array.from({ length: 12 }).map((_, i) => {
        const date = subMonths(new Date(), i);
        const lastDay = lastDayOfMonth(date);
        return {
            period: format(date, "MMMM yyyy", { locale: fr }),
            dateParam: lastDay.toISOString().split('T')[0],
        };
    });


    const latestEvaluation = useMemo(() => {
        if (evaluations.length === 0) return null;
        return evaluations.sort((a,b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime())[0];
    }, [evaluations]);

    const upcomingMissions = useMemo(() => {
        const today = new Date();
        return missions.filter(m => {
            try {
                const endDate = parseISO(m.endDate);
                return isAfter(endDate, today) && (m.status === 'Planifiée' || m.status === 'En cours');
            } catch {
                return false;
            }
        });
    }, [missions]);

    if (loading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
             </div>
        )
    }

    if (!user) {
        return null;
    }
    
    const fullName = `${employeeDetails?.lastName || ''} ${employeeDetails?.firstName || ''}`.trim() || user.name;
    const lastPayslip = payslipHistory[0];

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Mon Espace</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Solde de Congés" value={leaveBalance !== null ? `${leaveBalance} jours` : <Skeleton className="h-8 w-16" />} icon={Calendar} />
                <StatCard title="Dernière Évaluation" value={latestEvaluation ? latestEvaluation.reviewPeriod : "N/A"} icon={CheckCircle} description={latestEvaluation ? `Statut: ${latestEvaluation.status}` : ''}/>
                <StatCard title="Missions à Venir" value={upcomingMissions.length} icon={Rocket} />
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Actions Rapides</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                     <Button onClick={() => setIsSheetOpen(true)}>
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        Nouvelle Demande de Congé
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/payroll/${user.id}?payslipDate=${lastPayslip.dateParam}`}>
                            <Receipt className="mr-2 h-4 w-4" />
                            Voir le Dernier Bulletin
                        </Link>
                    </Button>
                    {latestEvaluation && (
                      <Button variant="outline" asChild>
                         <Link href={`/evaluations/${latestEvaluation.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Consulter ma Dernière Évaluation
                        </Link>
                      </Button>
                    )}
                </CardContent>
            </Card>

            <Tabs defaultValue="profile">
                <TabsList className="mb-4">
                    <TabsTrigger value="profile">Profil</TabsTrigger>
                    <TabsTrigger value="payroll">Paie</TabsTrigger>
                    <TabsTrigger value="leaves">Congés</TabsTrigger>
                    <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
                    <TabsTrigger value="assets">Actifs</TabsTrigger>
                    <TabsTrigger value="missions">Missions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations Personnelles</CardTitle>
                            <CardDescription>Vos informations de profil et professionnelles.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="flex items-center gap-6">
                                 <Avatar className="h-24 w-24">
                                    <AvatarImage src={user.photoUrl} alt={user.name} data-ai-hint="user avatar" />
                                    <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-bold">{fullName}</h2>
                                    <p className="text-muted-foreground">{employeeDetails?.poste}</p>
                                    <Badge variant="secondary" className="mt-2">{employeeDetails?.department}</Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoItem icon={Mail} label="Email" value={user.email} />
                                <InfoItem icon={Phone} label="Téléphone" value={employeeDetails?.mobile || 'N/A'} />
                                <InfoItem icon={Calendar} label="Date d'embauche" value={formatDate(employeeDetails?.dateEmbauche)} />
                                <InfoItem icon={Briefcase} label="Statut" value={employeeDetails?.status || 'N/A'} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payroll">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" /> Mes Bulletins de Paie</CardTitle>
                            <CardDescription>Consultez l'historique de vos bulletins de paie.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg max-h-96 overflow-y-auto">
                                <ul className="divide-y">
                                {payslipHistory.map(item => (
                                    <li key={item.dateParam}>
                                        <Link href={`/payroll/${user.id}?payslipDate=${item.dateParam}`} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                            <span className="font-medium text-sm capitalize">Bulletin de {item.period}</span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </Link>
                                    </li>
                                ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="leaves">
                    <Card>
                        <CardHeader>
                             <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Mes Demandes de Congé</CardTitle>
                                    <CardDescription>Soumettez et suivez vos demandes de congé.</CardDescription>
                                </div>
                                <Button onClick={() => setIsSheetOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Nouvelle Demande</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Date de début</TableHead>
                                        <TableHead>Date de fin</TableHead>
                                        <TableHead>Statut</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaves.length > 0 ? leaves.map(leave => (
                                        <TableRow key={leave.id}>
                                            <TableCell>{leave.type}</TableCell>
                                            <TableCell>{formatDate(leave.startDate)}</TableCell>
                                            <TableCell>{formatDate(leave.endDate)}</TableCell>
                                            <TableCell><Badge variant={statusVariantMap[leave.status as Status] || "default"}>{leave.status}</Badge></TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Aucune demande de congé trouvée.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                 <TabsContent value="evaluations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mes Évaluations de Performance</CardTitle>
                            <CardDescription>Consultez l'historique et le statut de vos évaluations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Période d'évaluation</TableHead>
                                        <TableHead>Manager</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead><span className="sr-only">Action</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {evaluations.length > 0 ? evaluations.map(evaluation => (
                                        <TableRow key={evaluation.id}>
                                            <TableCell className="font-medium">{evaluation.reviewPeriod}</TableCell>
                                            <TableCell>{evaluation.managerName}</TableCell>
                                            <TableCell>
                                                <Badge variant={evalStatusVariantMap[evaluation.status as EvaluationStatus] || "default"}>
                                                    {evaluation.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/evaluations/${evaluation.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Voir
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Aucune évaluation de performance trouvée.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="assets">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Laptop className="h-5 w-5 text-primary" /> Mes Actifs</CardTitle>
                            <CardDescription>La liste du matériel informatique qui vous est assigné.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Modèle</TableHead>
                                        <TableHead>N° Inventaire</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assets.length > 0 ? assets.map(asset => (
                                        <TableRow key={asset.tag}>
                                            <TableCell>{asset.type}</TableCell>
                                            <TableCell>{asset.modele}</TableCell>
                                            <TableCell>{asset.tag}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Aucun actif ne vous est assigné.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="missions">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> Mes Missions</CardTitle>
                            <CardDescription>Historique des missions auxquelles vous avez participé.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Titre de la Mission</TableHead>
                                        <TableHead>Période</TableHead>
                                        <TableHead>Statut</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {missions.length > 0 ? missions.map(mission => (
                                        <TableRow key={mission.id}>
                                            <TableCell className="font-medium">{mission.title}</TableCell>
                                            <TableCell>{formatDate(mission.startDate)} - {formatDate(mission.endDate)}</TableCell>
                                            <TableCell><Badge variant={missionStatusVariantMap[mission.status] || 'default'}>{mission.status}</Badge></TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Vous n'avez participé à aucune mission récemment.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
             <AddLeaveRequestSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onAddLeaveRequest={handleAddLeaveRequest}
            />
        </div>
    )
}

function StatCard({ title, value, icon: Icon, description }: { title: string, value: string | number | React.ReactNode, icon: React.ElementType, description?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    )
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
    return (
        <div className="space-y-1">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon className="h-4 w-4" /> {label}
            </Label>
            <p className="font-medium">{value}</p>
        </div>
    )
}
