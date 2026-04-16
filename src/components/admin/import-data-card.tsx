

import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertCircle, Download, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { batchAddEmployees } from "@/services/employee-service";
import { getDepartments } from "@/services/department-service";
import { getDirections } from "@/services/direction-service";
import { getServices } from "@/services/service-service";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import type { Employe, Department, Direction, Service } from "@/lib/data";
import { cn } from "@/lib/utils";


// Define a more flexible type for CSV row to handle various fields
type EmployeeCsvRow = { [key: string]: string | number | undefined | null };

export function ImportDataCard() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const loadMappingData = async () => {
      try {
        const [depts, dirs, servs] = await Promise.all([
          getDepartments(),
          getDirections(),
          getServices()
        ]);
        setDepartments(depts);
        setDirections(dirs);
        setServices(servs);
      } catch (err) {
        console.error("Failed to load mapping data:", err);
      }
    };
    loadMappingData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessCount(0);
    setProgress(0);
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
                departmentId: (() => {
                    const csvValue = String(row.service || '').trim().toLowerCase();
                    if (!csvValue) return '';
                    
                    // 1. Try to match department name
                    const deptMatch = departments.find(d => 
                        d.name.toLowerCase().includes(csvValue) || 
                        csvValue.includes(d.name.toLowerCase())
                    );
                    if (deptMatch) return deptMatch.id;

                    // 2. Try to match direction name (fallback)
                    const dirMatch = directions.find(d => 
                        d.name.toLowerCase().includes(csvValue) || 
                        csvValue.includes(d.name.toLowerCase())
                    );
                    if (dirMatch) return dirMatch.departmentId || '';

                    // 3. Fallback to raw value
                    return csvValue;
                })(),
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
    <Card className="border-white/20 shadow-3xl overflow-hidden bg-white/40 backdrop-blur-xl rounded-[2.5rem] group transition-all duration-700 hover:border-white/40 hover:-translate-y-2 relative">
      <CardHeader className="bg-slate-900 p-10 text-white relative overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="flex items-center gap-5 relative z-10">
            <div className="p-4 rounded-[1.5rem] bg-white/10 border border-white/20 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <FileSpreadsheet className="h-7 w-7 text-emerald-400" />
            </div>
            <div className="space-y-1">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/80">Flux RH Massif</CardTitle>
                <CardDescription className="text-2xl font-black uppercase tracking-tighter text-white">
                  Intégration CSV
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-10 space-y-8 relative z-10">
        <div className="flex flex-col gap-6">
            <div className="relative group/input">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent scale-x-0 group-hover/input:scale-x-100 transition-transform duration-700" />
                <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange} 
                    className="h-24 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-white hover:border-emerald-500/50 transition-all cursor-pointer flex items-center justify-center text-center font-bold px-10 pt-8 shadow-inner" 
                    ref={inputRef} 
                    disabled={isImporting}
                />
                <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/input:text-emerald-600 transition-colors">
                    <Upload className="h-3.5 w-3.5" /> Sélectionner le Fichier Source
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <a 
                    href="/data/import-employes-template.csv" 
                    download="modele-import-employes.csv"
                    className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 hover:text-emerald-600 flex items-center gap-3 transition-all duration-300 hover:translate-x-1"
                >
                    <Download className="h-5 w-5" />
                    Modèle Canaux RH
                </a>
                
                {successCount > 0 && (
                    <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 shadow-2xl animate-in zoom-in-95">
                        <CheckCircle2 className="h-4 w-4" />
                        {successCount} Intégrés
                    </div>
                )}
            </div>
        </div>

        {isImporting && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">
                    <span className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                        Injection Géo-Spatiale
                    </span>
                    <span className="text-emerald-600">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2.5 rounded-full overflow-hidden bg-slate-100 shadow-inner" />
                <p className="text-[9px] text-center font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
                    Transmission Sécurisée des Données...
                </p>
            </div>
        )}

        {error && (
            <Alert variant="destructive" className="bg-rose-50 border-rose-100 rounded-[1.5rem] animate-in zoom-in-95 duration-500 shadow-xl shadow-rose-500/5">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <AlertTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-600">Incident d&apos;Analayse</AlertTitle>
                <AlertDescription className="text-[10px] font-bold text-rose-500 leading-relaxed uppercase opacity-80 tracking-wide">{error}</AlertDescription>
            </Alert>
        )}
      </CardContent>
      <CardFooter className="p-10 pt-0 relative z-10">
        <Button 
            onClick={handleImport} 
            disabled={isImporting || !file} 
            className={cn(
                "w-full h-14 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all transform active:scale-95 shadow-2xl",
                isImporting ? "bg-slate-100 text-slate-400" : "bg-slate-900 border-slate-900 text-white hover:bg-black shadow-slate-900/40"
            )}
        >
          {isImporting ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Upload className="mr-3 h-5 w-5" />}
          {isImporting ? `Synchronisation (${progress}%)` : "Exécuter l'Importation"}
        </Button>
      </CardFooter>
    </Card>
  );
}
