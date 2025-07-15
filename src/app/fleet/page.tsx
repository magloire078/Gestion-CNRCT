import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fleetData } from "@/lib/data";

export default function FleetPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Fleet Management</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Company Fleet</CardTitle>
          <CardDescription>Manage all company vehicles and their maintenance schedules.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Plate</TableHead>
                <TableHead>Make & Model</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Maintenance Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fleetData.map((vehicle) => (
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
    </div>
  );
}