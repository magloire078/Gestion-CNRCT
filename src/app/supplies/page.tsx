
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search, Package } from "lucide-react";
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
import type { Supply } from "@/lib/data";
import { AddSupplySheet } from "@/components/supplies/add-supply-sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToSupplies, addSupply } from "@/services/supply-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export const supplyCategories = ["Papeterie", "Cartouches d'encre", "Matériel de nettoyage", "Autre"];

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToSupplies(
      (fetchedSupplies) => {
        setSupplies(fetchedSupplies);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Impossible de charger les fournitures.");
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAddSupply = async (newSupplyData: Omit<Supply, "id">) => {
     try {
        await addSupply(newSupplyData);
        setIsSheetOpen(false);
        toast({
            title: "Fourniture ajoutée",
            description: `${newSupplyData.name} a été ajouté à l'inventaire.`,
        });
     } catch (err) {
        console.error("Failed to add supply:", err);
        throw err;
     }
  };

  const filteredSupplies = useMemo(() => {
    return supplies.filter(supply => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = supply.name.toLowerCase().includes(searchTermLower);
      const matchesCategory = categoryFilter === 'all' || supply.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [supplies, searchTerm, categoryFilter]);

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity <= 0) return { text: "Rupture", color: "destructive" as const, value: 5, className: "bg-destructive" };
    if (quantity <= reorderLevel) return { text: "Bas", color: "secondary" as const, value: (quantity / (reorderLevel * 2)) * 100, className: "bg-yellow-500" };
    const percentage = Math.min(100, (quantity / (reorderLevel * 2)) * 100);
    return { text: "OK", color: "default" as const, value: percentage, className: "bg-primary" };
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des Fournitures
        </h1>
        <Button onClick={() => setIsSheetOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une fourniture
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inventaire des Fournitures et Consommables</CardTitle>
          <CardDescription>
            Suivez le stock des fournitures de bureau.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
             <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {supplyCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredSupplies.length} résultat(s) trouvé(s).
            </div>
          {error && <p className="text-destructive text-center py-4">{error}</p>}
           <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-center">Seuil</TableHead>
                    <TableHead>Dernier Ajout</TableHead>
                    <TableHead className="w-[200px]">Statut du Stock</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                             <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    filteredSupplies.map((supply) => {
                      const stockStatus = getStockStatus(supply.quantity, supply.reorderLevel);
                      return(
                        <TableRow key={supply.id}>
                          <TableCell className="font-medium">{supply.name}</TableCell>
                          <TableCell>{supply.category}</TableCell>
                          <TableCell className="text-center">{supply.quantity}</TableCell>
                          <TableCell className="text-center">{supply.reorderLevel}</TableCell>
                          <TableCell>{supply.lastRestockDate}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                               <Progress value={stockStatus.value} className="h-3" indicatorClassName={stockStatus.className} />
                               <span className="text-xs font-medium w-16 text-right">{stockStatus.text}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                )}
                </TableBody>
            </Table>
            </div>
          {!loading && filteredSupplies.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4">Aucune fourniture trouvée.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <AddSupplySheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddSupply={handleAddSupply}
      />
    </div>
  );
}

