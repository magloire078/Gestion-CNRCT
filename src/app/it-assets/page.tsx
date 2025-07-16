
"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Asset } from "@/lib/data";
import { AddAssetSheet } from "@/components/it-assets/add-asset-sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAssets, addAsset } from "@/services/asset-service";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchAssets() {
      try {
        setLoading(true);
        const fetchedAssets = await getAssets();
        setAssets(fetchedAssets);
        setError(null);
      } catch (err) {
        setError("Impossible de charger les actifs. Veuillez vérifier la configuration de votre base de données Firestore et les règles de sécurité.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

  const handleAddAsset = async (newAssetData: Omit<Asset, 'tag'>) => {
    try {
      const newAsset = await addAsset(newAssetData);
      setAssets(prev => [...prev, newAsset]);
      setIsSheetOpen(false);
    } catch (err) {
      console.error("Failed to add asset:", err);
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (!asset.model || !asset.assignedTo || !asset.tag) return false;
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
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Actifs Informatiques</h1>
        <Button onClick={() => setIsSheetOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un actif
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
          {error && <p className="text-destructive text-center py-4">{error}</p>}
          <div className="hidden md:block">
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
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    </TableRow>
                    ))
                ) : (
                    filteredAssets.map((asset) => (
                    <TableRow key={asset.tag}>
                        <TableCell className="font-medium">{asset.tag}</TableCell>
                        <TableCell>{asset.type}</TableCell>
                        <TableCell>{asset.model}</TableCell>
                        <TableCell>{asset.assignedTo}</TableCell>
                        <TableCell>
                        <Badge variant={statusVariantMap[asset.status as Status] || 'default'}>{asset.status}</Badge>
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
                filteredAssets.map((asset) => (
                  <Card key={asset.tag}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{asset.model}</p>
                          <p className="text-sm text-muted-foreground">{asset.type}</p>
                        </div>
                        <Badge variant={statusVariantMap[asset.status as Status] || 'default'}>{asset.status}</Badge>
                      </div>
                      <p className="text-sm"><span className="font-medium">Tag:</span> {asset.tag}</p>
                      <p className="text-sm"><span className="font-medium">Assigné à:</span> {asset.assignedTo}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          { !loading && filteredAssets.length === 0 && (
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
    </>
  );
}
