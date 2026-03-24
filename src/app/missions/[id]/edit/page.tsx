"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ChevronLeft, Loader2, 
    AlertCircle, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditMissionForm } from "@/components/missions/edit-mission-form";
import { getMission, updateMission } from "@/services/mission-service";
import type { Mission } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function EditMissionPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { toast } = useToast();
    const [mission, setMission] = useState<Mission | null>(null);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = useAuth();

    const canEdit = hasPermission('page:missions:view');

    useEffect(() => {
        if (!canEdit && !loading) {
            router.replace('/intranet');
            toast({
                variant: "destructive",
                title: "Accès refusé",
                description: "Vous n'avez pas les permissions pour modifier cette mission."
            });
            return;
        }

        async function fetchMission() {
            try {
                const data = await getMission(id);
                if (data) {
                    setMission(data);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Erreur",
                        description: "Mission introuvable."
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchMission();
    }, [id, canEdit, loading, router, toast]);

    const handleUpdateMission = async (missionId: string, data: Partial<Mission>) => {
        try {
            await updateMission(missionId, data);
            toast({
                title: "Modification réussie",
                description: "Les détails de la mission ont été mis à jour.",
            });
            router.push(`/missions/${missionId}`);
        } catch (err) {
            console.error(err);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de mettre à jour la mission."
            });
            throw err;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Chargement de la mission...</p>
            </div>
        );
    }

    if (!canEdit) return null;

    if (!mission) {
        return (
            <div className="container mx-auto py-20 text-center space-y-4">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
                <h2 className="text-2xl font-bold">Mission non trouvée</h2>
                <Button variant="outline" onClick={() => router.push("/missions")}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Retour aux missions
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full h-10 w-10">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <Briefcase className="h-8 w-8 text-primary" />
                        Édition de Mission
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Modification des paramètres du dossier {mission.numeroMission}
                    </p>
                </div>
            </div>

            <EditMissionForm mission={mission} onUpdateMission={handleUpdateMission} />
        </div>
    );
}
