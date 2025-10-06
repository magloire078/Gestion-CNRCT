
"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle, Search, Eye, Pencil, Trash2, MoreHorizontal, Laptop, Monitor, Printer as PrinterIcon, Keyboard, Mouse, FileCode, Package as PackageIcon, Download, Server, Printer } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Asset, OrganizationSettings } from "@/lib/data";
import { AddAssetSheet } from "@/components/it-assets/add-asset-sheet";
import { EditAssetSheet } from "@/components/it-assets/edit-asset-sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subscribeToAssets, addAsset, deleteAsset, updateAsset } from "@/services/asset-service";
import { getOrganizationSettings } from "@/services/organization-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { ImportAssetsDataCard } from "@/components/it-assets/import-assets-data-card";
import { PrintAssetsDialog } from "@/components/it-assets/print-assets-dialog";
import { PaginationControls } from "@/components/common/pagination-controls";
import { useAuth } from "@/hooks/use-auth";


type Status = 'En utilisation' | 'En stock' | 'En réparation' | 'Retiré';

const statusVariantMap: Record<Status, "default" | "secondary" | "outline"> = {
  'En utilisation': 'default',
  'En stock': 'secondary',
  'En réparation': 'outline',
  'Retiré': 'outline',
};

const assetTypes: Asset['type'][] = ["Ordinateur", "Moniteur", "Imprimante", "Clavier", "Souris", "Logiciel", "Équipement Réseau", "Autre"];
const assetStatuses: Asset['status'][] = ['En utilisation', 'En stock', 'En réparation', 'Retiré'];

const assetIcons: Record<Asset['type'], React.ElementType> = {
  "Ordinateur": Laptop,
  "Moniteur": Monitor,
  "Imprimante": PrinterIcon,
  "Clavier": Keyboard,
  "Souris": Mouse,
  "Logiciel": FileCode,
  "Équipement Réseau": Server,
  "Autre": PackageIcon,
};

export const allAssetColumns = {
  tag: "N° Inventaire",
  type: "Type",
  fabricant: "Fabricant",
  modele: "Modèle",
  numeroDeSerie: "N° Série",
  ipAddress: "Adresse IP",
  assignedTo: "Assigné à",
  status: "Statut",
};
export type AssetColumnKeys = keyof typeof allAssetColumns;

export default function ItAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { hasPermission } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [columnsToPrint, setColumnsToPrint] = useState<AssetColumnKeys[]>(Object.keys(allAssetColumns) as AssetColumnKeys[]);
  const [organizationLogos, setOrganizationLogos] = useState<OrganizationSettings | null>(null);
  const [printDate, setPrintDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const canImport = hasPermission('feature:it-assets:import');

  const openEditSheet = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsEditSheetOpen(true);
  };

  useEffect(() => {
    const unsubscribe = subscribeToAssets(
      (fetchedAssets) => {
        setAssets(fetchedAssets);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Impossible de charger les actifs. Veuillez vérifier la configuration de votre base de données Firestore et les règles de sécurité.");
        console.error(err);
        setLoading(false);
      }
    );
    getOrganizationSettings().then(setOrganizationLogos);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (isPrinting) {
          document.body.classList.add('print-landscape');
          setTimeout(() => {
              window.print();
              setIsPrinting(false);
              document.body.classList.remove('print-landscape');
          }, 500);
      }
  }, [isPrinting]);

  const handleAddAsset = async (newAssetData: Omit<Asset, 'tag'> & { tag: string }) => {
    try {
      await addAsset(newAssetData);
      setIsAddSheetOpen(false);
      toast({ title: 'Actif ajouté', description: `L'actif ${newAssetData.modele} a été ajouté avec succès.` });
    } catch (err) {
      console.error("Failed to add asset:", err);
      throw err;
    }
  };

  const handleUpdateAsset = async (tag: string, assetData: Partial<Asset>) => {
    try {
      await updateAsset(tag, assetData);
      setIsEditSheetOpen(false);
      toast({ title: "Actif mis à jour", description: "Les informations de l'actif ont été modifiées." });
    } catch(err) {
      console.error(err);
      throw(err);
    }
  };
  
  const handleDeleteAsset = async () => {
    if (!deleteTarget) return;

    try {
        await deleteAsset(deleteTarget.tag);
        toast({ title: "Actif supprimé", description: `L'actif ${deleteTarget.tag} a été supprimé.` });
    } catch (err) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'actif." });
    } finally {
        setDeleteTarget(null);
    }
  };

  const filteredAssets = useMemo(() => {
    const filtered = assets.filter(asset => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = 
          asset.tag.toLowerCase().includes(searchTermLower) ||
          (asset.fabricant || '').toLowerCase().includes(searchTermLower) ||
          asset.modele.toLowerCase().includes(searchTermLower) ||
          (asset.numeroDeSerie || '').toLowerCase().includes(searchTermLower) ||
          (asset.ipAddress || '').toLowerCase().includes(searchTermLower) ||
          asset.assignedTo.toLowerCase().includes(searchTermLower);

      const matchesType = typeFilter === 'all' || asset.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
        setCurrentPage(1);
    }
    return filtered;

  }, [assets, searchTerm, typeFilter, statusFilter, currentPage, itemsPerPage]);
  
  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAssets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

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
    if (filteredAssets.length === 0) {
      toast({ variant: "destructive", title: "Aucune donnée à exporter" });
      return;
    }
    const csvData = Papa.unparse(filteredAssets);
    downloadFile(csvData, 'export_actifs.csv', 'text/csv;charset=utf-8;');
    toast({ title: "Exportation CSV réussie" });
  };

  const handleExportJson = () => {
    if (filteredAssets.length === 0) {
      toast({ variant: "destructive", title: "Aucune donnée à exporter" });
      return;
    }
    const jsonData = JSON.stringify(filteredAssets, null, 2);
    downloadFile(jsonData, 'export_actifs.json', 'application/json;charset=utf-8;');
    toast({ title: "Exportation JSON réussie" });
  };
  
  const handleExportSql = () => {
    if (filteredAssets.length === 0) {
      toast({ variant: "destructive", title: "Aucune donnée à exporter" });
      return;
    }
    const escapeSql = (str: any) => str ? `'${String(str).replace(/'/g, "''")}'` : 'NULL';
    const tableName = 'assets';
    const columns = ['tag', 'type', 'typeOrdinateur', 'fabricant', 'modele', 'numeroDeSerie', 'assignedTo', 'status', 'ipAddress', 'password'];
    const sqlContent = filteredAssets.map(asset => {
      const values = columns.map(col => escapeSql(asset[col as keyof Asset])).join(', ');
      return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
    }).join('\n');
    downloadFile(sqlContent, 'export_actifs.sql', 'application/sql');
    toast({ title: "Exportation SQL réussie" });
  };

  const handlePrint = (selectedColumns: AssetColumnKeys[]) => {
    setColumnsToPrint(selectedColumns);
    setPrintDate(new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    setIsPrintDialogOpen(false);
    setIsPrinting(true);
  };


  return (
    <>
      <div className={`flex flex-col gap-6 ${isPrinting ? 'print-hidden' : ''}`}>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Actifs Informatiques</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(true)}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
            </Button>
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
            <Button onClick={() => setIsAddSheetOpen(true)} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un actif
            </Button>
          </div>
        </div>
        {canImport && <div className="mb-6">
          <ImportAssetsDataCard />
        </div>}
        <Card>
          <CardHeader>
            <CardTitle>Inventaire des actifs</CardTitle>
            <CardDescription>Suivez tout le matériel et les licences logicielles de l'entreprise.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par N° inventaire, IP, modèle..."
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
                  {assetStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
              <div className="mb-4 text-sm text-muted-foreground">
                  {filteredAssets.length} résultat(s) trouvé(s).
              </div>
            {error && <p className="text-destructive text-center py-4">{error}</p>}
            <div className="hidden md:block">
              <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead>N° Inventaire</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Fabricant/Modèle</TableHead>
                      <TableHead>Adresse IP</TableHead>
                      <TableHead>Assigné à</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
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
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                      ))
                  ) : (
                      paginatedAssets.map((asset) => {
                        const Icon = assetIcons[asset.type] || PackageIcon;
                        return (
                          <TableRow key={asset.tag}>
                              <TableCell className="font-medium">{asset.tag}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  {asset.type}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>{asset.fabricant}</div>
                                <div className="text-sm text-muted-foreground">{asset.modele}</div>
                              </TableCell>
                               <TableCell>
                                {asset.ipAddress ? (
                                    <a 
                                        href={`http://${asset.ipAddress}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {asset.ipAddress}
                                    </a>
                                ) : '-'}
                            </TableCell>
                              <TableCell>{asset.assignedTo}</TableCell>
                              <TableCell>
                              <Badge variant={statusVariantMap[asset.status as Status] || 'default'}>{asset.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                              <MoreHorizontal className="h-4 w-4" />
                                              <span className="sr-only">Ouvrir le menu</span>
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                          <DropdownMenuItem onSelect={() => openEditSheet(asset)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Modifier
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setDeleteTarget(asset)} className="text-destructive focus:text-destructive">
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
                  paginatedAssets.map((asset) => {
                    const Icon = assetIcons[asset.type] || PackageIcon;
                    return (
                      <Card key={asset.tag} onClick={() => openEditSheet(asset)} className="cursor-pointer">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold">{asset.fabricant} {asset.modele}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {asset.type}
                              </p>
                            </div>
                            <Badge variant={statusVariantMap[asset.status as Status] || 'default'}>{asset.status}</Badge>
                          </div>
                          <p className="text-sm"><span className="font-medium">N° Inventaire:</span> {asset.tag}</p>
                           {asset.ipAddress && <p className="text-sm"><span className="font-medium">IP:</span> {asset.ipAddress}</p>}
                          <p className="text-sm"><span className="font-medium">Assigné à:</span> {asset.assignedTo}</p>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            { !loading && paginatedAssets.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                  Aucun actif trouvé.
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
                    totalItems={filteredAssets.length}
                />
            </CardFooter>
        )}
        </Card>
        <AddAssetSheet
          isOpen={isAddSheetOpen}
          onClose={() => setIsAddSheetOpen(false)}
          onAddAsset={handleAddAsset}
        />
        {selectedAsset && (
            <EditAssetSheet
                isOpen={isEditSheetOpen}
                onClose={() => setIsEditSheetOpen(false)}
                onUpdateAsset={handleUpdateAsset}
                asset={selectedAsset}
            />
        )}
        <PrintAssetsDialog
            isOpen={isPrintDialogOpen}
            onClose={() => setIsPrintDialogOpen(false)}
            onPrint={handlePrint}
            allColumns={allAssetColumns}
        />
      </div>
       <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAsset}
        title={`Supprimer l'actif : ${deleteTarget?.tag}`}
        description={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.modele} (${deleteTarget?.tag})" ? Cette action est irréversible.`}
      />

       {isPrinting && (
            <div id="print-section" className="bg-white text-black p-8 w-full print:shadow-none print:border-none print:p-0">
                <header className="flex justify-between items-start mb-8">
                    <div className="text-center">
                        <h2 className="font-bold">Chambre Nationale des Rois et Chefs Traditionnels</h2>
                        {organizationLogos?.mainLogoUrl && <img src={organizationLogos.mainLogoUrl} alt="Logo" width={80} height={80} className="mx-auto mt-2" />}
                    </div>
                    <div className="text-center">
                        <p className="font-bold">République de Côte d'Ivoire</p>
                        {organizationLogos?.secondaryLogoUrl && <img src={organizationLogos.secondaryLogoUrl} alt="Logo secondaire" width={80} height={80} className="mx-auto my-2" />}
                        <p className="text-sm">Union - Discipline - Travail</p>
                    </div>
                </header>

                <div className="text-center my-6">
                    <h1 className="text-lg font-bold underline">INVENTAIRE DU MATERIEL INFORMATIQUE - {printDate}</h1>
                </div>
                
                <table className="w-full text-xs border-collapse border border-black">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-black p-1">N°</th>
                            {columnsToPrint.map(key => <th key={key} className="border border-black p-1 text-left font-bold">{allAssetColumns[key]}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssets.map((asset, index) => (
                            <tr key={asset.tag}>
                                <td className="border border-black p-1 text-center">{index + 1}</td>
                                {columnsToPrint.map(key => (
                                    <td key={key} className="border border-black p-1">{asset[key as keyof Asset] || ''}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </>
  );
}
