
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCustom } from "@/services/customs-service";
import type { Custom } from "@/lib/data";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil, BookOpen, MapPin, Languages, Users, Landmark, Scale, Shield, Sparkles, Sprout, Building } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function CustomDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params as { id: string };
    const [custom, setCustom] = useState<Custom | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (typeof id !== 'string') return;
        
        async function fetchData() {
            try {
                const data = await getCustom(id);
                setCustom(data);
            } catch (error) {
                console.error("Failed to fetch custom details", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);
    
    if (loading) {
        return <CustomDetailSkeleton />;
    }

    if (!custom) {
        return <div className="text-center py-10">Fiche de coutume non trouvée.</div>;
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                 </Button>
                 <div>
                    <p className="text-muted-foreground">Us & Coutumes</p>
                    <h1 className="text-2xl font-bold tracking-tight">{custom.ethnicGroup}</h1>
                 </div>
                 <Button asChild className="ml-auto">
                    <Link href={`/us-et-coutumes/${id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4"/>
                        Modifier
                    </Link>
                </Button>
            </div>
            
             <div className="space-y-6">
                <InfoSection icon={BookOpen} title="Identification Culturelle">
                    <InfoItem label="Région(s) d'implantation" value={custom.regions} />
                    <InfoItem label="Langue(s) parlée(s)" value={custom.languages} />
                    <InfoItem label="Origine Historique/Légendaire" value={custom.historicalOrigin} isTextarea/>
                </InfoSection>

                 <InfoSection icon={Building} title="Organisation Sociale et Politique">
                    <InfoItem label="Structure Sociale" value={custom.socialStructure} isTextarea />
                    <InfoItem label="Structure Politique" value={custom.politicalStructure} isTextarea />
                    <InfoItem label="Système de Succession" value={custom.successionSystem} isTextarea />
                </InfoSection>

                <InfoSection icon={Sparkles} title="Rites et Cérémonies">
                    <InfoItem label="Mariage Traditionnel" value={custom.traditionalMarriage} isTextarea />
                    <InfoItem label="Funérailles" value={custom.funerals} isTextarea />
                    <InfoItem label="Rites d'Initiation" value={custom.initiations} isTextarea />
                    <InfoItem label="Fêtes et Célébrations" value={custom.celebrations} isTextarea />
                </InfoSection>

                <InfoSection icon={Landmark} title="Spiritualité et Croyances">
                    <InfoItem label="Croyances et Spiritualité" value={custom.beliefs} isTextarea />
                    <InfoItem label="Pratiques Religieuses" value={custom.religiousPractices} isTextarea />
                    <InfoItem label="Lieux Sacrés" value={custom.sacredPlaces} isTextarea />
                </InfoSection>

                <InfoSection icon={Shield} title="Normes, Valeurs et Symboles">
                    <InfoItem label="Symboles et Objets Culturels" value={custom.culturalSymbols} isTextarea />
                    <InfoItem label="Normes et Valeurs" value={custom.normsAndValues} isTextarea />
                    <InfoItem label="Résolution des Conflits" value={custom.conflictResolutionSystem} isTextarea />
                </InfoSection>
                 <InfoSection icon={Sprout} title="Préservation et Évolution">
                    <InfoItem label="Impact de la Modernité" value={custom.modernityImpact} isTextarea />
                    <InfoItem label="Initiatives de Sauvegarde" value={custom.preservationInitiatives} isTextarea />
                    <InfoItem label="Transmission Intergénérationnelle" value={custom.intergenerationalTransmission} isTextarea />
                </InfoSection>
            </div>
        </div>
    );
}

function InfoSection({ icon: Icon, title, children }: { icon: React.ElementType, title: string; children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                    <Icon className="h-6 w-6 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {children}
            </CardContent>
        </Card>
    );
}


function InfoItem({ label, value, isTextarea }: { label: string; value?: string | null; isTextarea?: boolean}) {
    if (!value) return null;
    return (
        <div className={isTextarea ? "md:col-span-2" : ""}>
            <Label className="text-base font-semibold text-foreground">{label}</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{value}</p>
        </div>
    );
}

function CustomDetailSkeleton() {
    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                 <Skeleton className="h-10 w-10" />
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-48" />
                 </div>
                 <Skeleton className="h-10 w-24 ml-auto" />
            </div>
            <div className="space-y-6">
                <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><div className="grid grid-cols-2 gap-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
            </div>
        </div>
    )
}
