
"use client";

import { useState, useRef } from "react";
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
import type { Employe } from "@/lib/data";
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

const departmentList = ["Informatique", "Secretariat Général", "Communication", "Direction Administrative", "Direction des Affaires financières et du patrimoine", "Protocole", "Cabinet", "Direction des Affaires sociales", "Directoire", "Comités Régionaux", "Engineering", "Marketing", "Sales", "HR", "Operations", "Other"];

export function AddEmployeeSheet({ isOpen, onClose, onAddEmployee }: AddEmployeeSheetProps) {
  const [matricule, setMatricule] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [poste, setPoste] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<Employe['status']>('Actif');
  const [photoUrl, setPhotoUrl] = useState(`https://placehold.co/100x100.png`);
  const [skills, setSkills] = useState("");
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setMatricule("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPoste("");
    setDepartment("");
    setSkills("");
    setStatus("Actif");
    setPhotoUrl(`https://placehold.co/100x100.png`);
    setAvatarPrompt("");
    setError("");
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
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt) {
        toast({ variant: 'destructive', title: 'Champ requis', description: 'Veuillez entrer une description pour générer un avatar.' });
        return;
    }
    setIsGeneratingAvatar(true);
    try {
        const generatedDataUri = await generateAvatar(avatarPrompt);
        setPhotoUrl(generatedDataUri);
    } catch (err) {
        console.error("Avatar generation failed:", err);
        toast({ variant: 'destructive', title: "Erreur de l'IA", description: "Impossible de générer l'avatar." });
    } finally {
        setIsGeneratingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matricule || !firstName || !lastName || !poste || !department) {
      setError("Veuillez remplir tous les champs obligatoires.");
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
          status, 
          photoUrl, 
          name: `${firstName} ${lastName}`.trim(), 
          skills: skillsArray,
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
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter un nouvel employé</SheetTitle>
            <SheetDescription>
              Remplissez les détails ci-dessous pour ajouter un nouvel employé au système.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4 max-h-[85vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Photo
              </Label>
              <div className="col-span-3 flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                     <AvatarImage src={photoUrl} alt="Aperçu de la photo" data-ai-hint="employee photo" />
                     <AvatarFallback>{firstName ? firstName.charAt(0) : 'E'}</AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Télécharger
                  </Button>
                  <Input 
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    />
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="avatarPrompt" className="text-right pt-2">Avatar IA</Label>
                <div className="col-span-3 space-y-2">
                    <Input 
                        id="avatarPrompt" 
                        value={avatarPrompt} 
                        onChange={e => setAvatarPrompt(e.target.value)} 
                        placeholder="Ex: Femme d'affaire souriante"
                    />
                    <Button type="button" variant="secondary" onClick={handleGenerateAvatar} disabled={isGeneratingAvatar}>
                        {isGeneratingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Générer avec l'IA
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="matricule" className="text-right">
                Matricule
              </Label>
              <Input id="matricule" value={matricule} onChange={(e) => setMatricule(e.target.value)} className="col-span-3" required/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Nom
              </Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="col-span-3" required/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                Prénom(s)
              </Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="col-span-3" required/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="poste" className="text-right">
                Poste
              </Label>
              <Input id="poste" value={poste} onChange={(e) => setPoste(e.target.value)} className="col-span-3" required/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Département
              </Label>
               <Select value={department} onValueChange={(value) => setDepartment(value)} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionnez..." />
                </SelectTrigger>
                <SelectContent>
                  {departmentList.sort().map(dep => (
                    <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Statut
              </Label>
               <Select value={status} onValueChange={(value: Employe['status']) => setStatus(value)} required>
                  <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="En congé">En congé</SelectItem>
                      <SelectItem value="Licencié">Licencié</SelectItem>
                      <SelectItem value="Retraité">Retraité</SelectItem>
                      <SelectItem value="Décédé">Décédé</SelectItem>
                  </SelectContent>
               </Select>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="skills" className="text-right pt-2">
                Compétences
              </Label>
              <Textarea
                id="skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="col-span-3"
                rows={3}
                placeholder="Séparer les compétences par une virgule..."
              />
            </div>
            {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
          </div>
          <SheetFooter className="pt-4 border-t">
            <SheetClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
