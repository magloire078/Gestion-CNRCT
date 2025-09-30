

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Sparkles, Loader2 } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { generateAvatar } from "@/ai/flows/generate-avatar-flow";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";

interface AddEmployeeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employeeData: Omit<Employe, "id">, photoFile: File | null) => Promise<void>;
}

export function AddEmployeeSheet({ isOpen, onClose, onAddEmployee }: AddEmployeeSheetProps) {
  const [matricule, setMatricule] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [poste, setPoste] = useState("");
  
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [directionList, setDirectionList] = useState<Direction[]>([]);
  const [serviceList, setServiceList] = useState<Service[]>([]);
  
  const [department, setDepartment] = useState("");
  const [direction, setDirection] = useState("");
  const [service, setService] = useState("");

  const [status, setStatus] = useState<Employe['status']>('Actif');
  const [sexe, setSexe] = useState<Employe['sexe'] | "">("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(`https://placehold.co/100x100.png`);
  const [skills, setSkills] = useState("");
  const [dateDepart, setDateDepart] = useState("");
  
  const [region, setRegion] = useState("");
  const [village, setVillage] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      async function fetchInitialData() {
        try {
          const [depts, dirs, svcs] = await Promise.all([
            getDepartments(),
            getDirections(),
            getServices(),
          ]);
          setDepartmentList(depts);
          setDirectionList(dirs);
          setServiceList(svcs);
        } catch (err) {
          console.error("Failed to fetch organizational data", err);
          setError("Impossible de charger les données de l'organisation.");
        }
      }
      fetchInitialData();
    }
  }, [isOpen]);

  const selectedDepartmentObject = useMemo(() => departmentList.find(d => d.name === department), [department, departmentList]);

  const filteredDirections = useMemo(() => {
    if (!selectedDepartmentObject) return [];
    return directionList.filter(d => d.departmentId === selectedDepartmentObject.id);
  }, [selectedDepartmentObject, directionList]);

  const filteredServices = useMemo(() => {
    const selectedDir = directionList.find(d => d.name === direction);
    if (selectedDir) {
      return serviceList.filter(s => s.directionId === selectedDir.id);
    }
    if (selectedDepartmentObject) {
      return serviceList.filter(s => s.departmentId === selectedDepartmentObject.id && !s.directionId);
    }
    return [];
  }, [direction, selectedDepartmentObject, directionList, serviceList]);


  const resetForm = () => {
    setMatricule("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPoste("");
    setDepartment("");
    setDirection("");
    setService("");
    setSkills("");
    setStatus("Actif");
    setSexe("");
    setPhotoFile(null);
    setPhotoPreview(`https://placehold.co/100x100.png`);
    setError("");
    setAvatarPrompt("");
    setGeneratedAvatar(null);
    setDateDepart("");
    setRegion("");
    setVillage("");
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleClose = () => {
    resetForm();
    onClose();
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

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt) return;
    setIsGenerating(true);
    setGeneratedAvatar(null);
    try {
      const imageUrl = await generateAvatar(avatarPrompt);
      setGeneratedAvatar(imageUrl);
    } catch(err) {
       toast({
        variant: "destructive",
        title: "Erreur de génération",
        description: "Impossible de générer l'avatar. Veuillez réessayer.",
      });
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  const useGeneratedAvatar = async () => {
    if(generatedAvatar) {
        try {
            const response = await fetch(generatedAvatar);
            const blob = await response.blob();
            const file = new File([blob], "ai_avatar.png", { type: blob.type });
            setPhotoFile(file);
            setPhotoPreview(generatedAvatar);
            setIsAvatarDialogOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erreur d'utilisation",
                description: "Impossible d'utiliser l'avatar généré. Veuillez réessayer.",
            });
            console.error("Error converting data URL to file:", error);
        }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matricule || !firstName || !lastName || !poste || !department) {
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
          department, 
          direction,
          service,
          status, 
          name: `${lastName} ${firstName}`.trim(), 
          skills: skillsArray,
          sexe: sexe as Employe['sexe'],
          Date_Depart: dateDepart,
          Region: region,
          Village: village,
          photoUrl: '', // This will be set by the service after upload
      };
      await onAddEmployee(employeeData, photoFile);
      handleClose();
    } catch(err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de l'employé. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
            <DialogTitle>Ajouter un nouvel employé</DialogTitle>
            <DialogDescription>
            Remplissez les détails ci-dessous pour ajouter un nouvel employé au système.
            </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            <ScrollArea className="h-[60vh] p-1 -mx-6 pr-6">
                <div className="grid gap-4 px-6">
                    <div className="flex items-center gap-4">
                    <Label>Photo</Label>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16"><AvatarImage src={photoPreview} alt="Aperçu de la photo" data-ai-hint="employee photo" /><AvatarFallback>{firstName ? firstName.charAt(0) : 'E'}</AvatarFallback></Avatar>
                        <div className="flex flex-col gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Télécharger</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsAvatarDialogOpen(true)}><Sparkles className="mr-2 h-4 w-4" />Générer avec IA</Button>
                        </div>
                        <Input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange}/>
                    </div>
                    </div>

                    <div><Label htmlFor="matricule">Matricule</Label><Input id="matricule" value={matricule} onChange={(e) => setMatricule(e.target.value)} required/></div>
                    <div><Label htmlFor="lastName">Nom</Label><Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required/></div>
                    <div><Label htmlFor="firstName">Prénom(s)</Label><Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required/></div>
                    <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                    <div><Label htmlFor="poste">Poste</Label><Input id="poste" value={poste} onChange={(e) => setPoste(e.target.value)} required/></div>
                    
                    <div><Label htmlFor="department">Département</Label><Select value={department} onValueChange={(value) => { setDepartment(value); setDirection(''); setService(''); }} required><SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent>{departmentList.map(dep => (<SelectItem key={dep.id} value={dep.name}>{dep.name}</SelectItem>))}</SelectContent></Select></div>
                    <div><Label htmlFor="direction">Direction</Label><Select value={direction} onValueChange={(value) => { setDirection(value); setService(''); }} disabled={!department || filteredDirections.length === 0}><SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent>{filteredDirections.map(dir => (<SelectItem key={dir.id} value={dir.name}>{dir.name}</SelectItem>))}</SelectContent></Select></div>
                    <div><Label htmlFor="service">Service</Label><Select value={service} onValueChange={setService} disabled={!department || filteredServices.length === 0}><SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent>{filteredServices.map(svc => (<SelectItem key={svc.id} value={svc.name}>{svc.name}</SelectItem>))}</SelectContent></Select></div>

                    <div><Label htmlFor="region">Région</Label><Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} /></div>
                    <div><Label htmlFor="village">Village</Label><Input id="village" value={village} onChange={(e) => setVillage(e.target.value)} /></div>
                    
                    <div><Label htmlFor="status">Statut</Label><Select value={status} onValueChange={(value: Employe['status']) => setStatus(value)} required><SelectTrigger><SelectValue placeholder="Sélectionnez un statut" /></SelectTrigger><SelectContent><SelectItem value="Actif">Actif</SelectItem><SelectItem value="En congé">En congé</SelectItem><SelectItem value="Licencié">Licencié</SelectItem><SelectItem value="Retraité">Retraité</SelectItem><SelectItem value="Décédé">Décédé</SelectItem></SelectContent></Select></div>
                    <div><Label htmlFor="dateDepart">Date de Départ</Label><Input id="dateDepart" type="date" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)} /></div>
                    <div><Label htmlFor="sexe">Sexe</Label><Select value={sexe} onValueChange={(value: Employe['sexe']) => setSexe(value)}><SelectTrigger><SelectValue placeholder="Sélectionnez un sexe" /></SelectTrigger><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent></Select></div>
                    <div><Label htmlFor="skills">Compétences</Label><Textarea id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} rows={3} placeholder="Séparer les compétences par une virgule..."/></div>
                    
                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                </div>
            </ScrollArea>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" onClick={handleClose}>Annuler</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    
    <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Générer un avatar avec l'IA</DialogTitle>
            <DialogDescription>
                Décrivez l'avatar que vous souhaitez créer. Soyez simple et clair.
            </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="avatar-prompt">Description de l'avatar</Label>
                    <Input 
                        id="avatar-prompt" 
                        value={avatarPrompt} 
                        onChange={(e) => setAvatarPrompt(e.target.value)} 
                        placeholder="Ex: Homme d'affaires souriant" 
                    />
                </div>
                {isGenerating && (
                    <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    </div>
                )}
                {generatedAvatar && (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-sm font-medium">Résultat :</p>
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={generatedAvatar} alt="Avatar généré" data-ai-hint="ai avatar" />
                            <AvatarFallback>IA</AvatarFallback>
                        </Avatar>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)}>Fermer</Button>
                 {generatedAvatar ? (
                    <Button onClick={useGeneratedAvatar}>Utiliser cet avatar</Button>
                 ) : (
                    <Button onClick={handleGenerateAvatar} disabled={isGenerating || !avatarPrompt}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Générer
                    </Button>
                 )}
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
