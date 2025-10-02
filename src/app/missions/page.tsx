
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search, Eye, Pencil, Trash2, MoreHorizontal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { subscribeToMissions, addMission, deleteMission } from "@/services/mission-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import Link from "next/link";
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PaginationControls } from "@/components/common/pagination-controls";

type Status = "Planifiée" | "En cours" | "Terminée" | "Annulée";

const statusVariantMap: Record<Status, "secondary" | "default" | "outline" | "destructive"> = {
  'Planifiée': 'secondary',
  'En cours': 'default',
  'Terminée': 'outline',
  'Annulée': 'destructive',
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const formatDateRange = (start: string, end: string) => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      const startFormat = format(startDate, 'dd MMM', { locale: fr });
      const endFormat = format(endDate, 'dd MMM yyyy', { locale: fr });
      return `${startFormat} au ${endFormat}`;
    } catch {
      return `${start} au ${end}`;
    }
  };


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
  
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
        await deleteMission(deleteTarget.id);
        toast({
            title: "Mission supprimée",
            description: `La mission "${deleteTarget.title}" a été supprimée.`,
        });
    } catch (err) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de supprimer la mission."
        });
    } finally {
        setDeleteTarget(null);
    }
  }

  const filteredMissions = useMemo(() => {
    const filtered = missions.filter(mission => {
      const searchTermLower = searchTerm.toLowerCase();
      // Ensure participants array exists before trying to access it
      const participantsString = (mission.participants || []).map(p => p.employeeName).join(" ").toLowerCase();
      return mission.title.toLowerCase().includes(searchTermLower) ||
             participantsString.includes(searchTermLower) ||
             mission.description.toLowerCase().includes(searchTermLower);
    });
    if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
        setCurrentPage(1);
    }
    return filtered;
  }, [missions, searchTerm, currentPage, itemsPerPage]);

  const paginatedMissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMissions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMissions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des Missions
        </h1>
        <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/missions/report">
                    <FileText className="mr-2 h-4 w-4" />
                    Rapport des Missions
                </Link>
            </Button>
            <Button onClick={() => setIsSheetOpen(true)} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter une mission
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Liste des Missions</CardTitle>
          <CardDescription>
            Suivez toutes les missions de l'entreprise.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, participant..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
           <div className="mb-4 text-sm text-muted-foreground">
              {filteredMissions.length} résultat(s) trouvé(s).
            </div>
          {error && <p className="text-destructive text-center py-4">{error}</p>}
           <div className="hidden md:block">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    paginatedMissions.map((mission, index) => (
                        <TableRow key={mission.id} onClick={() => router.push(`/missions/${mission.id}`)} className="cursor-pointer">
                          <TableCell className="font-mono text-muted-foreground">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                          <TableCell className="font-medium">{mission.title}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(mission.participants || []).map(p => <Badge key={p.employeeName} variant="outline">{p.employeeName}</Badge>)}
                            </div>
                          </TableCell>
                          <TableCell>{formatDateRange(mission.startDate, mission.endDate)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariantMap[mission.status] || 'default'}>{mission.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Ouvrir le menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onSelect={() => router.push(`/missions/${mission.id}`)}>
                                        <Eye className="mr-2 h-4 w-4" /> Voir les détails
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => router.push(`/missions/${mission.id}/edit`)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setDeleteTarget(mission)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                paginatedMissions.map((mission, index) => (
                    <Card key={mission.id} onClick={() => router.push(`/missions/${mission.id}`)}>
                        <CardHeader>
                            <CardTitle className="text-base">
                               {(currentPage - 1) * itemsPerPage + index + 1}. {mission.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2">
                           <Badge variant={statusVariantMap[mission.status] || 'default'}>{mission.status}</Badge>
                            <p className="text-sm"><span className="font-medium">Période:</span> {formatDateRange(mission.startDate, mission.endDate)}</p>
                             <div className="flex flex-wrap gap-1 pt-1">
                              {(mission.participants || []).map(p => <Badge key={p.employeeName} variant="outline">{p.employeeName}</Badge>)}
                            </div>
                        </CardContent>
                    </Card>
                ))
              )}
            </div>
          {!loading && paginatedMissions.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucune mission trouvée.
            </div>
          )}
        </CardContent>
         {totalPages > 1 && (
            <CardFooter>
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalItems={filteredMissions.length}
                />
            </CardFooter>
        )}
      </Card>
      <AddMissionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddMission={handleAddMission}
      />
    </div>
    <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Supprimer la mission : ${deleteTarget?.title}`}
        description="Êtes-vous sûr de vouloir supprimer cette mission ? Cette action est irréversible."
    />
    </>
  );
}
