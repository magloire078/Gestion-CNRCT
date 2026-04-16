
"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertCircle, Download, FileSpreadsheet } from "lucide-react";
import { batchAddEmployees } from "@/services/employee-service";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import type { Employe } from "@/lib/data";
import { cn } from "@/lib/utils";


// Define a more flexible type for CSV row to handle various fields
type EmployeeCsvRow = { [key: string]: string | number | undefined | null };

export function ImportEmployeesDataCard() {
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
      dynamicTyping: false, // Turn off dynamic typing to treat all values as strings initially
      transformHeader: header => header.trim().toLowerCase(),
      complete: async (results) => {
        // Filter for critical errors only
        const criticalErrors = results.errors.filter(
          e => e.code !== 'TooManyFields' && e.code !== 'TooFewFields'
        );

        if (criticalErrors.length > 0) {
            console.error("Critical CSV Parsing errors:", criticalErrors);
            const firstError = criticalErrors[0];
            setError(`Erreur critique d'analyse à la ligne ${firstError.row}: ${firstError.message}`);
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
          .filter(row => row && row.matricule) // Basic validation for a valid row
          .map(row => {
              const parseNumber = (value: string | number | undefined | null): number | undefined => {
                  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return undefined;
                  const cleanedValue = String(value).replace(/ /g, '').replace(/,/g, '.');
                  if (cleanedValue === '') return undefined;
                  const num = parseFloat(cleanedValue);
                  return isNaN(num) ? undefined : num;
              }

              const combinedName = `${row.nom || ''} ${row.prenom || ''}`.trim();
              const photoPath = row.photo ? String(row.photo).trim() : null;

              const isValidPhoto = photoPath && 
                                  photoPath.length > 4 && 
                                  !photoPath.startsWith('.') &&
                                  (photoPath.includes('.') || photoPath.startsWith('http'));

              const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(combinedName || 'E')}&backgroundColor=006039&fontFamily=Arial`;

              const employeeData: Omit<Employe, 'id'> = {
                matricule: String(row.matricule),
                name: combinedName,
                firstName: String(row.prenom || ''),
                lastName: String(row.nom || ''),
                poste: String(row.poste || ''),
                departmentId: String(row.service || ''), // Assuming service from CSV maps to departmentId
                status: String(row.statut) === '1' || String(row.statut).toLowerCase() === 'actif' ? 'Actif' : 'Licencié',
                
                civilite: String(row.civilite || ''),
                sexe: String(row.sexe || 'Autre') as Employe['sexe'],
                mobile: String(row.mobile || ''),
                email: String(row.email || ''),
                
                groupe_1: String(row.groupe_1 || ''),
                groupe_2: String(row.groupe_2 || ''),
                Region: String(row.region || ''),
                Image_Region: String(row.image_region || ''),
                Departement: String(row.departement || ''),
                Commune: String(row.commune || ''),
                Village: String(row.village || ''),

                banque: String(row.banque || ''),
                numeroCompte: String(row.num_compte || ''),
                CB: String(row.cb || ''),
                CG: String(row.cg || ''),
                Cle_RIB: String(row.cle_rib || ''),
                CNPS: String(row.cnps) === '1' || String(row.cnps).toLowerCase() === 'true',
                cnpsEmploye: String(row.num_cnps || ''),
                Num_Decision: String(row.num_decision || ''),
                
                Date_Naissance: String(row.date_naissance || ''),
                dateEmbauche: String(row.date_embauche || ''),
                Date_Immatriculation: String(row.date_immatriculation || ''),
                Date_Depart: String(row.date_depart || ''),

                situationMatrimoniale: String(row.situation_famille || ''),
                Lieu_Naissance: String(row.lieu_naissance || ''),
                
                photoUrl: isValidPhoto 
                  ? (photoPath.startsWith('http') ? photoPath : `/photos/${photoPath}`) 
                  : defaultAvatar,
              };

              // Add numeric fields only if they are valid numbers
              const numericFields: (keyof Employe)[] = [
                'baseSalary', 'primeAnciennete', 'indemniteTransportImposable', 'indemniteResponsabilite', 
                'indemniteLogement', 'indemniteSujetion', 'indemniteCommunication', 'indemniteRepresentation', 
                'Salaire_Brut', 'transportNonImposable', 'Salaire_Net', 'enfants'
              ];
              const csvFieldMap: Record<string, string> = {
                  'baseSalary': 'salaire_base',
                  'primeAnciennete': 'prime_anciennete',
                  'indemniteTransportImposable': 'indemnite_transport',
                  'indemniteResponsabilite': 'indemnite_responsabilite',
                  'indemniteLogement': 'indemnite_logement',
                  'indemniteSujetion': 'indemnite_sujetion',
                  'indemniteCommunication': 'indemnite_communication',
                  'indemniteRepresentation': 'indemnite_representation',
                  'Salaire_Brut': 'salaire_brut',
                  'transportNonImposable': 'indemnite_transport_non_imposable',
                  'Salaire_Net': 'salaire_net',
                  'enfants': 'nombre_enfants'
              };

              numericFields.forEach(field => {
                  const csvField = csvFieldMap[field] || field;
                  const numValue = parseNumber(row[csvField]);
                  if (numValue !== undefined) {
                      (employeeData as any)[field] = numValue;
                  }
              });

              return employeeData;
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
        setError(`Erreur critique lors de l'analyse du fichier CSV : ${err.message}`);
        setIsImporting(false);
      },
    });
  };

  return (
    <Card className="border-none bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-3xl shadow-slate-200/50 border border-white/20 overflow-hidden text-center">
      <CardHeader className="p-10 border-b border-white/10">
        <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                <Upload className="h-8 w-8 text-white" />
            </div>
        </div>
        <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-800">Migration Institutionnelle</CardTitle>
        <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
          Flux d'importation massive des registres du personnel
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-10 space-y-8">
        <div className="relative group">
            <div className="absolute inset-0 bg-blue-600/5 rounded-[2.5rem] border-2 border-dashed border-blue-600/20 group-hover:bg-blue-600/10 group-hover:border-blue-600/40 transition-all duration-300" />
            <div className="relative p-12 space-y-4">
                <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    ref={inputRef} 
                />
                <div className="flex flex-col items-center">
                    <div className="text-sm font-black text-slate-600 uppercase tracking-widest mb-1">
                        {file ? file.name : "Déposer le registre CSV"}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">ou cliquer pour parcourir les fichiers</p>
                </div>
            </div>
        </div>

        <div className="flex flex-col items-center gap-4">
            <a 
                href="/data/import-employes-template.csv" 
                download="modele-import-employes.csv"
                className="flex items-center gap-2 px-6 py-3 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
                <Download className="h-4 w-4" />
                Matrice d'importation standard (.CSV)
            </a>
            <p className="max-w-md mx-auto text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">
                Note : Le système compare automatiquement les matricules pour éviter les doublons. 
                Veuillez respecter l'encodage UTF-8 pour les caractères accentués.
            </p>
        </div>

        {error && (
            <Alert variant="destructive" className="bg-rose-50 border-rose-100 rounded-3xl p-6 animate-in slide-in-from-top-4">
                <AlertCircle className="h-5 w-5 text-rose-500" />
                <AlertTitle className="text-xs font-black uppercase tracking-widest text-rose-700">Anomalie de transfert</AlertTitle>
                <AlertDescription className="text-[11px] font-medium text-rose-600 mt-1">{error}</AlertDescription>
            </Alert>
        )}
      </CardContent>

      <CardFooter className="p-10 bg-slate-50/50 border-t border-white/10 justify-center">
        <Button 
            onClick={handleImport} 
            disabled={isImporting || !file}
            className={cn(
                "h-16 px-10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all",
                isImporting ? "bg-slate-400" : "bg-slate-900 hover:bg-blue-600 hover:scale-105 active:scale-95 shadow-slate-900/20"
            )}
        >
          {isImporting ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Upload className="mr-3 h-5 w-5" />}
          {isImporting ? "Sécurisation des données..." : "Initier l'importation global"}
        </Button>
      </CardFooter>
    </Card>
  );
}
