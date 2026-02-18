
"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle, Search, Eye, Pencil, Trash2, MoreHorizontal, Laptop, Monitor, Printer as PrinterIcon, Keyboard, Mouse, FileCode, Package as PackageIcon, Download, Server, Printer, QrCode } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Asset, OrganizationSettings } from "@/lib/data";
import { AddAssetSheet } from "@/components/it-assets/add-asset-sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subscribeToAssets, addAsset, deleteAsset } from "@/services/asset-service";
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
import { BarcodeScanner } from "@/components/it-assets/barcode-scanner";
import { PrintLabels } from "@/components/it-assets/print-labels";
import { PrintSingleLabel } from "@/components/it-assets/print-single-label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";


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

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [initialAssetTag, setInitialAssetTag] = useState<string | undefined>(undefined);

  const [isPrintingLabels, setIsPrintingLabels] = useState(false);
  const [assetForLabelPreview, setAssetForLabelPreview] = useState<Asset | null>(null);
  const [assetToPrint, setAssetToPrint] = useState<Asset | null>(null);
  const [isPrintingSingleLabel, setIsPrintingSingleLabel] = useState(false);


  useEffect(() => {
    const unsubscribe = subscribeToAssets(
      (fetchedAssets) => {
        setAssets(fetchedAssets);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to subscribe to assets", error);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les actifs." });
        setLoading(false);
      }
    );
    getOrganizationSettings().then(setOrganizationLogos);
    return () => unsubscribe();
  }, [toast]);


  useEffect(() => {
    if (isPrinting) {
      document.body.classList.add('print-landscape');
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
        document.body.classList.remove('print-landscape');
      }, 500);
    }
    if (isPrintingLabels) {
      document.body.classList.remove('print-landscape'); // Ensure portrait mode for labels
      setTimeout(() => {
        window.print();
        setIsPrintingLabels(false);
      }, 500);
    }
  }, [isPrinting, isPrintingLabels]);

  useEffect(() => {
    if (isPrintingSingleLabel && assetToPrint) {
      document.body.classList.add('print-dymo-label');
      setTimeout(() => {
        window.print();
        document.body.classList.remove('print-dymo-label');
        setIsPrintingSingleLabel(false);
        setAssetToPrint(null);
      }, 300);
    }
  }, [isPrintingSingleLabel, assetToPrint]);


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

  const handleScanResult = (result: string) => {
    setIsScannerOpen(false);
    setInitialAssetTag(result);
    setIsAddSheetOpen(true);
    toast({ title: "Code Scanné", description: `Le N° d'inventaire a été pré-rempli.` });
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
    const escapeSql = (str: any) => str ? `'''${String(str).replace(/'/g, "''")}'''` : 'NULL';
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

  const handlePrintLabels = () => {
    if (filteredAssets.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun actif à imprimer",
        description: "Veuillez filtrer la liste pour sélectionner les actifs.",
      });
      return;
    }
    setIsPrintingLabels(true);
  };

  const handleShowLabelPreview = (asset: Asset) => {
    setAssetForLabelPreview(asset);
  };

  const handleConfirmPrintSingleLabel = () => {
    if (assetForLabelPreview) {
      setAssetToPrint(assetForLabelPreview);
      setIsPrintingSingleLabel(true);
      setAssetForLabelPreview(null);
    }
  }


  return (
    <>
      <div className={`flex flex-col gap-6 ${isPrinting || isPrintingLabels || isPrintingSingleLabel ? 'print-hidden' : ''}`}>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Actifs Informatiques</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
              <QrCode className="mr-2 h-4 w-4" />
              Scanner un actif
            </Button>
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(true)}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer Liste
            </Button>
            <Button variant="outline" onClick={handlePrintLabels}>
              <QrCode className="mr-2 h-4 w-4" />
              Imprimer Étiquettes
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
                    <TableHead>N°</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
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
                    paginatedAssets.map((asset, index) => {
                      const Icon = assetIcons[asset.type] || PackageIcon;
                      return (
                        <TableRow key={asset.tag}>
                          <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
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
                                <DropdownMenuItem asChild>
                                  <Link href={`/it-assets/${asset.tag}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" /> Modifier
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleShowLabelPreview(asset)}>
                                  <QrCode className="mr-2 h-4 w-4" /> Aperçu Étiquette
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
                paginatedAssets.map((asset, index) => {
                  const Icon = assetIcons[asset.type] || PackageIcon;
                  return (
                    <Card key={asset.tag}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {(currentPage - 1) * itemsPerPage + index + 1}. {asset.fabricant} {asset.modele}
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {asset.type}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <Badge variant={statusVariantMap[asset.status as Status] || 'default'}>{asset.status}</Badge>
                        <p className="text-sm"><span className="font-medium">N° Inventaire:</span> {asset.tag}</p>
                        {asset.ipAddress && <p className="text-sm"><span className="font-medium">IP:</span> {asset.ipAddress}</p>}
                        <p className="text-sm"><span className="font-medium">Assigné à:</span> {asset.assignedTo}</p>
                      </CardContent>
                      <CardFooter className="flex justify-end p-4 pt-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>Actions</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem asChild>
                              <Link href={`/it-assets/${asset.tag}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" /> Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleShowLabelPreview(asset)}>
                              <QrCode className="mr-2 h-4 w-4" /> Aperçu Étiquette
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTarget(asset)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardFooter>
                    </Card>
                  )
                })
              )}
            </div>
            {!loading && paginatedAssets.length === 0 && (
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
          onClose={() => { setIsAddSheetOpen(false); setInitialAssetTag(undefined); }}
          onAddAsset={handleAddAsset}
          initialTag={initialAssetTag}
        />
        <PrintAssetsDialog
          isOpen={isPrintDialogOpen}
          onClose={() => setIsPrintDialogOpen(false)}
          onPrint={handlePrint}
          allColumns={allAssetColumns}
        />
        <BarcodeScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={handleScanResult}
        />
      </div>
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAsset}
        title={`Supprimer l'actif : ${deleteTarget?.tag}`}
        description={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.modele} (${deleteTarget?.tag})" ? Cette action est irréversible.`}
      />

      {isPrinting && organizationLogos && (
        <div id="print-section" className="bg-white text-black w-full print:shadow-none print:border-none">
          <header className="flex justify-between items-start mb-8">
            <div className="text-center">
              <h2 className="font-bold text-sm leading-tight">
                Chambre Nationale des Rois<br />
                et Chefs Traditionnels
              </h2>
              {organizationLogos?.mainLogoUrl && <img src={organizationLogos.mainLogoUrl} alt="Logo" width={80} height={80} className="mx-auto mt-2" />}
            </div>
            <div className="text-center">
              <p className="font-bold">République de Côte d'Ivoire</p>
              {organizationLogos?.secondaryLogoUrl && <img src={organizationLogos.secondaryLogoUrl} alt="Logo secondaire" width={80} height={80} className="mx-auto my-2" />}
              <p className="text-sm">Union - Discipline - Travail</p>
            </div>
          </header>

          <div className="text-center my-6">
            <h1 className="text-lg font-bold underline">INVENTAIRE DU MATERIEL INFORMATIQUE - ${printDate}</h1>
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

      {isPrintingLabels && organizationLogos && (
        <PrintLabels assets={filteredAssets} settings={organizationLogos} />
      )}

      {isPrintingSingleLabel && assetToPrint && organizationLogos && (
        <PrintSingleLabel asset={assetToPrint} settings={organizationLogos} />
      )}

      {assetForLabelPreview && organizationLogos && (
        <Dialog open={!!assetForLabelPreview} onOpenChange={(open) => !open && setAssetForLabelPreview(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aperçu de l'étiquette</DialogTitle>
              <DialogDescription>
                Voici à quoi ressemblera l'étiquette pour l'actif {assetForLabelPreview.tag}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center items-center p-4 my-4 bg-muted rounded-md">
              <div className="border shadow-md" style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}>
                <PrintSingleLabel asset={assetForLabelPreview} settings={organizationLogos} isPreview={true} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssetForLabelPreview(null)}>Annuler</Button>
              <Button onClick={handleConfirmPrintSingleLabel}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
