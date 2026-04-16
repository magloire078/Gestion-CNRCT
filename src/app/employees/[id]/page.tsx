"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
    getEmployee, 
    deleteEmployee, 
    getOrganizationalUnits 
} from "@/services/employee-service";
import type { Employe, Department, Direction, Service } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { useFormat } from "@/hooks/use-format";
import { useToast } from "@/hooks/use-toast";
import { 
    getEmployeeHistory, 
    deleteEmployeeHistoryEvent
} from "@/services/employee-history-service";
import { AddHistoryEventSheet } from "@/components/employees/add-history-event-sheet";
import { EmployeeHistoryTimeline } from "@/components/employees/employee-history-timeline";
import { type EmployeeEvent } from "@/lib/data";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { differenceInYears, parseISO } from "date-fns";
import {
    PlusCircle,
    Receipt,
    Rocket,
    Sparkles,
    Bell,
    MessageSquare,
    Newspaper,
    ArrowRight,
    MapPin,
    Search,
    Calendar,
    Zap,
    Heart,
    Award,
    Pencil,
    Trash2,
    Mail,
    Phone,
    Briefcase,
    Building,
    Home,
    ShieldCheck,
    History,
    FileText,
    Download,
    ChevronLeft,
    CheckCircle2,
    XCircle,
    Banknote,
    UserCircle,
    UserCircle2,
    Building2,
    Users2,
    Wallet,
    CreditCard,
    MoreVertical
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { cn } from "@/lib/utils";

export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { formatDate, formatCurrency } = useFormat();
    const { hasPermission } = useAuth();
    
    const [employee, setEmployee] = useState<Employe | null>(null);
    const [units, setUnits] = useState<{ departments: Department[], directions: Direction[], services: Service[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEventDeleteDialogOpen, setIsEventDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<EmployeeEvent | null>(null);
    
    // History state
    const [historyEvents, setHistoryEvents] = useState<EmployeeEvent[]>([]);
    const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<EmployeeEvent | null>(null);
    const [activeTab, setActiveTab] = useState("info");
    const [isPending, startTransition] = useTransition();

    const employeeId = params.id as string;

    useEffect(() => {
        if (!employeeId) return;

        Promise.all([
            getEmployee(employeeId),
            getOrganizationalUnits(),
            getEmployeeHistory(employeeId)
        ])
        .then(([emp, orgUnits, history]) => {
            if (emp) {
                setEmployee(emp);
                setUnits(orgUnits);
                setHistoryEvents(history);
            } else {
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Employé non trouvé."
                });
                router.push("/employees");
            }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [employeeId, router, toast]);

    const handleRefreshHistory = async () => {
        try {
            const history = await getEmployeeHistory(employeeId);
            setHistoryEvents(history);
            // Also refresh employee data in case salary changed
            const emp = await getEmployee(employeeId);
            if (emp) setEmployee(emp);
        } catch (error) {
            console.error("Failed to refresh history", error);
        }
    };

    const handleDeleteEvent = (event: EmployeeEvent) => {
        setEventToDelete(event);
        setIsEventDeleteDialogOpen(true);
    };

    const handleConfirmDeleteEvent = async () => {
        if (!eventToDelete) return;
        
        startTransition(async () => {
            try {
                await deleteEmployeeHistoryEvent(employeeId, eventToDelete.id);
                toast({ title: "Événement supprimé", description: "L'historique a été mis à jour." });
                await handleRefreshHistory();
            } catch (error) {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'événement." });
            } finally {
                setIsEventDeleteDialogOpen(false);
                setEventToDelete(null);
            }
        });
    };

    const handleDelete = async () => {
        try {
            await deleteEmployee(employeeId);
            toast({
                title: "Employé supprimé",
                description: "La fiche a été retirée du répertoire."
            });
            router.push("/employees");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de supprimer l'employé."
            });
        }
    };

    const deptName = units?.departments.find(d => d.id === employee?.departmentId)?.name;
    const directionName = units?.directions.find(d => d.id === employee?.directionId)?.name;
    const serviceName = units?.services.find(s => s.id === employee?.serviceId)?.name;

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-48 bg-slate-100 rounded-xl" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="h-96 bg-slate-50 rounded-xl" />
                    <div className="lg:col-span-2 h-96 bg-slate-50 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!employee) return null;

    const canEdit = hasPermission('page:employees:edit');
    const canDelete = hasPermission('page:employees:delete');
    const canViewSalary = hasPermission('page:payroll:view') || hasPermission('feature:payroll:view-sensitive');

    // Salary total calculations (fallback if database totals are 0)
    const baseSalary = employee.baseSalary || 0;
    const primeAnciennete = employee.primeAnciennete || 0;
    const indemniteLogement = employee.indemniteLogement || 0;
    const indemniteTransport = employee.indemniteTransportImposable || 0;
    const otherIndemnities = (employee.indemniteResponsabilite || 0) + 
                             (employee.indemniteSujetion || 0) + 
                             (employee.indemniteCommunication || 0) + 
                             (employee.indemniteRepresentation || 0);
    
    const calculatedBrut = baseSalary + primeAnciennete + indemniteLogement + indemniteTransport + otherIndemnities;
    const displayBrut = (employee.Salaire_Brut && employee.Salaire_Brut > 0) ? employee.Salaire_Brut : calculatedBrut;
    const displayNet = (employee.Salaire_Net && employee.Salaire_Net > 0) ? employee.Salaire_Net : displayBrut;

    const isActive = employee.status === "Actif";

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* --- PROFILE HERO SECTION --- */}
            <div className="relative overflow-hidden rounded-3xl p-1 shadow-xl bg-white/20 backdrop-blur-xl border border-white/30">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent)]" />
                
                <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    {/* Avatar Section */}
                    <div className="relative group">
                        <div className={cn(
                            "absolute -inset-2 rounded-full blur-xl opacity-40 transition-all duration-700 group-hover:opacity-70 group-hover:scale-110",
                            isActive ? "bg-emerald-500" : "bg-rose-500"
                        )} />
                        <Avatar className="h-40 w-40 md:h-48 md:w-48 border-4 border-white/10 shadow-2xl transition-all duration-1000 group-hover:scale-[1.02]">
                            <AvatarImage src={employee.photoUrl} alt={employee.name} className="object-cover transition-transform duration-700 group-hover:scale-110" />
                            <AvatarFallback className="text-5xl font-black bg-slate-800 text-slate-500">
                                {employee.lastName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "absolute -bottom-1 -right-1 h-10 w-10 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-xl",
                            isActive ? "bg-emerald-500" : "bg-rose-500"
                        )}>
                            {isActive ? (
                                <CheckCircle2 className="h-5 w-5 text-white" />
                            ) : (
                                <XCircle className="h-5 w-5 text-white" />
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 text-center md:text-left space-y-6">
                        <div className="space-y-1">
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                <div className="bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg shadow-blue-900/40">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{employee.matricule}</span>
                                </div>
                                <span className="h-3 w-px bg-white/20" />
                                <span className="text-blue-400 font-bold uppercase text-[9px] tracking-widest flex items-center gap-2">
                                    <UserCircle className="h-3 w-3" /> Dossier Actif
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-3 uppercase">
                                {employee.lastName} <br/>
                                <span className="text-slate-400 font-medium tracking-tight normal-case">{employee.firstName}</span>
                            </h1>
                        </div>

                        <div className="inline-flex items-center gap-2.5 bg-white/5 border border-white/10 px-5 py-2 rounded-xl backdrop-blur-md">
                            <Briefcase className="h-4.5 w-4.5 text-amber-500" />
                            <span className="text-base md:text-lg text-slate-300 font-black uppercase tracking-[0.1em]">{employee.poste}</span>
                        </div>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4 border-t border-white/5 mt-6">
                            {[
                                { icon: Building2, label: "Unité", val: deptName, color: "text-blue-400" },
                                { icon: MapPin, label: "Lieu", val: employee.Region || "Siège", color: "text-rose-400" },
                                { icon: ShieldCheck, label: "CNPS", val: employee.CNPS ? "Affilié" : "Non immatriculé", color: employee.CNPS ? "text-emerald-400" : "text-slate-500" }
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                                    <div className="flex items-center gap-2 text-white text-sm font-bold">
                                        <item.icon className={cn("h-4 w-4", item.color)} /> {item.val || "—"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-col gap-2 w-full md:w-auto shrink-0 self-start pt-2">
                        {canEdit && (
                            <Button asChild className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[9px] shadow-xl shadow-black/10 group">
                                <Link href={`/employees/${employee.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4 text-blue-600 transition-transform group-hover:rotate-12" /> Modifier
                                </Link>
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                className="h-11 flex-1 md:w-16 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 shadow-lg font-black uppercase tracking-widest text-[9px]"
                                onClick={() => window.print()}
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-11 flex-1 md:w-16 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 shadow-lg">
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-slate-900 text-white border-white/10 shadow-3xl">
                                    <DropdownMenuLabel className="text-[10px] font-black p-2 uppercase tracking-widest text-slate-500">Flux de travail</DropdownMenuLabel>
                                    <DropdownMenuItem className="p-4 rounded-xl gap-3 cursor-pointer">
                                        <History className="h-4 w-4 text-blue-400" /> Nouvel historique
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="p-4 rounded-xl gap-3 cursor-pointer">
                                        <FileText className="h-4 w-4 text-emerald-400" /> Générer Attestation
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10"/>
                                    {canDelete && (
                                        <DropdownMenuItem 
                                            onClick={() => setIsDeleteDialogOpen(true)} 
                                            className="p-4 rounded-xl gap-3 cursor-pointer text-rose-400 focus:bg-rose-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" /> Radier l'agent
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs 
                defaultValue="info" 
                value={activeTab}
                onValueChange={(v) => startTransition(() => setActiveTab(v))}
                className="space-y-8"
            >
                <TabsList className="bg-white/40 backdrop-blur-xl border border-white/20 p-1 rounded-2xl shadow-xl shadow-slate-200/20 flex flex-wrap h-auto gap-1">
                    <TabsTrigger value="info" className="rounded-xl px-6 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">
                        <UserCircle2 className="mr-2 h-4 w-4" /> Identité
                    </TabsTrigger>
                    <TabsTrigger value="career" className="rounded-xl px-6 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">
                        <Briefcase className="mr-2 h-4 w-4" /> Carrière
                    </TabsTrigger>
                    {canViewSalary && (
                        <TabsTrigger value="salary" className="rounded-xl px-6 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">
                            <Banknote className="mr-2 h-4 w-4" /> Rémunération
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="history" className="rounded-xl px-6 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">
                        <History className="mr-2 h-4 w-4" /> Historique
                    </TabsTrigger>
                </TabsList>

                {/* Identity Tab */}
                <TabsContent value="info" className="grid grid-cols-1 lg:grid-cols-3 gap-6 focus-visible:outline-none">
                    <Card className="lg:col-span-2 border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-white/20">
                        <CardHeader className="p-6 pb-3 border-b border-white/10 bg-slate-50/50">
                            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                </div>
                                État Civil & Données Privées
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="grid grid-cols-1 gap-8">
                                {[
                                    { label: "Nom de Famille", val: employee.lastName, icon: UserCircle },
                                    { label: "Prénoms", val: employee.firstName, icon: null },
                                    { label: "Sexe & Genre", val: employee.sexe, icon: Sparkles },
                                    { label: "Date de Naissance", val: formatDate(employee.Date_Naissance), icon: Calendar }
                                ].map((item, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                        <p className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                            {item.icon && <item.icon className="h-4 w-4 text-slate-300" />} {item.val || "—"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 gap-8">
                                {[
                                    { label: "Téléphone Mobile", val: employee.mobile, icon: Phone, color: "text-blue-500" },
                                    { label: "Canal Email", val: employee.email, icon: Mail, color: "text-amber-500" },
                                    { label: "Situation Familiale", val: `${employee.enfants || 0} enfant(s)`, icon: Users2, color: "text-slate-300" }
                                ].map((item, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                        <p className="text-lg font-bold text-slate-900 flex items-center gap-3 italic">
                                            <item.icon className={cn("h-4 w-4", item.color)} /> {item.val || "—"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden self-start relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent)]" />
                        <CardHeader className="p-6 pb-3 relative z-10">
                            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                <Award className="h-5 w-5 text-amber-500" /> Qualifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-3 space-y-6 relative z-10">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hiérarchie / Grade</span>
                                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                    <span className="text-xl font-black text-blue-400 uppercase tracking-tighter">
                                        {employee.categorie || "AGENT GÉNÉRAL"}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-black">!</div>
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-relaxed">Agent habilité à manipuler des ressources stratégiques.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Career Tab */}
                <TabsContent value="career" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 focus-visible:outline-none">
                    <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-white/20">
                        <CardHeader className="p-6 pb-3 bg-slate-900 text-white">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-blue-400" />
                                </div>
                                <CardTitle className="text-lg font-black uppercase tracking-tight">Affectation</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                             {[
                                { label: "Direction", val: directionName },
                                { label: "Département", val: deptName },
                                { label: "Service Affecté", val: serviceName }
                             ].map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                    <p className="text-lg font-bold text-slate-900">{item.val || "Non spécifié"}</p>
                                </div>
                             ))}
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-white/20">
                        <CardHeader className="p-6 pb-3 bg-blue-600 text-white">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <CardTitle className="text-lg font-black uppercase tracking-tight">Anciennété</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrée en Service</span>
                                <p className="text-lg font-bold text-slate-900">{formatDate(employee.dateEmbauche)}</p>
                            </div>
                            <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] block mb-1">Calcul Automatique</span>
                                <p className="text-xl font-black text-blue-600 tracking-tighter">
                                    {employee.dateEmbauche ? differenceInYears(new Date(), parseISO(employee.dateEmbauche)) : 0} ANS <span className="text-xs font-bold text-blue-400 ml-1">DE SERVICE</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Départ Prévu</span>
                                <p className="text-lg font-bold text-rose-500">{formatDate(employee.Date_Depart) || "Indéterminée"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-white/20 lg:col-span-1">
                        <CardHeader className="p-6 pb-3 bg-emerald-600 text-white">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                                    <ShieldCheck className="h-5 w-5 text-white" />
                                </div>
                                <CardTitle className="text-lg font-black uppercase tracking-tight">Certification</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">N° Assurance CNPS</span>
                                <div className="bg-slate-900 text-white p-4 rounded-xl border-l-4 border-emerald-400 font-mono text-base font-black tracking-widest">
                                    {employee.CNPS ? "CNPS-RECO-8271" : "REG-INV-4402"}
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center italic">{employee.CNPS ? "Contrat immatriculé" : "En cours"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Badge Identité</span>
                                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black px-4 h-7 text-[10px] tracking-widest uppercase rounded-lg">
                                    {employee.categorie || "AGENT STANDARD"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Salary Tab */}
                {canViewSalary && (
                    <TabsContent value="salary" className="grid grid-cols-1 lg:grid-cols-2 gap-6 focus-visible:outline-none">
                        <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-white/20 relative">
                             <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <Banknote className="h-32 w-32" />
                             </div>
                             <CardHeader className="p-6 pb-3">
                                <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <Wallet className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    Architecture Salariale
                                </CardTitle>
                             </CardHeader>
                             <CardContent className="p-6 pt-3 space-y-8">
                                <div className="flex justify-between items-center p-6 rounded-2xl bg-emerald-900 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.2),transparent)]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10 opacity-70">Salaire Brut</span>
                                    <span className="text-3xl font-black relative z-10 tracking-tighter">{formatCurrency(displayBrut)}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {[
                                        { label: "Salaire de Base", val: employee.baseSalary },
                                        { label: "Primes Ancienneté", val: employee.primeAnciennete },
                                        { label: "Indemnité Logement", val: employee.indemniteLogement },
                                        { label: "Indemnité Transport", val: employee.indemniteTransportImposable }
                                    ].map((field, idx) => (
                                        <div key={idx} className="space-y-1 border-b border-slate-100 pb-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</span>
                                            <p className="text-lg font-bold text-slate-900">{formatCurrency(field.val || 0)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 rounded-2xl bg-blue-600 text-white flex justify-between items-center shadow-xl shadow-blue-900/20 relative overflow-hidden">
                                     <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] opacity-10" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">Net à Payer</span>
                                    <span className="text-4xl font-black relative z-10 tracking-tighter">{formatCurrency(displayNet)}</span>
                                </div>
                             </CardContent>
                        </Card>

                        <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-white/20">
                             <CardHeader className="p-6 pb-3">
                                <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <CreditCard className="h-5 w-5 text-blue-600" />
                                    </div>
                                    Paiement
                                </CardTitle>
                             </CardHeader>
                             <CardContent className="p-6 pt-3 space-y-8">
                                <div className="space-y-3 p-6 bg-slate-900 text-white rounded-2xl border border-white/10 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-2 right-4 text-white/10 italic font-black text-2xl">SECURE</div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banque</span>
                                    <p className="text-xl font-black italic tracking-tight">{employee.banque || "TRÉSOR PUBLIC"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Numéro de Compte</span>
                                    <p className="text-lg font-mono font-black text-slate-700 bg-white p-4 rounded-xl border-2 border-slate-100 shadow-inner tracking-widest">
                                        {employee.numeroCompte || "— — — — —"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <ShieldCheck className="h-6 w-6 text-blue-500 shrink-0" />
                                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-relaxed">Cryptage AES-256 activé.</p>
                                </div>
                             </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* History Tab */}
                <TabsContent value="history" className="focus-visible:outline-none">
                    <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-white/20">
                        <CardHeader className="p-6 pb-3 border-b border-white/10 bg-slate-50/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <History className="h-5 w-5 text-blue-600" />
                                </div>
                                Timeline
                            </CardTitle>
                            {canEdit && (
                                <Button 
                                    onClick={() => {
                                        startTransition(() => {
                                            setEventToEdit(null);
                                            setIsHistorySheetOpen(true);
                                        });
                                    }}
                                    className="h-10 px-5 rounded-lg bg-slate-900 text-white font-black uppercase tracking-widest text-[9px] hover:bg-black transition-all"
                                >
                                    <PlusCircle className="mr-2 h-3.5 w-3.5 text-emerald-400" /> Ajouter
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-6">
                            {activeTab === "history" && (
                                <EmployeeHistoryTimeline 
                                    events={historyEvents}
                                    onEdit={(event) => {
                                        setEventToEdit(event);
                                        setIsHistorySheetOpen(true);
                                    }}
                                    onDelete={handleDeleteEvent}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AddHistoryEventSheet 
                isOpen={isHistorySheetOpen}
                onCloseAction={() => setIsHistorySheetOpen(false)}
                employeeId={employeeId}
                eventToEdit={eventToEdit}
                onEventSavedAction={() => handleRefreshHistory()}
            />

            <ConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onCloseAction={() => setIsDeleteDialogOpen(false)}
                onConfirmAction={handleDelete}
                title="Radier cet employé ?"
                description={`Cette action retirera définitivement ${employee.name} de la base de données active de la CNRCT. Cette opération est irréversible.`}
            />

            <ConfirmationDialog
                isOpen={isEventDeleteDialogOpen}
                onCloseAction={() => setIsEventDeleteDialogOpen(false)}
                onConfirmAction={handleConfirmDeleteEvent}
                title="Supprimer l'événement ?"
                description="Cette action est irréversible et pourrait impacter les futurs bulletins de paie calculés à partir de cet historique."
                confirmText={isPending ? "Suppression..." : "Supprimer"}
            />
        </div>
    );
}
