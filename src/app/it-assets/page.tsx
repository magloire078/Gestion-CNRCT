
"use client";

import { useState, useMemo } from "react";
import { PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { assetData, Asset } from "@/lib/data";
import { AddAssetSheet } from "@/components/it-assets/add-asset-sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Status = 'In Use' | 'In Stock' | 'In Repair' | 'Retired' | 'Active';

const statusVariantMap: Record<Status, "default" | "secondary" | "outline"> = {
  'In Use': 'default',
  'Active': 'default',
  'In Stock': 'secondary',
  'In Repair': 'outline',
  'Retired': 'outline',
};

const assetTypes = ["Laptop", "Monitor", "Keyboard", "Mouse", "Software", "Other"];

export default function ItAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>(assetData);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleAddAsset = (newAsset: Omit<Asset, 'tag'>) => {
    const newTag = `IT-NEW-${(assets.length + 1).toString().padStart(3, '0')}`;
    setAssets([...assets, { tag: newTag, ...newAsset }]);
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = asset.model.toLowerCase().includes(searchTermLower) ||
                            asset.assignedTo.toLowerCase().includes(searchTermLower) ||
                            asset.tag.toLowerCase().includes(searchTermLower);
      const matchesType = typeFilter === 'all' || asset.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [assets, searchTerm, typeFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Actifs Informatiques</h1>
        <Button onClick={() => setIsSheetOpen(true)}>
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
           <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par étiquette, modèle, assigné..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {assetTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="In Use">En Utilisation</SelectItem>
                <SelectItem value="In Stock">En Stock</SelectItem>
                <SelectItem value="In Repair">En Réparation</SelectItem>
                <SelectItem value="Retired">Retiré</SelectItem>
                <SelectItem value="Active">Actif</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              {filteredAssets.map((asset) => (
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
          {filteredAssets.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucun actif trouvé.
            </div>
          )}
        </CardContent>
      </Card>
      <AddAssetSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddAsset={handleAddAsset}
      />
    </div>
  );
}
