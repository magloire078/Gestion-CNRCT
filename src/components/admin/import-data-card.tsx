
"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertCircle, Download } from "lucide-react";
import { batchAddEmployees } from "@/services/employee-service";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import type { Employe } from "@/lib/data";


// Define a more flexible type for CSV row to handle various fields
type EmployeeCsvRow = { [key: string]: string | undefined };

export function ImportDataCard() {
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

    Papa.parse<EmployeeCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
      complete: async (results) => {
        if (results.errors.length > 0) {
            console.error("CSV Parsing errors:", results.errors);
            setError(`Erreur lors de l'analyse du CSV: ${results.errors[0].message}`);
            setIsImporting(false);
            return;
        }

        const requiredColumns = ['matricule', 'nom', 'prenom', 'poste', 'service', 'statut'];
        const headers = results.meta.fields || [];
        const missingColumns = requiredColumns.filter(col => !headers.map(h => h.toLowerCase()).includes(col.toLowerCase()));

        if (missingColumns.length > 0) {
             setError(`Le fichier CSV est invalide. Colonnes manquantes : ${missingColumns.join(', ')}.`);
             setIsImporting(false);
             return;
        }
        
        const employeesToImport: Omit<Employe, "id">[] = results.data
          .filter(row => row.matricule && (row.nom || row.prenom)) // Basic validation for a valid row
          .map(row => {
              const parseNumber = (value: string | undefined) => {
                  if (!value || value.trim() === '') return undefined;
                  const cleanedValue = value.replace(/ /g, '').replace(/,/g, '.');
                  if (cleanedValue === '') return undefined;
                  const num = parseFloat(cleanedValue);
                  return isNaN(num) ? undefined : num;
              }

              const combinedName = `${row.prenom || ''} ${row.nom || ''}`.trim();

              return {
                matricule: row.matricule!,
                name: combinedName,
                firstName: row.prenom,
                lastName: row.nom,
                poste: row.poste,
                department: row.service,
                status: row.statut === '1' ? 'Actif' : 'Licencié',
                
                civilite: row.civilite,
                sexe: row.sexe,
                mobile: row.mobile,
                email: row.email,
                
                groupe_1: row.groupe_1,
                groupe_2: row.groupe_2,
                Region: row.Region,
                Image_Region: row.Image_Region,
                Departement: row.Departement,
                Commune: row.Commune,
                Village: row.Village,
                
                baseSalary: parseNumber(row.salaire_Base),
                primeAnciennete: parseNumber(row.prime_ancien),
                indemniteTransportImposable: parseNumber(row.indemnite_Transport),
                indemniteResponsabilite: parseNumber(row.indemnite_Responsabilite),
                indemniteLogement: parseNumber(row.indemnite_Logement),
                indemniteSujetion: parseNumber(row.indemnite_Sujetion),
                indemniteCommunication: parseNumber(row.indemnite_Communication),
                indemniteRepresentation: parseNumber(row.indemnite_Representation),
                Salaire_Brut: parseNumber(row.Salaire_Brut),
                transportNonImposable: parseNumber(row.indemnite_transport_non_imposable),
                Salaire_Net: parseNumber(row.Salaire_Net),

                banque: row.Banque,
                numeroCompte: row.Num_Compte,
                CB: row.CB,
                CG: row.CG,
                Cle_RIB: row.Cle_RIB,
                CNPS: row.CNPS === '1',
                cnpsEmploye: row.Num_CNPS,
                Num_Decision: row.Num_Decision,
                
                Date_Naissance: row.Date_Naissance,
                dateEmbauche: row.Date_Embauche,
                Date_Immatriculation: row.Date_Immatriculation,
                Date_Depart: row.Date_Depart,

                situationMatrimoniale: row.situation_famille,
                enfants: parseNumber(row.nombre_enfants),
                Lieu_Naissance: row.Lieu_Naissance,
                
                photoUrl: row.Photo ? `/photos/${row.Photo.trim()}` : `https://placehold.co/100x100.png`,
              } as Omit<Employe, 'id'>
          });

        if (employeesToImport.length === 0) {
          setError("Aucune ligne d'employé valide n'a été trouvée dans le fichier CSV.");
          setIsImporting(false);
          return;
        }

        try {
          const count = await batchAddEmployees(employeesToImport);
          toast({
            title: "Importation réussie",
            description: `${count} employés ont été importés ou mis à jour. La page des employés va maintenant se rafraîchir.`,
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
        setError(`Erreur lors de l'analyse du fichier CSV : ${err.message}`);
        setIsImporting(false);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importer des données</CardTitle>
        <CardDescription>
          Importez en masse des employés à partir d'un fichier CSV. Les employés avec un matricule déjà existant seront ignorés.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
            <Input type="file" accept=".csv" onChange={handleFileChange} className="flex-grow" ref={inputRef} />
            </div>
            <a 
                href="/data/import-employes-template.csv" 
                download="modele-import-employes.csv"
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
          {isImporting ? "Importation en cours..." : "Importer les employés"}
        </Button>
      </CardFooter>
    </Card>
  );
}
