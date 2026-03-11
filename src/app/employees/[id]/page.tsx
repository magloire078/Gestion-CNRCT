"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ChevronLeft, MapPin, Phone, Mail, 
    Calendar, Shield, User, FileText, 
    Pencil, ArrowRight, Printer,
    CreditCard, Briefcase, GraduationCap,
    Building2, Heart, ShieldCheck, AlertCircle,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEmployee, getOrganizationalUnits } from "@/services/employee-service";
import type { Employe, Department, Direction, Service } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function EmployeeProfilePage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { hasPermission } = useAuth();
    
    const [employee, setEmployee] = useState<Employe | null>(null);
    const [loading, setLoading] = useState(true);
    const [orgUnits, setOrgUnits] = useState<{ departments: Department[], directions: Direction[], services: Service[] } | null>(null);

    const canEdit = hasPermission('page:employees:edit');
    const canViewFinance = hasPermission('feature:payroll:view');

    useEffect(() => {
        async function fetchData() {
            try {
                const [empData, units] = await Promise.all([
                    getEmployee(id),
                    getOrganizationalUnits()
                ]);
                setEmployee(empData);
                setOrgUnits(units);
            } catch (err) {
                console.error("Error fetching employee details:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const employeeOrgUnit = useMemo(() => {
        if (!employee || !orgUnits) return 'Non spécifié';
        const service = orgUnits.services.find(s => s.id === employee.serviceId);
        if (service) return service.name;
        const direction = orgUnits.directions.find(d => d.id === employee.directionId);
        if (direction) return direction.name;
        const department = orgUnits.departments.find(d => d.id === employee.departmentId);
        if (department) return department.name;
        return 'Non spécifié';
    }, [employee, orgUnits]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "N/A";
        try {
            return format(parseISO(dateStr), "dd MMMM yyyy", { locale: fr });
        } catch (e) {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8 space-y-8 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded mb-4" />
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <Skeleton className="h-48 w-48 rounded-2xl" />
                    <div className="space-y-4 flex-1">
                        <Skeleton className="h-10 w-2/3" />
                        <Skeleton className="h-6 w-1/3" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 col-span-2" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="container mx-auto py-20 text-center space-y-4">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
                <h2 className="text-2xl font-bold">Employé non trouvé</h2>
                <p className="text-muted-foreground">Le profil que vous recherchez n'existe pas ou a été supprimé.</p>
                <Button variant="outline" onClick={() => router.push("/employees")}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Retour à la liste
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 pb-20 space-y-8">
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-slate-100">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Retour
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <Printer className="mr-2 h-4 w-4" /> Fiche Signalétique
                    </Button>
                    {canEdit && (
                        <Button size="sm" asChild className="bg-slate-900 border-none">
                            <Link href={`/employees/${id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" /> Modifier
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Header Profil Premium */}
            <div className="relative overflow-hidden rounded-3xl bg-white border shadow-sm p-6 md:p-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left relative z-10">
                    <div className="relative group">
                        <Avatar className="h-48 w-48 rounded-2xl border-4 border-white shadow-2xl transition-transform group-hover:scale-[1.02]">
                            <AvatarImage src={employee.photoUrl} alt={employee.name} className="object-cover" />
                            <AvatarFallback className="text-4xl font-bold bg-slate-100">{employee.lastName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Badge className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 border-2 border-white shadow-lg ${
                            employee.status === 'Actif' ? 'bg-emerald-600 text-white' : 'bg-slate-500 text-white'
                        }`}>
                            {employee.status}
                        </Badge>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                {employee.name}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-slate-500 font-medium pt-2">
                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    <Briefcase className="h-4 w-4 text-primary" /> {employee.poste}
                                </span>
                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    <Building2 className="h-4 w-4 text-blue-500" /> {employeeOrgUnit}
                                </span>
                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> {employee.matricule}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-semibold uppercase tracking-wider">
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] text-slate-400">Date d'embauche</span>
                                <span className="text-slate-800">{formatDate(employee.dateEmbauche)}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-100 hidden sm:block" />
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] text-slate-400">Ancienneté</span>
                                <span className="text-slate-800">{employee.anciennete || "Calculée lors de la paie"}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-100 hidden sm:block" />
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] text-slate-400">Origine</span>
                                <span className="text-slate-800">{employee.Village || employee.Lieu_Naissance || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonne Gauche - Détails */}
                <div className="lg:col-span-2 space-y-8">
                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 bg-slate-100/50 p-1 rounded-xl">
                            <TabsTrigger value="info" className="rounded-lg font-bold text-xs uppercase tracking-widest">Identité</TabsTrigger>
                            <TabsTrigger value="pro" className="rounded-lg font-bold text-xs uppercase tracking-widest">Carrière</TabsTrigger>
                            <TabsTrigger value="finance" className="rounded-lg font-bold text-xs uppercase tracking-widest">Finances</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-lg font-bold text-xs uppercase tracking-widest">Compétences</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="info" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Card className="border-none shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="border-b bg-slate-50/50">
                                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">État Civil</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-sm text-slate-500 font-medium">Sexe</span>
                                            <span className="text-sm font-bold text-slate-800">{employee.sexe || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-sm text-slate-500 font-medium">Né(e) le</span>
                                            <span className="text-sm font-bold text-slate-800">{formatDate(employee.Date_Naissance)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-sm text-slate-500 font-medium">Lieu</span>
                                            <span className="text-sm font-bold text-slate-800">{employee.Lieu_Naissance || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-sm text-slate-500 font-medium">Famille</span>
                                            <span className="text-sm font-bold text-slate-800">{employee.enfants || 0} enfant(s)</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="border-b bg-slate-50/50">
                                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Coordonnées</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-colors">
                                            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Téléphone</p>
                                                <p className="text-sm font-bold text-slate-800">{employee.mobile || "Non renseigné"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-colors">
                                            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                                                <p className="text-sm font-bold text-slate-800 truncate">{employee.email || "Non renseigné"}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="pro" className="space-y-6">
                             <Card className="border-none shadow-sm bg-white overflow-hidden">
                                <CardHeader className="border-b bg-slate-50/50">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Parcours Professionnel</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                                    <Briefcase className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase">Poste Actuel</p>
                                                    <p className="text-sm font-bold text-slate-800">{employee.poste}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase">Unité de Travail</p>
                                                    <p className="text-sm font-bold text-slate-800">{employeeOrgUnit}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                                    <Calendar className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase">Date d'Entrée</p>
                                                    <p className="text-sm font-bold text-slate-800">{formatDate(employee.dateEmbauche)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                                                    <AlertCircle className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase">Fin de Contrat / Retraite</p>
                                                    <p className="text-sm font-bold text-slate-800">{formatDate(employee.Date_Depart)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="finance" className="space-y-6">
                            {canViewFinance ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                                        <CardHeader className="border-b bg-primary/5">
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Informations Salariales</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4 space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-slate-50 font-bold text-lg">
                                                <span className="text-slate-500 font-medium">Salaire de Base</span>
                                                <span className="text-primary">{(employee.baseSalary || 0).toLocaleString()} FCFA</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1 text-sm">
                                                <span className="text-slate-500">Prime Ancienneté</span>
                                                <span className="font-semibold text-slate-800">{(employee.primeAnciennete || 0).toLocaleString()} FCFA</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1 text-sm">
                                                <span className="text-slate-500">Indémnités</span>
                                                <span className="font-semibold text-slate-800">
                                                    {(
                                                        (employee.indemniteTransportImposable || 0) + 
                                                        (employee.indemniteLogement || 0) + 
                                                        (employee.indemniteResponsabilite || 0)
                                                    ).toLocaleString()} FCFA
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-100 font-black text-xl text-emerald-600">
                                                <span>Net à payer estimé</span>
                                                <span>{(employee.Salaire_Net || 0).toLocaleString()} FCFA</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                                        <CardHeader className="border-b bg-blue-50/50">
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-blue-600">Détails Bancaires</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4 space-y-4">
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <CreditCard className="h-5 w-5 text-blue-500" />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Banque</p>
                                                        <p className="text-sm font-bold text-slate-800">{employee.banque || "Non renseignée"}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Numéro de Compte</p>
                                                    <p className="text-sm font-mono font-bold text-slate-800">{employee.numeroCompte || "•••• •••• •••• ••••"}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <Card className="border-2 border-dashed border-slate-200">
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                        <Shield className="h-12 w-12 text-slate-300" />
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-slate-600">Accès restreint</h3>
                                            <p className="text-sm text-slate-400 max-w-md">Vous n'avez pas les permissions nécessaires pour voir les informations financières de cet employé.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="space-y-6">
                            <Card className="border-none shadow-sm bg-white">
                                <CardContent className="pt-6">
                                    <h3 className="text-lg font-bold mb-4">Compétences & Qualifications</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {employee.skills && employee.skills.length > 0 ? (
                                            employee.skills.map((skill, i) => (
                                                <Badge key={i} variant="secondary" className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border-none transition-colors">
                                                    {skill}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-slate-400 italic">Aucune compétence renseignée.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Colonne Droite - Statut & Sidebar */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg bg-slate-900 text-white overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Statut RH</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-bold">Contrat Certifié</p>
                                    <p className="text-xs text-slate-400">Dossier administratif complet</p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-white/10">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400 font-medium">Couverture Santé (CNPS)</span>
                                    <span className={`font-bold ${employee.CNPS ? 'text-emerald-400' : 'text-slate-400'}`}>
                                        {employee.CNPS ? 'ACTIVÉE' : 'NON DÉCLARÉ'}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full ${employee.CNPS ? 'bg-emerald-500 w-full' : 'bg-slate-700 w-1/3'}`} />
                                </div>
                            </div>

                            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold" size="sm">
                                Voir Contrat Numérisé
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-indigo-50/50 border border-indigo-100">
                        <CardHeader>
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-900 flex items-center gap-2">
                                <Heart className="h-3.5 w-3.5" />
                                Situation Sociale
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-xl bg-white border border-indigo-100 shadow-sm flex items-center gap-3">
                                <User className="h-5 w-5 text-indigo-400" />
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Statut Matrimonial</p>
                                    <p className="text-xs font-bold text-slate-800">{employee.situationMatrimoniale || "Non spécifié"}</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-white border border-indigo-100 shadow-sm flex items-center gap-3">
                                <GraduationCap className="h-5 w-5 text-indigo-400" />
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Dernière Formation</p>
                                    <p className="text-xs font-bold text-slate-800">Non renseignée</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
