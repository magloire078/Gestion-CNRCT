
"use client";

import { useState, useMemo } from "react";
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
import { fleetData, Fleet } from "@/lib/data";
import { AddVehicleSheet } from "@/components/fleet/add-vehicle-sheet";
import { Input } from "@/components/ui/input";

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Fleet[]>(fleetData);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddVehicle = (newVehicle: Fleet) => {
    setVehicles([...vehicles, newVehicle]);
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const searchTermLower = searchTerm.toLowerCase();
      return vehicle.plate.toLowerCase().includes(searchTermLower) ||
             vehicle.makeModel.toLowerCase().includes(searchTermLower) ||
             vehicle.assignedTo.toLowerCase().includes(searchTermLower);
    });
  }, [vehicles, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion de la Flotte de Véhicules
        </h1>
        <Button onClick={() => setIsSheetOpen(true)}>
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
           <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par plaque, modèle, assigné..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plaque d'immatriculation</TableHead>
                <TableHead>Marque & Modèle</TableHead>
                <TableHead>Assigné à</TableHead>
                <TableHead>Entretien Prévu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.plate}>
                  <TableCell className="font-medium">{vehicle.plate}</TableCell>
                  <TableCell>{vehicle.makeModel}</TableCell>
                  <TableCell>{vehicle.assignedTo}</TableCell>
                  <TableCell>{vehicle.maintenanceDue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredVehicles.length === 0 && (
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
