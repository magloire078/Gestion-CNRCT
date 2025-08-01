
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
type EmployeeCsvRow = { [key: string]: string | number | undefined | null };

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
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      transformHeader: header => header.trim().toLowerCase(),
      complete: async (results) => {
        if (results.errors.length > 0) {
            console.error("CSV Parsing errors:", results.errors);
            const firstError = results.errors[0];
            setError(`Erreur à la ligne ${firstError.row}: ${firstError.message}`);
            setIsImporting(false);
            return;
        }

        const headers = results.meta.fields || [];
        const requiredColumns = ['matricule', 'nom', 'prenom', 'poste', 'service', 'statut'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
             setError(`Le fichier CSV est invalide. Colonnes requises manquantes : ${missingColumns.join(', ')}.`);
             setIsImporting(false);
             return;
        }
        
        const employeesToImport: Omit<Employe, "id">[] = results.data
          .filter(row => row.matricule) // Basic validation for a valid row
          .map(row => {
              const parseNumber = (value: string | number | undefined | null): number | undefined => {
                  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return undefined;
                  const cleanedValue = String(value).replace(/ /g, '').replace(/,/g, '.');
                  if (cleanedValue === '') return undefined;
                  const num = parseFloat(cleanedValue);
                  return isNaN(num) ? undefined : num;
              }

              const combinedName = `${row.prenom || ''} ${row.nom || ''}`.trim();
              const photoPath = row.photo ? String(row.photo).trim() : null;

              return {
                matricule: String(row.matricule),
                name: combinedName,
                firstName: String(row.prenom || ''),
                lastName: String(row.nom || ''),
                poste: String(row.poste || ''),
                department: String(row.service || ''),
                status: row.statut === 1 || String(row.statut).toLowerCase() === 'actif' ? 'Actif' : 'Licencié',
                
                civilite: String(row.civilite || ''),
                sexe: String(row.sexe || ''),
                mobile: String(row.mobile || ''),
                email: String(row.email || ''),
                
                groupe_1: String(row.groupe_1 || ''),
                groupe_2: String(row.groupe_2 || ''),
                Region: String(row.region || ''),
                Image_Region: String(row.image_region || ''),
                Departement: String(row.departement || ''),
                Commune: String(row.commune || ''),
                Village: String(row.village || ''),
                
                baseSalary: parseNumber(row.salaire_base),
                primeAnciennete: parseNumber(row.prime_ancien),
                indemniteTransportImposable: parseNumber(row.indemnite_transport),
                indemniteResponsabilite: parseNumber(row.indemnite_responsabilite),
                indemniteLogement: parseNumber(row.indemnite_logement),
                indemniteSujetion: parseNumber(row.indemnite_sujetion),
                indemniteCommunication: parseNumber(row.indemnite_communication),
                indemniteRepresentation: parseNumber(row.indemnite_representation),
                Salaire_Brut: parseNumber(row.salaire_brut),
                transportNonImposable: parseNumber(row.indemnite_transport_non_imposable),
                Salaire_Net: parseNumber(row.salaire_net),

                banque: String(row.banque || ''),
                numeroCompte: String(row.num_compte || ''),
                CB: String(row.cb || ''),
                CG: String(row.cg || ''),
                Cle_RIB: String(row.cle_rib || ''),
                CNPS: row.cnps === 1,
                cnpsEmploye: String(row.num_cnps || ''),
                Num_Decision: String(row.num_decision || ''),
                
                Date_Naissance: String(row.date_naissance || ''),
                dateEmbauche: String(row.date_embauche || ''),
                Date_Immatriculation: String(row.date_immatriculation || ''),
                Date_Depart: String(row.date_depart || ''),

                situationMatrimoniale: String(row.situation_famille || ''),
                enfants: parseNumber(row.nombre_enfants),
                Lieu_Naissance: String(row.lieu_naissance || ''),
                
                photoUrl: photoPath ? `/photos/${photoPath}` : `https://placehold.co/100x100.png`,
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
