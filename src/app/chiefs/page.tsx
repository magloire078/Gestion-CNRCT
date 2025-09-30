
"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle, Search, MoreHorizontal, Eye, Pencil, Trash2, Download } from "lucide-react";
import Link from 'next/link';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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

export default function ChiefsPage() {
  const [chiefs, setChiefs] = useState<Chief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { hasPermission } = useAuth();

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
      throw err; // Re-throw to be handled in the sheet component
    }
  };

  const handleDeleteChief = async (chief: Chief) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${chief.name} du répertoire ?`)) {
      try {
        await deleteChief(chief.id);
        toast({
          title: "Chef supprimé",
          description: `${chief.name} a été retiré du répertoire.`,
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: `Impossible de supprimer ${chief.name}.`,
        });
      }
    }
  };

  const filteredChiefs = useMemo(() => {
    return chiefs.filter((chief) =>
      chief.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chief.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chief.village || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      chief.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chiefs, searchTerm]);
  
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
    if (filteredChiefs.length === 0) {
      toast({ variant: "destructive", title: "Aucune donnée à exporter" });
      return;
    }
    const csvData = Papa.unparse(filteredChiefs, {
        header: true,
    });
    downloadFile(csvData, 'export_chefs.csv', 'text/csv;charset=utf-8;');
    toast({ title: "Exportation CSV réussie" });
  };
  
  const handleExportJson = () => {
    if (filteredChiefs.length === 0) {
      toast({ variant: "destructive", title: "Aucune donnée à exporter" });
      return;
    }
    const jsonData = JSON.stringify(filteredChiefs, null, 2);
    downloadFile(jsonData, 'export_chefs.json', 'application/json;charset=utf-8;');
    toast({ title: "Exportation JSON réussie" });
  };
  
  const handleExportSql = () => {
    if (filteredChiefs.length === 0) {
      toast({ variant: "destructive", title: "Aucune donnée à exporter" });
      return;
    }

    const escapeSql = (str: string | number | undefined | null) => {
      if (str === null || str === undefined) return 'NULL';
      if (typeof str === 'number') return str;
      return `'${String(str).replace(/'/g, "''")}'`;
    };

    const tableName = 'chiefs';
    const columns = ['id', 'name', 'title', 'role', 'region', 'department', 'subPrefecture', 'village', 'contact', 'bio', 'photoUrl', 'latitude', 'longitude', 'parentChiefId', 'dateOfBirth', 'regencyStartDate', 'regencyEndDate'];
    
    const sqlContent = filteredChiefs.map(chief => {
      const values = columns.map(col => escapeSql(chief[col as keyof Chief])).join(', ');
      return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
    }).join('\n');

    downloadFile(sqlContent, 'export_chefs.sql', 'application/sql');
    toast({ title: "Exportation SQL réussie" });
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rois et Chefs Traditionnels</h1>
        <div className="flex gap-2">
            {canExport && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExportCsv}>Exporter en CSV</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportJson}>Exporter en JSON</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportSql}>Exporter en SQL</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            <Button onClick={() => setIsSheetOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un Chef
            </Button>
        </div>
      </div>
      {canImport && (
        <div className="mb-6">
          <ImportChiefsDataCard />
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Répertoire Officiel</CardTitle>
          <CardDescription>
            Consultez et gérez le répertoire des autorités traditionnelles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, région, village..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

           <div className="mb-4 text-sm text-muted-foreground">
              {filteredChiefs.length} résultat(s) trouvé(s).
            </div>

          {error && <p className="text-destructive text-center py-4">{error}</p>}
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead className="w-[80px]">Photo</TableHead>
                  <TableHead>Nom & Titre</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><div className="flex justify-end"><Skeleton className="h-8 w-8" /></div></TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredChiefs.map((chief, index) => (
                    <TableRow key={chief.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={chief.photoUrl} alt={chief.name} data-ai-hint="chief portrait" />
                          <AvatarFallback>{chief.lastName?.charAt(0) || 'C'}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{`${chief.lastName || ''} ${chief.firstName || ''}`.trim()}</div>
                        <div className="text-sm text-muted-foreground">{chief.title}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{chief.role}</Badge>
                      </TableCell>
                       <TableCell>
                        <div className="font-medium">{chief.village}</div>
                        <div className="text-sm text-muted-foreground">{chief.region} / {chief.department}</div>
                      </TableCell>
                      <TableCell>{chief.contact}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ouvrir le menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/chiefs/${chief.id}`}>
                                   <Eye className="mr-2 h-4 w-4" /> Voir les détails
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/chiefs/${chief.id}/edit`}>
                                   <Pencil className="mr-2 h-4 w-4" /> Modifier
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteChief(chief)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
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

          {!loading && filteredChiefs.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              Aucun chef trouvé.
            </div>
          )}
        </CardContent>
      </Card>
      <AddChiefSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddChief={handleAddChief}
      />
    </div>
  );
}
