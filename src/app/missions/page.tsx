
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Mission } from "@/lib/data";
import { AddMissionSheet } from "@/components/missions/add-mission-sheet";
import { Input } from "@/components/ui/input";
import { subscribeToMissions, addMission } from "@/services/mission-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type Status = "Planned" | "In Progress" | "Completed" | "Cancelled";

const statusVariantMap: Record<Status, "secondary" | "default" | "outline" | "destructive"> = {
  'Planned': 'secondary',
  'In Progress': 'default',
  'Completed': 'outline',
  'Cancelled': 'destructive',
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToMissions(
      (fetchedMissions) => {
        setMissions(fetchedMissions);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Impossible de charger les missions.");
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAddMission = async (newMissionData: Omit<Mission, "id">) => {
     try {
        await addMission(newMissionData);
        // State is managed by real-time subscription
        setIsSheetOpen(false);
        toast({
            title: "Mission ajoutée",
            description: `La mission "${newMissionData.title}" a été ajoutée avec succès.`,
        });
     } catch (err) {
        console.error("Failed to add mission:", err);
        throw err;
     }
  };

  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      const searchTermLower = searchTerm.toLowerCase();
      return mission.title.toLowerCase().includes(searchTermLower) ||
             mission.assignedTo.toLowerCase().includes(searchTermLower) ||
             mission.description.toLowerCase().includes(searchTermLower);
    });
  }, [missions, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des Missions
        </h1>
        <Button onClick={() => setIsSheetOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une mission
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Liste des Missions</CardTitle>
          <CardDescription>
            Suivez toutes les missions de l'entreprise.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, assigné..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-destructive text-center py-4">{error}</p>}
           <div className="hidden md:block">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Assigné à</TableHead>
                    <TableHead>Date de début</TableHead>
                    <TableHead>Date de fin</TableHead>
                    <TableHead>Statut</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    filteredMissions.map((mission) => (
                        <TableRow key={mission.id}>
                        <TableCell className="font-medium">{mission.title}</TableCell>
                        <TableCell>{mission.assignedTo}</TableCell>
                        <TableCell>{mission.startDate}</TableCell>
                        <TableCell>{mission.endDate}</TableCell>
                        <TableCell>
                           <Badge variant={statusVariantMap[mission.status] || 'default'}>{mission.status}</Badge>
                        </TableCell>
                        </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
            </div>
             <div className="grid grid-cols-1 gap-4 md:hidden">
              {loading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
                 ))
              ) : (
                filteredMissions.map((mission) => (
                    <Card key={mission.id}>
                        <CardContent className="p-4 space-y-2">
                            <p className="font-bold">{mission.title}</p>
                            <p className="text-sm"><span className="font-medium">Assigné à:</span> {mission.assignedTo}</p>
                            <p className="text-sm"><span className="font-medium">Période:</span> {mission.startDate} au {mission.endDate}</p>
                            <Badge variant={statusVariantMap[mission.status] || 'default'}>{mission.status}</Badge>
                        </CardContent>
                    </Card>
                ))
              )}
            </div>
          {!loading && filteredMissions.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucune mission trouvée.
            </div>
          )}
        </CardContent>
      </Card>
      <AddMissionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddMission={handleAddMission}
      />
    </div>
  );
}
