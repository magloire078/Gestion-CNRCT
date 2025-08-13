
"use client";

import { useState, useRef, useMemo, useEffect } from "react";
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
import type { Chief, ChiefRole } from "@/lib/data";
import { getChiefs } from "@/services/chief-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { divisions } from "@/lib/ivory-coast-divisions";

interface AddChiefSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChief: (chief: Omit<Chief, "id">, photoFile: File | null) => Promise<void>;
}

export function AddChiefSheet({ isOpen, onClose, onAddChief }: AddChiefSheetProps) {
  const [name, setName] = useState("");
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
    setName(""); setTitle(""); setRole("Chef de Village"); setSexe(""); setContact("");
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

    if (!name || !title || !role || !finalRegion || !finalDepartment || !finalSubPrefecture || !finalVillage) {
      setError("Veuillez remplir tous les champs obligatoires (nom, titre, rôle, et toute la localisation).");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const chiefData = { 
          name, title, role, sexe: sexe as Chief['sexe'],
          region: finalRegion, 
          department: finalDepartment,
          subPrefecture: finalSubPrefecture,
          village: finalVillage,
          contact, bio, parentChiefId,
          photoUrl: '', // This will be set by the service after upload
          latitude: latitude !== '' ? Number(latitude) : undefined,
          longitude: longitude !== '' ? Number(longitude) : undefined,
          dateOfBirth: dateOfBirth || undefined,
          regencyStartDate: regencyStartDate || undefined,
          regencyEndDate: regencyEndDate || undefined,
        };
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
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter un nouveau Chef</SheetTitle>
            <SheetDescription>
              Remplissez les détails ci-dessous pour ajouter une nouvelle autorité traditionnelle.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4 max-h-[85vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Photo</Label>
              <div className="col-span-3 flex items-center gap-4">
                  <Avatar className="h-16 w-16"><AvatarImage src={photoPreview} alt="Aperçu de la photo" data-ai-hint="chief portrait" /><AvatarFallback>{name ? name.charAt(0) : 'C'}</AvatarFallback></Avatar>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Télécharger</Button>
                  <Input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange}/>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Nom Complet</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="title" className="text-right">Titre</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="Ex: Roi des N'zima" required /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="role" className="text-right">Rôle</Label><Select value={role} onValueChange={(v: ChiefRole) => setRole(v)} required><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Chef de Village">Chef de Village</SelectItem><SelectItem value="Chef de Canton">Chef de Canton</SelectItem><SelectItem value="Roi">Roi</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="sexe" className="text-right">Sexe</Label><Select value={sexe} onValueChange={(value: Chief['sexe']) => setSexe(value)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="parentChief" className="text-right">Chef Supérieur</Label><Select value={parentChiefId ?? 'none'} onValueChange={(v) => setParentChiefId(v === 'none' ? null : v)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Aucun (optionnel)" /></SelectTrigger><SelectContent><SelectItem value="none">Aucun</SelectItem>{allChiefs.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.title})</SelectItem>)}</SelectContent></Select></div>
            
            {/* Location Fields */}
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="region" className="text-right">Région</Label><Select value={selectedRegion} onValueChange={v => {setSelectedRegion(v); setSelectedDepartment(''); setSelectedSubPrefecture(''); setSelectedVillage('');}} required><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez une région..." /></SelectTrigger><SelectContent>{Object.keys(divisions).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent></Select></div>
            {selectedRegion === 'AUTRE' && <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="customRegion" className="text-right">Nouvelle Région</Label><Input id="customRegion" value={customRegion} onChange={e => setCustomRegion(e.target.value)} className="col-span-3" placeholder="Nom de la nouvelle région" required /></div>}

            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="department" className="text-right">Département</Label><Select value={selectedDepartment} onValueChange={v => {setSelectedDepartment(v); setSelectedSubPrefecture(''); setSelectedVillage('');}} disabled={!selectedRegion || selectedRegion === 'AUTRE'} required><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez un département..." /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent></Select></div>
            {selectedDepartment === 'AUTRE' && <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="customDepartment" className="text-right">Nouveau Dép.</Label><Input id="customDepartment" value={customDepartment} onChange={e => setCustomDepartment(e.target.value)} className="col-span-3" placeholder="Nom du nouveau département" required /></div>}

            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="subPrefecture" className="text-right">Sous-préfecture</Label><Select value={selectedSubPrefecture} onValueChange={v => {setSelectedSubPrefecture(v); setSelectedVillage('');}} disabled={!selectedDepartment || selectedDepartment === 'AUTRE'} required><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez une sous-préfecture..." /></SelectTrigger><SelectContent>{subPrefectures.map(sp => <SelectItem key={sp} value={sp}>{sp}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent></Select></div>
            {selectedSubPrefecture === 'AUTRE' && <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="customSubPrefecture" className="text-right">Nouv. S-préfecture</Label><Input id="customSubPrefecture" value={customSubPrefecture} onChange={e => setCustomSubPrefecture(e.target.value)} className="col-span-3" placeholder="Nom de la nouvelle sous-préfecture" required /></div>}

            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="village" className="text-right">Village/Commune</Label><Select value={selectedVillage} onValueChange={setSelectedVillage} disabled={!selectedSubPrefecture || selectedSubPrefecture === 'AUTRE'} required><SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez un village..." /></SelectTrigger><SelectContent>{villages.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent></Select></div>
            {selectedVillage === 'AUTRE' && <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="customVillage" className="text-right">Nouveau Village</Label><Input id="customVillage" value={customVillage} onChange={e => setCustomVillage(e.target.value)} className="col-span-3" placeholder="Nom du nouveau village" required /></div>}

            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="latitude" className="text-right">Latitude</Label><Input id="latitude" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value === '' ? '' : parseFloat(e.target.value))} className="col-span-3" placeholder="Ex: 5.345" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="longitude" className="text-right">Longitude</Label><Input id="longitude" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value === '' ? '' : parseFloat(e.target.value))} className="col-span-3" placeholder="Ex: -4.028" /></div>
            
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="dateOfBirth" className="text-right">Date de Naissance</Label><Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="regencyStartDate" className="text-right">Début de Régence</Label><Input id="regencyStartDate" type="date" value={regencyStartDate} onChange={(e) => setRegencyStartDate(e.target.value)} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="regencyEndDate" className="text-right">Fin de Régence / Décès</Label><Input id="regencyEndDate" type="date" value={regencyEndDate} onChange={(e) => setRegencyEndDate(e.target.value)} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="contact" className="text-right">Contact</Label><Input id="contact" type="text" value={contact} onChange={(e) => setContact(e.target.value)} className="col-span-3" placeholder="Numéro de téléphone ou email" /></div>
            <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="bio" className="text-right pt-2">Biographie</Label><Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="col-span-3" rows={3} placeholder="Brève biographie ou notes..."/></div>
            
            {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
          </div>
          <SheetFooter className="border-t pt-4">
            <SheetClose asChild><Button type="button" variant="outline" onClick={handleClose}>Annuler</Button></SheetClose>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
