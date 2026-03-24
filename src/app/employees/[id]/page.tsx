"use client";

import { useState, useEffect, useMemo } from "react";
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

    const employeeId = params.id as string;

    useEffect(() => {
        if (!employeeId) return;

        Promise.all([
            getEmployee(employeeId),
            getOrganizationalUnits()
        ])
        .then(([emp, orgUnits]) => {
            if (emp) {
                setEmployee(emp);
                setUnits(orgUnits);
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
                <div className="h-48 bg-slate-100 rounded-[3rem]" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="h-96 bg-slate-50 rounded-[2rem]" />
                    <div className="lg:col-span-2 h-96 bg-slate-50 rounded-[2rem]" />
                </div>
            </div>
        );
    }

    if (!employee) return null;

    const canEdit = hasPermission('page:employees:edit');
    const canDelete = hasPermission('page:employees:delete');
    const canViewSalary = hasPermission('page:payroll:view') || hasPermission('feature:payroll:view-sensitive');

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Header / Hero Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent)]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <div className="relative">
                        <Avatar className="h-40 w-40 border-8 border-white/5 shadow-2xl transition-transform hover:scale-105 duration-500">
                            <AvatarImage src={employee.photoUrl} alt={employee.name} className="object-cover" />
                            <AvatarFallback className="text-4xl font-black bg-slate-800 text-slate-500">
                                {employee.lastName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 h-10 w-10 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                                {employee.lastName} <span className="text-slate-400 font-medium">{employee.firstName}</span>
                            </h1>
                            <Badge className="w-fit mx-auto md:mx-0 bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-1 h-7 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {employee.matricule}
                            </Badge>
                        </div>
                        <p className="text-lg md:text-xl text-slate-400 font-bold uppercase tracking-wide">{employee.poste}</p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                                <Building2 className="h-4 w-4 text-slate-500" /> {deptName || "—"}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                                <ShieldCheck className={cn("h-4 w-4", employee.CNPS ? "text-emerald-500" : "text-slate-600")} />
                                {employee.CNPS ? "Affilié CNPS" : "Non Affilié"}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 shrink-0 self-start md:self-center">
                        {canEdit && (
                            <Button asChild className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-12 px-6 font-bold shadow-xl shadow-black/10">
                                <Link href={`/employees/${employee.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" /> Modifier
                                </Link>
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 shadow-lg">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl border-slate-100 mt-2">
                                <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">
                                    Commandes Système
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="p-3 gap-3 rounded-xl m-1 cursor-pointer">
                                    <FileText className="h-4 w-4 text-blue-500" /> Dossier Personnel
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="p-3 gap-3 rounded-xl m-1 cursor-pointer">
                                    <Link href={`/payroll/${employee.id}`}>
                                        <Wallet className="h-4 w-4 text-emerald-500" /> Dernier Bulletin
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {canDelete && (
                                    <DropdownMenuItem 
                                        onClick={() => setIsDeleteDialogOpen(true)} 
                                        className="p-3 gap-3 rounded-xl m-1 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                    >
                                        <Trash2 className="h-4 w-4" /> Supprimer la Fiche
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="info" className="space-y-8">
                <TabsList className="bg-white border border-slate-100 p-1.5 rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-wrap h-auto gap-2">
                    <TabsTrigger value="info" className="rounded-2xl px-8 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all">
                        <UserCircle2 className="mr-2 h-4 w-4" /> Identité
                    </TabsTrigger>
                    <TabsTrigger value="career" className="rounded-2xl px-8 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all">
                        <Briefcase className="mr-2 h-4 w-4" /> Carrière
                    </TabsTrigger>
                    {canViewSalary && (
                        <TabsTrigger value="salary" className="rounded-2xl px-8 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all">
                            <Banknote className="mr-2 h-4 w-4" /> Rémunération
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="history" className="rounded-2xl px-8 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all">
                        <History className="mr-2 h-4 w-4" /> Événements
                    </TabsTrigger>
                </TabsList>

                {/* Identity Tab */}
                <TabsContent value="info" className="grid grid-cols-1 lg:grid-cols-3 gap-8 focus-visible:outline-none">
                    <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> État Civil & Identité
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom de Famille</span>
                                    <p className="text-base font-bold text-slate-900">{employee.lastName || "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prénoms</span>
                                    <p className="text-base font-bold text-slate-900">{employee.firstName || "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sexe</span>
                                    <p className="text-base font-bold text-slate-900">{employee.sexe || "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de Naissance</span>
                                    <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-300" /> {formatDate(employee.Date_Naissance)}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone Mobile</span>
                                    <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-blue-500" /> {employee.mobile || "—"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                                    <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-amber-500" /> {employee.email || "—"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enfants</span>
                                    <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Users2 className="h-4 w-4 text-slate-300" /> {employee.enfants || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-slate-50 overflow-hidden self-start">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl flex items-center gap-3">
                                <Award className="h-5 w-5 text-amber-500" /> Qualifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</span>
                                <Badge variant="outline" className="text-xs font-bold bg-white text-slate-700 border-slate-200 h-8 px-4 rounded-xl">
                                    {employee.categorie || "Non renseigné"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Career Tab */}
                <TabsContent value="career" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 focus-visible:outline-none">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 pb-4 bg-slate-900 text-white">
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-blue-400" />
                                <CardTitle className="text-xl">Organisation</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                             <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direction</span>
                                <p className="text-base font-bold text-slate-900">{directionName || "—"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Département</span>
                                <p className="text-base font-bold text-slate-900">{deptName || "—"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</span>
                                <p className="text-base font-bold text-slate-900">{serviceName || "—"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 pb-4 bg-blue-600 text-white">
                             <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-blue-200" />
                                <CardTitle className="text-xl">Temporalité</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date d'Embauche</span>
                                <p className="text-base font-bold text-slate-900">{formatDate(employee.dateEmbauche)}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anciennété</span>
                                <p className="text-base font-bold text-blue-600">
                                    {employee.dateEmbauche ? differenceInYears(new Date(), parseISO(employee.dateEmbauche)) : 0} ans de service
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de Départ Prévue</span>
                                <p className="text-base font-bold text-rose-500">{formatDate(employee.Date_Depart) || "Indéterminée"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden lg:col-span-1">
                        <CardHeader className="p-8 pb-4 bg-emerald-600 text-white">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-emerald-200" />
                                <CardTitle className="text-xl">Sécurité Sociale</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Affiliation CNPS</span>
                                <p className="text-base font-bold font-mono text-slate-900 bg-slate-50 p-3 rounded-xl border border-dotted border-slate-200">
                                    {employee.CNPS ? "Déclaré & Actif" : "Non immatriculé"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</span>
                                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black px-4 h-6 text-[10px] tracking-widest uppercase">
                                    {employee.categorie || "—"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Salary Tab */}
                {canViewSalary && (
                    <TabsContent value="salary" className="grid grid-cols-1 lg:grid-cols-2 gap-8 focus-visible:outline-none">
                        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden relative">
                             <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Banknote className="h-32 w-32" />
                             </div>
                             <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-xl flex items-center gap-3">
                                    <Wallet className="h-5 w-5 text-emerald-500" /> Salaire & Primes
                                </CardTitle>
                             </CardHeader>
                             <CardContent className="p-8 pt-4 space-y-6">
                                <div className="flex justify-between items-center p-4 rounded-3xl bg-emerald-50 border border-emerald-100">
                                    <span className="text-sm font-black text-emerald-900 uppercase tracking-widest">Salaire Brut Total</span>
                                    <span className="text-2xl font-black text-emerald-600">{formatCurrency(employee.Salaire_Brut || 0)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salaire de Base</span>
                                        <p className="text-base font-bold text-slate-900">{formatCurrency(employee.baseSalary || 0)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ancienneté</span>
                                        <p className="text-base font-bold text-slate-900">{formatCurrency(employee.primeAnciennete || 0)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ind. Logement</span>
                                        <p className="text-base font-bold text-slate-900">{formatCurrency(employee.indemniteLogement || 0)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ind. Transport</span>
                                        <p className="text-base font-bold text-slate-900">{formatCurrency(employee.indemniteTransportImposable || 0)}</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-3xl bg-slate-900 text-white flex justify-between items-center group overflow-hidden relative">
                                    <div className="absolute inset-0 bg-blue-500 w-0 group-hover:w-full transition-all duration-700 opacity-20" />
                                    <span className="text-sm font-black uppercase tracking-[0.2em] relative z-10">Net à Payer</span>
                                    <span className="text-3xl font-black text-blue-400 relative z-10">{formatCurrency(employee.Salaire_Net || 0)}</span>
                                </div>
                             </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                             <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-xl flex items-center gap-3">
                                    <CreditCard className="h-5 w-5 text-blue-500" /> Coordonnées Bancaires
                                </CardTitle>
                             </CardHeader>
                             <CardContent className="p-8 pt-4 space-y-8">
                                <div className="space-y-1 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Établissement</span>
                                    <p className="text-xl font-black text-slate-900 italic">{employee.banque || "Virement Bancaire"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">N° de Compte</span>
                                    <p className="text-lg font-mono font-bold text-slate-600 bg-white p-4 rounded-2xl border border-slate-100 shadow-inner">
                                        {employee.numeroCompte || "—"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                                    <p className="text-xs font-medium text-blue-600">Ces informations sont cryptées et restreintes au personnel RH habilité.</p>
                                </div>
                             </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* History Tab */}
                <TabsContent value="history" className="focus-visible:outline-none">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl flex items-center gap-3">
                                <History className="h-5 w-5 text-blue-500" /> Fil d'évenements Carrière
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4">
                            <div className="relative space-y-12 before:absolute before:left-6 before:top-2 before:h-[calc(100%-1rem)] before:w-1 before:bg-slate-100">
                                {/* Entry Point */}
                                <div className="relative flex gap-10">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl z-10">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-sm font-black uppercase text-slate-400 tracking-widest mb-1">{formatDate(employee.dateEmbauche)}</p>
                                        <h4 className="text-lg font-black text-slate-900">Intégration au Directoire</h4>
                                        <p className="text-sm text-slate-500 mt-2 font-medium">Nomination officielle au poste de <b>{employee.poste}</b> au sein du département <b>{deptName}</b>.</p>
                                    </div>
                                </div>

                                {/* Current State */}
                                <div className="relative flex gap-10">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-xl z-10 animate-pulse">
                                        <Briefcase className="h-6 w-6" />
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-sm font-black uppercase text-blue-400 tracking-widest mb-1">AUJOURD'HUI</p>
                                        <h4 className="text-lg font-black text-slate-900">Positionnement Actuel</h4>
                                        <p className="text-sm text-slate-500 mt-2 font-medium">L'employé est actuellement en statut <Badge className="bg-emerald-500">{employee.status}</Badge>.</p>
                                    </div>
                                </div>

                                {/* Future Item (Retirement) */}
                                {employee.Date_Depart && (
                                    <div className="relative flex gap-10 opacity-40">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-500 shadow-xl z-10">
                                            <Calendar className="h-6 w-6" />
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-sm font-black uppercase text-slate-400 tracking-widest mb-1">{formatDate(employee.Date_Depart)}</p>
                                            <h4 className="text-lg font-black text-slate-900 italic">Départ en Retraite (Prévisionnel)</h4>
                                            <p className="text-sm text-slate-500 mt-2 font-medium">Fin de fonction administrative prévue après 60 ans révolus.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onCloseAction={() => setIsDeleteDialogOpen(false)}
                onConfirmAction={handleDelete}
                title="Radier cet employé ?"
                description={`Cette action retirera définitivement ${employee.name} de la base de données active de la CNRCT. Cette opération est irréversible.`}
            />
        </div>
    );
}
