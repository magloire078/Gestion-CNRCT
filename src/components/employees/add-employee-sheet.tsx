

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
import { ScrollArea } from "../ui/scroll-area";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Checkbox } from "@/components/ui/checkbox";

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
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <SheetContent className="sm:max-w-xl bg-white/40 backdrop-blur-2xl border-l border-white/20 p-0 shadow-3xl overflow-hidden rounded-l-[3rem]">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-transparent pointer-events-none" />
            
            <SheetHeader className="p-10 pb-6 relative z-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                  <UserCircle2 className="h-6 w-6 text-white" />
                </div>
                <SheetTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Enrôlement Agent</SheetTitle>
              </div>
              <SheetDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Création d'un nouveau dossier individuel dans la base CNRCT
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-hidden relative z-10">
              <ScrollArea className="h-full w-full px-10">
                {isSubmitting && !firstName ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Initialisation du flux...</p>
                  </div>
                ) : (
                  <div className="grid gap-10 pb-10">
                    {/* Photo upload section */}
                    <div className="flex items-center gap-8 p-6 bg-white/40 rounded-[2rem] border border-white/20 shadow-xl shadow-slate-200/20 group">
                      <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-2xl transition-transform group-hover:scale-105 duration-500">
                          <AvatarImage src={photoPreview} alt="Aperçu" className="object-cover" />
                          <AvatarFallback className="text-2xl font-black bg-slate-100 text-slate-400 uppercase">{lastName ? lastName.charAt(0) : 'E'}</AvatarFallback>
                        </Avatar>
                        <Button 
                          type="button" 
                          size="icon" 
                          className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-slate-900 border-4 border-white shadow-xl hover:scale-110" 
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600 transition-colors">Photographie Officielle</Label>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-bold">Format recommandé : JPG/PNG 400x400px. Taille max 2Mo.</p>
                      </div>
                      <Input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </div>

                    {/* Section 1: Identity */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                        <Info className="h-4 w-4 text-slate-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identité de l'agent</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                          <Label htmlFor="matricule" className="text-[9px] font-black uppercase tracking-widest text-slate-900 ml-1">N° Matricule</Label>
                          <DebouncedInput id="matricule" value={matricule} onChange={(val) => setMatricule(val as string)} required className="h-12 rounded-xl bg-slate-900 text-white font-black tracking-widest border-none shadow-lg focus-visible:ring-blue-500/50" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sexe" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Genre</Label>
                          <Select value={sexe} onValueChange={(value) => setSexe(value as Employe['sexe'])}>
                            <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900">
                              <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-3xl">
                              <SelectItem value="Homme" className="font-bold py-3 uppercase text-[9px] tracking-widest">Homme</SelectItem>
                              <SelectItem value="Femme" className="font-bold py-3 uppercase text-[9px] tracking-widest">Femme</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Nom de Famille</Label>
                        <DebouncedInput id="lastName" value={lastName} onChange={(val) => setLastName(val as string)} required className="h-12 rounded-xl border-slate-200 bg-white shadow-inner font-bold uppercase" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Prénom(s)</Label>
                        <DebouncedInput id="firstName" value={firstName} onChange={(val) => setFirstName(val as string)} required className="h-12 rounded-xl border-slate-200 bg-white shadow-inner font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Canal Email (Personnel)</Label>
                        <DebouncedInput id="email" type="email" value={email} onChange={(val) => setEmail(val as string)} className="h-12 rounded-xl border-slate-200 bg-white italic" placeholder="exemple@cnrct.ci" />
                      </div>
                    </div>

                    {/* Section 2: Organisation */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Affectation & Poste</h3>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="poste" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Intitulé du Poste</Label>
                        <DebouncedInput id="poste" value={poste} onChange={(val) => setPoste(val as string)} required className="h-12 rounded-xl border-slate-200 bg-white font-black uppercase text-blue-600 shadow-sm" />
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Département Parent</Label>
                          <Select value={departmentId} onValueChange={(value) => { setDepartmentId(value); setDirectionId(''); setServiceId(''); }} required>
                            <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-3xl">
                              {departmentList.map(dep => (<SelectItem key={dep.id} value={dep.id} className="font-bold py-3 uppercase text-[9px] tracking-widest">{dep.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Direction</Label>
                            <Select value={directionId} onValueChange={(value) => { setDirectionId(value); setServiceId(''); }} disabled={!departmentId || filteredDirections.length === 0}>
                              <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold"><SelectValue placeholder="—" /></SelectTrigger>
                              <SelectContent className="rounded-xl border-slate-100 shadow-3xl">
                                {filteredDirections.map(dir => (<SelectItem key={dir.id} value={dir.id} className="font-bold py-3 uppercase text-[8px] tracking-widest">{dir.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Unité / Service</Label>
                            <Select value={serviceId} onValueChange={setServiceId} disabled={!departmentId || filteredServices.length === 0}>
                              <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold"><SelectValue placeholder="—" /></SelectTrigger>
                              <SelectContent className="rounded-xl border-slate-100 shadow-3xl">
                                {filteredServices.map(svc => (<SelectItem key={svc.id} value={svc.id} className="font-bold py-3 uppercase text-[8px] tracking-widest">{svc.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Geolocation */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Localisation Géo-Administrative</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="region" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Région</Label>
                          <Select value={region} onValueChange={setRegion}>
                            <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-3xl max-h-[300px]">
                              {IVORIAN_REGIONS.map(r => (<SelectItem key={r} value={r} className="font-bold py-3 uppercase text-[9px] tracking-widest">{r}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="departement" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Département</Label>
                          <DebouncedInput id="departement" value={departement} onChange={(val) => setDepartement(val as string)} className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold" />
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Administrative status */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                        <ShieldCheck className="h-4 w-4 text-slate-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Paramètres de Gestion RH</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                          <Label htmlFor="status" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Statut Courant</Label>
                          <Select value={status} onValueChange={(value: Employe['status']) => setStatus(value)} required>
                            <SelectTrigger className={cn("h-12 rounded-xl border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest shadow-sm", status === 'Actif' ? 'text-emerald-600' : 'text-slate-600')}>
                              <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-3xl">
                              <SelectItem value="Actif" className="font-bold py-3 uppercase text-[9px] tracking-widest text-emerald-600">Actif</SelectItem>
                              <SelectItem value="En congé" className="font-bold py-3 uppercase text-[9px] tracking-widest text-blue-600">En congé</SelectItem>
                              <SelectItem value="Licencié" className="font-bold py-3 uppercase text-[9px] tracking-widest text-rose-600">Licencié</SelectItem>
                              <SelectItem value="Retraité" className="font-bold py-3 uppercase text-[9px] tracking-widest text-slate-500">Retraité</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="numDecision" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Référence Décision</Label>
                          <DebouncedInput id="numDecision" value={numDecision} onChange={(val) => setNumDecision(val as string)} className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-mono font-bold" placeholder="EX: DEC-2024-..." />
                        </div>
                      </div>

                      <div className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100 shadow-xl shadow-blue-500/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <ShieldCheck className="h-16 w-16" />
                        </div>
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center space-x-3">
                            <Checkbox 
                              id="cnps-add" 
                              checked={cnps} 
                              onCheckedChange={(checked) => setCnps(checked as boolean)}
                              className="h-6 w-6 rounded-lg border-blue-200 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-md transition-all"
                            />
                            <Label htmlFor="cnps-add" className="text-[10px] font-black uppercase tracking-widest text-slate-700 cursor-pointer">Immatriculation CNPS active</Label>
                          </div>
                        </div>
                        {cnps && (
                           <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-blue-600 ml-1">Date d'effet immatriculation</Label>
                            <Input 
                              type="date"
                              value={dateCessationCNPS} 
                              onChange={(e) => setDateCessationCNPS(e.target.value)}
                              className="h-12 rounded-xl border-blue-200 bg-white/60 font-bold focus-visible:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="skills" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Expertises & Compétences</Label>
                        <Textarea 
                          id="skills" 
                          value={skills} 
                          onChange={(e) => setSkills(e.target.value)} 
                          className="rounded-2xl border-slate-200 bg-white/60 min-h-[100px] p-6 text-sm font-medium focus-visible:ring-blue-500/50 shadow-inner" 
                          placeholder="EX: Gestion de Projet, Informatique, Mécanique..." 
                        />
                        <p className="text-[9px] text-slate-400 font-bold italic ml-2">Séparez les expertises par des virgules.</p>
                      </div>
                    </div>

                    {error && (
                      <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600 shadow-lg shadow-rose-200/50">
                        <XCircle className="h-6 w-6" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>

            <SheetFooter className="p-10 bg-white/40 border-t border-white/20 backdrop-blur-md relative z-10">
              <div className="flex gap-4 w-full">
                <SheetClose asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClose}
                    className="h-14 flex-1 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 hover:text-slate-900 shadow-lg"
                  >
                    Annuler
                  </Button>
                </SheetClose>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-14 flex-1 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-black shadow-2xl shadow-black/20 group"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="mr-3 h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" /> 
                      Valider Dossier
                    </>
                  )}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

    </>
  );
}
