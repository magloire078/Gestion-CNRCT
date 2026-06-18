

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import type { Employe, Department, Direction, Service } from "@/lib/data";
import { getDepartments } from "@/services/department-service";
import { getDirections } from "@/services/direction-service";
import { getServices } from "@/services/service-service";
import { getLatestMatricule } from "@/services/employee-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2, UserCircle2, Building2, MapPin, ShieldCheck, Briefcase, Info, Save, XCircle } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { divisions } from "@/lib/ivory-coast-divisions";
import { ScrollArea } from "../ui/scroll-area";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { VillageCombobox } from "@/components/chiefs/village-combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface AddEmployeeSheetProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onAddEmployeeAction: (employeeData: Omit<Employe, "id">, photoFile: File | null) => Promise<void>;
}

export function AddEmployeeSheet({ isOpen, onCloseAction, onAddEmployeeAction }: AddEmployeeSheetProps) {
  const [matricule, setMatricule] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [poste, setPoste] = useState("");

  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [directionList, setDirectionList] = useState<Direction[]>([]);
  const [serviceList, setServiceList] = useState<Service[]>([]);

  const [departmentId, setDepartmentId] = useState("");
  const [directionId, setDirectionId] = useState("");
  const [serviceId, setServiceId] = useState("");

  const [status, setStatus] = useState<Employe['status']>('Actif');
  const [sexe, setSexe] = useState<Employe['sexe'] | "">("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(`https://placehold.co/100x100.png`);
  const [skills, setSkills] = useState("");
  const [dateDepart, setDateDepart] = useState("");

  const [region, setRegion] = useState("");
  const [departement, setDepartement] = useState("");
  const [subPrefecture, setSubPrefecture] = useState("");
  const [village, setVillage] = useState("");
  const [numDecision, setNumDecision] = useState("");
  const [cnps, setCnps] = useState(true);
  const [dateImmatriculation, setDateImmatriculation] = useState("");
  const [dateCessationCNPS, setDateCessationCNPS] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      async function fetchInitialData() {
        setIsSubmitting(true); // Use isSubmitting to show a loader
        try {
          const [depts, dirs, svcs, nextMatricule] = await Promise.all([
            getDepartments(),
            getDirections(),
            getServices(),
            getLatestMatricule(),
          ]);
          setDepartmentList(depts);
          setDirectionList(dirs);
          setServiceList(svcs);
          setMatricule(nextMatricule);
        } catch (err) {
          console.error("Failed to fetch organizational data", err);
          setError("Impossible de charger les données de l'organisation ou le prochain matricule.");
        } finally {
          setIsSubmitting(false);
        }
      }
      fetchInitialData();
    }
  }, [isOpen]);

  const filteredDirections = useMemo(() => {
    if (!departmentId) return [];
    return directionList.filter(d => d.departmentId === departmentId);
  }, [departmentId, directionList]);

  const filteredServices = useMemo(() => {
    if (directionId) {
      return serviceList.filter(s => s.directionId === directionId);
    }
    if (departmentId) {
      return serviceList.filter(s => s.departmentId === departmentId && !s.directionId);
    }
    return [];
  }, [departmentId, directionId, serviceList]);


  const resetForm = () => {
    setMatricule("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPoste("");
    setDepartmentId("");
    setDirectionId("");
    setServiceId("");
    setSkills("");
    setStatus("Actif");
    setSexe("");
    setPhotoFile(null);
    setPhotoPreview(`https://placehold.co/100x100.png`);
    setError("");
    setDateDepart("");
    setRegion("");
    setDepartement("");
    setSubPrefecture("");
    setVillage("");
    setNumDecision("");
    setCnps(true);
    setDateImmatriculation("");
    setDateCessationCNPS("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const handleClose = () => {
    resetForm();
    onCloseAction();
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matricule || !firstName || !lastName || !poste || !departmentId) {
      setError("Veuillez remplir tous les champs obligatoires (matricule, noms, poste, département).");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
      const employeeData: Omit<Employe, "id"> = {
        matricule,
        firstName,
        lastName,
        email,
        poste,
        departmentId,
        directionId: directionId || undefined,
        serviceId: serviceId || undefined,
        status,
        name: `${lastName} ${firstName}`.trim(),
        skills: skillsArray,
        sexe: sexe as Employe['sexe'],
        Date_Depart: dateDepart,
        Region: region,
        Departement: departement,
        subPrefecture: subPrefecture,
        Village: village,
        Num_Decision: numDecision,
        CNPS: cnps,
        Date_Immatriculation: cnps ? dateImmatriculation : undefined,
        Date_Cessation_CNPS: cnps ? dateCessationCNPS : undefined,
        photoUrl: '', // This will be set by the service after upload
      };
      await onAddEmployeeAction(employeeData, photoFile);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de l'employé. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="sm:max-w-2xl bg-slate-50/50 p-0 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          <form onSubmit={handleSubmit} className="h-full flex flex-col overflow-hidden">
            <DialogHeader className="px-6 py-5 bg-white border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <UserCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-slate-800 text-left">Enrôlement Agent</DialogTitle>
                  <DialogDescription className="text-sm text-slate-500 mt-1 text-left">
                    Création d'un nouveau dossier individuel
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-slate-200">
                {isSubmitting && !firstName ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Initialisation...</p>
                  </div>
                ) : (
                  <div className="grid gap-8 pb-5">
                    {/* Photo upload section */}
                    <div className="flex items-center gap-5 p-5 bg-white rounded-xl border border-slate-100 shadow-sm group">
                      <div className="relative">
                        <Avatar className="h-20 w-20 border-2 border-white shadow-md transition-transform group-hover:scale-105 duration-300">
                          <AvatarImage src={photoPreview} alt="Aperçu" className="object-cover" />
                          <AvatarFallback className="text-xl font-semibold bg-slate-100 text-slate-400">{lastName ? lastName.charAt(0) : 'E'}</AvatarFallback>
                        </Avatar>
                        <Button 
                          type="button" 
                          size="icon" 
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors" 
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-semibold text-slate-800">Photographie Officielle</Label>
                        <p className="text-xs text-slate-500">JPG/PNG 400x400px. Max 2Mo.</p>
                      </div>
                      <Input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </div>

                    {/* Section 1: Identity */}
                    <div className="space-y-5 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-5 w-5 text-blue-500" />
                        <h3 className="text-base font-semibold text-slate-800">Identité de l'agent</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                         <div className="space-y-2">
                          <Label htmlFor="matricule" className="text-slate-700 font-medium">N° Matricule</Label>
                          <Input id="matricule" value={matricule} onChange={(e) => setMatricule(e.target.value)} required className="h-11 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-blue-500/50" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sexe" className="text-slate-700 font-medium">Genre</Label>
                          <Select value={sexe} onValueChange={(value) => setSexe(value as Employe['sexe'])}>
                            <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white">
                              <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                              <SelectItem value="Homme">Homme</SelectItem>
                              <SelectItem value="Femme">Femme</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-slate-700 font-medium">Nom de Famille</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="h-11 rounded-lg border-slate-200 uppercase" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-slate-700 font-medium">Prénom(s)</Label>
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="h-11 rounded-lg border-slate-200 capitalize" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700 font-medium">Canal Email (Personnel)</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-lg border-slate-200" placeholder="exemple@cnrct.ci" />
                      </div>
                    </div>

                    {/* Section 2: Organisation */}
                    <div className="space-y-5 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-indigo-500" />
                        <h3 className="text-base font-semibold text-slate-800">Affectation & Poste</h3>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="poste" className="text-slate-700 font-medium">Intitulé du Poste</Label>
                        <Input id="poste" value={poste} onChange={(e) => setPoste(e.target.value)} required className="h-11 rounded-lg border-slate-200" />
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-medium">Département Parent</Label>
                          <Select value={departmentId} onValueChange={(value) => { setDepartmentId(value); setDirectionId(''); setServiceId(''); }} required>
                            <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                            <SelectContent className="rounded-lg">
                              {departmentList.map(dep => (<SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Direction</Label>
                            <Select value={directionId} onValueChange={(value) => { setDirectionId(value); setServiceId(''); }} disabled={!departmentId || filteredDirections.length === 0}>
                              <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white"><SelectValue placeholder="—" /></SelectTrigger>
                              <SelectContent className="rounded-lg">
                                {filteredDirections.map(dir => (<SelectItem key={dir.id} value={dir.id}>{dir.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Unité / Service</Label>
                            <Select value={serviceId} onValueChange={setServiceId} disabled={!departmentId || filteredServices.length === 0}>
                              <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white"><SelectValue placeholder="—" /></SelectTrigger>
                              <SelectContent className="rounded-lg">
                                {filteredServices.map(svc => (<SelectItem key={svc.id} value={svc.id}>{svc.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Geolocation */}
                    <div className="space-y-5 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-5 w-5 text-emerald-500" />
                        <h3 className="text-base font-semibold text-slate-800">Localisation Géo-Administrative</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="region" className="text-slate-700 font-medium">Région</Label>
                          <Select value={region} onValueChange={(val) => { setRegion(val); setDepartement(""); setSubPrefecture(""); setVillage(""); }}>
                            <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                            <SelectContent className="rounded-lg max-h-[300px]">
                              {IVORIAN_REGIONS.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="departement" className="text-slate-700 font-medium">Département</Label>
                          <Select value={departement} onValueChange={(val) => { setDepartement(val); setSubPrefecture(""); setVillage(""); }} disabled={!region}>
                            <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                            <SelectContent className="rounded-lg max-h-[300px]">
                              {Object.keys(divisions[region] || {}).sort().map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="subPrefecture" className="text-slate-700 font-medium">Sous-Préfecture</Label>
                          <Select value={subPrefecture} onValueChange={(val) => { setSubPrefecture(val); setVillage(""); }} disabled={!departement}>
                            <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                            <SelectContent className="rounded-lg max-h-[300px]">
                              {Object.keys(divisions[region]?.[departement] || {}).sort().map(sp => (
                                <SelectItem key={sp} value={sp}>{sp}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="village" className="text-slate-700 font-medium">Village / Quartier</Label>
                          <VillageCombobox
                              value={village}
                              onValueChange={(val) => setVillage(val)}
                              region={region}
                              department={departement}
                              subPrefecture={subPrefecture}
                              disabled={!subPrefecture}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Section 4: Administrative status */}
                    <div className="space-y-5 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-5 w-5 text-orange-500" />
                        <h3 className="text-base font-semibold text-slate-800">Paramètres de Gestion RH</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                         <div className="space-y-2">
                          <Label htmlFor="status" className="text-slate-700 font-medium">Statut Courant</Label>
                          <Select value={status} onValueChange={(value: Employe['status']) => setStatus(value)} required>
                            <SelectTrigger className={cn("h-11 rounded-lg border-slate-200 bg-white font-medium", status === 'Actif' ? 'text-emerald-600' : 'text-slate-600')}>
                              <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                              <SelectItem value="Actif">Actif</SelectItem>
                              <SelectItem value="En congé">En congé</SelectItem>
                              <SelectItem value="Remplacé">Remplacé</SelectItem>
                              <SelectItem value="Retraité">Retraité</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="numDecision" className="text-slate-700 font-medium">Référence Décision</Label>
                          <Input id="numDecision" value={numDecision} onChange={(e) => setNumDecision(e.target.value)} className="h-11 rounded-lg border-slate-200 bg-white" placeholder="EX: DEC-2024-..." />
                        </div>
                      </div>

                      <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden group">
                        <div className="flex items-center space-x-3 mb-4">
                          <Checkbox 
                            id="cnps-add" 
                            checked={cnps} 
                            onCheckedChange={(checked) => setCnps(checked as boolean)}
                            className="h-5 w-5 rounded-md border-blue-200 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm transition-all"
                          />
                          <Label htmlFor="cnps-add" className="text-sm font-semibold text-slate-800 cursor-pointer">Immatriculation CNPS active</Label>
                        </div>
                        {cnps && (
                           <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Date d'immatriculation</Label>
                              <Input 
                                type="date"
                                value={dateImmatriculation} 
                                onChange={(e) => setDateImmatriculation(e.target.value)}
                                className="h-11 rounded-lg border-blue-200 bg-white focus-visible:ring-blue-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cessation (Optionnel)</Label>
                              <Input 
                                type="date"
                                value={dateCessationCNPS} 
                                onChange={(e) => setDateCessationCNPS(e.target.value)}
                                className="h-11 rounded-lg border-slate-200 bg-white focus-visible:ring-slate-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="skills" className="text-slate-700 font-medium">Expertises & Compétences</Label>
                        <Textarea 
                          id="skills" 
                          value={skills} 
                          onChange={(e) => setSkills(e.target.value)} 
                          className="rounded-xl border-slate-200 bg-white min-h-[100px] p-4 text-sm focus-visible:ring-blue-500/50" 
                          placeholder="EX: Gestion de Projet, Informatique, Mécanique..." 
                        />
                        <p className="text-xs text-slate-500 italic ml-1">Séparez les expertises par des virgules.</p>
                      </div>
                    </div>

                    {error && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 shadow-sm">
                        <XCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">{error}</p>
                      </div>
                    )}
                  </div>
                )}
            </div>

            <DialogFooter className="px-6 py-4 bg-white border-t border-slate-100 shrink-0">
              <div className="flex gap-3 w-full justify-end">
                <DialogClose asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClose}
                    className="h-10 px-6 border-slate-200 text-slate-700 font-medium"
                  >
                    Annuler
                  </Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> 
                      Valider Dossier
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </>
  );
}
