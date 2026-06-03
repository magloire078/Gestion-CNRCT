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
import type { Chief, ChiefRole, DesignationMode, ChiefCareerEvent, Predecessor } from "@/types/chief";
import { getChiefs } from "@/services/chief-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Plus, Trash2 as TrashIcon, ChevronRight, ChevronLeft, MapPin as PinIcon, ShieldCheck } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { divisions } from "@/lib/ivory-coast-divisions";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { ScrollArea } from "../ui/scroll-area";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { LocationPicker } from "@/components/common/location-picker";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AddChiefDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onAddChiefAction: (chief: Omit<Chief, "id">, photoFile: File | null) => Promise<void>;
}

const STEPS = [
  { id: 1, title: "Identité", description: "Informations de base et rôle" },
  { id: 2, title: "Territoire", description: "Localisation et carte" },
  { id: 3, title: "Culture & Contact", description: "Ethnie et coordonnées" },
  { id: 4, title: "Carrière", description: "Légal et historique" }
];

export function AddChiefSheet({ isOpen, onCloseAction, onAddChiefAction }: AddChiefDialogProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  // --- Form States ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<ChiefRole>("Chef de Village");
  const [additionalRoles, setAdditionalRoles] = useState<ChiefRole[]>([]);
  const [cnrctAffiliation, setCnrctAffiliation] = useState<Chief['cnrctAffiliation']>("Aucune");
  const [designationDate, setDesignationDate] = useState("");
  const [designationMode, setDesignationMode] = useState<DesignationMode | "">("");
  const [ethnicGroup, setEthnicGroup] = useState("");
  const [languages, setLanguages] = useState("");
  const [CNRCTRegistrationNumber, setCNRCTRegistrationNumber] = useState("");
  const [officialDocuments, setOfficialDocuments] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [sexe, setSexe] = useState<Chief['sexe'] | "">("");
  const [phone, setPhone] = useState("");
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
  const [status, setStatus] = useState<Chief['status']>("actif");
  const [career, setCareer] = useState<ChiefCareerEvent[]>([]);
  const [predecessors, setPredecessors] = useState<Predecessor[]>([]);
  const [throneAccessionDate, setThroneAccessionDate] = useState("");

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
        } catch (err) {}
      }
      fetchChiefs();
      setStep(1);
    }
  }, [isOpen]);

  const departments = useMemo(() => selectedRegion && divisions[selectedRegion] ? Object.keys(divisions[selectedRegion]) : [], [selectedRegion]);
  const subPrefectures = useMemo(() => selectedRegion && selectedDepartment && divisions[selectedRegion]?.[selectedDepartment] ? Object.keys(divisions[selectedRegion][selectedDepartment]) : [], [selectedRegion, selectedDepartment]);
  const villages = useMemo(() => selectedRegion && selectedDepartment && selectedSubPrefecture && divisions[selectedRegion]?.[selectedDepartment]?.[selectedSubPrefecture] ? divisions[selectedRegion][selectedDepartment][selectedSubPrefecture] : [], [selectedRegion, selectedDepartment, selectedSubPrefecture]);

  const resetForm = () => {
    setFirstName(""); setLastName(""); setTitle(""); setRole("Chef de Village"); setAdditionalRoles([]); setCnrctAffiliation("Aucune"); setSexe(""); setPhone(""); setContact("");
    setBio(""); setPhotoFile(null); setPhotoPreview(`https://placehold.co/100x100.png`);
    setSelectedRegion(""); setCustomRegion(""); setSelectedDepartment(""); setCustomDepartment("");
    setSelectedSubPrefecture(""); setCustomSubPrefecture(""); setSelectedVillage(""); setCustomVillage("");
    setLatitude(''); setLongitude(''); setParentChiefId(null); setDateOfBirth("");
    setRegencyStartDate(""); setRegencyEndDate(""); setStatus("actif"); setError("");
    setDesignationDate(""); setDesignationMode(""); setEthnicGroup(""); setLanguages("");
    setCNRCTRegistrationNumber(""); setOfficialDocuments(""); setEmail(""); setAddress("");
    setCareer([]); setPredecessors([]); setThroneAccessionDate(""); setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!firstName || !lastName || !title)) {
      setError("Veuillez remplir les champs obligatoires (Nom, Prénom, Titre).");
      return;
    }
    setError("");
    setDirection(1);
    setStep(s => Math.min(s + 1, STEPS.length));
  };

  const prevStep = () => {
    setError("");
    setDirection(-1);
    setStep(s => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !title) {
      setError("Informations d'identité incomplètes.");
      setStep(1);
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const finalRegion = selectedRegion === 'AUTRE' ? customRegion : selectedRegion;
      const finalDepartment = selectedDepartment === 'AUTRE' ? customDepartment : selectedDepartment;
      const finalSubPrefecture = selectedSubPrefecture === 'AUTRE' ? customSubPrefecture : selectedSubPrefecture;
      const finalVillage = selectedVillage === 'AUTRE' ? customVillage : selectedVillage;

      const chiefData: Omit<Chief, "id"> = {
        name: `${lastName} ${firstName}`.trim(),
        firstName, lastName, title, role,
        additionalRoles: additionalRoles.length > 0 ? additionalRoles : undefined,
        designationDate: designationDate || undefined,
        designationMode: designationMode as DesignationMode,
        sexe: sexe as Chief['sexe'],
        region: finalRegion, department: finalDepartment, subPrefecture: finalSubPrefecture, village: finalVillage,
        ethnicGroup: ethnicGroup || undefined,
        languages: languages ? languages.split(',').map(s => s.trim()) : undefined,
        phone: phone || undefined, contact, email: email || undefined, address: address || undefined,
        CNRCTRegistrationNumber: CNRCTRegistrationNumber || undefined,
        cnrctAffiliation: cnrctAffiliation !== "Aucune" ? cnrctAffiliation : undefined,
        officialDocuments: officialDocuments || undefined,
        status: status || 'actif', bio, career, predecessors, photoUrl: '',
      };

      if (throneAccessionDate) chiefData.throneAccessionDate = throneAccessionDate;

      if (parentChiefId) chiefData.parentChiefId = parentChiefId;
      if (latitude !== '') chiefData.latitude = Number(latitude);
      if (longitude !== '') chiefData.longitude = Number(longitude);
      if (dateOfBirth) chiefData.dateOfBirth = dateOfBirth;
      if (regencyStartDate) chiefData.regencyStartDate = regencyStartDate;
      if (regencyEndDate) chiefData.regencyEndDate = regencyEndDate;

      await onAddChiefAction(chiefData, photoFile);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout du chef.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    hidden: (direction: number) => ({ x: direction > 0 ? '50%' : '-50%', opacity: 0 }),
    visible: { x: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    exit: (direction: number) => ({ x: direction > 0 ? '-50%' : '50%', opacity: 0, transition: { duration: 0.2 } })
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-slate-50 w-full h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[85vh]">
        <div className="flex flex-col md:flex-row h-full">
          {/* Sidebar Wizard Navigation */}
          <div className="w-full md:w-64 bg-white border-b md:border-r md:border-b-0 border-slate-100 p-4 md:p-6 shrink-0 flex flex-col justify-between">
            <div>
              <div className="hidden md:block mb-8">
                <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Ajout Autorité</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">Enregistrement au registre CNRCT</p>
              </div>
              <div className="flex flex-row md:flex-col justify-between md:justify-start space-y-0 md:space-y-6 overflow-x-auto no-scrollbar pb-2">
                {STEPS.map((s, idx) => (
                  <div key={s.id} className="flex flex-col md:flex-row items-center md:items-start gap-1 md:gap-4 flex-1 md:flex-none">
                    <div className={cn(
                      "flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full border-2 text-[10px] md:text-xs font-black shrink-0 transition-all duration-300",
                      step === s.id ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/30" 
                      : step > s.id ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 border-slate-200 text-slate-400"
                    )}>
                      {step > s.id ? "✓" : s.id}
                    </div>
                    <div className="flex flex-col pt-0 md:pt-1 text-center md:text-left">
                      <span className={cn("text-[9px] md:text-sm font-bold uppercase tracking-wider line-clamp-1", step === s.id ? "text-slate-900" : step > s.id ? "text-slate-700" : "text-slate-400")}>
                        {s.title}
                      </span>
                      <span className="hidden md:block text-[10px] text-slate-400">{s.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="hidden md:block mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 italic">"L'autorité traditionnelle est la garante de la cohésion sociale."</p>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 flex flex-col relative bg-white overflow-hidden min-h-0">
            <DialogHeader className="p-6 border-b border-slate-100 bg-white z-10 shrink-0">
              <DialogTitle className="text-xl">{STEPS[step-1].title}</DialogTitle>
              <DialogDescription>{STEPS[step-1].description}</DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 p-6 relative h-full">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6 pb-20"
                >
                  {/* STEP 1: Identité */}
                  {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="col-span-1 md:col-span-2 p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-6">
                            <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                                <AvatarImage src={photoPreview} />
                                <AvatarFallback className="text-xl bg-blue-50 text-blue-600 font-black">{lastName ? lastName.charAt(0) : 'C'}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-black tracking-widest text-slate-500">Portrait Officiel</Label>
                                <div className="flex gap-3">
                                    <Button type="button" variant="default" size="sm" onClick={() => fileInputRef.current?.click()} className="shadow-md">
                                        <Upload className="mr-2 h-4 w-4" /> Parcourir...
                                    </Button>
                                    <Input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                </div>
                                <p className="text-[10px] text-slate-400">Format JPG ou PNG. Taille max 5MB.</p>
                            </div>
                        </div>

                        <div className="space-y-2"><Label>Nom <span className="text-red-500">*</span></Label><DebouncedInput value={lastName} onChange={(v) => setLastName(v as string)} placeholder="Ex: HOUPHOUËT" /></div>
                        <div className="space-y-2"><Label>Prénom(s) <span className="text-red-500">*</span></Label><DebouncedInput value={firstName} onChange={(v) => setFirstName(v as string)} placeholder="Ex: Boigny" /></div>
                        <div className="space-y-2"><Label>Titre traditionnel <span className="text-red-500">*</span></Label><DebouncedInput value={title} onChange={(v) => setTitle(v as string)} placeholder="Ex: Nanan, Awoula..." /></div>
                        
                        <div className="space-y-2">
                            <Label>Niveau de Juridiction (Rôle Principal) <span className="text-red-500">*</span></Label>
                            <Select value={role} onValueChange={(v: ChiefRole) => { setRole(v); setAdditionalRoles(additionalRoles.filter(r => r !== v)); }}>
                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 focus:ring-blue-500"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Roi" className="font-bold text-amber-700">Roi</SelectItem>
                                    <SelectItem value="Chef de province">Chef de province</SelectItem>
                                    <SelectItem value="Chef de canton">Chef de canton</SelectItem>
                                    <SelectItem value="Chef de tribu">Chef de tribu</SelectItem>
                                    <SelectItem value="Chef de Village">Chef de Village</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Casquettes Supplémentaires (Optionnel)</Label>
                            <p className="text-[10px] text-slate-500">Si l'autorité cumule plusieurs fonctions (ex: Chef de village ET Chef de tribu)</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {(["Roi", "Chef de province", "Chef de canton", "Chef de tribu", "Chef de Village"] as ChiefRole[]).filter(r => r !== role).map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => {
                                            if (additionalRoles.includes(r)) {
                                                setAdditionalRoles(additionalRoles.filter(ar => ar !== r));
                                            } else {
                                                setAdditionalRoles([...additionalRoles, r]);
                                            }
                                        }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                                            additionalRoles.includes(r) 
                                                ? "bg-blue-100 text-blue-700 border-blue-300" 
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Sexe</Label>
                            <Select value={sexe} onValueChange={(v) => setSexe(v as Chief['sexe'])}>
                                <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                                <SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2"><Label>Date de Naissance</Label><Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></div>
                    </div>
                  )}

                  {/* STEP 2: Territoire & Carte */}
                  {step === 2 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Région</Label>
                                <Select value={selectedRegion} onValueChange={v => { setSelectedRegion(v); setSelectedDepartment(''); setSelectedSubPrefecture(''); setSelectedVillage(''); }}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                                    <SelectContent>{IVORIAN_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent>
                                </Select>
                                {selectedRegion === 'AUTRE' && <Input value={customRegion} onChange={e => setCustomRegion(e.target.value)} placeholder="Nom..." className="mt-2" />}
                            </div>

                            <div className="space-y-2">
                                <Label>Département</Label>
                                <Select value={selectedDepartment} onValueChange={v => { setSelectedDepartment(v); setSelectedSubPrefecture(''); setSelectedVillage(''); }} disabled={!selectedRegion || selectedRegion === 'AUTRE'}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                                    <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent>
                                </Select>
                                {selectedDepartment === 'AUTRE' && <Input value={customDepartment} onChange={e => setCustomDepartment(e.target.value)} placeholder="Nom..." className="mt-2" />}
                            </div>

                            <div className="space-y-2">
                                <Label>Sous-préfecture</Label>
                                <Select value={selectedSubPrefecture} onValueChange={v => { setSelectedSubPrefecture(v); setSelectedVillage(''); }} disabled={!selectedDepartment || selectedDepartment === 'AUTRE'}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                                    <SelectContent>{subPrefectures.map(sp => <SelectItem key={sp} value={sp}>{sp}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent>
                                </Select>
                                {selectedSubPrefecture === 'AUTRE' && <Input value={customSubPrefecture} onChange={e => setCustomSubPrefecture(e.target.value)} placeholder="Nom..." className="mt-2" />}
                            </div>

                            <div className="space-y-2">
                                <Label>Village/Commune</Label>
                                <Select value={selectedVillage} onValueChange={setSelectedVillage} disabled={!selectedSubPrefecture || selectedSubPrefecture === 'AUTRE'}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                                    <SelectContent>{villages.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent>
                                </Select>
                                {selectedVillage === 'AUTRE' && <Input value={customVillage} onChange={e => setCustomVillage(e.target.value)} placeholder="Nom..." className="mt-2" />}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl space-y-4">
                            <div>
                                <Label className="text-sm font-black uppercase text-slate-700">Géolocalisation SIG</Label>
                                <p className="text-[10px] text-slate-500">Placez le curseur sur la carte pour définir les coordonnées précises.</p>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 overflow-hidden rounded-xl border-2 border-white shadow-lg">
                                    <LocationPicker 
                                        onLocationSelectAction={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
                                        initialLat={latitude !== '' ? latitude : undefined}
                                        initialLng={longitude !== '' ? longitude : undefined}
                                    />
                                </div>
                                <div className="flex flex-col gap-4 justify-center">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Latitude</Label>
                                        <Input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.000000" className="font-mono bg-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Longitude</Label>
                                        <Input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.000000" className="font-mono bg-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                  )}

                  {/* STEP 3: Culture & Contact */}
                  {step === 3 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Groupe ethnique</Label><DebouncedInput value={ethnicGroup} onChange={(v) => setEthnicGroup(v as string)} placeholder="Ex: Akan, Baoulé..." /></div>
                            <div className="space-y-2"><Label>Langue(s) parlée(s)</Label><DebouncedInput value={languages} onChange={(v) => setLanguages(v as string)} placeholder="Séparées par une virgule" /></div>
                            <div className="col-span-2 space-y-2"><Label>Us, Coutumes & Biographie</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Brève biographie, historique de la chefferie, us et coutumes..." className="resize-none" /></div>
                        </div>

                        <div className="h-px bg-slate-100 my-4" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Téléphone Principal</Label><DebouncedInput type="tel" inputMode="tel" value={phone} onChange={(v) => setPhone(v as string)} placeholder="+225 0700000000" /></div>
                            <div className="space-y-2"><Label>Contact Secondaire</Label><DebouncedInput type="tel" inputMode="tel" value={contact} onChange={(v) => setContact(v as string)} placeholder="Assistant, Secrétaire..." /></div>
                            <div className="space-y-2"><Label>Adresse email</Label><DebouncedInput type="email" value={email} onChange={(v) => setEmail(v as string)} placeholder="email@domaine.ci" /></div>
                            <div className="space-y-2"><Label>Adresse postale</Label><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Boîte postale ou description..." /></div>
                        </div>
                    </div>
                  )}

                  {/* STEP 4: Carrière & Légal */}
                  {step === 4 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div className="space-y-2"><Label>N° d'enregistrement CNRCT</Label><Input value={CNRCTRegistrationNumber} onChange={e => setCNRCTRegistrationNumber(e.target.value)} className="bg-white font-mono" placeholder="Ex: CNRCT-2024-001" /></div>
                            <div className="space-y-2">
                                <Label>Statut Actuel</Label>
                                <Select value={status} onValueChange={(v) => setStatus(v as Chief['status'])}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="actif">En Exercice (Actif)</SelectItem>
                                        <SelectItem value="a_vie">Régence à Vie</SelectItem>
                                        <SelectItem value="archive">Archivé / Décédé</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Affiliation CNRCT</Label>
                                <Select value={cnrctAffiliation} onValueChange={(v) => setCnrctAffiliation(v as Chief['cnrctAffiliation'])}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Aucune" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Aucune">Aucune</SelectItem>
                                        <SelectItem value="Directoire">Directoire</SelectItem>
                                        <SelectItem value="Comité Régional">Comité Régional</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2"><Label>Mode de désignation</Label><Select value={designationMode} onValueChange={(v: DesignationMode) => setDesignationMode(v)}><SelectTrigger className="bg-white"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger><SelectContent><SelectItem value="Héritage">Héritage</SelectItem><SelectItem value="Élection">Élection</SelectItem><SelectItem value="Nomination coutumière">Nomination coutumière</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label>Date de désignation</Label><Input type="date" value={designationDate} onChange={e => setDesignationDate(e.target.value)} className="bg-white" /></div>
                            <div className="space-y-2"><Label>Date d'accession au Trône</Label><Input type="date" value={throneAccessionDate} onChange={e => setThroneAccessionDate(e.target.value)} className="bg-white" /></div>
                            <div className="col-span-1 space-y-2"><Label>Documents officiels (Décrets, Arrêtés)</Label><Textarea value={officialDocuments} onChange={(e) => setOfficialDocuments(e.target.value)} rows={2} className="bg-white" placeholder="Références des arrêtés de nomination..." /></div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <Label className="text-sm font-black uppercase text-slate-700">Chronologie de Carrière</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => setCareer([...career, { id: crypto.randomUUID(), date: "", title: "", type: "Intronisation", description: "" }])} className="shadow-sm">
                                    <Plus className="mr-2 h-4 w-4" /> Ajouter Événement
                                </Button>
                            </div>
                            
                            {career.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-medium">Aucun événement ajouté au dossier.</div>
                            ) : (
                                <div className="space-y-4">
                                    {career.map((event, index) => (
                                        <div key={event.id} className="relative p-4 bg-white border border-slate-200 rounded-xl shadow-sm group">
                                            <Button type="button" variant="ghost" size="icon" className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity border border-red-100" onClick={() => setCareer(career.filter(e => e.id !== event.id))}><TrashIcon className="h-4 w-4" /></Button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Type</Label>
                                                    <Select value={event.type} onValueChange={(v) => { const newCareer = [...career]; newCareer[index].type = v as any; setCareer(newCareer); }}>
                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent><SelectItem value="Intronisation">Intronisation</SelectItem><SelectItem value="Médaille">Décoration</SelectItem><SelectItem value="Médiation">Médiation</SelectItem><SelectItem value="Mission">Mission</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Date/Période</Label><Input className="h-9 text-xs" value={event.date} onChange={(e) => { const newCareer = [...career]; newCareer[index].date = e.target.value; setCareer(newCareer); }} /></div>
                                                <div className="col-span-2 space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Titre</Label><Input className="h-9 text-xs" value={event.title} onChange={(e) => { const newCareer = [...career]; newCareer[index].title = e.target.value; setCareer(newCareer); }} /></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <Label className="text-sm font-black uppercase text-slate-700">Généalogie / Prédécesseurs</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => setPredecessors([...predecessors, { id: crypto.randomUUID(), name: "", period: "", notes: "" }])} className="shadow-sm">
                                    <Plus className="mr-2 h-4 w-4" /> Ajouter Prédécesseur
                                </Button>
                            </div>
                            
                            {predecessors.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-medium">Aucun prédécesseur renseigné.</div>
                            ) : (
                                <div className="space-y-4">
                                    {predecessors.map((pred, index) => (
                                        <div key={pred.id} className="relative p-4 bg-white border border-slate-200 rounded-xl shadow-sm group">
                                            <Button type="button" variant="ghost" size="icon" className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity border border-red-100" onClick={() => setPredecessors(predecessors.filter(p => p.id !== pred.id))}><TrashIcon className="h-4 w-4" /></Button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="col-span-2 space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Nom du Prédécesseur</Label><Input className="h-9 text-xs" value={pred.name} onChange={(e) => { const newPreds = [...predecessors]; newPreds[index].name = e.target.value; setPredecessors(newPreds); }} placeholder="Ex: Nanan Kouamé..." /></div>
                                                <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Période de Règne</Label><Input className="h-9 text-xs" value={pred.period} onChange={(e) => { const newPreds = [...predecessors]; newPreds[index].period = e.target.value; setPredecessors(newPreds); }} placeholder="Ex: 1990 - 2010" /></div>
                                                <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Notes (Motif fin, lien)</Label><Input className="h-9 text-xs" value={pred.notes || ''} onChange={(e) => { const newPreds = [...predecessors]; newPreds[index].notes = e.target.value; setPredecessors(newPreds); }} placeholder="Décès, Père du chef actuel..." /></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                  )}

                  {error && <p className="text-sm font-black text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 mt-4">{error}</p>}
                </motion.div>
              </AnimatePresence>
            </ScrollArea>

            {/* Footer Navigation */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
                <Button type="button" variant="ghost" onClick={step === 1 ? handleClose : prevStep} className="font-bold text-slate-600">
                    {step === 1 ? "Annuler" : <><ChevronLeft className="mr-2 h-4 w-4" /> Précédent</>}
                </Button>
                
                {step < STEPS.length ? (
                    <Button type="button" onClick={nextStep} className="bg-slate-900 hover:bg-slate-800 font-bold px-8 shadow-xl">
                        Suivant <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-xl shadow-blue-500/20">
                        {isSubmitting ? "Création du Dossier..." : "Enregistrer le Chef"} <ShieldCheck className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
