"use client";

import { useState, useEffect, useMemo, forwardRef } from "react";
import Fuse from "fuse.js";
import { TableVirtuoso, VirtuosoGrid } from "react-virtuoso";
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
import { ChiefsMapWrapper } from "@/components/map/map-wrapper";
import { Map as MapIcon } from "lucide-react";

export default function ChiefsPage() {
  const [chiefs, setChiefs] = useState<Chief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<Chief | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('grid');

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

  // Fuse Instance for fuzzy searching
  const fuseInstance = useMemo(() => {
    return new Fuse(chiefs, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'region', weight: 1 },
        { name: 'village', weight: 1 },
        { name: 'title', weight: 1 }
      ],
      threshold: 0.3,
      ignoreLocation: true
    });
  }, [chiefs]);

  const filteredChiefs = useMemo(() => {
    let baseChiefs = chiefs;

    // 1. Search Filter (Fuzzy)
    if (searchTerm.trim() !== '') {
      const results = fuseInstance.search(searchTerm);
      baseChiefs = results.map(result => result.item);
    }

    return baseChiefs.filter((chief) => {
      const matchesRole = selectedRole === 'all' || chief.role === selectedRole;
      const matchesRegion = selectedRegion === 'all' || chief.region === selectedRegion;
      const matchesStatus = selectedStatus === 'all' || (chief.status || 'actif') === selectedStatus;
      
      return matchesRole && matchesRegion && matchesStatus;
    });
  }, [chiefs, fuseInstance, searchTerm, selectedRole, selectedRegion, selectedStatus]);

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
            Autorités Traditionnelles
            <Badge className="bg-amber-500/10 text-amber-600 border-none px-3 py-1 text-xs font-black uppercase tracking-widest hidden sm:flex">RÉPERTOIRE</Badge>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Répertoire intelligent et suivi de carrière des Autorités Traditionnelles.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {canExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto rounded-lg h-10 shadow-sm border-slate-200 font-bold">
                  <Download className="mr-2 h-4 w-4 text-slate-400" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-lg shadow-2xl">
                <DropdownMenuLabel className="text-sm uppercase font-black text-slate-400">Format d'export</DropdownMenuLabel>
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
          <Button onClick={() => setIsSheetOpen(true)} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 rounded-lg h-10 px-6 font-bold shadow-xl shadow-slate-200">
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

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <div className="relative group flex-grow lg:w-[280px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                            <Input
                                placeholder="Rechercher..."
                                className="pl-11 h-10 rounded-lg border-none bg-white shadow-inner focus:ring-slate-900 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-center p-1 bg-white rounded-lg shadow-inner border border-slate-100 shrink-0 w-full sm:w-auto">
                        <Button 
                            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                            size="icon" 
                            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'grid' ? "bg-slate-900 shadow-md" : "text-slate-400 hover:text-slate-900")}
                            onClick={() => setViewMode('grid')}
                            title="Vue Grille"
                        >
                            <Grid2X2 className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant={viewMode === 'table' ? 'default' : 'ghost'} 
                            size="icon" 
                            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'table' ? "bg-slate-900 shadow-md" : "text-slate-400 hover:text-slate-900")}
                            onClick={() => setViewMode('table')}
                            title="Vue Tableau"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant={viewMode === 'map' ? 'default' : 'ghost'} 
                            size="icon" 
                            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'map' ? "bg-slate-900 shadow-md" : "text-slate-400 hover:text-slate-900")}
                            onClick={() => setViewMode('map')}
                            title="Vue Carte (SIG)"
                        >
                            <MapIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </CardHeader>

        <CardContent className="p-5">
          {error && <div className="p-12 text-center text-red-500 font-black uppercase tracking-widest">{error}</div>}

          {viewMode === 'grid' ? (
              <VirtuosoGrid
                useWindowScroll
                data={filteredChiefs}
                listClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                itemContent={(index, chief) => (
                    <ChiefCard 
                      key={chief.id} 
                      chief={chief} 
                      onClick={() => handleShowQuickView(chief)} 
                    />
                )}
              />
          ) : viewMode === 'map' ? (
              <div className="rounded-[2rem] border-4 border-slate-100/50 shadow-inner overflow-hidden relative">
                  <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200">
                      <p className="text-sm font-black uppercase tracking-widest text-slate-500">Autorités Visibles : <span className="text-slate-900">{filteredChiefs.length}</span></p>
                  </div>
                  <ChiefsMapWrapper 
                      chiefs={filteredChiefs} 
                      onChiefClick={handleShowQuickView} 
                      height="600px"
                  />
              </div>
          ) : (
             <div className="rounded-xl border border-slate-100 shadow-inner overflow-hidden bg-white">
                <TableVirtuoso
                    useWindowScroll
                    data={filteredChiefs}
                    components={{
                        Table: ({ style, ...props }) => <table {...props} style={{ ...style, width: "100%", borderCollapse: "collapse" }} className="w-full caption-bottom text-sm" />,
                        TableHead: forwardRef((props, ref) => <thead {...props} ref={ref as any} className="[&_tr]:border-b bg-slate-50/50" />),
                        TableRow: (props) => <tr {...props} className="group hover:bg-slate-50/50 border-slate-50 transition-colors border-b" />,
                        TableBody: forwardRef((props, ref) => <tbody {...props} ref={ref as any} className="[&_tr:last-child]:border-0" />),
                    }}
                    fixedHeaderContent={() => (
                        <tr className="border-slate-100 hover:bg-transparent">
                            <th className="h-12 px-4 align-middle text-center text-sm font-black uppercase tracking-widest text-slate-400 w-12">#</th>
                            <th className="h-12 px-4 align-middle text-left text-sm font-black uppercase tracking-widest text-slate-400">Portrait & Dignitaire</th>
                            <th className="h-12 px-4 align-middle text-left text-sm font-black uppercase tracking-widest text-slate-400">Fonction</th>
                            <th className="h-12 px-4 align-middle text-left text-sm font-black uppercase tracking-widest text-slate-400">Localisation</th>
                            <th className="h-12 px-4 align-middle text-left text-sm font-black uppercase tracking-widest text-slate-400">Coordonnées</th>
                            <th className="h-12 px-4 align-middle text-right w-20"></th>
                        </tr>
                    )}
                    itemContent={(index, chief) => (
                        <>
                            <td className="p-4 align-middle text-center font-mono text-sm text-slate-300">{index + 1}</td>
                            <td className="p-4 align-middle">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                                        <AvatarImage src={chief.photoUrl} alt={chief.name} />
                                        <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">{chief.lastName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{chief.name}</span>
                                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{chief.title}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 align-middle">
                                <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-sm font-black uppercase tracking-wider">{chief.role}</Badge>
                            </td>
                            <td className="p-4 align-middle">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-600">{chief.village}</span>
                                    <span className="text-sm text-slate-400">{chief.region} / {chief.department}</span>
                                </div>
                            </td>
                            <td className="p-4 align-middle text-xs font-medium text-slate-500 italic">{chief.phone || chief.contact || "—"}</td>
                            <td className="p-4 align-middle text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-30 group-hover:opacity-100 transition-all">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-lg shadow-2xl border-slate-100">
                                        <DropdownMenuLabel className="text-sm font-black text-slate-400 uppercase px-3 py-2">Commanderies</DropdownMenuLabel>
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
                            </td>
                        </>
                    )}
                />
             </div>
          )}

          {!loading && filteredChiefs.length === 0 && (
            <div className="py-16 text-center rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <UserCircle2 className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Aucune Autorité Répertoriée</h3>
                <p className="text-slate-400 text-sm italic mt-2">Votre recherche ne correspond à aucun profil dans notre base de données nationale.</p>
            </div>
          )}
        </CardContent>


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
