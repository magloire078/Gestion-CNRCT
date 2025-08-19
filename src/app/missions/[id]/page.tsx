
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getMission } from "@/services/mission-service";
import type { Mission } from "@/lib/data";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, User, Calendar, Info, Flag, Users, Car, MapPin, Hash } from "lucide-react";
import { Label } from "@/components/ui/label";

type Status = "Planifiée" | "En cours" | "Terminée" | "Annulée";

const statusVariantMap: Record<Status, "secondary" | "default" | "outline" | "destructive"> = {
  'Planifiée': 'secondary',
  'En cours': 'default',
  'Terminée': 'outline',
  'Annulée': 'destructive',
};


export default function MissionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const [mission, setMission] = useState<Mission | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof id !== 'string') return;
        
        async function fetchData() {
            try {
                const missionData = await getMission(id);
                setMission(missionData);
            } catch (error) {
                console.error("Failed to fetch mission details", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);
    
    if (loading) {
        return <MissionDetailSkeleton />;
    }

    if (!mission) {
        return <div className="text-center py-10">Mission non trouvée.</div>;
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                 </Button>
                 <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Détails de la Mission</h1>
                    <p className="text-muted-foreground truncate">{mission.title}</p>
                 </div>
                 <Button asChild>
                    <Link href={`/missions/${id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4"/>
                        Modifier
                    </Link>
                </Button>
            </div>
            
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Hash className="h-5 w-5 text-muted-foreground" />
                                {mission.numeroMission} - {mission.title}
                            </CardTitle>
                            <CardDescription className="mt-2">
                                <Badge variant={statusVariantMap[mission.status]}>{mission.status}</Badge>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoItem label="Période" value={`${mission.startDate} au ${mission.endDate}`} icon={Calendar} />
                        <InfoItem label="Lieu" value={mission.lieuMission} icon={MapPin} />
                        <InfoItem label="Transport" value={mission.moyenTransport} icon={Car} />
                        <InfoItem label="Immatriculation" value={mission.immatriculation} icon={Car} />
                    </div>
                     <InfoItem label="Participants" icon={Users}>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {mission.assignedTo.map(name => <Badge key={name}>{name}</Badge>)}
                        </div>
                    </InfoItem>
                     {mission.description && (
                        <InfoItem label="Description / Objectifs" icon={Info}>
                           <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{mission.description}</p>
                        </InfoItem>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function InfoItem({ label, value, icon: Icon, children }: { label: string; value?: string | number | null; icon?: React.ElementType, children?: React.ReactNode }) {
    if (!value && !children) return null;
    return (
        <div className="flex flex-col">
            <Label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                 {Icon && <Icon className="h-4 w-4" />}
                 {label}
            </Label>
            {value && <p className="text-base font-medium">{value}</p>}
            {children && <div className="mt-1">{children}</div>}
        </div>
    );
}

function MissionDetailSkeleton() {
    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                 <Skeleton className="h-10 w-10" />
                 <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                 </div>
                 <Skeleton className="h-10 w-24 ml-auto" />
            </div>
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                   </div>
                   <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}
