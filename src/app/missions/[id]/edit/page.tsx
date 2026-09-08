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
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";

export default function EditMissionPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { toast } = useToast();
    const [mission, setMission] = useState<Mission | null>(null);
    const [loading, setLoading] = useState(true);
    const { hasPermission, loading: authLoading } = useAuth();
    const { can, loading: permissionsLoading } = usePermissions();

    const isAuthResolving = authLoading || permissionsLoading;
    const canEdit = hasPermission('page:missions:view') && can('missions', 'update');

    useEffect(() => {
        if (isAuthResolving) return;

        if (!canEdit) {
            router.replace('/missions');
            toast({
                variant: "destructive",
                title: "Accès refusé",
                description: "Vous n'avez pas les permissions pour modifier cette mission."
            });
            return;
        }

        let isMounted = true;
        async function fetchMission() {
            try {
                const data = await getMission(id);
                if (!isMounted) return;
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
                if (isMounted) setLoading(false);
            }
        }
        fetchMission();

        return () => {
            isMounted = false;
        };
    }, [id, canEdit, isAuthResolving, router, toast]);

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
            <div className="container mx-auto py-8 text-center space-y-4">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
                <h2 className="text-2xl font-bold">Mission non trouvée</h2>
                <Button variant="outline" onClick={() => router.push("/missions")}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Retour aux missions
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6 max-w-7xl">
            <div className="flex items-center gap-4">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => router.back()} 
                    className="rounded-xl h-11 w-11 border-slate-200 bg-white shadow-sm hover:bg-slate-100 transition-all"
                >
                    <ChevronLeft className="h-5 w-5 text-slate-700" />
                </Button>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                            Dossier N° {mission.numeroMission}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                            Modification des paramètres
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
                        Édition du Dossier de Mission
                    </h1>
                </div>
            </div>

            <EditMissionForm mission={mission} onUpdateMission={handleUpdateMission} />
        </div>
    );
}
