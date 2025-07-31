
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
import type { Employee } from "@/lib/data";

type EmployeeCsvRow = {
  matricule: string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Terminated' | '0' | '1';
  photoUrl?: string;
  baseSalary?: string;
  primeAnciennete?: string;
  indemniteTransportImposable?: string;
  indemniteResponsabilite?: string;
  indemniteLogement?: string;
  transportNonImposable?: string;
  banque?: string;
  numeroCompte?: string;
  cnpsEmploye?: string;
  dateEmbauche?: string;
};

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
        const employeesToImport: Omit<Employee, "id">[] = results.data
          .filter(row => row.matricule && row.name && row.role && row.department && row.status)
          .map(row => {
            const [firstName, ...lastNameParts] = row.name.split(' ');
            const lastName = lastNameParts.join(' ');
            return {
              matricule: row.matricule,
              firstName: firstName,
              lastName: lastName,
              name: row.name,
              email: row.email || '',
              role: row.role,
              department: row.department,
              photoUrl: row.photoUrl || 'https://placehold.co/100x100.png',
              status: row.status === '1' || String(row.status).toLowerCase() === 'active' ? 'Active' : 'Terminated',
              baseSalary: parseFloat(row.baseSalary || '0'),
              primeAnciennete: parseFloat(row.primeAnciennete || '0'),
              indemniteTransportImposable: parseFloat(row.indemniteTransportImposable || '0'),
              indemniteResponsabilite: parseFloat(row.indemniteResponsabilite || '0'),
              indemniteLogement: parseFloat(row.indemniteLogement || '0'),
              transportNonImposable: parseFloat(row.transportNonImposable || '0'),
              banque: row.banque || '',
              numeroCompte: row.numeroCompte || '',
              cnpsEmploye: row.cnpsEmploye || '',
              dateEmbauche: row.dateEmbauche || '',
            }
          });

        if (employeesToImport.length === 0) {
          setError("Le fichier CSV est vide ou ne contient pas les colonnes requises (matricule, name, role, department, status).");
          setIsImporting(false);
          return;
        }

        try {
          const count = await batchAddEmployees(employeesToImport);
          toast({
            title: "Importation réussie",
            description: `${count} employés ont été importés avec succès. La page des employés va maintenant se mettre à jour.`,
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
      error: (err) => {
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
