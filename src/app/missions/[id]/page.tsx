

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getMission } from "@/services/mission-service";
import type { Mission } from "@/lib/data";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Pencil,
  User,
  Calendar,
  Info,
  Flag,
  Users,
  Car,
  MapPin,
  Hash,
  Printer,
  Trash2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { generateMissionOrderAction, deleteMissionAction } from "./actions";

type Status = "Planifiée" | "En cours" | "Terminée" | "Annulée";

const statusVariantMap: Record<
  Status,
  "secondary" | "default" | "outline" | "destructive"
> = {
  Planifiée: "secondary",
  "En cours": "default",
  Terminée: "outline",
  Annulée: "destructive",
};

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { toast } = useToast();

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (typeof id !== "string") return;

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

  const handlePrint = async () => {
    if (!mission) return;
    setIsPrinting(true);
    try {
      const result = await generateMissionOrderAction(mission);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Erreur de Génération",
          description: result.error,
        });
      } else if (result.document) {
        const printWindow = window.open("", "_blank", "height=800,width=800");
        if (printWindow) {
            printWindow.document.write(result.document);
            printWindow.document.close();
            // Give it a moment to load before printing
            setTimeout(() => {
            printWindow.print();
            }, 500);
        } else {
            toast({
              variant: "destructive",
              title: "Erreur d'impression",
              description: "Impossible d'ouvrir la fenêtre d'impression. Vérifiez les bloqueurs de popups.",
            });
        }
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur Inattendue",
        description:
          "Une erreur est survenue lors de la génération de l'ordre de mission.",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDelete = async () => {
    if (!mission) return;
    setIsDeleting(true);
    try {
      await deleteMissionAction(id);
      toast({
        title: "Mission supprimée",
        description: `La mission "${mission.title}" a été supprimée avec succès.`,
      });
      router.push("/missions");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur de Suppression",
        description: "Impossible de supprimer la mission.",
      });
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <MissionDetailSkeleton />;
  }

  if (!mission) {
    return <div className="text-center py-10">Mission non trouvée.</div>;
  }

  const participantsToShow = mission.participants.slice(0, 5);
  const remainingParticipantsCount =
    mission.participants.length - participantsToShow.length;

  return (
    <>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Retour</span>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Détails de la Mission
            </h1>
            <p className="text-muted-foreground truncate">{mission.title}</p>
          </div>
          <Button asChild>
            <Link href={`/missions/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
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
                  Dossier Mission N° {mission.numeroMission} - {mission.title}
                </CardTitle>
                <CardDescription className="mt-2">
                  <Badge variant={statusVariantMap[mission.status]}>
                    {mission.status}
                  </Badge>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={isPrinting}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {isPrinting ? "Génération..." : "Ordres de Mission"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem
                label="Période"
                value={`${mission.startDate} au ${mission.endDate}`}
                icon={Calendar}
              />
              <InfoItem
                label="Lieu"
                value={mission.lieuMission}
                icon={MapPin}
              />
            </div>
            <InfoItem label="Participants" icon={Users}>
              <div className="flex flex-col gap-2 pt-1">
                {participantsToShow.map((p) => (
                  <div key={p.employeeName} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{p.employeeName}</span>
                      <span className="text-xs text-muted-foreground font-mono">Ordre N° {p.numeroOrdre || 'N/A'}</span>
                  </div>
                ))}
                {remainingParticipantsCount > 0 && (
                  <Button variant="link" asChild className="p-0 h-auto justify-start">
                    <Link href={`/missions/${id}/participants`}>
                      et {remainingParticipantsCount} autre(s)...
                    </Link>
                  </Button>
                )}
              </div>
            </InfoItem>
            {mission.description && (
              <InfoItem label="Description / Objectifs" icon={Info}>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                  {mission.description}
                </p>
              </InfoItem>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`Supprimer la mission "${mission.title}" ?`}
        description="Cette action est irréversible et supprimera définitivement la mission."
      />
    </>
  );
}

function InfoItem({
  label,
  value,
  icon: Icon,
  children,
}: {
  label: string;
  value?: string | number | null;
  icon?: React.ElementType;
  children?: React.ReactNode;
}) {
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
  );
}
