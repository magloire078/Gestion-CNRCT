

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getChief, getChiefs } from "@/services/chief-service";
import type { Chief } from "@/lib/data";
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, User, MapPin, Phone, Crown, Calendar, Users, Building, Shield } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function ChiefDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const [chief, setChief] = useState<Chief | null>(null);
    const [parentChief, setParentChief] = useState<Chief | null>(null);
    const [loading, setLoading] = useState(true);
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'dd MMMM yyyy', { locale: fr });
        } catch (error) {
            return dateString; // Fallback to original string if parsing fails
        }
    };

    useEffect(() => {
        if (typeof id !== 'string') return;
        
        async function fetchData() {
            try {
                const chiefData = await getChief(id);
                setChief(chiefData);

                if (chiefData?.parentChiefId) {
                    const parentData = await getChief(chiefData.parentChiefId);
                    setParentChief(parentData);
                }
            } catch (error) {
                console.error("Failed to fetch chief details", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);
    
    const fullName = chief ? `${chief.lastName || ''} ${chief.firstName || ''}`.trim() : "Chargement...";


    if (loading) {
        return <ChiefDetailSkeleton />;
    }

    if (!chief) {
        return <div className="text-center py-10">Chef non trouvé.</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                 </Button>
                 <h1 className="text-3xl font-bold tracking-tight">Profil du Chef</h1>
                 <Button asChild className="ml-auto">
                    <Link href={`/chiefs/${id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4"/>
                        Modifier
                    </Link>
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                     <Card>
                        <CardContent className="pt-6 flex flex-col items-center text-center">
                            <Avatar className="h-32 w-32 border-4 border-primary/20 mb-4">
                                <AvatarImage src={chief.photoUrl} alt={fullName} data-ai-hint="chief portrait" />
                                <AvatarFallback className="text-4xl bg-muted">{chief.lastName?.charAt(0) || 'C'}</AvatarFallback>
                            </Avatar>
                            <h2 className="text-2xl font-bold">{fullName}</h2>
                            <p className="text-lg text-primary">{chief.title}</p>
                            <Badge variant="secondary" className="mt-2">{chief.role}</Badge>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                         <CardHeader>
                             <CardTitle className="flex items-center gap-2 text-xl"><MapPin className="h-5 w-5 text-primary"/> Localisation</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <InfoItem label="Région" value={chief.region} icon={Shield} />
                            <InfoItem label="Département" value={chief.department} icon={Building} />
                            <InfoItem label="Sous-préfecture" value={chief.subPrefecture} />
                            <InfoItem label="Village / Commune" value={chief.village} />
                            {(chief.latitude && chief.longitude) && 
                                <InfoItem label="Coordonnées" value={`${chief.latitude}, ${chief.longitude}`} />
                            }
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl"><User className="h-5 w-5 text-primary"/> Informations Personnelles</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <InfoItem label="Contact" value={chief.contact} icon={Phone} />
                            <InfoItem label="Date de naissance" value={formatDate(chief.dateOfBirth)} icon={Calendar} />
                            {parentChief && (
                                <InfoItem label="Autorité Supérieure" value={`${parentChief.lastName || ''} ${parentChief.firstName || ''}`} icon={Users} />
                            )}
                            {chief.regencyStartDate && (
                                <InfoItem label="Début de régence" value={formatDate(chief.regencyStartDate)} icon={Calendar} />
                            )}
                            {chief.regencyEndDate && (
                                <InfoItem label="Fin de régence / Décès" value={formatDate(chief.regencyEndDate)} icon={Calendar} />
                            )}
                        </CardContent>
                    </Card>
                    
                    {chief.bio && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl"><Crown className="h-5 w-5 text-primary"/> Biographie & Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{chief.bio}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
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

function ChiefDetailSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Skeleton className="h-10 w-10" />
                 <Skeleton className="h-8 w-64" />
                 <Skeleton className="h-10 w-24 ml-auto" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                     <Card><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
