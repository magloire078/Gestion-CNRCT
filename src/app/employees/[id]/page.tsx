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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
    getEmployeeHistory, 
    deleteEmployeeHistoryEvent
} from "@/services/employee-history-service";
import { AddHistoryEventSheet } from "@/components/employees/add-history-event-sheet";
import { EmployeeHistoryTimeline } from "@/components/employees/employee-history-timeline";
import { type EmployeeEvent } from "@/lib/data";
import { EmployeeProfileReport } from "@/components/reports/employee-profile-report";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/lib/data";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseISO, lastDayOfMonth } from "date-fns";
import {
    PlusCircle,
    MapPin,
    Calendar,
    Award,
    Pencil,
    Trash2,
    Mail,
    Phone,
    Briefcase,
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
    Eye,
    EyeOff,
    AlertTriangle,
    Crown,
    Layers,
    Clock,
    Sparkles,
    Landmark,
    Shield
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
import { SecurityConfirmationDialog } from "@/components/common/security-confirmation-dialog";
import { isTraditionalAuthorityOrMember, calculateTenure, calculatePayrollTotals } from "@/lib/employee-utils";
import { cn } from "@/lib/utils";

export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { formatDate, formatCurrency } = useFormat();
    const { hasPermission, user } = useAuth();
    
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
    const [activeTab, setActiveTab] = useState("identity");
    const [showSalary, setShowSalary] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null);
    const [isPending, startTransition] = useTransition();

    // Promotion state
    const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
    const [inactiveEmployees, setInactiveEmployees] = useState<Employe[]>([]);
    const [promotionRemplaceId, setPromotionRemplaceId] = useState<string>("none");
    const [isPromoting, setIsPromoting] = useState(false);

    // Payslip Generation Dialog state
    const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
    const [generationMode, setGenerationMode] = useState<'monthly' | 'period'>('monthly');
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());
    const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [endYear, setEndYear] = useState<string>(new Date().getFullYear().toString());
    const [endMonth, setEndMonth] = useState<string>((new Date().getMonth() + 1).toString());

    const years = useMemo(() => Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString()), []);
    const months = useMemo(() => [
        { value: "1", label: "Janvier" }, { value: "2", label: "Février" },
        { value: "3", label: "Mars" }, { value: "4", label: "Avril" },
        { value: "5", label: "Mai" }, { value: "6", label: "Juin" },
        { value: "7", label: "Juillet" }, { value: "8", label: "Août" },
        { value: "9", label: "Septembre" }, { value: "10", label: "Octobre" },
        { value: "11", label: "Novembre" }, { value: "12", label: "Décembre" },
    ], []);

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
        getOrganizationSettings().then(setOrgSettings);
    }, [employeeId, router, toast]);

    const handleRefreshHistory = async () => {
        try {
            const history = await getEmployeeHistory(employeeId);
            setHistoryEvents(history);
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
                toast({ variant: "destructive", title: "Erreur", description: "Impossible d'annuler l'événement." });
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

    const handleNavigateToPayslip = () => {
        const selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const lastDay = lastDayOfMonth(selectedDate);
        const formattedDate = lastDay.toISOString().split('T')[0];

        setIsDateDialogOpen(false);
        
        setTimeout(() => {
            let url = `/payroll/${employeeId}?payslipDate=${formattedDate}`;
            if (generationMode === 'period') {
                const endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
                const lastDayEnd = lastDayOfMonth(endDate);
                url += `&endDate=${lastDayEnd.toISOString().split('T')[0]}`;
            }
            router.push(url);
        }, 100);
    };

    const deptName = units?.departments.find(d => d.id === employee?.departmentId)?.name;
    const directionName = units?.directions.find(d => d.id === employee?.directionId)?.name;
    const serviceName = units?.services.find(s => s.id === employee?.serviceId)?.name;
    const isGarde = deptName === "Garde Républicaine";

    // Traditional Authority detection
    const isTraditional = useMemo(() => {
        return isTraditionalAuthorityOrMember(employee, deptName);
    }, [employee, deptName]);

    // Tenure calculation
    const tenure = useMemo(() => {
        return calculateTenure(employee?.dateEmbauche);
    }, [employee?.dateEmbauche]);

    // Military rotation calculation
    const rotationStatus = useMemo(() => {
        if (!isGarde || !employee?.Date_Depart) return null;
        try {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const departDate = parseISO(employee.Date_Depart);
            if (isNaN(departDate.getTime())) return null;
            departDate.setHours(0, 0, 0, 0);
            
            const diffTime = departDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                return {
                    status: 'expired',
                    label: 'Rotation échue',
                    description: `La période de détachement de 6 mois de ce militaire a expiré le ${formatDate(employee.Date_Depart)}. Une rotation/relève est requise.`,
                };
            } else if (diffDays <= 30) {
                return {
                    status: 'warning',
                    label: 'Rotation proche',
                    description: `La période de détachement de ce militaire se termine dans ${diffDays} jour(s) (le ${formatDate(employee.Date_Depart)}). Veuillez planifier sa relève.`,
                };
            }
            return {
                status: 'ok',
                label: 'Détachement actif',
                description: `Détachement militaire en cours. Rotation prévue le ${formatDate(employee.Date_Depart)}.`,
            };
        } catch {
            return null;
        }
    }, [isGarde, employee?.Date_Depart, formatDate]);

    if (loading) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto py-6 animate-pulse">
                <div className="h-44 bg-slate-100 rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="h-24 bg-slate-50 rounded-2xl" />
                    <div className="h-24 bg-slate-50 rounded-2xl" />
                    <div className="h-24 bg-slate-50 rounded-2xl" />
                    <div className="h-24 bg-slate-50 rounded-2xl" />
                </div>
                <div className="h-96 bg-slate-50 rounded-2xl" />
            </div>
        );
    }

    if (!employee) return null;

    const canEdit = hasPermission('employees:update') || hasPermission('page:employees:edit');
    const canDelete = hasPermission('employees:delete') || hasPermission('page:employees:delete');
    const canManagePayroll = hasPermission('payroll:read') || hasPermission('page:payroll:update') || hasPermission('payroll:update') || hasPermission('page:payroll:create');
    const isSelf = user?.employeeId === employee.id || user?.email === employee.email;
    const canViewSalary = canManagePayroll || isSelf;

    // Payroll Totals
    const payroll = calculatePayrollTotals(employee);
    const isActive = employee.status === "Actif";
    const isRegionalMember = employee.poste?.toLowerCase().includes("comité régional") || employee.poste?.toLowerCase().includes("comite regional");

    const handleOpenPromotion = async () => {
        setIsPromotionDialogOpen(true);
        if (inactiveEmployees.length === 0) {
            try {
                const { getEmployeeDirectory } = await import("@/services/employee-service");
                const employees = await getEmployeeDirectory();
                setInactiveEmployees(employees.filter(e => e.status === 'Décédé' || e.status === 'Remplacé' || e.status === 'Licencié'));
            } catch(e) {
                console.error(e);
            }
        }
    };

    const handlePromote = async () => {
        if (!employee) return;
        setIsPromoting(true);
        try {
            const { updateEmployee } = await import("@/services/employee-service");
            const replacedEmp = inactiveEmployees.find(e => e.id === promotionRemplaceId);
            
            await updateEmployee(employee.id, {
                poste: 'Membre du Directoire',
                departmentId: '9ywKFDgVMS86rZLPYhpm',
                remplaceId: promotionRemplaceId !== "none" ? promotionRemplaceId : undefined,
                remplaceNom: replacedEmp ? `${replacedEmp.lastName || ''} ${replacedEmp.firstName || ''}`.trim() : undefined
            });
            
            toast({ title: "Promotion effectuée", description: "Le membre a été promu au Directoire." });
            setIsPromotionDialogOpen(false);
            
            const emp = await getEmployee(employee.id);
            if (emp) setEmployee(emp);
        } catch(e) {
            toast({ variant: "destructive", title: "Erreur", description: "Échec de la promotion." });
        } finally {
            setIsPromoting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <Button 
                    variant="ghost" 
                    onClick={() => router.back()} 
                    className="h-9 px-3 gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Retour au répertoire
                </Button>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Fiche n°</span>
                    <Badge variant="outline" className="font-mono font-bold text-xs bg-white text-slate-700">
                        {employee.matricule}
                    </Badge>
                </div>
            </div>

            {/* --- HERO HEADER CARD --- */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white p-6 md:p-8 shadow-xl border border-slate-800">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Avatar with Status Ring */}
                    <div className="relative shrink-0">
                        <Avatar className="h-32 w-32 md:h-36 md:w-36 rounded-2xl border-4 border-white/10 shadow-2xl object-cover">
                            <AvatarImage src={employee.photoUrl} alt={employee.name} className="object-cover" />
                            <AvatarFallback className="text-4xl font-black bg-slate-800 text-slate-400">
                                {employee.lastName?.charAt(0) || "E"}
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-lg",
                            isActive ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        )}>
                            {isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        </div>
                    </div>

                    {/* Identity & Main Info */}
                    <div className="flex-1 text-center md:text-left space-y-3">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                                {employee.matricule}
                            </span>
                            <Badge variant="outline" className={cn(
                                "border-none text-[10px] font-black uppercase tracking-wider px-2 py-0.5",
                                isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                            )}>
                                {employee.status}
                            </Badge>
                            {isTraditional && (
                                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                                    <Crown className="h-3 w-3 mr-1 text-amber-400" /> Autorité Traditionnelle
                                </Badge>
                            )}
                        </div>

                        <div>
                            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                                {employee.civilite && <span className="text-slate-400 font-normal mr-2 text-xl md:text-2xl">{employee.civilite}</span>}
                                {employee.lastName} <span className="text-slate-300 font-bold normal-case">{employee.firstName}</span>
                            </h1>
                            <p className="text-sm md:text-base font-bold text-blue-400 uppercase tracking-wide mt-1 flex items-center justify-center md:justify-start gap-2">
                                <Briefcase className="h-4 w-4 shrink-0" />
                                {employee.poste || "Poste non défini"}
                                {employee.grade && <span className="text-slate-400 font-normal text-xs">• {employee.grade}</span>}
                            </p>
                        </div>

                        {/* Quick tags */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                            <div className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4 text-slate-400" />
                                <span className="font-semibold">{deptName || "Siège Central"}</span>
                            </div>
                            {isTraditional && employee.Region && (
                                <div className="flex items-center gap-1.5 text-amber-300">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-semibold">{employee.Region} {employee.Departement ? `(${employee.Departement})` : ''}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-emerald-400" />
                                <span className="font-semibold">{tenure.label}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto justify-center">
                        {canEdit && (
                            <Button asChild className="bg-white hover:bg-slate-100 text-slate-900 rounded-xl h-10 px-4 font-bold text-xs uppercase tracking-wider shadow-md">
                                <Link href={`/employees/${employee.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4 text-blue-600" /> Modifier la fiche
                                </Link>
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsPrinting(true)}
                                className="h-10 flex-1 md:flex-initial rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 font-bold text-xs uppercase tracking-wider"
                                title="Imprimer la fiche profil"
                            >
                                <Download className="h-4 w-4 mr-1.5" /> Fiche
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-10 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 px-3">
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1 bg-slate-900 text-white border-slate-800 shadow-2xl">
                                    <DropdownMenuLabel className="text-[10px] font-black p-2 uppercase tracking-widest text-slate-400">Actions RH</DropdownMenuLabel>
                                    {canEdit && (
                                        <DropdownMenuItem 
                                            onClick={() => {
                                                setEventToEdit(null);
                                                setIsHistorySheetOpen(true);
                                            }}
                                            className="p-2.5 rounded-xl gap-2.5 cursor-pointer text-xs font-bold"
                                        >
                                            <History className="h-4 w-4 text-blue-400" /> Nouvel événement carrière
                                        </DropdownMenuItem>
                                    )}
                                    {canViewSalary && (
                                        <DropdownMenuItem onClick={() => setIsDateDialogOpen(true)} className="p-2.5 rounded-xl gap-2.5 cursor-pointer text-xs font-bold">
                                            <Banknote className="h-4 w-4 text-emerald-400" /> Générer Bulletin de Paie
                                        </DropdownMenuItem>
                                    )}
                                    {isRegionalMember && canEdit && (
                                        <DropdownMenuItem onClick={handleOpenPromotion} className="p-2.5 rounded-xl gap-2.5 cursor-pointer text-xs font-bold text-amber-400">
                                            <Award className="h-4 w-4" /> Promouvoir au Directoire
                                        </DropdownMenuItem>
                                    )}
                                    {canDelete && (
                                        <>
                                            <DropdownMenuSeparator className="bg-white/10"/>
                                            <DropdownMenuItem 
                                                onClick={() => setIsDeleteDialogOpen(true)} 
                                                className="p-2.5 rounded-xl gap-2.5 cursor-pointer text-rose-400 focus:bg-rose-500/20 text-xs font-bold"
                                            >
                                                <Trash2 className="h-4 w-4" /> Radier / Supprimer l'agent
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            {/* Military Rotation Alert Banner */}
            {rotationStatus && (
                <div className={cn(
                    "p-4 rounded-2xl border flex items-start gap-3 shadow-sm",
                    rotationStatus.status === 'expired' && "bg-rose-50 border-rose-200 text-rose-800",
                    rotationStatus.status === 'warning' && "bg-amber-50 border-amber-200 text-amber-800",
                    rotationStatus.status === 'ok' && "bg-blue-50 border-blue-200 text-blue-800"
                )}>
                    {rotationStatus.status === 'expired' && <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />}
                    {rotationStatus.status === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />}
                    {rotationStatus.status === 'ok' && <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                        <h4 className="text-xs font-black uppercase tracking-wider mb-0.5">
                            {rotationStatus.label} (Garde Républicaine)
                        </h4>
                        <p className="text-xs font-medium leading-relaxed">
                            {rotationStatus.description}
                        </p>
                    </div>
                </div>
            )}

            {/* Quick KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Affectation</p>
                        <p className="text-sm font-bold text-slate-800 truncate" title={deptName || "Siège"}>
                            {deptName || "Siège Central"}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{directionName || serviceName || "Services généraux"}</p>
                    </div>
                </Card>

                <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ancienneté</p>
                        <p className="text-sm font-bold text-slate-800">{tenure.label}</p>
                        <p className="text-[11px] text-slate-500">Depuis le {formatDate(employee.dateEmbauche)}</p>
                    </div>
                </Card>

                <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Couverture CNPS</p>
                        <p className="text-sm font-bold text-slate-800">{employee.CNPS ? "Immatriculé" : "Non affilié"}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{employee.cnpsEmploye || (employee.CNPS ? "En règle" : "Sans N°")}</p>
                    </div>
                </Card>

                {isTraditional ? (
                    <Card className="border border-amber-200 bg-amber-50/50 rounded-2xl shadow-sm p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Crown className="h-6 w-6" />
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Territoire Coutumier</p>
                            <p className="text-sm font-bold text-amber-950 truncate">{employee.Region || "Région non spécifiée"}</p>
                            <p className="text-[11px] text-amber-800 truncate">{employee.Departement || employee.Village || "Localité"}</p>
                        </div>
                    </Card>
                ) : (
                    <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <UserCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Catégorie</p>
                            <p className="text-sm font-bold text-slate-800">{employee.categorie || "Agent Général"}</p>
                            <p className="text-[11px] text-slate-500">{employee.grade || "Standard"}</p>
                        </div>
                    </Card>
                )}
            </div>

            {/* --- MAIN TABBED CONTENT --- */}
            <Tabs 
                defaultValue="identity" 
                value={activeTab}
                onValueChange={(v) => startTransition(() => setActiveTab(v))}
                className="space-y-6"
            >
                <TabsList className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex flex-wrap h-auto gap-1">
                    <TabsTrigger 
                        value="identity" 
                        className="rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                    >
                        <UserCircle2 className="mr-2 h-4 w-4 text-blue-600" /> Identité & État Civil
                    </TabsTrigger>
                    
                    <TabsTrigger 
                        value="career" 
                        className="rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                    >
                        <Briefcase className="mr-2 h-4 w-4 text-amber-600" /> Carrière & Affectation
                    </TabsTrigger>

                    {/* Conditionnel : Chefferie & Territoire */}
                    {isTraditional && (
                        <TabsTrigger 
                            value="chefferie" 
                            className="rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm bg-amber-50 text-amber-900"
                        >
                            <Crown className="mr-2 h-4 w-4" /> Chefferie & Territoire
                        </TabsTrigger>
                    )}

                    {canViewSalary && (
                        <TabsTrigger 
                            value="salary" 
                            className="rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                        >
                            <Wallet className="mr-2 h-4 w-4 text-emerald-600" /> Rémunération
                        </TabsTrigger>
                    )}

                    <TabsTrigger 
                        value="social" 
                        className="rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                    >
                        <ShieldCheck className="mr-2 h-4 w-4 text-indigo-600" /> Social & CNPS
                    </TabsTrigger>

                    <TabsTrigger 
                        value="history" 
                        className="rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                    >
                        <History className="mr-2 h-4 w-4 text-slate-600" /> Historique ({historyEvents.length})
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: IDENTITÉ & ÉTAT CIVIL */}
                <TabsContent value="identity" className="grid grid-cols-1 lg:grid-cols-3 gap-6 focus-visible:outline-none">
                    <Card className="lg:col-span-2 border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                <UserCircle2 className="h-5 w-5 text-blue-600" />
                                Données d'État Civil & Coordonnées
                            </CardTitle>
                            {canEdit && (
                                <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-600">
                                    <Link href={`/employees/${employee.id}/edit`}>
                                        <Pencil className="h-3.5 w-3.5 mr-1" /> Modifier
                                    </Link>
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nom Complet</span>
                                    <p className="text-base font-bold text-slate-900">
                                        {employee.civilite && <span className="text-slate-500 font-normal mr-1">{employee.civilite}</span>}
                                        {employee.lastName} {employee.firstName}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sexe / Genre</span>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {employee.sexe === 'H' || employee.sexe === 'Homme' ? 'Homme (H)' : employee.sexe === 'F' || employee.sexe === 'Femme' ? 'Femme (F)' : (employee.sexe || "Non renseigné")}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date de Naissance</span>
                                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        {formatDate(employee.Date_Naissance)}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Lieu de Naissance</span>
                                    <p className="text-sm font-semibold text-slate-800">{employee.Lieu_Naissance || "Non renseigné"}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Téléphone Mobile</span>
                                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-emerald-600" />
                                        {employee.mobile ? (
                                            <a href={`tel:${employee.mobile}`} className="hover:underline text-blue-600">
                                                {employee.mobile}
                                            </a>
                                        ) : "Non renseigné"}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Adresse Email</span>
                                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-blue-600" />
                                        {employee.email ? (
                                            <a href={`mailto:${employee.email}`} className="hover:underline text-blue-600 italic">
                                                {employee.email}
                                            </a>
                                        ) : "Non renseignée"}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Situation Matrimoniale</span>
                                    <p className="text-sm font-semibold text-slate-800">{employee.situationMatrimoniale || "Célibataire"}</p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Enfants à Charge</span>
                                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <Users2 className="h-4 w-4 text-slate-400" />
                                        {employee.enfants ?? 0} enfant(s)
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Side card: Qualifications & Summary */}
                    <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden self-start">
                        <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                <Award className="h-5 w-5 text-amber-500" />
                                Qualification & Profil
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hiérarchie / Rang</span>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <p className="text-sm font-black text-slate-900 uppercase">
                                        {employee.categorie || "Agent Général"}
                                    </p>
                                    {employee.grade && (
                                        <p className="text-xs font-bold text-blue-600 mt-0.5">{employee.grade}</p>
                                    )}
                                </div>
                            </div>

                            {Array.isArray(employee.skills) && employee.skills.length > 0 && (
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Expertises Clés</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {employee.skills.map((skill, i) => (
                                            <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 text-[11px] font-semibold">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
                                <p className="font-semibold">Dossier individuel vérifié.</p>
                                <p className="text-[11px] text-blue-700 mt-0.5">Toutes les pièces administratives sont archivées au service des Ressources Humaines.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: CARRIÈRE & AFFECTATION */}
                <TabsContent value="career" className="grid grid-cols-1 md:grid-cols-3 gap-6 focus-visible:outline-none">
                    <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                Rattachement Administratif
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Département</span>
                                <p className="text-sm font-bold text-slate-900">{deptName || "Non assigné"}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Direction</span>
                                <p className="text-sm font-bold text-slate-800">{directionName || "Non spécifiée"}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Service / Unité</span>
                                <p className="text-sm font-bold text-slate-800">{serviceName || "Non spécifié"}</p>
                            </div>
                            {employee.remplaceNom && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block mb-0.5">En remplacement de</span>
                                    <p className="text-xs font-bold text-amber-900">{employee.remplaceNom}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-emerald-600" />
                                Temporalité & Dates Clés
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date d'engagement</span>
                                <p className="text-sm font-bold text-slate-900">{formatDate(employee.dateEmbauche)}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest block mb-0.5">Ancienneté de Service</span>
                                <p className="text-lg font-black text-emerald-800">{tenure.label}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date de Départ / Relève</span>
                                <p className="text-sm font-bold text-rose-600">{formatDate(employee.Date_Depart) || "Indéterminée (CDI / Mandat)"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-purple-600" />
                                Actes & Références
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Décision de Nomination</span>
                                <p className="text-sm font-mono font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                    {employee.Num_Decision || "DEC-CNRCT-OFFICIEL"}
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Statut Contractuel</span>
                                <Badge className="bg-slate-900 text-white font-bold text-xs uppercase px-2.5 py-1">
                                    {employee.status}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: CHEFFERIE & TERRITOIRE (CONDITIONNEL) */}
                {isTraditional && (
                    <TabsContent value="chefferie" className="space-y-6 focus-visible:outline-none">
                        <Card className="border border-amber-200 bg-white rounded-2xl shadow-sm overflow-hidden">
                            <CardHeader className="p-5 pb-3 border-b border-amber-100 bg-amber-50/50 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-black uppercase tracking-tight text-amber-900 flex items-center gap-2">
                                        <Crown className="h-5 w-5 text-amber-600" />
                                        Ancrage Coutumier & Mandats Territoriaux
                                    </CardTitle>
                                    <CardDescription className="text-xs text-amber-700">
                                        Attributions coutumières au sein de la Chambre Nationale des Rois et Chefs Traditionnels.
                                    </CardDescription>
                                </div>
                                {employee.chiefId && (
                                    <Button asChild variant="outline" size="sm" className="h-8 text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-100">
                                        <Link href={`/chiefs/${employee.chiefId}`}>
                                            Voir la Fiche Chef
                                        </Link>
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-5 space-y-6">
                                {/* Geographic coordinates */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Région</span>
                                        <p className="text-base font-black text-slate-900">{employee.Region || "Non assignée"}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Département</span>
                                        <p className="text-base font-black text-slate-900">{employee.Departement || "Non spécifié"}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sous-Préfecture</span>
                                        <p className="text-base font-black text-slate-900">{employee.subPrefecture || "Non spécifiée"}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Village / Localité</span>
                                        <p className="text-base font-black text-slate-900">{employee.Village || employee.village || "Non spécifié"}</p>
                                    </div>
                                </div>

                                {/* Customary Titles / Chief Statuses */}
                                <div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                        Titres Coutumiers & Casquettes de Chef
                                    </span>
                                    {Array.isArray(employee.statutChef) && employee.statutChef.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {employee.statutChef.map((st, i) => (
                                                <Badge key={i} className="bg-amber-500 text-white font-black text-xs uppercase px-3 py-1.5 shadow-sm">
                                                    <Crown className="h-3.5 w-3.5 mr-1.5" />
                                                    {st}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-500 italic">Aucun titre coutumier spécifique enregistré.</p>
                                    )}
                                </div>

                                {/* Mandates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date Début Mandat</span>
                                        <p className="text-sm font-bold text-slate-800">{formatDate(employee.mandatDebut) || "Mandat permanent / En cours"}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date Fin Mandat</span>
                                        <p className="text-sm font-bold text-slate-800">{formatDate(employee.mandatFin) || "Non définie"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* TAB 4: RÉMUNÉRATION (ACCESSIBLE AUX AYANTS DROIT OU SELF) */}
                {canViewSalary && (
                    <TabsContent value="salary" className="grid grid-cols-1 lg:grid-cols-3 gap-6 focus-visible:outline-none">
                        {/* Salary Architecture */}
                        <Card className="lg:col-span-2 border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
                            <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-emerald-600" />
                                    Architecture Salariale & Indemnités
                                </CardTitle>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                    onClick={() => setShowSalary(!showSalary)}
                                >
                                    {showSalary ? (
                                        <><EyeOff className="h-3.5 w-3.5 mr-1" /> Masquer</>
                                    ) : (
                                        <><Eye className="h-3.5 w-3.5 mr-1" /> Révéler</>
                                    )}
                                </Button>
                            </CardHeader>
                            <CardContent className="p-5 space-y-6">
                                {/* Highlights : Brut & Net */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-sm space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salaire Brut Total</span>
                                        <p className="text-2xl font-black text-white">
                                            {showSalary ? formatCurrency(payroll.brut) : "•••••••• FCFA"}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-emerald-700 text-white shadow-sm space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Net Estimé à Payer</span>
                                        <p className="text-2xl font-black text-white">
                                            {showSalary ? formatCurrency(payroll.net) : "•••••••• FCFA"}
                                        </p>
                                    </div>
                                </div>

                                {/* Detailed breakdown */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Salaire de Base</span>
                                        <p className="text-base font-bold text-slate-900">
                                            {showSalary ? formatCurrency(employee.baseSalary || 0) : "••••••••"}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Prime d'Ancienneté</span>
                                        <p className="text-base font-bold text-slate-900">
                                            {showSalary ? formatCurrency(employee.primeAnciennete || 0) : "••••••••"}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Indemnité Logement</span>
                                        <p className="text-base font-bold text-slate-900">
                                            {showSalary ? formatCurrency(employee.indemniteLogement || 0) : "••••••••"}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Indemnité Transport Imposable</span>
                                        <p className="text-base font-bold text-slate-900">
                                            {showSalary ? formatCurrency(employee.indemniteTransportImposable || 0) : "••••••••"}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Indemnité Responsabilité</span>
                                        <p className="text-base font-bold text-slate-900">
                                            {showSalary ? formatCurrency(employee.indemniteResponsabilite || 0) : "••••••••"}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Indemnité Sujétion</span>
                                        <p className="text-base font-bold text-slate-900">
                                            {showSalary ? formatCurrency(employee.indemniteSujetion || 0) : "••••••••"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bank Details */}
                        <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden self-start">
                            <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                    Coordonnées Bancaires
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Banque / Trésor</span>
                                    <p className="text-base font-black text-slate-900 uppercase">
                                        {employee.banque || "Trésor Public de Côte d'Ivoire"}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Numéro de Compte (RIP)</span>
                                    <p className="text-sm font-mono font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                        {showSalary ? (employee.numeroCompte || "— — — — —") : "•••• •••• •••• ••••"}
                                    </p>
                                </div>

                                {(employee.CB || employee.CG || employee.Cle_RIB) && (
                                    <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                            <span className="text-[9px] font-bold text-slate-400 block">Code Banque</span>
                                            <span className="font-mono text-xs font-bold">{showSalary ? (employee.CB || "—") : "•••"}</span>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                            <span className="text-[9px] font-bold text-slate-400 block">Code Guichet</span>
                                            <span className="font-mono text-xs font-bold">{showSalary ? (employee.CG || "—") : "•••"}</span>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                            <span className="text-[9px] font-bold text-slate-400 block">Clé RIB</span>
                                            <span className="font-mono text-xs font-bold">{showSalary ? (employee.Cle_RIB || "—") : "••"}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                                    <p className="text-[11px] font-semibold text-blue-900">Données bancaires chiffrées & protégées.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* TAB 5: SOCIAL & CNPS */}
                <TabsContent value="social" className="grid grid-cols-1 md:grid-cols-2 gap-6 focus-visible:outline-none">
                    <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                Immatriculation & Sécurité Sociale
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-700">Statut CNPS</span>
                                <Badge className={cn(
                                    "font-black text-xs uppercase px-2.5 py-1",
                                    employee.CNPS ? "bg-emerald-600 text-white" : "bg-slate-500 text-white"
                                )}>
                                    {employee.CNPS ? "Immatriculé" : "Non immatriculé"}
                                </Badge>
                            </div>

                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">N° CNPS Salarié</span>
                                <p className="text-sm font-mono font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                    {employee.cnpsEmploye || "CNPS-RECO-INDIV"}
                                </p>
                            </div>

                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date d'Immatriculation</span>
                                <p className="text-sm font-bold text-slate-800">{formatDate(employee.Date_Immatriculation) || "Non renseignée"}</p>
                            </div>

                            {employee.Date_Cessation_CNPS && (
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date de Cessation</span>
                                    <p className="text-sm font-bold text-rose-600">{formatDate(employee.Date_Cessation_CNPS)}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                Droits & Congés Payés
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
                                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest block">Solde de Congés Restants</span>
                                <p className="text-3xl font-black text-blue-900">
                                    {employee.solde_conges ?? 30} <span className="text-sm font-bold text-blue-700">Jours</span>
                                </p>
                            </div>

                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Dernier Congé Enregistré</span>
                                <p className="text-sm font-semibold text-slate-700">{formatDate(employee.dateConge) || "Aucun congé récent"}</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 6: HISTORIQUE RH */}
                <TabsContent value="history" className="focus-visible:outline-none">
                    <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                    <History className="h-5 w-5 text-slate-700" />
                                    Chronologie & Évolution de Carrière
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Historique des promotions, augmentations, mutations et décisions administratives.
                                </CardDescription>
                            </div>
                            {canEdit && (
                                <Button 
                                    onClick={() => {
                                        startTransition(() => {
                                            setEventToEdit(null);
                                            setIsHistorySheetOpen(true);
                                        });
                                    }}
                                    className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider"
                                >
                                    <PlusCircle className="mr-1.5 h-4 w-4 text-emerald-400" /> Ajouter un événement
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-5">
                            <EmployeeHistoryTimeline 
                                events={historyEvents}
                                onEdit={(event) => {
                                    setEventToEdit(event);
                                    setIsHistorySheetOpen(true);
                                }}
                                onDelete={handleDeleteEvent}
                                canEdit={canEdit}
                                canDelete={canDelete}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Sheets & Dialogs */}
            <AddHistoryEventSheet 
                isOpen={isHistorySheetOpen}
                onCloseAction={() => setIsHistorySheetOpen(false)}
                employeeId={employeeId}
                eventToEdit={eventToEdit}
                onEventSavedAction={() => handleRefreshHistory()}
            />

            <SecurityConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onCloseAction={() => setIsDeleteDialogOpen(false)}
                onConfirmAction={async () => { await handleDelete(); }}
                title="Radier cet employé ?"
                description={`Cette action retirera définitivement ${employee.name} de la base de données active de la CNRCT. Cette opération est irréversible.`}
            />

            <ConfirmationDialog
                isOpen={isEventDeleteDialogOpen}
                onCloseAction={() => setIsEventDeleteDialogOpen(false)}
                onConfirmAction={handleConfirmDeleteEvent}
                title="Annuler cet événement ?"
                description="Cette action va retirer cet événement de l'historique et recalculer automatiquement la chaîne salariale pour maintenir la cohérence des données."
                confirmText={isPending ? "Annulation..." : "Confirmer l'annulation"}
            />

            {/* Print Profile Portal */}
            {employee && (
                <EmployeeProfileReport 
                    employee={employee}
                    history={historyEvents}
                    organizationSettings={orgSettings}
                    isPrinting={isPrinting}
                    onAfterPrint={() => setIsPrinting(false)}
                    showSalary={canViewSalary}
                    departmentName={deptName}
                    directionName={directionName}
                />
            )}
            
            {/* Promotion Dialog */}
            <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
                <DialogContent className="rounded-2xl border-slate-200 bg-white shadow-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-900">Promouvoir au Directoire</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Cette action nommera automatiquement le membre au sein du Directoire central.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-600">En remplacement de</Label>
                            <Select value={promotionRemplaceId} onValueChange={setPromotionRemplaceId}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                                    <SelectValue placeholder="Personne (Nouvelle nomination)" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="none" className="font-bold text-xs text-slate-400">Personne (Nouvelle nomination)</SelectItem>
                                    {inactiveEmployees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id} className="font-bold text-xs">
                                            {`${emp.lastName || ''} ${emp.firstName || ''} - ${emp.poste || 'Sans poste'} (${emp.status})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2 sm:justify-between">
                        <Button variant="outline" onClick={() => setIsPromotionDialogOpen(false)} disabled={isPromoting} className="rounded-xl h-10 font-bold text-xs uppercase tracking-wider">
                            Annuler
                        </Button>
                        <Button onClick={handlePromote} disabled={isPromoting} className="rounded-xl h-10 font-bold text-xs uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white">
                            {isPromoting ? "En cours..." : "Confirmer la promotion"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payslip Generation Dialog */}
            <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border-slate-200 shadow-xl rounded-2xl">
                    <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-800">Période du Bulletin de Paie</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-1">
                            Sélectionnez le mois et l'année pour générer le bulletin de paie de <span className="font-bold text-slate-700">{employee.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 px-6 py-5">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">Mode de génération</Label>
                            <Select value={generationMode} onValueChange={(v: any) => setGenerationMode(v)}>
                                <SelectTrigger className="h-10 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="monthly">Bulletin Unique (Mensuel)</SelectItem>
                                    <SelectItem value="period">Période Personnalisée</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="year" className="text-xs font-bold text-slate-700">Année</Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger id="year" className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent className="max-h-[200px] rounded-xl">
                                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="month" className="text-xs font-bold text-slate-700">{generationMode === 'monthly' ? 'Mois' : 'Mois de début'}</Label>
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger id="month" className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent className="max-h-[200px] rounded-xl">
                                        {months.map(m => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {generationMode === 'period' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="endYear" className="text-xs font-bold text-slate-700">Année de fin</Label>
                                    <Select value={endYear} onValueChange={setEndYear}>
                                        <SelectTrigger id="endYear" className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent className="max-h-[200px] rounded-xl">
                                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endMonth" className="text-xs font-bold text-slate-700">Mois de fin</Label>
                                    <Select value={endMonth} onValueChange={setEndMonth}>
                                        <SelectTrigger id="endMonth" className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent className="max-h-[200px] rounded-xl">
                                            {months.map(m => {
                                                const isBeforeStart = parseInt(endYear) < parseInt(year) || (parseInt(endYear) === parseInt(year) && parseInt(m.value) < parseInt(month));
                                                return (
                                                    <SelectItem key={m.value} value={m.value} disabled={isBeforeStart}>
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
                    <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2 sm:justify-between">
                        <Button variant="outline" className="rounded-xl h-10 font-bold text-xs" onClick={() => setIsDateDialogOpen(false)}>Annuler</Button>
                        <Button className="rounded-xl h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm" onClick={handleNavigateToPayslip}>
                            Générer le Bulletin
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
