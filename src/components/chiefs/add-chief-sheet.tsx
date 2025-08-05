
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
import { divisions } from "@/lib/ivory-coast-divisions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { Textarea } from "../ui/textarea";

interface AddChiefSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChief: (chief: Omit<Chief, "id">) => Promise<void>;
}

export function AddChiefSheet({ isOpen, onClose, onAddChief }: AddChiefSheetProps) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<ChiefRole>("Chef de Village");
  const [contact, setContact] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState(`https://placehold.co/100x100.png`);
  
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSubPrefecture, setSelectedSubPrefecture] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [parentChiefId, setParentChiefId] = useState<string | null>(null);

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

  const departments = useMemo(() => selectedRegion ? Object.keys(divisions[selectedRegion]) : [], [selectedRegion]);
  const subPrefectures = useMemo(() => selectedRegion && selectedDepartment ? Object.keys(divisions[selectedRegion][selectedDepartment]) : [], [selectedRegion, selectedDepartment]);
  const villages = useMemo(() => selectedRegion && selectedDepartment && selectedSubPrefecture ? divisions[selectedRegion][selectedDepartment][selectedSubPrefecture] : [], [selectedRegion, selectedDepartment, selectedSubPrefecture]);

  const resetForm = () => {
    setName("");
    setTitle("");
    setRole("Chef de Village");
    setContact("");
    setBio("");
    setPhotoUrl(`https://placehold.co/100x100.png`);
    setSelectedRegion("");
    setSelectedDepartment("");
    setSelectedSubPrefecture("");
    setSelectedVillage("");
    setParentChiefId(null);
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

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setSelectedDepartment("");
    setSelectedSubPrefecture("");
    setSelectedVillage("");
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setSelectedSubPrefecture("");
    setSelectedVillage("");
  };
  
  const handleSubPrefectureChange = (value: string) => {
    setSelectedSubPrefecture(value);
    setSelectedVillage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !title || !role || !selectedRegion || !selectedDepartment || !selectedSubPrefecture || !selectedVillage) {
      setError("Veuillez remplir tous les champs obligatoires (nom, titre, rôle, localisation).");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onAddChief({ 
          name, 
          title, 
          role,
          region: selectedRegion, 
          department: selectedDepartment,
          subPrefecture: selectedSubPrefecture,
          village: selectedVillage,
          contact, 
          bio, 
          photoUrl,
          parentChiefId,
        });
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
              <Label className="text-right">
                Photo
              </Label>
              <div className="col-span-3 flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                     <AvatarImage src={photoUrl} alt="Aperçu de la photo" data-ai-hint="chief portrait" />
                     <AvatarFallback>{name ? name.charAt(0) : 'C'}</AvatarFallback>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom Complet
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Titre
              </Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="Ex: Roi des N'zima" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Rôle</Label>
              <Select value={role} onValueChange={(v: ChiefRole) => setRole(v)} required>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Chef de Village">Chef de Village</SelectItem>
                    <SelectItem value="Chef de Canton">Chef de Canton</SelectItem>
                    <SelectItem value="Roi">Roi</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parentChief" className="text-right">Chef Supérieur</Label>
              <Select value={parentChiefId || ""} onValueChange={(v) => setParentChiefId(v || null)}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Aucun (optionnel)" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {allChiefs.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.title})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="region" className="text-right">Région</Label>
              <Select value={selectedRegion} onValueChange={handleRegionChange} required>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez une région..." /></SelectTrigger>
                <SelectContent>{Object.keys(divisions).sort().map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">Département</Label>
              <Select value={selectedDepartment} onValueChange={handleDepartmentChange} disabled={!selectedRegion} required>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez un département..." /></SelectTrigger>
                <SelectContent>{departments.sort().map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subPrefecture" className="text-right">Sous-préfecture</Label>
              <Select value={selectedSubPrefecture} onValueChange={handleSubPrefectureChange} disabled={!selectedDepartment} required>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez une sous-préfecture..." /></SelectTrigger>
                <SelectContent>{subPrefectures.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="village" className="text-right">Village</Label>
              <Select value={selectedVillage} onValueChange={setSelectedVillage} disabled={!selectedSubPrefecture} required>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionnez un village..." /></SelectTrigger>
                <SelectContent>{villages.sort().map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact" className="text-right">Contact</Label>
              <Input id="contact" type="text" value={contact} onChange={(e) => setContact(e.target.value)} className="col-span-3" placeholder="Numéro de téléphone ou email" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="bio" className="text-right pt-2">Biographie</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="col-span-3" rows={3} placeholder="Brève biographie ou notes..."/>
            </div>
            {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
          </div>
          <SheetFooter className="border-t pt-4">
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
