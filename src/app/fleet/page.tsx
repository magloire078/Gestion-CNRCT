
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { subscribeToVehicles, addVehicle, deleteVehicle, updateVehicle } from "@/services/fleet-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { PaginationControls } from "@/components/common/pagination-controls";
import Link from "next/link";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { FleetOfficialReport } from "@/components/reports/fleet-official-report";
import { getOrganizationSettings } from "@/services/organization-service";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrganizationSettings } from "@/lib/data";


const statusVariantMap: Record<Fleet['status'], "default" | "secondary" | "outline" | "destructive"> = {
  'Disponible': 'default',
  'En mission': 'secondary',
  'En maintenance': 'outline',
  'Hors service': 'destructive',
};

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Fleet[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Fleet | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPrinting, setIsPrinting] = useState(false);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);


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
    getOrganizationSettings().then(setSettings);
    return () => unsubscribe();
  }, []);

  const handleAddVehicle = async (newVehicleData: Omit<Fleet, "id"> & { plate: string }) => {
    try {
      await addVehicle(newVehicleData);
      // State is managed by real-time subscription
      setIsAddSheetOpen(false);
      toast({
        title: "Véhicule ajouté",
        description: `Le véhicule ${newVehicleData.makeModel} a été ajouté avec succès.`,
      });
    } catch (err) {
      console.error("Failed to add vehicle:", err);
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVehicle(deleteTarget.plate);
      toast({
        title: "Véhicule supprimé",
        description: `Le véhicule ${deleteTarget.plate} a été supprimé.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le véhicule."
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredVehicles = useMemo(() => {
    const filtered = vehicles.filter(vehicle => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = vehicle.plate.toLowerCase().includes(searchTermLower) ||
        vehicle.makeModel.toLowerCase().includes(searchTermLower) ||
        vehicle.assignedTo.toLowerCase().includes(searchTermLower);

      const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
      setCurrentPage(1);
    }
    return filtered;

  }, [vehicles, searchTerm, statusFilter, currentPage, itemsPerPage]);

  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVehicles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVehicles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  return (
    <PermissionGuard permission="page:fleet:view">
      <div className={cn("flex flex-col gap-6 pb-12", isPrinting && "hidden")}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-1 flex-shrink-0 bg-slate-900 rounded-full" />
              <div>
                <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900">
                  Gestion Flotte
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 pl-1">
                  Système Centralisé de Surveillance de Mobilité
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Flux de données temps réel actif</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="h-14 px-6 rounded-[1.5rem] border-slate-200 bg-white/50 backdrop-blur-md font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 active:scale-95 transition-all text-slate-600"
            >
              <Printer className="mr-3 h-5 w-5 text-blue-500" />
              Rapport Officiel
            </Button>
            <Button
              onClick={() => setIsAddSheetOpen(true)}
              className="h-14 px-8 rounded-[1.5rem] bg-slate-900 shadow-2xl shadow-slate-900/20 font-black uppercase tracking-widest text-[11px] hover:bg-black active:scale-95 transition-all text-white border-t border-white/10"
            >
              <PlusCircle className="mr-3 h-5 w-5 text-emerald-400" />
              Intégrer Véhicule
            </Button>
          </div>
        </div>
        <Card className="border-white/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden rounded-[2.5rem] px-2">
          <CardHeader className="border-b border-border/50 bg-primary/5 py-8 px-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Registre du Parc Automobile</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                  Inventaire technique et opérationnel de la flotte
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="IDENTIFICATION VÉHICULE..."
                    className="h-12 pl-12 pr-4 rounded-xl border-slate-200 bg-white/50 focus:bg-white transition-all font-black text-[10px] tracking-widest"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 w-full sm:w-[220px] rounded-xl border-slate-200 bg-white/50 font-black uppercase text-[9px] tracking-widest">
                    <SelectValue placeholder="FILTRER PAR STATUT" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                    <SelectItem value="all" className="font-bold py-3 uppercase text-[9px] tracking-widest">Toute la flotte</SelectItem>
                    <SelectItem value="Disponible" className="font-bold py-3 uppercase text-[9px] tracking-widest text-emerald-600">Disponible</SelectItem>
                    <SelectItem value="En mission" className="font-bold py-3 uppercase text-[9px] tracking-widest text-blue-600">En mission</SelectItem>
                    <SelectItem value="En maintenance" className="font-bold py-3 uppercase text-[9px] tracking-widest text-orange-600">Maintenance</SelectItem>
                    <SelectItem value="Hors service" className="font-bold py-3 uppercase text-[9px] tracking-widest text-rose-600">Hors service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="p-8 text-center text-destructive font-black uppercase text-xs tracking-widest">
                {error}
              </div>
            )}

            {/* Desktop View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="w-[80px] py-6 px-8 font-black uppercase text-[10px] tracking-widest text-center text-slate-400">ID</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Immatriculation</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Type de Véhicule</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Affectation Actuelle</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Statut</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Entretien</TableHead>
                    <TableHead className="sr-only">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-border/20">
                        <TableCell className="px-8"><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    paginatedVehicles.map((vehicle, index) => (
                      <TableRow key={vehicle.plate} className="border-border/20 hover:bg-white/40 transition-all group h-20">
                        <TableCell className="text-center font-black text-slate-300 group-hover:text-slate-900 transition-colors px-8">
                          {((currentPage - 1) * itemsPerPage + index + 1).toString().padStart(2, '0')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 uppercase tracking-tight text-sm group-hover:text-blue-600 transition-all">
                              {vehicle.plate}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certifié CNRCT</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-700 uppercase tracking-tight">{vehicle.makeModel}</TableCell>
                        <TableCell className="font-bold text-slate-500 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            {vehicle.assignedTo}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariantMap[vehicle.status]} className="font-black text-[9px] uppercase tracking-widest rounded-lg px-3 py-1 border-none shadow-sm">
                            {vehicle.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-700">{vehicle.maintenanceDue}</span>
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mt-0.5">Échéance de contrôle</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-200/50 transition-colors">
                                <MoreHorizontal className="h-5 w-5 text-slate-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl">
                              <DropdownMenuLabel className="px-3 py-2 font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Actions Flotte</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/fleet/${vehicle.plate}/edit`} className="rounded-xl font-bold py-2.5 px-3 focus:bg-slate-100 cursor-pointer flex items-center">
                                  <Pencil className="mr-2 h-4 w-4 text-slate-600" /> Modifier les données
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteTarget(vehicle)} className="rounded-xl text-rose-600 font-bold py-2.5 px-3 focus:bg-rose-50 focus:text-rose-600 cursor-pointer flex items-center">
                                <Trash2 className="mr-2 h-4 w-4" /> Retrait Définitif
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-4 md:hidden p-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-[2rem]" />
                ))
              ) : (
                paginatedVehicles.map((vehicle) => (
                  <Card key={vehicle.plate} className="bg-white/50 border-white/10 rounded-[2rem] shadow-lg overflow-hidden active:scale-95 transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant={statusVariantMap[vehicle.status]} className="font-black text-[9px] uppercase tracking-widest rounded-md px-2 py-0.5 border-none shadow-sm">
                          {vehicle.status}
                        </Badge>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{vehicle.plate}</span>
                      </div>
                      <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight mt-2">
                        {vehicle.makeModel}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 space-y-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigné à</span>
                        <span className="text-xs font-bold text-slate-700">{vehicle.assignedTo}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maintenance</span>
                        <span className="text-xs font-bold text-slate-700">{vehicle.maintenanceDue}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end p-4 pt-0 border-t border-slate-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] tracking-widest text-slate-400">Actions</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl shadow-xl p-2">
                          <DropdownMenuItem asChild>
                            <Link href={`/fleet/${vehicle.plate}/edit`} className="font-bold rounded-lg px-3 py-2 flex items-center">
                              <Pencil className="mr-2 h-4 w-4" /> Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(vehicle)} className="text-rose-600 font-bold rounded-lg px-3 py-2 flex items-center">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>

            {!loading && paginatedVehicles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-black uppercase tracking-tight">Aucun véhicule identifié</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Ajustez vos filtres de recherche</p>
              </div>
            )}
          </CardContent>
          {totalPages > 1 && (
            <CardFooter className="py-8 px-8 border-t border-border/50">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={filteredVehicles.length}
              />
            </CardFooter>
          )}
        </Card>

        <AddVehicleSheet
          isOpen={isAddSheetOpen}
          onClose={() => setIsAddSheetOpen(false)}
          onAddVehicle={handleAddVehicle}
        />
        <ConfirmationDialog
          isOpen={!!deleteTarget}
          onCloseAction={() => setDeleteTarget(null)}
          onConfirmAction={handleDeleteConfirm}
          title={`Supprimer le véhicule ${deleteTarget?.plate}`}
          description="Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible."
        />
      </div>

      {isPrinting && (
        <FleetOfficialReport vehicles={vehicles} organizationSettings={settings} />
      )}
    </PermissionGuard>
  );
}
