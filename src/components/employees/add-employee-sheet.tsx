
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Employe, Department, Direction, Service } from "@/lib/data";
import { getDepartments } from "@/services/department-service";
import { getDirections } from "@/services/direction-service";
import { getServices } from "@/services/service-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Sparkles, Loader2 } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { generateAvatar } from "@/ai/flows/generate-avatar-flow";
import { useToast } from "@/hooks/use-toast";

interface AddEmployeeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: Omit<Employe, "id">) => Promise<void>;
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
  const [sexe, setSexe] = useState<Employe['sexe'] | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState(`https://placehold.co/100x100.png`);
  const [skills, setSkills] = useState("");
  const [dateDepart, setDateDepart] = useState("");
  
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

  const filteredDirections = useMemo(() => {
    if (!department) return [];
    const selectedDept = departmentList.find(d => d.name === department);
    return selectedDept ? directionList.filter(d => d.departmentId === selectedDept.id) : [];
  }, [department, directionList, departmentList]);

  const filteredServices = useMemo(() => {
    if (!direction) return [];
    const selectedDir = directionList.find(d => d.name === direction);
    return selectedDir ? serviceList.filter(s => s.directionId === selectedDir.id) : [];
  }, [direction, serviceList, directionList]);


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
    setSexe(undefined);
    setPhotoUrl(undefined);
    setPhotoPreview(`https://placehold.co/100x100.png`);
    setError("");
    setAvatarPrompt("");
    setGeneratedAvatar(null);
    setDateDepart("");
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
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPhotoUrl(dataUri);
        setPhotoPreview(dataUri);
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

  const useGeneratedAvatar = () => {
    if(generatedAvatar) {
      setPhotoUrl(generatedAvatar);
      setPhotoPreview(generatedAvatar);
      setIsAvatarDialogOpen(false);
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
      await onAddEmployee({ 
          matricule, 
          firstName, 
          lastName, 
          email, 
          poste, 
          department, 
          direction,
          service,
          status, 
          photoUrl: photoUrl || '', 
          name: `${firstName} ${lastName}`.trim(), 
          skills: skillsArray,
          sexe,
          Date_Depart: dateDepart || undefined,
      });
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
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter un nouvel employé</SheetTitle>
            <SheetDescription>
              Remplissez les détails ci-dessous pour ajouter un nouvel employé au système.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4 max-h-[85vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Photo</Label>
              <div className="col-span-3 flex items-center gap-4">
                  <Avatar className="h-16 w-16"><AvatarImage src={photoPreview} alt="Aperçu de la photo" data-ai-hint="employee photo" /><AvatarFallback>{firstName ? firstName.charAt(0) : 'E'}</AvatarFallback></Avatar>
                  <div className="flex flex-col gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Télécharger</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsAvatarDialogOpen(true)}><Sparkles className="mr-2 h-4 w-4" />Générer avec IA</Button>
                  </div>
                  <Input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange}/>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="matricule" className="text-right">Matricule</Label><Input id="matricule" value={matricule} onChange={(e) => setMatricule(e.target.value)} className="col-span-3" required/></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="lastName" className="text-right">Nom</Label><Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="col-span-3" required/></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="firstName" className="text-right">Prénom(s)</Label><Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="col-span-3" required/></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email" className="text-right">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="poste" className="text-right">Poste</Label><Input id="poste" value={poste} onChange={(e) => setPoste(e.target.value)} className="col-span-3" required/></div>
            
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="department" className="text-right">Département</Label><Select value={department} onValueChange={(value) => { setDepartment(value); setDirection(''); setService(''); }} required><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent>{departmentList.map(dep => (<SelectItem key={dep.id} value={dep.name}>{dep.name}</SelectItem>))}</SelectContent></Select></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="direction" className="text-right">Direction</Label><Select value={direction} onValueChange={(value) => { setDirection(value); setService(''); }} disabled={!department}><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent>{filteredDirections.map(dir => (<SelectItem key={dir.id} value={dir.name}>{dir.name}</SelectItem>))}</SelectContent></Select></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="service" className="text-right">Service</Label><Select value={service} onValueChange={setService} disabled={!direction}><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent>{filteredServices.map(svc => (<SelectItem key={svc.id} value={svc.name}>{svc.name}</SelectItem>))}</SelectContent></Select></div>

            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="status" className="text-right">Statut</Label><Select value={status} onValueChange={(value: Employe['status']) => setStatus(value)} required><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez un statut" /></SelectTrigger><SelectContent><SelectItem value="Actif">Actif</SelectItem><SelectItem value="En congé">En congé</SelectItem><SelectItem value="Licencié">Licencié</SelectItem><SelectItem value="Retraité">Retraité</SelectItem><SelectItem value="Décédé">Décédé</SelectItem></SelectContent></Select></div>
             <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="dateDepart" className="text-right">Date de Départ</Label><Input id="dateDepart" type="date" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="sexe" className="text-right">Sexe</Label><Select value={sexe} onValueChange={(value: Employe['sexe']) => setSexe(value)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez un sexe" /></SelectTrigger><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="skills" className="text-right pt-2">Compétences</Label><Textarea id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} className="col-span-3" rows={3} placeholder="Séparer les compétences par une virgule..."/></div>
            
            {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
          </div>
          <SheetFooter className="pt-4 border-t">
            <SheetClose asChild><Button type="button" variant="outline" onClick={handleClose}>Annuler</Button></SheetClose>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
    
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

    
