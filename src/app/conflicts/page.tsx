
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
import type { Conflict } from "@/lib/data";
import { AddConflictSheet } from "@/components/conflicts/add-conflict-sheet";
import { Input } from "@/components/ui/input";
import { getConflicts, addConflict } from "@/services/conflict-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type Status = "Ongoing" | "Resolved" | "Mediating";

const statusVariantMap: Record<Status, "destructive" | "default" | "secondary"> = {
  Ongoing: "destructive",
  Resolved: "default",
  Mediating: "secondary",
};

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    async function fetchConflicts() {
      try {
        setLoading(true);
        const fetchedConflicts = await getConflicts();
        setConflicts(fetchedConflicts);
        setError(null);
      } catch (err) {
        setError("Impossible de charger les conflits.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchConflicts();
  }, []);

  const handleAddConflict = async (newConflictData: Omit<Conflict, "id">) => {
     try {
        const newConflict = await addConflict(newConflictData);
        setConflicts(prev => [...prev, newConflict]);
        setIsSheetOpen(false);
        toast({
            title: "Conflit ajouté",
            description: `Le conflit à ${newConflict.village} a été enregistré.`,
        });
     } catch (err) {
        console.error("Failed to add conflict:", err);
        throw err;
     }
  };

  const filteredConflicts = useMemo(() => {
    return conflicts.filter(conflict => {
      const searchTermLower = searchTerm.toLowerCase();
      return conflict.village.toLowerCase().includes(searchTermLower) ||
             conflict.description.toLowerCase().includes(searchTermLower);
    });
  }, [conflicts, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des Conflits
        </h1>
        <Button onClick={() => setIsSheetOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Signaler un conflit
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Conflits Villageois</CardTitle>
          <CardDescription>
            Suivi et résolution des conflits au sein des communautés.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par village, description..."
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
                    <TableHead>Village</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date Signalée</TableHead>
                    <TableHead>Statut</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-80" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    filteredConflicts.map((conflict) => (
                        <TableRow key={conflict.id}>
                          <TableCell className="font-medium">{conflict.village}</TableCell>
                          <TableCell>{conflict.description}</TableCell>
                          <TableCell>{conflict.reportedDate}</TableCell>
                          <TableCell>
                             <Badge variant={statusVariantMap[conflict.status] || 'default'}>{conflict.status}</Badge>
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
                filteredConflicts.map((conflict) => (
                    <Card key={conflict.id}>
                        <CardContent className="p-4 space-y-2">
                            <p className="font-bold">{conflict.village}</p>
                            <p className="text-sm text-muted-foreground">{conflict.description}</p>
                            <p className="text-sm"><span className="font-medium">Signalé le:</span> {conflict.reportedDate}</p>
                             <Badge variant={statusVariantMap[conflict.status] || 'default'}>{conflict.status}</Badge>
                        </CardContent>
                    </Card>
                ))
              )}
            </div>
          {!loading && filteredConflicts.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucun conflit trouvé.
            </div>
          )}
        </CardContent>
      </Card>
      <AddConflictSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddConflict={handleAddConflict}
      />
    </div>
  );
}
