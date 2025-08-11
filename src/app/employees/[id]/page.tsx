
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getEmployee } from "@/services/employee-service";
import { getLeaves } from "@/services/leave-service";
import { getAssets } from "@/services/asset-service";
import { getMissions } from "@/services/mission-service";
import type { Employe, Leave, Asset, Mission } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, User, Briefcase, Mail, Phone, MapPin, BadgeCheck, FileText, Calendar, Laptop, Rocket, FolderArchive } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


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
    const { id } = params;
    const [employee, setEmployee] = useState<Employe | null>(null);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof id !== 'string') return;
        
        async function fetchData() {
            try {
                const employeeData = await getEmployee(id);
                setEmployee(employeeData);

                if (employeeData) {
                    const [leavesData, assetsData, missionsData] = await Promise.all([
                        getLeaves(),
                        getAssets(),
                        getMissions()
                    ]);
                    setLeaves(leavesData.filter(l => l.employee === employeeData.name).slice(0, 5));
                    setAssets(assetsData.filter(a => a.assignedTo === employeeData.name));
                    setMissions(missionsData.filter(m => m.assignedTo === employeeData.name).slice(0, 5));
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

    if (loading) {
        return <EmployeeDetailSkeleton />;
    }

    if (!employee) {
        return <div className="text-center py-10">Employé non trouvé.</div>;
    }

    const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.name;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                 </Button>
                 <h1 className="text-3xl font-bold tracking-tight">Fiche de l'Employé</h1>
                 <Button asChild className="ml-auto">
                    <Link href={`/employees/${id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4"/>
                        Modifier
                    </Link>
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <Avatar className="h-24 w-24 border">
                                <AvatarImage src={employee.photoUrl} alt={fullName} data-ai-hint="employee photo"/>
                                <AvatarFallback className={`text-3xl ${getAvatarBgClass(employee.sexe)}`}>
                                    {employee.lastName?.charAt(0) || ''}{employee.firstName?.charAt(0) || ''}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-3xl">{fullName}</CardTitle>
                                <CardDescription className="text-lg text-muted-foreground">{employee.poste}</CardDescription>
                                <div className="mt-2 flex gap-2">
                                <Badge variant={employee.status === 'Actif' ? 'default' : 'destructive'}>{employee.status}</Badge>
                                <Badge variant="secondary">{employee.department}</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <InfoSection title="Informations de Contact" icon={User}>
                                <InfoItem label="Email" value={employee.email} icon={Mail} />
                                <InfoItem label="Téléphone" value={employee.mobile} icon={Phone} />
                            </InfoSection>
                        </CardContent>
                    </Card>

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
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                         <CardHeader>
                             <CardTitle className="flex items-center gap-2 text-lg"><Briefcase className="h-5 w-5 text-primary"/> Info Professionnelle</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoItem label="Poste" value={employee.poste} />
                            <InfoItem label="Matricule" value={employee.matricule} />
                            <InfoItem label="Service / Département" value={employee.department} />
                            <InfoItem label="Date d'embauche" value={employee.dateEmbauche} />
                            <InfoItem label="Numéro de décision" value={employee.Num_Decision} icon={FileText} />
                        </CardContent>
                    </Card>
                     <Card>
                         <CardHeader>
                             <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-primary"/> Info Personnelle</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoItem label="Lieu de naissance" value={employee.Lieu_Naissance} icon={MapPin} />
                            <InfoItem label="Date de naissance" value={employee.Date_Naissance} />
                             <InfoItem label="Compétences" icon={BadgeCheck}>
                                {employee.skills && employee.skills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {employee.skills.map(skill => (
                                            <Badge key={skill} variant="outline">{skill}</Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm font-normal">Aucune</p>
                                )}
                            </InfoItem>
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
                                        <span>{asset.model}</span>
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

            </div>
        </div>
    );
}

function InfoSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType, children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b pb-2">
                <Icon className="h-5 w-5 text-primary" />
                {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {children}
            </div>
        </div>
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
                <div className="lg:col-span-2 space-y-6">
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
                        <CardContent>
                           <Skeleton className="h-12 w-full" />
                        </CardContent>
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
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
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


    