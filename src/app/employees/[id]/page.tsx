
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getEmployee } from "@/services/employee-service";
import type { Employe } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, User, Briefcase, Mail, Phone, MapPin, BadgeCheck, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const [employee, setEmployee] = useState<Employe | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof id !== 'string') return;
        async function fetchEmployee() {
            try {
                const data = await getEmployee(id);
                setEmployee(data);
            } catch (error) {
                console.error("Failed to fetch employee", error);
            } finally {
                setLoading(false);
            }
        }
        fetchEmployee();
    }, [id]);

    if (loading) {
        return <EmployeeDetailSkeleton />;
    }

    if (!employee) {
        return <div className="text-center py-10">Employé non trouvé.</div>;
    }

    const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.name;

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
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
            
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <Avatar className="h-24 w-24 border">
                        <AvatarImage src={employee.photoUrl} alt={fullName} data-ai-hint="employee photo"/>
                        <AvatarFallback className="text-3xl">{fullName.charAt(0)}</AvatarFallback>
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
                <CardContent className="space-y-8">
                    <InfoSection title="Informations Personnelles" icon={User}>
                        <InfoItem label="Nom complet" value={fullName} />
                        <InfoItem label="Matricule" value={employee.matricule} />
                        <InfoItem label="Email" value={employee.email} icon={Mail} />
                        <InfoItem label="Téléphone" value={employee.mobile} icon={Phone} />
                        <InfoItem label="Lieu de naissance" value={employee.Lieu_Naissance} icon={MapPin} />
                        <InfoItem label="Date de naissance" value={employee.Date_Naissance} />
                    </InfoSection>

                    <InfoSection title="Informations Professionnelles" icon={Briefcase}>
                         <InfoItem label="Poste" value={employee.poste} />
                         <InfoItem label="Service / Département" value={employee.department} />
                         <InfoItem label="Date d'embauche" value={employee.dateEmbauche} />
                         <InfoItem label="Numéro de décision" value={employee.Num_Decision} icon={FileText} />
                    </InfoSection>

                    <InfoSection title="Compétences" icon={BadgeCheck}>
                        {employee.skills && employee.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {employee.skills.map(skill => (
                                    <Badge key={skill} variant="outline">{skill}</Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">Aucune compétence renseignée.</p>
                        )}
                    </InfoSection>
                </CardContent>
            </Card>
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

function InfoItem({ label, value, icon: Icon }: { label: string; value?: string | number | null; icon?: React.ElementType }) {
    if (!value) return null;
    return (
        <div className="flex flex-col">
            <Label className="text-sm text-muted-foreground">{label}</Label>
            <div className="flex items-center gap-2 mt-1">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                <p className="text-base font-medium">{value}</p>
            </div>
        </div>
    );
}

function EmployeeDetailSkeleton() {
    return (
         <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Skeleton className="h-10 w-10" />
                 <Skeleton className="h-8 w-64" />
                 <Skeleton className="h-10 w-24 ml-auto" />
            </div>
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
                <CardContent className="space-y-8">
                    <div>
                        <Skeleton className="h-7 w-48 mb-4" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                     <div>
                        <Skeleton className="h-7 w-56 mb-4" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
