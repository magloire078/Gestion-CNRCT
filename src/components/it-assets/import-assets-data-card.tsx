
"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertCircle, Download } from "lucide-react";
import { batchAddAssets } from "@/services/asset-service";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import type { Asset } from "@/lib/data";

type AssetCsvRow = { [key: string]: string | number | undefined | null };

export function ImportAssetsDataCard() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Veuillez d'abord sélectionner un fichier.");
      return;
    }

    setIsImporting(true);
    setError(null);

    Papa.parse<AssetCsvRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: header => header.trim().toLowerCase().replace(/[^a-z0-9]/gi, ''),
      complete: async (results) => {
        if (results.errors.length > 0) {
          setError(`Erreur d'analyse à la ligne ${results.errors[0].row}: ${results.errors[0].message}`);
          setIsImporting(false);
          return;
        }

        const requiredColumns = ['tag', 'type', 'modele', 'status', 'assignedto'];
        const headers = results.meta.fields || [];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col.replace(/[^a-z0-9]/gi, '')));

        if (missingColumns.length > 0) {
             setError(`Colonnes requises manquantes : ${missingColumns.join(', ')}.`);
             setIsImporting(false);
             return;
        }
        
        const assetsToImport = results.data
          .filter(row => row && row.tag)
          .map(row => {
              const assetData = {
                tag: String(row.tag),
                type: String(row.type || 'Autre'),
                fabricant: String(row.fabricant || ''),
                modele: String(row.modele),
                numeroDeSerie: String(row.numerodeserie || ''),
                status: String(row.status || 'En stock'),
                assignedTo: String(row.assignedto || 'En stock'),
              } as Omit<Asset, 'type'> & { type: string, tag: string };

              if (assetData.type === 'Ordinateur' && row.typeordinateur) {
                  assetData.typeOrdinateur = String(row.typeordinateur) as Asset['typeOrdinateur'];
              }

              return assetData as Omit<Asset, 'tag'> & { tag: string };
          });

        if (assetsToImport.length === 0) {
          setError("Aucun actif valide trouvé dans le fichier CSV.");
          setIsImporting(false);
          return;
        }

        try {
          const count = await batchAddAssets(assetsToImport);
          toast({
            title: "Importation réussie",
            description: `${count} actifs ont été ajoutés. ${assetsToImport.length - count} doublons ont été ignorés.`,
          });
          setFile(null);
          if(inputRef.current) inputRef.current.value = "";
        } catch (err) {
          console.error(err);
          setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue.");
        } finally {
          setIsImporting(false);
        }
      },
      error: (err: any) => {
        setError(`Erreur critique : ${err.message}`);
        setIsImporting(false);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importer des Actifs</CardTitle>
        <CardDescription>
          Importez en masse des actifs à partir d'un fichier CSV. Les actifs avec un N° d'inventaire existant seront ignorés.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
            <Input type="file" accept=".csv" onChange={handleFileChange} className="flex-grow" ref={inputRef} />
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
