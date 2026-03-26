"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ChevronLeft, Calendar, User, 
    FileText, CheckCircle2, AlertCircle, 
    Clock, XCircle, Printer, 
    Download, Briefcase, Info,
    Building2, MapPin, Hash,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeave, updateLeaveStatus } from "@/services/leave-service";
import { getEmployee, getOrganizationalUnits } from "@/services/employee-service";
import type { Leave, Employe, Direction, Service } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO, eachDayOfInterval, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function LeaveDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { toast } = useToast();
    const [leave, setLeave] = useState<Leave | null>(null);
    const [employee, setEmployee] = useState<Employe | null>(null);
    const [units, setUnits] = useState<{ directions: Direction[], services: Service[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, hasPermission } = useAuth();

    const canApprove = hasPermission('page:leave:view');

    useEffect(() => {
        async function fetchData() {
            try {
                const [leaveData, orgUnits] = await Promise.all([
                    getLeave(id),
                    getOrganizationalUnits()
                ]);
                
                if (orgUnits) {
                    setUnits({ directions: orgUnits.directions, services: orgUnits.services });
                }

                if (leaveData) {
                    setLeave(leaveData);
                    if (leaveData.employeeId) {
                        const empData = await getEmployee(leaveData.employeeId);
                        setEmployee(empData);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handleStatusUpdate = async (status: 'Approuvé' | 'Rejeté') => {
        if (!leave) return;
        try {
            await updateLeaveStatus(leave.id, status);
            setLeave({ ...leave, status });
            toast({
                title: `Demande ${status.toLowerCase()}`,
                description: `Le congé a été ${status === 'Approuvé' ? 'approuvé' : 'rejeté'} avec succès.`,
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de mettre à jour le statut.",
            });
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8 space-y-8">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        );
    }

    if (!leave) {
        return (
            <div className="container mx-auto py-20 text-center">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h1 className="text-2xl font-bold">Demande de congé non trouvée</h1>
                <Button variant="link" onClick={() => router.push("/leave")}>
                    Retour à la liste
                </Button>
            </div>
        );
    }

    const workingDays = (() => {
        try {
            const start = parseISO(leave.startDate);
            const end = parseISO(leave.endDate);
            const days = eachDayOfInterval({ start, end });
            return days.filter(day => getDay(day) !== 0).length;
        } catch {
            return 0;
        }
    })();

    const statusIcons = {
        'En attente': <Clock className="h-4 w-4" />,
        'Approuvé': <CheckCircle2 className="h-4 w-4" />,
        'Rejeté': <XCircle className="h-4 w-4" />,
    };

    const statusColors = {
        'En attente': 'bg-blue-100 text-blue-800 border-blue-200',
        'Approuvé': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'Rejeté': 'bg-rose-100 text-rose-800 border-rose-200',
    };

    return (
        <div className="container mx-auto py-8 space-y-8 pb-20">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/leave")} className="rounded-full h-10 w-10">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight">{leave.type}</h1>
                            <Badge className={cn("rounded-full px-4 py-1 flex items-center gap-2 border shadow-none font-medium", statusColors[leave.status])}>
                                {statusIcons[leave.status]}
                                {leave.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            <User className="h-4 w-4" /> {employee?.name || leave.employee}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-lg h-10">
                        <Printer className="mr-2 h-4 w-4" /> Imprimer
                    </Button>
                    {canApprove && leave.status === 'En attente' && (
                        <>
                            <Button variant="outline" className="rounded-lg h-10 border-rose-200 hover:bg-rose-50 hover:text-rose-700" onClick={() => handleStatusUpdate('Rejeté')}>
                                <XCircle className="mr-2 h-4 w-4" /> Rejeter
                            </Button>
                            <Button className="bg-slate-900 rounded-lg h-10" onClick={() => handleStatusUpdate('Approuvé')}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approuver
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Detail Cards */}
                    <Card className="border-none shadow-sm bg-slate-50 overflow-hidden">
                        <div className="h-1.5 bg-primary/20 w-full" />
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="h-5 w-5 text-primary" /> Détails de la demande
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Période du congé</p>
                                        <p className="text-lg font-bold">
                                            {format(parseISO(leave.startDate), "dd MMM yyyy", { locale: fr })} au {format(parseISO(leave.endDate), "dd MMM yyyy", { locale: fr })}
                                        </p>
                                        <p className="text-sm text-blue-600 font-medium mt-1 flex items-center gap-1">
                                            <Hash className="h-3 w-3" /> {workingDays} jours ouvrables
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-600">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Motif / Justification</p>
                                        <p className="text-sm border-l-2 border-emerald-200 pl-4 py-1 mt-2 text-slate-700 italic">
                                            {leave.reason || "Aucun motif spécifique renseigné."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-orange-600">
                                        <Briefcase className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Type de congé</p>
                                        <p className="text-lg font-bold">{leave.type}</p>
                                        <Badge variant="outline" className="mt-1 bg-white">ID: {leave.id.slice(0, 8)}</Badge>
                                    </div>
                                </div>

                                {leave.num_decision && (
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-purple-600">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">N° de décision</p>
                                            <p className="text-lg font-bold">{leave.num_decision}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline / History (Conceptual for premium look) */}
                    <Card className="border shadow-none">
                        <CardHeader>
                            <CardTitle className="text-md font-bold">Historique de la demande</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 relative before:absolute before:inset-0 before:left-6 before:top-4 before:bottom-4 before:w-px before:bg-slate-200">
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="h-4 w-4 rounded-full bg-emerald-500 mt-1 border-4 border-white shadow-sm ring-1 ring-slate-100" />
                                <div>
                                    <p className="text-sm font-bold">Soumission de la demande</p>
                                    <p className="text-xs text-muted-foreground">Par {leave.employee} le {format(parseISO(leave.startDate), "dd/MM/yyyy")}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 relative z-10">
                                <div className={cn("h-4 w-4 rounded-full mt-1 border-4 border-white shadow-sm ring-1 ring-slate-100", leave.status === 'En attente' ? 'bg-amber-400' : 'bg-slate-300')} />
                                <div>
                                    <p className="text-sm font-bold">Validation RH / Hiérarchie</p>
                                    <p className="text-xs text-muted-foreground">
                                        {leave.status === 'En attente' ? "Examen en cours par le service RH" : `Statut final : ${leave.status}`}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg overflow-hidden bg-slate-900 text-white">
                        <CardHeader>
                            <CardTitle className="text-slate-300">Profil Employé</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl font-bold">
                                    {employee?.name?.charAt(0) || leave.employee.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-lg font-bold">{employee?.name || leave.employee}</p>
                                    <p className="text-xs text-slate-400 font-mono">{employee?.matricule || "N/A"}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                <div className="flex items-center gap-2 text-sm">
                                    <Building2 className="h-4 w-4 text-slate-500" />
                                    <span>{units?.directions.find(d => d.id === employee?.directionId)?.name || "Direction non spécifiée"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-slate-500" />
                                    <span>{units?.services.find(s => s.id === employee?.serviceId)?.name || "Service non spécifié"}</span>
                                </div>
                            </div>

                            <Button variant="ghost" className="w-full justify-between text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl" onClick={() => router.push(`/employees/${leave.employeeId}`)}>
                                Voir le profil complet <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50/50 border-none shadow-none p-6">
                        <h4 className="font-bold flex items-center gap-2 text-blue-900 mb-4">
                            <Briefcase className="h-4 w-4" /> Solde estimé
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-blue-700">Droit annuel</span>
                                <span className="font-bold text-blue-900">26 jours</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-blue-700">Pris (y compris cette demanade)</span>
                                <span className="font-bold text-blue-900">{workingDays} jours</span>
                            </div>
                            <div className="pt-2 border-t border-blue-100 flex justify-between items-center font-bold">
                                <span className="text-blue-900">Solde restant</span>
                                <span className="text-blue-900">{26 - workingDays} jours</span>
                            </div>
                        </div>
                    </Card>

                    <Button variant="outline" className="w-full h-12 rounded-xl border-dashed hover:border-primary hover:bg-primary/5">
                        <Download className="mr-2 h-4 w-4" /> Télécharger la Décision (PDF)
                    </Button>
                </div>
            </div>
        </div>
    );
}
