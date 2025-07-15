"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
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

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Fleet[]>(fleetData);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleAddVehicle = (newVehicle: Fleet) => {
    setVehicles([...vehicles, newVehicle]);
  };

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
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.plate}>
                  <TableCell className="font-medium">{vehicle.plate}</TableCell>
                  <TableCell>{vehicle.makeModel}</TableCell>
                  <TableCell>{vehicle.assignedTo}</TableCell>
                  <TableCell>{vehicle.maintenanceDue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
