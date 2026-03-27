

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
} from "@/components/ui/select";
import type { Employe, Department, Direction, Service } from "@/lib/data";
import { getDepartments } from "@/services/department-service";
import { getDirections } from "@/services/direction-service";
import { getServices } from "@/services/service-service";
import { getLatestMatricule } from "@/services/employee-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { ScrollArea } from "../ui/scroll-area";
import { DebouncedInput } from "@/components/ui/debounced-input";

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
  const [village, setVillage] = useState("");
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
    setVillage("");
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
        Village: village,
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
        <SheetContent className="sm:max-w-xl">
          <form onSubmit={handleSubmit}>
            <SheetHeader>
              <SheetTitle>Ajouter un nouvel employé</SheetTitle>
              <SheetDescription>
                Remplissez les détails ci-dessous pour ajouter un nouvel employé au système.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 h-[calc(100vh-150px)]">
              <ScrollArea className="h-full w-full pr-6">
                {isSubmitting ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="flex items-center gap-4">
                      <Label>Photo</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16"><AvatarImage src={photoPreview} alt="Aperçu de la photo" data-ai-hint="employee photo" /><AvatarFallback>{lastName ? lastName.charAt(0) : 'E'}</AvatarFallback></Avatar>
                        <div className="flex flex-col gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Télécharger</Button>
                        </div>
                        <Input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                      </div>
                    </div>

                    <div><Label htmlFor="matricule">Matricule</Label><DebouncedInput id="matricule" value={matricule} onChange={(val) => setMatricule(val as string)} required /></div>
                    <div><Label htmlFor="lastName">Nom</Label><DebouncedInput id="lastName" value={lastName} onChange={(val) => setLastName(val as string)} required /></div>
                    <div><Label htmlFor="firstName">Prénom(s)</Label><DebouncedInput id="firstName" value={firstName} onChange={(val) => setFirstName(val as string)} required /></div>
                    <div><Label htmlFor="email">Email</Label><DebouncedInput id="email" type="email" value={email} onChange={(val) => setEmail(val as string)} /></div>
                    <div><Label htmlFor="poste">Poste</Label><DebouncedInput id="poste" value={poste} onChange={(val) => setPoste(val as string)} required /></div>

                    <div><Label htmlFor="departmentId">Département</Label><Select value={departmentId} onValueChange={(value) => { setDepartmentId(value); setDirectionId(''); setServiceId(''); }} required><SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent>{departmentList.map(dep => (<SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>))}</SelectContent></Select></div>
                    <div><Label htmlFor="directionId">Direction</Label><Select value={directionId} onValueChange={(value) => { setDirectionId(value); setServiceId(''); }} disabled={!departmentId || filteredDirections.length === 0}><SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent>{filteredDirections.map(dir => (<SelectItem key={dir.id} value={dir.id}>{dir.name}</SelectItem>))}</SelectContent></Select></div>
                    <div><Label htmlFor="serviceId">Service</Label><Select value={serviceId} onValueChange={setServiceId} disabled={!departmentId || filteredServices.length === 0}><SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent>{filteredServices.map(svc => (<SelectItem key={svc.id} value={svc.id}>{svc.name}</SelectItem>))}</SelectContent></Select></div>

                    <div><Label htmlFor="region">Région</Label><Select value={region} onValueChange={setRegion}><SelectTrigger><SelectValue placeholder="Sélectionnez une région..." /></SelectTrigger><SelectContent>{IVORIAN_REGIONS.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent></Select></div>
                    <div><Label htmlFor="village">Village</Label><DebouncedInput id="village" value={village} onChange={(val) => setVillage(val as string)} /></div>

                    <div><Label htmlFor="status">Statut</Label><Select value={status} onValueChange={(value: Employe['status']) => setStatus(value)} required><SelectTrigger><SelectValue placeholder="Sélectionnez un statut" /></SelectTrigger><SelectContent><SelectItem value="Actif">Actif</SelectItem><SelectItem value="En congé">En congé</SelectItem><SelectItem value="Licencié">Licencié</SelectItem><SelectItem value="Retraité">Retraité</SelectItem><SelectItem value="Décédé">Décédé</SelectItem></SelectContent></Select></div>
                    <div><Label htmlFor="dateDepart">Date de Départ</Label><Input id="dateDepart" type="date" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)} /></div>
                    <div><Label htmlFor="sexe">Sexe</Label><Select value={sexe} onValueChange={(value) => setSexe(value as Employe['sexe'])}><SelectTrigger><SelectValue placeholder="Sélectionnez un sexe" /></SelectTrigger><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent></Select></div>
                    <div><Label htmlFor="skills">Compétences</Label><Textarea id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} rows={3} placeholder="Séparer les compétences par une virgule..." /></div>

                    <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="cnps-add" 
                          checked={cnps} 
                          onChange={(e) => setCnps(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="cnps-add" className="font-bold text-xs uppercase tracking-tight">Cotise à la CNPS</Label>
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="dateCessationCNPS" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Date Cessation</Label>
                        <Input 
                          id="dateCessationCNPS" 
                          type="date" 
                          className="h-8 text-xs"
                          value={dateCessationCNPS} 
                          onChange={(e) => setDateCessationCNPS(e.target.value)} 
                          disabled={!cnps}
                        />
                      </div>
                    </div>

                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                  </div>
                )}
              </ScrollArea>
            </div>
            <SheetFooter>
              <SheetClose asChild><Button type="button" variant="outline" onClick={handleClose}>Annuler</Button></SheetClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

    </>
  );
}
