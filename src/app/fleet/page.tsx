
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Fleet } from "@/lib/data";
import { AddVehicleSheet } from "@/components/fleet/add-vehicle-sheet";
import { Input } from "@/components/ui/input";
import { subscribeToVehicles, addVehicle } from "@/services/fleet-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const statusVariantMap: Record<Fleet['status'], "default" | "secondary" | "outline" | "destructive"> = {
  'Disponible': 'default',
  'En mission': 'secondary',
  'En maintenance': 'outline',
  'Hors service': 'destructive',
};

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Fleet[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToVehicles(
      (fetchedVehicles) => {
        setVehicles(fetchedVehicles);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Impossible de charger les véhicules. Veuillez vérifier la configuration de votre base de données Firestore et les règles de sécurité.");
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAddVehicle = async (newVehicleData: Omit<Fleet, "id"> & { plate: string }) => {
     try {
        await addVehicle(newVehicleData);
        // State is managed by real-time subscription
        setIsSheetOpen(false);
        toast({
            title: "Véhicule ajouté",
            description: `Le véhicule ${newVehicleData.makeModel} a été ajouté avec succès.`,
        });
     } catch (err) {
        console.error("Failed to add vehicle:", err);
        throw err;
     }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = vehicle.plate.toLowerCase().includes(searchTermLower) ||
             vehicle.makeModel.toLowerCase().includes(searchTermLower) ||
             vehicle.assignedTo.toLowerCase().includes(searchTermLower);
      
      const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion de la Flotte
        </h1>
        <Button onClick={() => setIsSheetOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un véhicule
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Flotte de l'Entreprise</CardTitle>
          <CardDescription>
            Gérez tous les véhicules de l'entreprise et leurs calendriers
            d'entretien.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par plaque, modèle, assigné..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
             <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Disponible">Disponible</SelectItem>
                <SelectItem value="En mission">En mission</SelectItem>
                <SelectItem value="En maintenance">En maintenance</SelectItem>
                <SelectItem value="Hors service">Hors service</SelectItem>
              </SelectContent>
            </Select>
          </div>
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredVehicles.length} résultat(s) trouvé(s).
            </div>
          {error && <p className="text-destructive text-center py-4">{error}</p>}
           <div className="hidden md:block">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Plaque d'immatriculation</TableHead>
                    <TableHead>Marque & Modèle</TableHead>
                    <TableHead>Assigné à</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Entretien Prévu</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    filteredVehicles.map((vehicle) => (
                        <TableRow key={vehicle.plate}>
                          <TableCell className="font-medium">{vehicle.plate}</TableCell>
                          <TableCell>{vehicle.makeModel}</TableCell>
                          <TableCell>{vehicle.assignedTo}</TableCell>
                           <TableCell>
                            <Badge variant={statusVariantMap[vehicle.status]}>{vehicle.status}</Badge>
                          </TableCell>
                          <TableCell>{vehicle.maintenanceDue}</TableCell>
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
                filteredVehicles.map((vehicle) => (
                    <Card key={vehicle.plate}>
                        <CardContent className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <p className="font-bold">{vehicle.makeModel}</p>
                                <Badge variant={statusVariantMap[vehicle.status]}>{vehicle.status}</Badge>
                            </div>
                            <p className="text-sm"><span className="font-medium">Plaque:</span> {vehicle.plate}</p>
                            <p className="text-sm"><span className="font-medium">Assigné à:</span> {vehicle.assignedTo}</p>
                            <p className="text-sm"><span className="font-medium">Prochain entretien:</span> {vehicle.maintenanceDue}</p>
                        </CardContent>
                    </Card>
                ))
              )}
            </div>
          {!loading && filteredVehicles.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucun véhicule trouvé.
            </div>
          )}
        </CardContent>
      </Card>
      <AddVehicleSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddVehicle={handleAddVehicle}
      />
    </div>
  );
}
