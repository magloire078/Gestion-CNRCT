import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { assetData } from "@/lib/data";

type Status = 'In Use' | 'In Stock' | 'In Repair' | 'Retired' | 'Active';

const statusVariantMap: Record<Status, "default" | "secondary" | "outline"> = {
  'In Use': 'default',
  'Active': 'default',
  'In Stock': 'secondary',
  'In Repair': 'outline',
  'Retired': 'outline',
};

export default function ItAssetsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Actifs Informatiques</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un nouvel actif
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inventaire des actifs</CardTitle>
          <CardDescription>Suivez tout le matériel et les licences logicielles de l'entreprise.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Étiquette d'actif</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Modèle</TableHead>
                <TableHead>Assigné à</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetData.map((asset) => (
                <TableRow key={asset.tag}>
                  <TableCell className="font-medium">{asset.tag}</TableCell>
                  <TableCell>{asset.type}</TableCell>
                  <TableCell>{asset.model}</TableCell>
                  <TableCell>{asset.assignedTo}</TableCell>
                   <TableCell>
                    <Badge variant={statusVariantMap[asset.status as Status] || 'default'}>{asset.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
