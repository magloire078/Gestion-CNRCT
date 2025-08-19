
"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertCircle, Download } from "lucide-react";
import { batchAddChiefs } from "@/services/chief-service";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import type { Chief } from "@/lib/data";


type ChiefCsvRow = { [key: string]: string | number | undefined | null };

export function ImportChiefsDataCard() {
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

    Papa.parse<ChiefCsvRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      transformHeader: header => header.trim().toLowerCase(),
      complete: async (results) => {
        const criticalErrors = results.errors.filter(
          e => e.code !== 'TooManyFields' && e.code !== 'TooFewFields'
        );

        if (criticalErrors.length > 0) {
            const firstError = criticalErrors[0];
            setError(`Erreur critique d'analyse à la ligne ${firstError.row}: ${firstError.message}`);
            setIsImporting(false);
            return;
        }

        const headers = results.meta.fields || [];
        const requiredColumns = ['lastname', 'firstname', 'title', 'role', 'region', 'department', 'subprefecture', 'village'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
             setError(`Le fichier CSV est invalide. Colonnes requises manquantes : ${missingColumns.join(', ')}.`);
             setIsImporting(false);
             return;
        }
        
        const chiefsToImport: Omit<Chief, "id">[] = results.data
          .filter(row => row && row.lastname)
          .map(row => {
              const chiefData: Omit<Chief, 'id'> = {
                name: `${row.lastname || ''} ${row.firstname || ''}`.trim(),
                lastName: String(row.lastname || ''),
                firstName: String(row.firstname || ''),
                title: String(row.title || ''),
                role: String(row.role || 'Chef de Village') as Chief['role'],
                region: String(row.region || ''),
                department: String(row.department || ''),
                subPrefecture: String(row.subprefecture || ''),
                village: String(row.village || ''),
                contact: String(row.contact || ''),
                bio: String(row.bio || ''),
                photoUrl: String(row.photourl || `https://placehold.co/100x100.png`),
                latitude: row.latitude ? Number(row.latitude) : undefined,
                longitude: row.longitude ? Number(row.longitude) : undefined,
                parentChiefId: row.parentchiefid ? String(row.parentchiefid) : undefined,
                dateOfBirth: row.dateofbirth ? String(row.dateofbirth) : undefined,
                regencyStartDate: row.regencystartdate ? String(row.regencystartdate) : undefined,
                regencyEndDate: row.regencyenddate ? String(row.regencyenddate) : undefined,
              };

              return chiefData;
          });

        if (chiefsToImport.length === 0) {
          setError("Aucune ligne de chef valide n'a été trouvée dans le fichier CSV.");
          setIsImporting(false);
          return;
        }

        try {
          const count = await batchAddChiefs(chiefsToImport);
          toast({
            title: "Importation réussie",
            description: `${count} chefs ont été importés ou mis à jour.`,
          });
          setFile(null);
          if(inputRef.current) inputRef.current.value = "";
        } catch (err) {
          console.error(err);
          setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue lors de l'importation.");
        } finally {
          setIsImporting(false);
        }
      },
      error: (err: any) => {
        setError(`Erreur critique lors de l'analyse du fichier CSV : ${err.message}`);
        setIsImporting(false);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importer des Chefs</CardTitle>
        <CardDescription>
          Importez en masse des chefs à partir d'un fichier CSV. Les chefs avec un nom déjà existant seront ignorés.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
            <Input type="file" accept=".csv" onChange={handleFileChange} className="flex-grow" ref={inputRef} />
            </div>
            <a 
                href="/data/import-chefs-template.csv" 
                download="modele-import-chefs.csv"
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
          {isImporting ? "Importation en cours..." : "Importer les chefs"}
        </Button>
      </CardFooter>
    </Card>
  );
}
