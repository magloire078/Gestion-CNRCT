"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    PlusCircle, Search, MoreHorizontal, Eye, 
    Pencil, Trash2, Download, Crown, 
    UserCheck, MapPin, Grid2X2, List,
    FileSpreadsheet, FileJson, Database,
    UserCircle2, ShieldCheck, ChevronRight
} from "lucide-react";
import Link from 'next/link';
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Chief } from "@/lib/data";
import { subscribeToChiefs, addChief, deleteChief } from "@/services/chief-service";
import { AddChiefSheet } from "@/components/chiefs/add-chief-sheet";
import { Badge } from "@/components/ui/badge";
import Papa from "papaparse";
import { ImportChiefsDataCard } from "@/components/chiefs/import-chiefs-data-card";
import { useAuth } from "@/hooks/use-auth";
import { PaginationControls } from "@/components/common/pagination-controls";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { cn } from "@/lib/utils";

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

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(viewMode === 'grid' ? 12 : 10);

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

  const filteredChiefs = useMemo(() => {
    const filtered = chiefs.filter((chief) =>
      (chief.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chief.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chief.village || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chief.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered;
  }, [chiefs, searchTerm]);

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
    <div className="flex flex-col gap-8 pb-20">
      {/* Dynamic Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Corps de la Chefferie</h1>
          <p className="text-muted-foreground mt-2 font-medium">Répertoire souverain des Autorités Traditionnelles de Côte d'Ivoire.</p>
        </div>
        <div className="flex items-center gap-3">
          {canExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-xl h-12 shadow-sm border-slate-200 font-bold">
                  <Download className="mr-2 h-4 w-4 text-slate-400" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl">
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
          <Button onClick={() => setIsAddSheetOpen(true)} className="bg-slate-900 hover:bg-slate-800 rounded-xl h-12 px-6 font-bold shadow-xl shadow-slate-200">
            <PlusCircle className="mr-2 h-5 w-5" />
            Ajouter un Chef
          </Button>
        </div>
      </div>

      {canImport && <ImportChiefsDataCard />}

      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                        <UserCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Souverains & Dignitaires</CardTitle>
                        <CardDescription>{filteredChiefs.length} profils authentifiés dans le registre.</CardDescription>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group w-full sm:w-[320px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <Input
                            placeholder="Nom, titre, village, région..."
                            className="pl-12 h-12 rounded-2xl border-none bg-white shadow-inner focus:ring-slate-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center p-1.5 bg-white rounded-2xl shadow-inner border border-slate-100 shrink-0">
                        <Button 
                            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                            size="icon" 
                            className={cn("h-9 w-9 rounded-xl transition-all", viewMode === 'grid' ? "bg-slate-900 shadow-md" : "text-slate-400")}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid2X2 className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant={viewMode === 'table' ? 'default' : 'ghost'} 
                            size="icon" 
                            className={cn("h-9 w-9 rounded-xl transition-all", viewMode === 'table' ? "bg-slate-900 shadow-md" : "text-slate-400")}
                            onClick={() => setViewMode('table')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </CardHeader>

        <CardContent className="p-8">
          {error && <div className="p-12 text-center text-red-500 font-black uppercase tracking-widest">{error}</div>}

          {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="h-[380px] rounded-[2rem] bg-slate-50 animate-pulse border border-slate-100" />
                      ))
                  ) : paginatedChiefs.map((chief) => (
                      <Link key={chief.id} href={`/chiefs/${chief.id}`} className="group">
                          <Card className="h-full border-none shadow-lg shadow-slate-100 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 flex flex-col relative group">
                              <div className="h-40 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                  <div className="relative z-10 p-4 w-full flex flex-col items-center">
                                       <Avatar className="h-24 w-24 border-4 border-slate-800 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                            <AvatarImage src={chief.photoUrl} alt={chief.name} className="object-cover" />
                                            <AvatarFallback className="bg-slate-800 text-slate-500 font-black text-2xl">{chief.lastName?.charAt(0)}</AvatarFallback>
                                       </Avatar>
                                  </div>
                              </div>
                              <CardHeader className="px-6 pt-6 pb-2 text-center">
                                   <Badge className="mx-auto bg-amber-500/10 text-amber-600 border-none px-3 h-5 text-[9px] font-black uppercase tracking-widest mb-2">
                                       {chief.role}
                                   </Badge>
                                   <CardTitle className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                                       {chief.name}
                                   </CardTitle>
                                   <CardDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">{chief.title}</CardDescription>
                              </CardHeader>
                              <CardContent className="px-6 pb-8 flex-grow">
                                  <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
                                      <div className="flex items-center gap-3 text-slate-500">
                                          <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                              <MapPin className="h-4 w-4 text-slate-300" />
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                              <span className="text-[9px] font-black uppercase text-slate-300">Localité</span>
                                              <span className="text-xs font-bold truncate">{chief.village}</span>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3 text-slate-500">
                                          <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                              <ShieldCheck className="h-4 w-4 text-slate-300" />
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                              <span className="text-[9px] font-black uppercase text-slate-300">Territoire</span>
                                              <span className="text-xs font-bold truncate">{chief.region}</span>
                                          </div>
                                      </div>
                                  </div>
                              </CardContent>
                              <div className="h-1 bg-amber-500 w-0 group-hover:w-full transition-all duration-700" />
                          </Card>
                      </Link>
                  ))}
              </div>
          ) : (
             <div className="overflow-x-auto rounded-3xl border border-slate-100 shadow-inner">
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
                                <TableCell className="text-xs font-medium text-slate-500 italic">{chief.contact || "—"}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-30 group-hover:opacity-100 transition-all">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl border-slate-100">
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
            <div className="py-32 text-center rounded-[3rem] bg-slate-50 border-2 border-dashed border-slate-200">
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
  );
}
