
"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertCircle, Download } from "lucide-react";
import { batchAddAssets } from "@/services/asset-service";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Asset } from "@/lib/data";

type AssetCsvRow = { [key: string]: string | number | undefined | null };

export function ImportAssetsDataCard() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [mergeExisting, setMergeExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const normalizeHeader = (header: string) => header.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');

  const processAssets = async (data: any[]) => {
    const requiredColumns = ['tag', 'type', 'modele', 'status', 'assignedto'];

    // Check headers from the first row if possible, or just check if data has required keys after normalization
    if (data.length === 0) {
      setError("Le fichier est vide.");
      setIsImporting(false);
      return;
    }

    // Normalize keys for the first row to check structure
    const firstRowKeys = Object.keys(data[0]).map(normalizeHeader);
    const missingColumns = requiredColumns.filter(col => !firstRowKeys.includes(col));

    if (missingColumns.length > 0) {
      setError(`Colonnes requises manquantes (ou mal nommées) : ${missingColumns.join(', ')}.`);
      setIsImporting(false);
      return;
    }

    const assetsToImport = data
      .filter(row => {
        // Find the tag key regardless of case/special chars
        const keys = Object.keys(row);
        const tagKey = keys.find(k => normalizeHeader(k) === 'tag');
        return tagKey && row[tagKey];
      })
      .map(row => {
        const keys = Object.keys(row);
        const getValue = (targetKey: string) => {
          const key = keys.find(k => normalizeHeader(k) === targetKey);
          return key ? row[key] : undefined;
        };

        const assetData = {
          tag: String(getValue('tag')),
          type: String(getValue('type') || 'Autre'),
          fabricant: String(getValue('fabricant') || ''),
          modele: String(getValue('modele')),
          numeroDeSerie: String(getValue('numerodeserie') || ''),
          status: String(getValue('status') || 'En stock'),
          assignedTo: String(getValue('assignedto') || 'En stock'),
        } as Omit<Asset, 'type'> & { type: string, tag: string };

        const typeOrdinateur = getValue('typeordinateur');
        if (assetData.type === 'Ordinateur' && typeOrdinateur) {
          assetData.typeOrdinateur = String(typeOrdinateur) as Asset['typeOrdinateur'];
        }

        return assetData as Omit<Asset, 'tag'> & { tag: string };
      });

    if (assetsToImport.length === 0) {
      setError("Aucun actif valide trouvé dans le fichier.");
      setIsImporting(false);
      return;
    }

    try {
      const count = await batchAddAssets(assetsToImport, mergeExisting);
      toast({
        title: "Importation réussie",
        description: `${count} actifs ont été ${mergeExisting ? 'traités (ajoutés ou mis à jour)' : 'ajoutés'}.`,
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Veuillez d'abord sélectionner un fichier.");
      return;
    }

    setIsImporting(true);
    setError(null);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse<AssetCsvRow>(file, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: async (results) => {
          if (results.errors.length > 0) {
            setError(`Erreur d'analyse CSV : ${results.errors[0].message}`);
            setIsImporting(false);
            return;
          }
          await processAssets(results.data);
        },
        error: (err: any) => {
          setError(`Erreur critique CSV : ${err.message}`);
          setIsImporting(false);
        },
      });
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          await processAssets(jsonData);
        } catch (err) {
          setError("Erreur lors de la lecture du fichier Excel.");
          setIsImporting(false);
        }
      };
      reader.onerror = () => {
        setError("Erreur de lecture du fichier.");
        setIsImporting(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError("Format de fichier non supporté. Veuillez utiliser .csv, .xlsx ou .xls");
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importer des Actifs</CardTitle>
        <CardDescription>
          Importez en masse des actifs à partir d'un fichier CSV ou Excel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="flex-grow"
              ref={inputRef}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="merge-existing"
              checked={mergeExisting}
              onCheckedChange={(checked) => setMergeExisting(checked as boolean)}
            />
            <Label htmlFor="merge-existing">
              Mettre à jour les actifs existants (Si le N° d'inventaire existe déjà)
            </Label>
          </div>
          <a
            href="/data/import-actifs-template.csv"
            download="modele-import-actifs.csv"
            className="text-sm text-primary hover:underline"
          >
            <Download className="inline-block mr-2 h-4 w-4" />
            Télécharger le modèle CSV
          </a>
        </div>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur d'importation</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleImport} disabled={isImporting || !file}>
          {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {isImporting ? "Importation..." : "Importer les actifs"}
        </Button>
      </CardFooter>
    </Card>
  );
}
