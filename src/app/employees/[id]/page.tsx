
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getEmployee } from "@/services/employee-service";
import { getLeaves } from "@/services/leave-service";
import { getAssets } from "@/services/asset-service";
import { getMissions } from "@/services/mission-service";
import { getEmployeeHistory, deleteEmployeeHistoryEvent } from "@/services/employee-history-service";
import type { Employe, Leave, Asset, Mission, EmployeeEvent, Department, Direction, Service } from "@/lib/data";
import { getDepartments } from "@/services/department-service";
import { getDirections } from "@/services/direction-service";
import { getServices } from "@/services/service-service";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, User, Briefcase, Mail, Phone, MapPin, BadgeCheck, FileText, Calendar, Laptop, Rocket, FolderArchive, LogOut, Globe, Landmark, ChevronRight, Users, Cake, History, PlusCircle, Trash2, Binary, Printer, Receipt } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { lastDayOfMonth, format, subMonths, differenceInYears, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EmployeeHistoryTimeline } from "@/components/employees/employee-history-timeline";
import { AddHistoryEventSheet } from "@/components/employees/add-history-event-sheet";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";


type Status = "Approuvé" | "En attente" | "Rejeté";

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> =
{
    "Approuvé": "default",
    "En attente": "secondary",
    "Rejeté": "destructive",
};


export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { id } = params;
    const [employee, setEmployee] = useState<Employe | null>(null);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [history, setHistory] = useState<EmployeeEvent[]>([]);
    const [orgStructure, setOrgStructure] = useState<{ departments: Department[], directions: Direction[], services: Service[] }>({ departments: [], directions: [], services: [] });
    const [loading, setLoading] = useState(true);

    const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());
    const [endYear, setEndYear] = useState<string>(new Date().getFullYear().toString());
    const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [endMonth, setEndMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [generationMode, setGenerationMode] = useState<'monthly' | 'period'>('monthly');

    const [isEventSheetOpen, setIsEventSheetOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EmployeeEvent | null>(null);
    const [deleteEventTarget, setDeleteEventTarget] = useState<EmployeeEvent | null>(null);

    useEffect(() => {
        if (typeof id !== 'string') return;

        async function fetchData() {
            try {
                const [
                    employeeData,
                    leavesData,
                    assetsData,
                    missionsData,
                    historyData,
                    departments,
                    directions,
                    services
                ] = await Promise.all([
                    getEmployee(id as string).catch(err => { console.error("Failed to fetch employee", err); return null; }),
                    getLeaves().catch(err => { console.error("Failed to fetch leaves", err); return []; }),
                    getAssets().catch(err => { console.error("Failed to fetch assets", err); return []; }),
                    getMissions().catch(err => { console.error("Failed to fetch missions", err); return []; }),
                    getEmployeeHistory(id as string).catch(err => { console.error("Failed to fetch history", err); return []; }),
                    getDepartments().catch(err => { console.error("Failed to fetch departments", err); return []; }),
                    getDirections().catch(err => { console.error("Failed to fetch directions", err); return []; }),
                    getServices().catch(err => { console.error("Failed to fetch services", err); return []; }),
                ]);

                if (employeeData && employeeData.Date_Naissance) {
                    employeeData.age = differenceInYears(new Date(), parseISO(employeeData.Date_Naissance));
                }

                setOrgStructure({ departments, directions, services });
                setEmployee(employeeData);

                if (employeeData) {
                    setLeaves(leavesData.filter(l => l.employee === employeeData.name).slice(0, 5));
                    setAssets(assetsData.filter(a => a.assignedTo === employeeData.name));
                    setMissions(missionsData.filter(m => m.participants.some(p => p.employeeName === employeeData.name)).slice(0, 5));
                    setHistory(historyData);
                }
            } catch (error) {
                console.error("Failed to fetch employee details", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const getAvatarBgClass = (sexe?: 'Homme' | 'Femme' | 'Autre') => {
        switch (sexe) {
            case 'Homme': return 'bg-blue-200 dark:bg-blue-800';
            case 'Femme': return 'bg-pink-200 dark:bg-pink-800';
            default: return 'bg-muted';
        }
    };

    const handleNavigateToPayslip = () => {
        if (!employee) return;

        const selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const lastDay = lastDayOfMonth(selectedDate);
        const formattedDate = lastDay.toISOString().split('T')[0]; // YYYY-MM-DD

        setIsDateDialogOpen(false);

        let url = `/payroll/${employee.id}?payslipDate=${formattedDate}`;
        if (generationMode === 'period') {
            const endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
            const lastDayEnd = lastDayOfMonth(endDate);
            url += `&endDate=${lastDayEnd.toISOString().split('T')[0]}`;
        }

        router.push(url);
    };

    const handleOpenEventSheet = (eventToEdit: EmployeeEvent | null = null) => {
        setEditingEvent(eventToEdit);
        setIsEventSheetOpen(true);
    };

    const handleEventSaved = (savedEvent: EmployeeEvent) => {
        if (editingEvent) {
            // Update existing event in the list
            setHistory(prev => prev.map(e => e.id === savedEvent.id ? savedEvent : e));
        } else {
            // Add new event and re-sort
            setHistory(prev => [savedEvent, ...prev].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()));
        }
    };

    const handleDeleteEventConfirm = async () => {
        if (!deleteEventTarget) return;
        try {
            await deleteEmployeeHistoryEvent(id as string, deleteEventTarget.id);
            setHistory(prev => prev.filter(e => e.id !== deleteEventTarget.id));
            toast({ title: "Événement supprimé", description: "L'événement a été retiré de l'historique." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'événement." });
        } finally {
            setDeleteEventTarget(null);
        }
    };

    const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
    const months = [
        { value: "1", label: "Janvier" }, { value: "2", label: "Février" },
        { value: "3", label: "Mars" }, { value: "4", label: "Avril" },
        { value: "5", label: "Mai" }, { value: "6", label: "Juin" },
        { value: "7", label: "Juillet" }, { value: "8", label: "Août" },
        { value: "9", label: "Septembre" }, { value: "10", label: "Octobre" },
        { value: "11", label: "Novembre" }, { value: "12", label: "Décembre" },
    ];

    const lastThreePayslips = Array.from({ length: 3 }).map((_, i) => {
        const date = subMonths(new Date(), i);
        const lastDay = lastDayOfMonth(date);
        return {
            period: format(date, "MMMM yyyy", { locale: fr }),
            dateParam: lastDay.toISOString().split('T')[0],
        };
    });


    if (loading) {
        return <EmployeeDetailSkeleton />;
    }

    if (!employee) {
        return <div className="text-center py-10">Employé non trouvé.</div>;
    }

    const fullName = `${employee.lastName || ''} ${employee.firstName || ''}`.trim() || employee.name;
    const departmentName = orgStructure.departments.find(d => d.id === employee.departmentId)?.name;
    const directionName = orgStructure.directions.find(d => d.id === employee.directionId)?.name;
    const serviceName = orgStructure.services.find(s => s.id === employee.serviceId)?.name;


    let retirementDate = null;
    if (employee.Date_Naissance && employee.status === 'Actif') {
        const birthDate = new Date(employee.Date_Naissance);
        retirementDate = new Date(birthDate.getFullYear() + 60, birthDate.getMonth(), birthDate.getDate()).toLocaleDateString('fr-FR');
    }


    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Retour</span>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Fiche de l'Employé</h1>
                    <Button asChild className="ml-auto">
                        <Link href={`/employees/${id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                        </Link>
                    </Button>
                </div>

                <Tabs defaultValue="info">
                    <TabsList className="mb-4">
                        <TabsTrigger value="info">Informations Générales</TabsTrigger>
                        <TabsTrigger value="payroll">Paie</TabsTrigger>
                        <TabsTrigger value="activity">Activité</TabsTrigger>
                        <TabsTrigger value="history">Historique</TabsTrigger>
                    </TabsList>
                    <TabsContent value="info">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-3">
                                <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                    <Avatar className="h-24 w-24 border">
                                        <AvatarImage src={employee.photoUrl} alt={fullName} data-ai-hint="employee photo" />
                                        <AvatarFallback className={`text-3xl ${getAvatarBgClass(employee.sexe)}`}>
                                            {employee.lastName?.charAt(0) || ''}{employee.firstName?.charAt(0) || ''}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-3xl">{fullName}</CardTitle>
                                        <CardDescription className="text-lg text-muted-foreground">{employee.poste}</CardDescription>
                                        <div className="mt-2 flex gap-2 flex-wrap">
                                            <Badge variant={employee.status === 'Actif' ? 'default' : 'destructive'}>{employee.status}</Badge>
                                            {departmentName && <Badge variant="secondary">{departmentName}</Badge>}
                                            {directionName && <Badge variant="outline">{directionName}</Badge>}
                                            {serviceName && <Badge variant="outline" className="bg-accent/50">{serviceName}</Badge>}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg"><Briefcase className="h-5 w-5 text-primary" /> Informations Générales</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        <InfoItem label="Poste" value={employee.poste} />
                                        <InfoItem label="Matricule" value={employee.matricule} />
                                        <InfoItem label="Email" value={employee.email} icon={Mail} />
                                        <InfoItem label="Téléphone" value={employee.mobile} icon={Phone} />
                                        <InfoItem label="Date d'embauche" value={employee.dateEmbauche} />
                                        <InfoItem label="Date de départ" value={employee.Date_Depart} />
                                        <InfoItem label="Numéro de décision" value={employee.Num_Decision} icon={FileText} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-primary" /> Informations Personnelles</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        <InfoItem label="Date de naissance" value={employee.Date_Naissance} icon={Calendar} />
                                        {employee.age !== undefined && <InfoItem label="Âge" value={`${employee.age} ans`} icon={Cake} />}
                                        <InfoItem label="Lieu de naissance" value={employee.Lieu_Naissance} icon={MapPin} />
                                        <InfoItem label="Situation matrimoniale" value={employee.situationMatrimoniale} />
                                        {employee.enfants !== undefined && <InfoItem label="Enfants à charge" value={employee.enfants} icon={Users} />}
                                        <InfoItem label="Sexe" value={employee.sexe} icon={Binary} />
                                        <InfoItem label="Localisation" icon={Globe}>
                                            {employee.Region || employee.Village ? (
                                                <p className="text-base font-medium mt-1">{employee.Region}{employee.Village ? `, ${employee.Village}` : ''}</p>
                                            ) : (
                                                <p className="text-muted-foreground text-sm font-normal">Non spécifiée</p>
                                            )}
                                        </InfoItem>
                                        {retirementDate && <InfoItem label="Date de retraite estimée" value={retirementDate} icon={LogOut} />}
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="lg:col-span-1 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg"><BadgeCheck className="h-5 w-5 text-primary" /> Compétences</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {employee.skills && employee.skills.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {employee.skills.map(skill => (
                                                    <Badge key={skill} variant="secondary">{skill}</Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground text-sm font-normal text-center py-4">Aucune compétence enregistrée.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="payroll">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" /> Gestion de la Paie</CardTitle>
                                <CardDescription>Générez et consultez les bulletins de paie de l'employé.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Bulletins Récents</h4>
                                    <div className="space-y-2">
                                        {lastThreePayslips.map(item => (
                                            <Button key={item.dateParam} variant="outline" className="w-full justify-start" asChild>
                                                <Link href={`/payroll/${id}?payslipDate=${item.dateParam}`}>
                                                    <Receipt className="mr-2 h-4 w-4" />
                                                    Bulletin de {item.period}
                                                </Link>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Générer un autre bulletin</h4>
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <p className="text-sm">Générer un bulletin pour une période personnalisée.</p>
                                        <Button onClick={() => setIsDateDialogOpen(true)} size="sm">Générer</Button>
                                    </div>
                                </div>
                                <div className="space-y-4 md:col-span-2">
                                    <h4 className="font-semibold flex items-center gap-2"><Landmark className="h-4 w-4" /> Coordonnées Bancaires</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                                        <InfoItem label="Banque" value={employee.banque} />
                                        <InfoItem label="Code Banque" value={employee.CB} />
                                        <InfoItem label="Code Guichet" value={employee.CG} />
                                        <InfoItem label="Numéro de Compte" value={employee.numeroCompte} />
                                        <InfoItem label="Clé RIB" value={employee.Cle_RIB} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="activity">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Historique des Congés</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {leaves.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Début</TableHead>
                                                    <TableHead>Fin</TableHead>
                                                    <TableHead>Statut</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {leaves.map(leave => (
                                                    <TableRow key={leave.id}>
                                                        <TableCell>{leave.type}</TableCell>
                                                        <TableCell>{leave.startDate}</TableCell>
                                                        <TableCell>{leave.endDate}</TableCell>
                                                        <TableCell><Badge variant={statusVariantMap[leave.status as Status] || "default"}>{leave.status}</Badge></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : <p className="text-sm text-muted-foreground">Aucune demande de congé trouvée.</p>}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> Missions Récentes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {missions.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Titre</TableHead>
                                                    <TableHead>Période</TableHead>
                                                    <TableHead>Statut</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {missions.map(mission => (
                                                    <TableRow key={mission.id}>
                                                        <TableCell>{mission.title}</TableCell>
                                                        <TableCell>{mission.startDate} - {mission.endDate}</TableCell>
                                                        <TableCell><Badge variant="secondary">{mission.status}</Badge></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : <p className="text-sm text-muted-foreground">Aucune mission récente.</p>}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Laptop className="h-5 w-5 text-primary" /> Actifs Assignés</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {assets.length > 0 ? (
                                        <ul className="space-y-2">
                                            {assets.map(asset => (
                                                <li key={asset.tag} className="text-sm flex justify-between">
                                                    <span>{asset.modele}</span>
                                                    <span className="text-muted-foreground">({asset.tag})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-sm text-muted-foreground">Aucun actif assigné.</p>}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><FolderArchive className="h-5 w-5 text-primary" /> Documents Associés</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        La fonctionnalité de gestion des documents sera bientôt disponible ici.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Historique Professionnel</CardTitle>
                                        <CardDescription>Journal des événements clés de la carrière de l'employé.</CardDescription>
                                    </div>
                                    <Button onClick={() => handleOpenEventSheet()}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un événement
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <EmployeeHistoryTimeline
                                    events={history}
                                    onEdit={handleOpenEventSheet}
                                    onDelete={setDeleteEventTarget}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Choisir la Période du Bulletin</DialogTitle>
                            <DialogDescription>
                                Sélectionnez le mois et l'année pour générer le bulletin de paie de {fullName}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label>Mode de génération</Label>
                                <Select value={generationMode} onValueChange={(v: any) => setGenerationMode(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Bulletin Unique (Mensuel)</SelectItem>
                                        <SelectItem value="period">Période Personnalisée</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="year">Année</Label>
                                    <Select value={year} onValueChange={setYear}>
                                        <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="month">{generationMode === 'monthly' ? 'Mois' : 'Mois de début'}</Label>
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger id="month"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {generationMode === 'period' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="endYear">Année de fin</Label>
                                        <Select value={endYear} onValueChange={setEndYear}>
                                            <SelectTrigger id="endYear"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="endMonth">Mois de fin</Label>
                                        <Select value={endMonth} onValueChange={setEndMonth}>
                                            <SelectTrigger id="endMonth"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {months.map(m => {
                                                    const isBeforeStart = parseInt(endYear) < parseInt(year) || (parseInt(endYear) === parseInt(year) && parseInt(m.value) < parseInt(month));
                                                    return (
                                                        <SelectItem
                                                            key={m.value}
                                                            value={m.value}
                                                            disabled={isBeforeStart}
                                                        >
                                                            {m.label}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>Annuler</Button>
                            <Button onClick={handleNavigateToPayslip}>
                                {generationMode === 'monthly' ? 'Générer le Bulletin' : 'Générer les Bulletins'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <AddHistoryEventSheet
                isOpen={isEventSheetOpen}
                onClose={() => setIsEventSheetOpen(false)}
                employeeId={id as string}
                eventToEdit={editingEvent}
                onEventSaved={handleEventSaved}
            />
            <ConfirmationDialog
                isOpen={!!deleteEventTarget}
                onClose={() => setDeleteEventTarget(null)}
                onConfirm={handleDeleteEventConfirm}
                title={`Supprimer l'événement : ${deleteEventTarget?.eventType}`}
                description="Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible."
            />
        </>
    );
}

function InfoItem({ label, value, icon: Icon, children }: { label: string; value?: string | number | null; icon?: React.ElementType, children?: React.ReactNode }) {
    if (!value && !children) return null;
    return (
        <div className="flex flex-col">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {label}
            </Label>
            {value && <p className="text-base font-medium mt-1">{value}</p>}
            {children && <div className="mt-1">{children}</div>}
        </div>
    );
}

function EmployeeDetailSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-24 ml-auto" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-6">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-8 w-1/2" />
                                <Skeleton className="h-6 w-1/3" />
                                <div className="flex gap-2 mt-2">
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
