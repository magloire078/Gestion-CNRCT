
"use client";

import { useState, useRef, useMemo, useEffect } from "react";
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
import type { Chief, ChiefRole } from "@/lib/data";
import { getChiefs } from "@/services/chief-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { divisions } from "@/lib/ivory-coast-divisions";
import { ScrollArea } from "../ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AddChiefDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChief: (chief: Omit<Chief, "id">, photoFile: File | null) => Promise<void>;
}

export function AddChiefSheet({ isOpen, onClose, onAddChief }: AddChiefDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<ChiefRole>("Chef de Village");
  const [sexe, setSexe] = useState<Chief['sexe'] | "">("");
  const [contact, setContact] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(`https://placehold.co/100x100.png`);
  
  const [selectedRegion, setSelectedRegion] = useState("");
  const [customRegion, setCustomRegion] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [selectedSubPrefecture, setSelectedSubPrefecture] = useState("");
  const [customSubPrefecture, setCustomSubPrefecture] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [customVillage, setCustomVillage] = useState("");

  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');

  const [parentChiefId, setParentChiefId] = useState<string | null>(null);

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [regencyStartDate, setRegencyStartDate] = useState("");
  const [regencyEndDate, setRegencyEndDate] = useState("");

  const [allChiefs, setAllChiefs] = useState<Chief[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen) {
        async function fetchChiefs() {
            try {
                const fetchedChiefs = await getChiefs();
                setAllChiefs(fetchedChiefs);
            } catch (err) {
                console.error("Failed to fetch chiefs list for parent selection", err);
            }
        }
        fetchChiefs();
    }
  }, [isOpen]);

  const departments = useMemo(() => selectedRegion && divisions[selectedRegion] ? Object.keys(divisions[selectedRegion]) : [], [selectedRegion]);
  const subPrefectures = useMemo(() => selectedRegion && selectedDepartment && divisions[selectedRegion]?.[selectedDepartment] ? Object.keys(divisions[selectedRegion][selectedDepartment]) : [], [selectedRegion, selectedDepartment]);
  const villages = useMemo(() => selectedRegion && selectedDepartment && selectedSubPrefecture && divisions[selectedRegion]?.[selectedDepartment]?.[selectedSubPrefecture] ? divisions[selectedRegion][selectedDepartment][selectedSubPrefecture] : [], [selectedRegion, selectedDepartment, selectedSubPrefecture]);


  const resetForm = () => {
    setFirstName(""); setLastName(""); setTitle(""); setRole("Chef de Village"); setSexe(""); setContact("");
    setBio(""); setPhotoFile(null); setPhotoPreview(`https://placehold.co/100x100.png`);
    setSelectedRegion(""); setCustomRegion("");
    setSelectedDepartment(""); setCustomDepartment("");
    setSelectedSubPrefecture(""); setCustomSubPrefecture("");
    setSelectedVillage(""); setCustomVillage("");
    setLatitude(''); setLongitude('');
    setParentChiefId(null); setDateOfBirth("");
    setRegencyStartDate(""); setRegencyEndDate(""); setError("");
    if(fileInputRef.current) fileInputRef.current.value = "";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalRegion = selectedRegion === 'AUTRE' ? customRegion : selectedRegion;
    const finalDepartment = selectedDepartment === 'AUTRE' ? customDepartment : selectedDepartment;
    const finalSubPrefecture = selectedSubPrefecture === 'AUTRE' ? customSubPrefecture : selectedSubPrefecture;
    const finalVillage = selectedVillage === 'AUTRE' ? customVillage : selectedVillage;

    if (!firstName || !lastName || !title) {
      setError("Veuillez remplir au moins les champs nom, prénom et titre.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
        const chiefData: Omit<Chief, "id"> = {
            name: `${lastName} ${firstName}`.trim(),
            firstName,
            lastName,
            title,
            role,
            sexe: sexe as Chief['sexe'],
            region: finalRegion,
            department: finalDepartment,
            subPrefecture: finalSubPrefecture,
            village: finalVillage,
            contact,
            bio,
            photoUrl: '', // This will be set by the service after upload
        };

        if (parentChiefId) chiefData.parentChiefId = parentChiefId;
        if (latitude !== '') chiefData.latitude = Number(latitude);
        if (longitude !== '') chiefData.longitude = Number(longitude);
        if (dateOfBirth) chiefData.dateOfBirth = dateOfBirth;
        if (regencyStartDate) chiefData.regencyStartDate = regencyStartDate;
        if (regencyEndDate) chiefData.regencyEndDate = regencyEndDate;

        await onAddChief(chiefData, photoFile);
        handleClose();
    } catch(err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout du chef.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau Chef</DialogTitle>
          <DialogDescription>
            Remplissez les détails ci-dessous pour ajouter une nouvelle autorité traditionnelle.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ScrollArea className="h-[60vh] p-1 -mr-6 pr-6">
            <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Informations Principales</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-4">
                    <div className="flex items-center gap-4">
                        <Label>Photo</Label>
                        <Avatar className="h-16 w-16"><AvatarImage src={photoPreview} alt="Aperçu de la photo" data-ai-hint="chief portrait" /><AvatarFallback>{lastName ? lastName.charAt(0) : 'C'}</AvatarFallback></Avatar>
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Télécharger</Button>
                        <Input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange}/>
                    </div>
                    <div><Label htmlFor="lastName">Nom</Label><Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
                    <div><Label htmlFor="firstName">Prénom(s)</Label><Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
                    <div><Label htmlFor="title">Titre</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Roi des N'zima" required /></div>
                    <div><Label htmlFor="role">Rôle</Label><Select value={role} onValueChange={(v: ChiefRole) => setRole(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Chef de Village">Chef de Village</SelectItem><SelectItem value="Chef de Canton">Chef de Canton</SelectItem><SelectItem value="Roi">Roi</SelectItem></SelectContent></Select></div>
                    <div><Label htmlFor="parentChief">Chef Supérieur</Label><Select value={parentChiefId ?? 'none'} onValueChange={(v) => setParentChiefId(v === 'none' ? null : v)}><SelectTrigger><SelectValue placeholder="Aucun (optionnel)" /></SelectTrigger><SelectContent><SelectItem value="none">Aucun</SelectItem>{allChiefs.map(c => <SelectItem key={c.id} value={c.id}>{`${c.lastName || ''} ${c.firstName || ''}`} ({c.title})</SelectItem>)}</SelectContent></Select></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Localisation</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-4">
                    <div><Label htmlFor="region">Région</Label><Select value={selectedRegion} onValueChange={v => {setSelectedRegion(v); setSelectedDepartment(''); setSelectedSubPrefecture(''); setSelectedVillage('');}}><SelectTrigger><SelectValue placeholder="Sélectionnez une région..." /></SelectTrigger><SelectContent>{Object.keys(divisions).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent></Select></div>
                    {selectedRegion === 'AUTRE' && <div><Label htmlFor="customRegion">Nouvelle Région</Label><Input id="customRegion" value={customRegion} onChange={e => setCustomRegion(e.target.value)} placeholder="Nom de la nouvelle région" /></div>}

                    <div><Label htmlFor="department">Département</Label><Select value={selectedDepartment} onValueChange={v => {setSelectedDepartment(v); setSelectedSubPrefecture(''); setSelectedVillage('');}} disabled={!selectedRegion || selectedRegion === 'AUTRE'}><SelectTrigger><SelectValue placeholder="Sélectionnez un département..." /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent></Select></div>
                    {selectedDepartment === 'AUTRE' && <div><Label htmlFor="customDepartment">Nouveau Dép.</Label><Input id="customDepartment" value={customDepartment} onChange={e => setCustomDepartment(e.target.value)} placeholder="Nom du nouveau département" /></div>}

                    <div><Label htmlFor="subPrefecture">Sous-préfecture</Label><Select value={selectedSubPrefecture} onValueChange={v => {setSelectedSubPrefecture(v); setSelectedVillage('');}} disabled={!selectedDepartment || selectedDepartment === 'AUTRE'}><SelectTrigger><SelectValue placeholder="Sélectionnez une sous-préfecture..." /></SelectTrigger><SelectContent>{subPrefectures.map(sp => <SelectItem key={sp} value={sp}>{sp}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent></Select></div>
                    {selectedSubPrefecture === 'AUTRE' && <div><Label htmlFor="customSubPrefecture">Nouv. S-préfecture</Label><Input id="customSubPrefecture" value={customSubPrefecture} onChange={e => setCustomSubPrefecture(e.target.value)} placeholder="Nom de la nouvelle sous-préfecture" /></div>}

                    <div><Label htmlFor="village">Village/Commune</Label><Select value={selectedVillage} onValueChange={setSelectedVillage} disabled={!selectedSubPrefecture || selectedSubPrefecture === 'AUTRE'}><SelectTrigger><SelectValue placeholder="Sélectionnez un village..." /></SelectTrigger><SelectContent>{villages.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent></Select></div>
                    {selectedVillage === 'AUTRE' && <div><Label htmlFor="customVillage">Nouveau Village</Label><Input id="customVillage" value={customVillage} onChange={e => setCustomVillage(e.target.value)} placeholder="Nom du nouveau village" /></div>}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label htmlFor="latitude">Latitude</Label><Input id="latitude" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Ex: 5.345" /></div>
                        <div><Label htmlFor="longitude">Longitude</Label><Input id="longitude" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Ex: -4.028" /></div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Informations Additionnelles</AccordionTrigger>
                <AccordionContent>
                   <div className="grid gap-4 pt-4">
                        <div><Label htmlFor="sexe">Sexe</Label><Select value={sexe} onValueChange={(value: Chief['sexe']) => setSexe(value)}><SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent></Select></div>
                        <div><Label htmlFor="dateOfBirth">Date de Naissance</Label><Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></div>
                        <div><Label htmlFor="regencyStartDate">Début de Régence</Label><Input id="regencyStartDate" type="date" value={regencyStartDate} onChange={(e) => setRegencyStartDate(e.target.value)} /></div>
                        <div><Label htmlFor="regencyEndDate">Fin de Régence / Décès</Label><Input id="regencyEndDate" type="date" value={regencyEndDate} onChange={(e) => setRegencyEndDate(e.target.value)} /></div>
                        <div><Label htmlFor="contact">Contact</Label><Input id="contact" type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Numéro de téléphone ou email" /></div>
                        <div><Label htmlFor="bio">Biographie</Label><Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Brève biographie ou notes..."/></div>
                   </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            {error && <p className="text-sm text-destructive text-center py-2">{error}</p>}
          </ScrollArea>
          
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" onClick={handleClose}>Annuler</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
