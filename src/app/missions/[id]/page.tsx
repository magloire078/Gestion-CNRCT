

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getMission } from "@/services/mission-service";
import type { Mission, Employe, MissionParticipant } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";
import { differenceInDays, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  Users,
  MapPin,
  Hash,
  Printer,
  Trash2,
  FileText,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { generateMissionOrderAction, deleteMissionAction } from "./actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MissionCostReport } from "@/components/missions/mission-cost-report";
import { getAllowanceRate } from "@/services/allowance-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


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

interface ParticipantWithDetails extends Employe, MissionParticipant {}

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { toast } = useToast();

  const [mission, setMission] = useState<Mission | null>(null);
  const [participantsDetails, setParticipantsDetails] = useState<ParticipantWithDetails[]>([]);
  const [missionDuration, setMissionDuration] = useState(0);
  const [totalMissionCost, setTotalMissionCost] = useState(0);

  const [loading, setLoading] = useState(true);
  const [isPrintingOrder, setIsPrintingOrder] = useState(false);
  const [isPrintingCostReport, setIsPrintingCostReport] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDateRange = (start: string, end: string) => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      const startFormat = format(startDate, 'dd MMMM', { locale: fr });
      const endFormat = format(endDate, 'dd MMMM yyyy', { locale: fr });
      return `du ${startFormat} au ${endFormat}`;
    } catch {
      return `${start} au ${end}`;
    }
  };

  useEffect(() => {
    if (typeof id !== "string") return;

    async function fetchData() {
      try {
        const [missionData, allEmployees] = await Promise.all([
          getMission(id),
          getEmployees(),
        ]);

        if (missionData) {
            setMission(missionData);
            
            const startDate = parseISO(missionData.startDate);
            const endDate = parseISO(missionData.endDate);
            const duration = differenceInDays(endDate, startDate) + 1;
            setMissionDuration(duration > 0 ? duration : 1);

            const employeesMap = new Map(allEmployees.map(e => [e.name, e]));
            
            let calculatedTotalCost = 0;
            const participantsWithDetails = (missionData.participants || []).map(p => {
                const employee = employeesMap.get(p.employeeName);
                if (!employee) return null;

                // If totalIndemnites is not manually set, calculate it
                if (p.totalIndemnites === undefined || p.totalIndemnites === 0) {
                    const rate = getAllowanceRate(employee.categorie);
                    p.totalIndemnites = rate * (duration > 0 ? duration : 1);
                }

                const participantCost = (p.totalIndemnites || 0) + (p.coutTransport || 0) + (p.coutHebergement || 0);
                calculatedTotalCost += participantCost;

                return { ...employee, ...p };
            }).filter((p): p is ParticipantWithDetails => p !== null);
            
            setParticipantsDetails(participantsWithDetails);
            setTotalMissionCost(calculatedTotalCost);
        }
        
      } catch (error) {
        console.error("Failed to fetch mission details", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handlePrintMissionOrder = async () => {
    if (!mission) return;
    setIsPrintingOrder(true);
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
      setIsPrintingOrder(false);
    }
  };

  const handlePrintCostReport = () => {
      setIsPrintingCostReport(true);
  };
  
  useEffect(() => {
      if(isPrintingCostReport) {
          setTimeout(() => {
            window.print();
            setIsPrintingCostReport(false);
          }, 300);
      }
  }, [isPrintingCostReport]);

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
  
  const formatCurrency = (value: number | undefined) => {
    if(value === undefined) return '0 FCFA';
    return value.toLocaleString('fr-FR') + ' FCFA';
  };

  if (loading) {
    return <MissionDetailSkeleton />;
  }

  if (!mission) {
    return <div className="text-center py-10">Mission non trouvée.</div>;
  }

  return (
    <>
      <div className={`flex flex-col gap-6 max-w-4xl mx-auto ${isPrintingCostReport ? 'print-hidden' : ''}`}>
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
           <div className="flex gap-2">
            <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
            </Button>
             <Button asChild size="sm">
                <Link href={`/missions/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
                </Link>
            </Button>
          </div>
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
                    onClick={handlePrintCostReport}
                    disabled={isPrintingCostReport}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    État des Frais
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintMissionOrder}
                    disabled={isPrintingOrder}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    {isPrintingOrder ? "Génération..." : "Ordres de Mission"}
                  </Button>
               </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem
                label="Période"
                value={`${formatDateRange(mission.startDate, mission.endDate)} (${missionDuration} jours)`}
                icon={Calendar}
              />
              <InfoItem
                label="Lieu"
                value={mission.lieuMission}
                icon={MapPin}
              />
            </div>
            {mission.description && (
              <InfoItem label="Description / Objectifs" icon={Info}>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                  {mission.description}
                </p>
              </InfoItem>
            )}
          </CardContent>
        </Card>
        
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Détails Financiers par Participant
                </CardTitle>
                <CardDescription>
                  Détail des coûts et indemnités pour chaque participant.
                </CardDescription>
            </CardHeader>
             <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Participant</TableHead>
                            <TableHead className="text-right">Indemnités</TableHead>
                            <TableHead className="text-right">Transport</TableHead>
                            <TableHead className="text-right">Hébergement</TableHead>
                            <TableHead className="text-right">Total Participant</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {participantsDetails.map((p) => {
                            const totalParticipant = (p.totalIndemnites || 0) + (p.coutTransport || 0) + (p.coutHebergement || 0);
                            return (
                                <TableRow key={p.id}>
                                    <TableCell>
                                       <Link href={`/employees/${p.id}`} className="flex items-center gap-3 group">
                                         <Avatar className="h-9 w-9">
                                            <AvatarImage src={p.photoUrl} alt={p.name} data-ai-hint="employee photo" />
                                            <AvatarFallback>{p.lastName?.charAt(0)}{p.firstName?.charAt(0)}</AvatarFallback>
                                         </Avatar>
                                         <div>
                                            <div className="font-medium group-hover:underline">{`${p.lastName || ''} ${p.firstName || ''}`.trim()}</div>
                                            <div className="text-sm text-muted-foreground">{p.poste}</div>
                                         </div>
                                       </Link>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(p.totalIndemnites)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(p.coutTransport)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(p.coutHebergement)}</TableCell>
                                    <TableCell className="text-right font-bold font-mono">{formatCurrency(totalParticipant)}</TableCell>
                                </TableRow>
                            )
                        })}
                         {participantsDetails.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                    Aucun participant assigné à cette mission.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
                <div className="flex justify-end mt-4 pt-4 border-t">
                    <div className="text-right">
                        <p className="text-muted-foreground">Coût total de la mission</p>
                        <p className="text-xl font-bold">{formatCurrency(totalMissionCost)}</p>
                    </div>
                </div>
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

      {isPrintingCostReport && mission && (
        <div id="print-section">
            <MissionCostReport mission={mission} participants={participantsDetails} duration={missionDuration} totalCost={totalMissionCost} />
        </div>
      )}
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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
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
      <Card>
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
      </Card>
    </div>
  );
}
