
"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertCircle } from "lucide-react";
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
      complete: async (results) => {
        if (results.errors.length > 0) {
            console.error("CSV Parsing errors:", results.errors);
            setError(`Erreur lors de l'analyse du CSV: ${results.errors[0].message}`);
            setIsImporting(false);
            return;
        }
        
        const employeesToImport: Omit<Employe, "id">[] = results.data
          .filter(row => row.matricule && row.nom && row.poste && row.service)
          .map(row => {
              const parseNumber = (value: string | undefined) => {
                  if (!value) return 0;
                  return parseFloat(value.replace(/ /g, '').replace(/,/g, '.')) || 0;
              }

              return {
                // Main fields
                matricule: row.matricule!,
                nom: row.nom!,
                prenom: row.prenom || '',
                name: `${row.prenom || ''} ${row.nom || ''}`.trim(),
                poste: row.poste!,
                service: row.service!,
                department: row.service!, // compatibility
                status: row.Statut === '1' ? 'Actif' : 'Licencié',
                
                // Detailed personal info
                civilite: row.civilite,
                sexe: row.sexe,
                mobile: row.mobile,
                email: row.email,
                situation_famille: row.situation_famille,
                nombre_enfants: parseNumber(row.nombre_enfants),
                Lieu_Naissance: row.Lieu_Naissance,
                Date_Naissance: row.Date_Naissance,
                Date_Embauche: row.Date_Embauche,
                Date_Immatriculation: row.Date_Immatriculation,
                Date_Depart: row.Date_Depart,

                // Photo
                photoUrl: row.Photo ? `/photos/${row.Photo.trim()}` : 'https://placehold.co/100x100.png',
                Photo: row.Photo,
                
                // Grouping
                groupe_1: row.groupe_1,
                groupe_2: row.groupe_2,
                Region: row.Region,
                Image_Region: row.Image_Region,
                Departement: row.Departement,
                Commune: row.Commune,
                Village: row.Village,
                
                // Salary & Compensation
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

                // Bank & Legal
                banque: row.Banque,
                numeroCompte: row.Num_Compte,
                CB: row.CB,
                CG: row.CG,
                Cle_RIB: row.Cle_RIB,
                CNPS: row.CNPS === '1',
                cnpsEmploye: row.Num_CNPS,
                Num_CNPS: row.Num_CNPS,
                Num_Decision: row.Num_Decision,
              } as Omit<Employe, 'id'>
          });

        if (employeesToImport.length === 0) {
          setError("Le fichier CSV est vide ou ne contient pas les colonnes requises (matricule, nom, poste, service).");
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

  const loadAndImportDefault = async () => {
    try {
        const response = await fetch('/data/import_employes.csv');
        if(!response.ok) {
            throw new Error("Le fichier CSV par défaut n'a pas pu être chargé.");
        }
        const blob = await response.blob();
        const defaultFile = new File([blob], "import_employes.csv", { type: "text/csv" });
        setFile(defaultFile);
        toast({
            title: "Fichier prêt",
            description: "Le fichier d'importation par défaut a été chargé. Cliquez sur 'Importer' pour continuer."
        })
    } catch(e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importer des données</CardTitle>
        <CardDescription>
          Importez une liste d'employés à partir d'un fichier CSV. Vous pouvez charger le <Button variant="link" className="p-0 h-auto" onClick={loadAndImportDefault}>fichier par défaut</Button> ou téléverser le vôtre.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Input type="file" accept=".csv" onChange={handleFileChange} className="flex-grow" ref={inputRef} />
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
