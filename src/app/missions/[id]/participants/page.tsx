

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMission } from "@/services/mission-service";
import { getEmployees } from "@/services/employee-service";
import type { Mission, Employe } from "@/lib/data";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Briefcase, Mail, Hash, Car } from "lucide-react";

export default function MissionParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const [mission, setMission] = useState<Mission | null>(null);
  const [participantsDetails, setParticipantsDetails] = useState<({ employee: Employe, transport?: string, immatriculation?: string, numeroOrdre?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const [missionData, allEmployees] = await Promise.all([
          getMission(id),
          getEmployees(),
        ]);

        if (missionData) {
          setMission(missionData);
          const participantDetails = missionData.participants.map(p => {
              const employee = allEmployees.find(e => e.name === p.employeeName);
              return {
                  employee: employee!,
                  transport: p.moyenTransport,
                  immatriculation: p.immatriculation,
                  numeroOrdre: p.numeroOrdre,
              }
          }).filter(p => p.employee);
          setParticipantsDetails(participantDetails);
        }
      } catch (error) {
        console.error("Failed to fetch mission participants", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <ParticipantsSkeleton />;
  }

  if (!mission) {
    return <div className="text-center py-10">Mission non trouvée.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Retour</span>
        </Button>
        <div>
          <p className="text-muted-foreground">Mission #{mission.numeroMission}</p>
          <h1 className="text-2xl font-bold tracking-tight">{mission.title}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Participants ({participantsDetails.length})</CardTitle>
          <CardDescription>
            Tous les employés assignés à cette mission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {participantsDetails.map((p) => (
              <Card key={p.employee.id} className="p-4 flex flex-col">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={p.employee.photoUrl} alt={p.employee.name} data-ai-hint="employee photo" />
                    <AvatarFallback>
                      {p.employee.lastName?.charAt(0)}
                      {p.employee.firstName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold">{p.employee.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {p.employee.poste}
                    </p>
                     <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {p.employee.email || "N/A"}
                    </p>
                  </div>
                </div>
                 <div className="mt-3 pt-3 border-t space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" /> N° Ordre: <span className="font-mono">{p.numeroOrdre || 'N/A'}</span></p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Car className="h-3 w-3" /> Transport: {p.transport || 'N/A'} ({p.immatriculation || 'N/A'})</p>
                 </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function ParticipantsSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-48" />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </CardContent>
            </Card>
        </div>
    )
}
