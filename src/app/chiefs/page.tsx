"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    PlusCircle, Search, MoreHorizontal, Eye, 
    Pencil, Trash2, Download, Crown, 
    UserCheck, MapPin, Grid2X2, List,
    FileSpreadsheet, FileJson, Database,
    UserCircle2, ShieldCheck, ChevronRight,
    Star, GraduationCap, Medal
} from "lucide-react";
import Link from 'next/link';
import { motion, AnimatePresence } from "framer-motion";
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
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Chief } from "@/types/chief";
import { subscribeToChiefs, addChief, deleteChief } from "@/services/chief-service";
import { AddChiefSheet } from "@/components/chiefs/add-chief-sheet";
import { Badge } from "@/components/ui/badge";
import Papa from "papaparse";
import { useAuth } from "@/hooks/use-auth";
import { PaginationControls } from "@/components/common/pagination-controls";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { ChiefCard } from "@/components/chiefs/chief-card";
import { ChiefQuickView } from "@/components/chiefs/chief-quick-view";

export default function ChiefsPage() {
  const [chiefs, setChiefs] = useState<Chief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<Chief | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  const [selectedChief, setSelectedChief] = useState<Chief | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(viewMode === 'grid' ? 12 : 10);

  const stats = useMemo(() => {
    const activeCount = chiefs.filter(c => c.status === 'actif' || c.status === 'a_vie' || !c.status).length;
    const highLevelRoles = chiefs.filter(c => c.role === 'Roi' || c.role === 'Chef de province').length;
    const regionsCount = new Set(chiefs.map(c => c.region)).size;
    
    return {
      total: chiefs.length,
      active: activeCount,
      highLevel: highLevelRoles,
      regions: regionsCount
    };
  }, [chiefs]);

  const canImport = hasPermission('feature:chiefs:import');
  const canExport = hasPermission('feature:chiefs:export');

  useEffect(() => {
    const unsubscribe = subscribeToChiefs(
      (data) => {
        setChiefs(data);
        setLoading(false);
      },
      (err) => {
        setError("Impossible de charger le répertoire des chefs.");
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAddChief = async (newChiefData: Omit<Chief, "id">, photoFile: File | null) => {
    try {
      await addChief(newChiefData, photoFile);
      setIsSheetOpen(false);
      toast({
        title: "Chef ajouté",
        description: `${newChiefData.name} a été ajouté au répertoire.`,
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteChief = async () => {
    if (!deleteTarget) return;
    try {
      await deleteChief(deleteTarget.id);
      toast({
        title: "Chef supprimé",
        description: `${deleteTarget.name} a été retiré du répertoire.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de supprimer ${deleteTarget.name}.`,
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleShowQuickView = (chief: Chief) => {
    setSelectedChief(chief);
    setIsQuickViewOpen(true);
  };

  const filteredChiefs = useMemo(() => {
    return chiefs.filter((chief) => {
      const matchesSearch = (chief.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (chief.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (chief.village || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (chief.title || '').toLowerCase().includes(searchTerm.toLowerCase());
                            
      const matchesRole = selectedRole === 'all' || chief.role === selectedRole;
      const matchesRegion = selectedRegion === 'all' || chief.region === selectedRegion;
      const matchesStatus = selectedStatus === 'all' || (chief.status || 'actif') === selectedStatus;
      
      return matchesSearch && matchesRole && matchesRegion && matchesStatus;
    });
  }, [chiefs, searchTerm, selectedRole, selectedRegion, selectedStatus]);

  const paginatedChiefs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredChiefs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredChiefs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredChiefs.length / itemsPerPage);

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCsv = () => {
    if (filteredChiefs.length === 0) return;
    const csvData = Papa.unparse(filteredChiefs, { header: true });
    downloadFile(csvData, 'export_chefs.csv', 'text/csv;charset=utf-8;');
  };

  return (
    <PermissionGuard permission="page:chiefs:view">
      <div className="flex flex-col gap-8 pb-20">
      {/* Dynamic Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Authority Life Hub
            <Badge className="bg-amber-500/10 text-amber-600 border-none px-3 py-1 text-xs font-black uppercase tracking-widest hidden sm:flex">Souveraineté</Badge>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Répertoire intelligent et suivi de carrière des Autorités Traditionnelles.</p>
        </div>
        <div className="flex items-center gap-3">
          {canExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-lg h-10 shadow-sm border-slate-200 font-bold">
                  <Download className="mr-2 h-4 w-4 text-slate-400" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-lg shadow-2xl">
                <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-400">Format d'export</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportCsv} className="gap-2 cursor-pointer rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> CSV Excel
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg">
                    <FileJson className="h-4 w-4 text-amber-500" /> JSON Data
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg">
                    <Database className="h-4 w-4 text-blue-500" /> SQL Script
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button onClick={() => setIsSheetOpen(true)} className="bg-slate-900 hover:bg-slate-800 rounded-lg h-10 px-6 font-bold shadow-xl shadow-slate-200">
            <PlusCircle className="mr-2 h-5 w-5" />
            Ajouter un Chef
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden group hover:scale-[1.02] transition-all">
              <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center">
                          <Crown className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="bg-slate-50 text-slate-900 border-none font-bold">CNRCT</Badge>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">{stats.total}</h3>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Autorités répertoriées</p>
              </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden group hover:scale-[1.02] transition-all">
              <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <ShieldCheck className="h-6 w-6 text-amber-600" />
                      </div>
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-none font-bold">Souverains</Badge>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">{stats.highLevel}</h3>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Rois & Provinces</p>
              </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden group hover:scale-[1.02] transition-all">
              <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-emerald-600" />
                      </div>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none font-bold">Rayonnement</Badge>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">{stats.regions}</h3>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Régions couvertes</p>
              </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden group hover:scale-[1.02] transition-all">
              <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <UserCheck className="h-6 w-6 text-indigo-600" />
                      </div>
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-bold">Actifs</Badge>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">{stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}%</h3>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Conformité Administrative</p>
              </CardContent>
          </Card>
      </div>


      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center shadow-lg">
                        <UserCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Souverains & Dignitaires</CardTitle>
                        <CardDescription>{filteredChiefs.length} profils authentifiés dans le registre.</CardDescription>
                    </div>
                </div>
                
                <div className="flex flex-col xl:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:w-auto print:hidden">
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-lg bg-white border-slate-200">
                                <SelectValue placeholder="Tous les Rôles" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                <SelectItem value="all">Tous les Rôles</SelectItem>
                                <SelectItem value="Roi">Rois</SelectItem>
                                <SelectItem value="Chef de province">Provinces</SelectItem>
                                <SelectItem value="Chef de canton">Cantons</SelectItem>
                                <SelectItem value="Chef de tribu">Tribus</SelectItem>
                                <SelectItem value="Chef de Village">Villages</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                            <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-lg bg-white border-slate-200">
                                <SelectValue placeholder="Toutes Régions" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                <SelectItem value="all">Toutes Régions</SelectItem>
                                {IVORIAN_REGIONS.map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-full sm:w-[130px] h-10 rounded-lg bg-white border-slate-200">
                                <SelectValue placeholder="Tous Statuts" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                <SelectItem value="all">Tous Statuts</SelectItem>
                                <SelectItem value="actif">En Exercice</SelectItem>
                                <SelectItem value="a_vie">À Vie</SelectItem>
                                <SelectItem value="archive">Archivés</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative group flex-grow lg:w-[280px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                            <Input
                                placeholder="Rechercher..."
                                className="pl-11 h-10 rounded-lg border-none bg-white shadow-inner focus:ring-slate-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center p-1 bg-white rounded-lg shadow-inner border border-slate-100 shrink-0">
                        <Button 
                            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                            size="icon" 
                            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'grid' ? "bg-slate-900 shadow-md" : "text-slate-400")}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid2X2 className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant={viewMode === 'table' ? 'default' : 'ghost'} 
                            size="icon" 
                            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'table' ? "bg-slate-900 shadow-md" : "text-slate-400")}
                            onClick={() => setViewMode('table')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </CardHeader>

        <CardContent className="p-5">
          {error && <div className="p-12 text-center text-red-500 font-black uppercase tracking-widest">{error}</div>}

          {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="h-[280px] rounded-2xl bg-slate-50 animate-pulse border border-slate-100 shadow-sm" />
                      ))
                  ) : paginatedChiefs.map((chief) => (
                      <ChiefCard 
                        key={chief.id} 
                        chief={chief} 
                        onClick={() => handleShowQuickView(chief)} 
                      />
                  ))}
                </AnimatePresence>
              </div>
          ) : (
             <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-inner">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="w-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">#</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portrait & Dignitaire</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fonction</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Localisation</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coordonnées</TableHead>
                            <TableHead className="w-20 text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-slate-50">
                                    <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-3 w-32" />
                                                <Skeleton className="h-2 w-48" />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : paginatedChiefs.map((chief, index) => (
                            <TableRow key={chief.id} className="group hover:bg-slate-50/50 border-slate-50 transition-colors">
                                <TableCell className="text-center font-mono text-[10px] text-slate-300">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                                            <AvatarImage src={chief.photoUrl} alt={chief.name} />
                                            <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">{chief.lastName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{chief.name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{chief.title}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">{chief.role}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-600">{chief.village}</span>
                                        <span className="text-[10px] text-slate-400">{chief.region} / {chief.department}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs font-medium text-slate-500 italic">{chief.phone || chief.contact || "—"}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-30 group-hover:opacity-100 transition-all">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-lg shadow-2xl border-slate-100">
                                            <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase px-3 py-2">Commanderies</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild className="rounded-lg m-1 cursor-pointer">
                                                <Link href={`/chiefs/${chief.id}`} className="flex items-center">
                                                    <Eye className="mr-2 h-4 w-4 text-blue-500" /> Dossier Individuel
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="rounded-lg m-1 cursor-pointer">
                                                <Link href={`/chiefs/${chief.id}/edit`} className="flex items-center">
                                                    <Pencil className="mr-2 h-4 w-4 text-amber-500" /> Modifier la Fiche
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setDeleteTarget(chief)} className="rounded-lg m-1 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                                <Trash2 className="mr-2 h-4 w-4" /> Retirer du Registre
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
          )}

          {!loading && paginatedChiefs.length === 0 && (
            <div className="py-16 text-center rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <UserCircle2 className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Aucune Autorité Répertoriée</h3>
                <p className="text-slate-400 text-sm italic mt-2">Votre recherche ne correspond à aucun profil dans notre base de données nationale.</p>
            </div>
          )}
        </CardContent>

        {totalPages > 1 && (
          <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-8">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={filteredChiefs.length}
            />
          </CardFooter>
        )}
      </Card>

      <ChiefQuickView
        chief={selectedChief}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />

      <AddChiefSheet
        isOpen={isSheetOpen}
        onCloseAction={() => setIsSheetOpen(false)}
        onAddChiefAction={handleAddChief}
      />
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onCloseAction={() => setDeleteTarget(null)}
        onConfirmAction={handleDeleteChief}
        title={`Radiation du Registre ?`}
        description={`Confirmez-vous le retrait définitif de Sa Majesté ${deleteTarget?.name} des archives officielles de la CNRCT ? Cette action est irréversible.`}
      />
      </div>
    </PermissionGuard>
  );
}
