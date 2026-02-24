
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search, Package, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Supply } from "@/lib/data";
import { AddSupplySheet } from "@/components/supplies/add-supply-sheet";
import { EditSupplySheet } from "@/components/supplies/edit-supply-sheet";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToSupplies, addSupply, updateSupply, deleteSupply } from "@/services/supply-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { PaginationControls } from "@/components/common/pagination-controls";


import { supplyCategories } from "@/lib/constants/supply";

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supply | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      setIsAddSheetOpen(false);
      toast({
        title: "Fourniture ajoutée",
        description: `${newSupplyData.name} a été ajouté à l'inventaire.`,
      });
    } catch (err) {
      console.error("Failed to add supply:", err);
      throw err;
    }
  };

  const handleUpdateSupply = async (id: string, dataToUpdate: Partial<Omit<Supply, "id">>) => {
    try {
      await updateSupply(id, dataToUpdate);
      setIsEditSheetOpen(false);
      toast({
        title: "Fourniture mise à jour",
        description: "L'article a été mis à jour avec succès.",
      });
    } catch (err) {
      console.error("Failed to update supply:", err);
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSupply(deleteTarget.id);
      toast({
        title: "Fourniture supprimée",
        description: `L'article "${deleteTarget.name}" a été supprimé.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer l'article.",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEditSheet = (supply: Supply) => {
    setSelectedSupply(supply);
    setIsEditSheetOpen(true);
  }

  const filteredSupplies = useMemo(() => {
    const filtered = supplies.filter(supply => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = supply.name.toLowerCase().includes(searchTermLower);
      const matchesCategory = categoryFilter === 'all' || supply.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
      setCurrentPage(1);
    }
    return filtered;

  }, [supplies, searchTerm, categoryFilter, currentPage, itemsPerPage]);

  const paginatedSupplies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSupplies.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSupplies, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSupplies.length / itemsPerPage);

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity <= 0) return { text: "Rupture", color: "destructive" as const, value: 5, className: "bg-destructive" };
    if (quantity <= reorderLevel) return { text: "Bas", color: "secondary" as const, value: (quantity / (reorderLevel * 2)) * 100, className: "bg-yellow-500" };
    const percentage = Math.min(100, (quantity / (reorderLevel * 2)) * 100);
    return { text: "OK", color: "default" as const, value: percentage, className: "bg-primary" };
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des Fournitures
          </h1>
          <Button onClick={() => setIsAddSheetOpen(true)} className="w-full sm:w-auto">
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
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-center">Seuil</TableHead>
                    <TableHead>Dernier Ajout</TableHead>
                    <TableHead className="w-[200px]">Statut du Stock</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    paginatedSupplies.map((supply, index) => {
                      const stockStatus = getStockStatus(supply.quantity, supply.reorderLevel);
                      return (
                        <TableRow key={supply.id}>
                          <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
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
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditSheet(supply)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeleteTarget(supply)} className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
                ))
              ) : (
                paginatedSupplies.map((supply, index) => {
                  const stockStatus = getStockStatus(supply.quantity, supply.reorderLevel);
                  return (
                    <Card key={supply.id} onClick={() => openEditSheet(supply)}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {(currentPage - 1) * itemsPerPage + index + 1}. {supply.name}
                        </CardTitle>
                        <CardDescription>{supply.category}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Quantité:</span> {supply.quantity} (Seuil: {supply.reorderLevel})</p>
                          <Progress value={stockStatus.value} className="h-2" indicatorClassName={stockStatus.className} />
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">Dernier ajout: {supply.lastRestockDate}</p>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
            {!loading && paginatedSupplies.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4">Aucune fourniture trouvée.</p>
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
                totalItems={filteredSupplies.length}
              />
            </CardFooter>
          )}
        </Card>
        <AddSupplySheet
          isOpen={isAddSheetOpen}
          onCloseAction={() => setIsAddSheetOpen(false)}
          onAddSupplyAction={handleAddSupply}
        />
        {selectedSupply && (
          <EditSupplySheet
            isOpen={isEditSheetOpen}
            onClose={() => setIsEditSheetOpen(false)}
            onUpdateSupply={handleUpdateSupply}
            supply={selectedSupply}
          />
        )}
        <ConfirmationDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title={`Supprimer "${deleteTarget?.name}"`}
          description="Êtes-vous sûr de vouloir supprimer cet article de l'inventaire ? Cette action est irréversible."
        />
      </div>
    </>
  );
}
