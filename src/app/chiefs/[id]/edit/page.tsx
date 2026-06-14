"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    CheckCircle2, AlertCircle, Loader2,
    Plus, Trash2 as TrashIcon, Award, Medal, Clock,
    ChevronLeft, Save, Upload, MapPin, User, Shield, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getChief, updateChief, getChiefs } from "@/services/chief-service";
import type { Chief, ChiefRole, DesignationMode, ChiefCareerEvent, Predecessor } from "@/types/chief";
import { CreatableSelect } from "@/components/ui/creatable-select";

import { useAuth } from "@/hooks/use-auth";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { divisions } from "@/lib/ivory-coast-divisions";
import { LocationPicker } from "@/components/common/location-picker";
import { EthnicityCombobox } from "@/components/common/ethnicity-combobox";

export default function EditChiefPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const { hasPermission } = useAuth();
    
    const canEditCareer = hasPermission('chiefs-career:edit');

    // Form states
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [title, setTitle] = useState("");
    const [role, setRole] = useState<ChiefRole>("Chef de Village");
    const [additionalRoles, setAdditionalRoles] = useState<ChiefRole[]>([]);
    const [cnrctAffiliation, setCnrctAffiliation] = useState<Chief['cnrctAffiliation']>("Aucune");
    const [designationDate, setDesignationDate] = useState("");
    const [designationMode, setDesignationMode] = useState<DesignationMode | "">("");
    const [sexe, setSexe] = useState<Chief['sexe'] | "">("");
    const [phone, setPhone] = useState("");
    const [contact, setContact] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [ethnicGroup, setEthnicGroup] = useState("");
    const [languages, setLanguages] = useState("");
    const [CNRCTRegistrationNumber, setCNRCTRegistrationNumber] = useState("");
    const [officialDocuments, setOfficialDocuments] = useState("");
    const [bio, setBio] = useState("");
    const [career, setCareer] = useState<ChiefCareerEvent[]>([]);
    const [predecessors, setPredecessors] = useState<Predecessor[]>([]);
    const [throneAccessionDate, setThroneAccessionDate] = useState("");

    const [mandatDebut, setMandatDebut] = useState("");
    const [mandatFin, setMandatFin] = useState("");
    const [estRenouvele, setEstRenouvele] = useState(false);
    const [historiqueNominations, setHistoriqueNominations] = useState<Array<{id: string, periode: string, poste: string, region?: string}>>([]);

    const [photoUrl, setPhotoUrl] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState("");

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

    // Custom Domains
    const [royaumeName, setRoyaumeName] = useState("");
    const [provinceName, setProvinceName] = useState("");
    const [cantonName, setCantonName] = useState("");
    const [tribuName, setTribuName] = useState("");

    // Domain options
    const [royaumeOptions, setRoyaumeOptions] = useState<{label: string, value: string}[]>([]);
    const [provinceOptions, setProvinceOptions] = useState<{label: string, value: string}[]>([]);
    const [cantonOptions, setCantonOptions] = useState<{label: string, value: string}[]>([]);
    const [tribuOptions, setTribuOptions] = useState<{label: string, value: string}[]>([]);

    useEffect(() => {
        async function fetchChief() {
            try {
                const data = await getChief(id);
                if (data) {
                    setFirstName(data.firstName || "");
                    setLastName(data.lastName || "");
                    setTitle(data.title || "");
                    setRole(data.role || "Chef de Village");
                    setAdditionalRoles(data.additionalRoles || []);
                    setCnrctAffiliation(data.cnrctAffiliation || "Aucune");
                    setDesignationDate(data.designationDate || "");
                    setDesignationMode(data.designationMode || "");
                    setSexe(data.sexe || "");
                    setPhone(data.phone || "");
                    setContact(data.contact || "");
                    setEmail(data.email || "");
                    setAddress(data.address || "");
                    setEthnicGroup(data.ethnicGroup || "");
                    setLanguages(data.languages?.join(", ") || "");
                    setCNRCTRegistrationNumber(data.CNRCTRegistrationNumber || "");
                    setOfficialDocuments(data.officialDocuments || "");
                    setBio(data.bio || "");
                    setCareer(data.career || []);
                    setPredecessors(data.predecessors || []);
                    setThroneAccessionDate(data.throneAccessionDate || "");
                    
                    setMandatDebut(data.mandatDebut || "");
                    setMandatFin(data.mandatFin || "");
                    setEstRenouvele(data.estRenouvele || false);
                    setHistoriqueNominations(data.historiqueNominations?.map(h => ({ ...h, id: crypto.randomUUID() })) || []);

                    setPhotoUrl(data.photoUrl || "");
                    setPhotoPreview(data.photoUrl || "");
                    
                    // Division loading
                    if (data.region && ((IVORIAN_REGIONS as readonly string[]).includes(data.region) || data.region === "AUTRE")) {
                        setSelectedRegion(data.region);
                        if (data.department && divisions[data.region]?.[data.department]) {
                            setSelectedDepartment(data.department);
                            if (data.subPrefecture && divisions[data.region][data.department][data.subPrefecture]) {
                                setSelectedSubPrefecture(data.subPrefecture);
                                if (data.village && divisions[data.region][data.department][data.subPrefecture].includes(data.village)) {
                                    setSelectedVillage(data.village);
                                } else {
                                    setSelectedVillage("AUTRE");
                                    setCustomVillage(data.village);
                                }
                            } else {
                                setSelectedSubPrefecture("AUTRE");
                                setCustomSubPrefecture(data.subPrefecture);
                                setCustomVillage(data.village);
                            }
                        } else {
                            setSelectedDepartment("AUTRE");
                            setCustomDepartment(data.department);
                        }
                    } else if (data.region) {
                        // If region is not in our standard list, we still allow it but mark as AUTRE
                        setSelectedRegion("AUTRE");
                        setCustomRegion(data.region);
                    }

                    setLatitude(data.latitude ?? '');
                    setLongitude(data.longitude ?? '');
                    setRoyaumeName(data.royaumeName || "");
                    setProvinceName(data.provinceName || "");
                    setCantonName(data.cantonName || "");
                    setTribuName(data.tribuName || "");
                }

                // Fetch domains
                const allChiefs = await getChiefs();
                const rSet = new Set<string>();
                const pSet = new Set<string>();
                const cSet = new Set<string>();
                const tSet = new Set<string>();
                allChiefs.forEach(c => {
                    if (c.royaumeName) rSet.add(c.royaumeName);
                    if (c.provinceName) pSet.add(c.provinceName);
                    if (c.cantonName) cSet.add(c.cantonName);
                    if (c.tribuName) tSet.add(c.tribuName);
                });
                setRoyaumeOptions(Array.from(rSet).map(v => ({ label: v, value: v })));
                setProvinceOptions(Array.from(pSet).map(v => ({ label: v, value: v })));
                setCantonOptions(Array.from(cSet).map(v => ({ label: v, value: v })));
                setTribuOptions(Array.from(tSet).map(v => ({ label: v, value: v })));

            } catch (err) {
                console.error("Error loading chief for edit:", err);
                setError("Impossible de charger les données.");
            } finally {
                setLoading(false);
            }
        }
        fetchChief();
    }, [id]);

    const departments = useMemo(() => selectedRegion && divisions[selectedRegion] ? Object.keys(divisions[selectedRegion]) : [], [selectedRegion]);
    const subPrefectures = useMemo(() => selectedRegion && selectedDepartment && divisions[selectedRegion]?.[selectedDepartment] ? Object.keys(divisions[selectedRegion][selectedDepartment]) : [], [selectedRegion, selectedDepartment]);
    const villages = useMemo(() => selectedRegion && selectedDepartment && selectedSubPrefecture && divisions[selectedRegion]?.[selectedDepartment]?.[selectedSubPrefecture] ? divisions[selectedRegion][selectedDepartment][selectedSubPrefecture] : [], [selectedRegion, selectedDepartment, selectedSubPrefecture]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        const finalRegion = selectedRegion === 'AUTRE' ? customRegion : selectedRegion;
        const finalDepartment = selectedDepartment === 'AUTRE' ? customDepartment : selectedDepartment;
        const finalSubPrefecture = selectedSubPrefecture === 'AUTRE' ? customSubPrefecture : selectedSubPrefecture;
        const finalVillage = selectedVillage === 'AUTRE' ? customVillage : selectedVillage;

        try {
            const updateData: Partial<Chief> = {
                name: `${lastName} ${firstName}`.trim(),
                firstName,
                lastName,
                title,
                role,
                additionalRoles: additionalRoles.length > 0 ? additionalRoles : undefined,
                cnrctAffiliation: cnrctAffiliation !== "Aucune" ? cnrctAffiliation : undefined,
                designationDate: designationDate || undefined,
                designationMode: (designationMode || undefined) as DesignationMode,
                sexe: (sexe || undefined) as Chief['sexe'],
                region: finalRegion,
                department: finalDepartment,
                subPrefecture: finalSubPrefecture,
                village: finalVillage,
                ethnicGroup: ethnicGroup || undefined,
                languages: languages ? languages.split(',').map(s => s.trim()) : undefined,
                phone: phone || undefined,
                contact,
                email: email || undefined,
                address: address || undefined,
                CNRCTRegistrationNumber: CNRCTRegistrationNumber || undefined,
                officialDocuments: officialDocuments || undefined,
                bio,
                career,
                predecessors,
                royaumeName: royaumeName || undefined,
                provinceName: provinceName || undefined,
                cantonName: cantonName || undefined,
                tribuName: tribuName || undefined,
            };

            if (throneAccessionDate) updateData.throneAccessionDate = throneAccessionDate;

            if (cnrctAffiliation !== "Aucune") {
                updateData.mandatDebut = mandatDebut || undefined;
                updateData.mandatFin = mandatFin || undefined;
                updateData.estRenouvele = estRenouvele;
                if (historiqueNominations.length > 0) {
                    updateData.historiqueNominations = historiqueNominations.map(({ id, ...rest }) => rest);
                } else {
                    updateData.historiqueNominations = undefined;
                }
            }

            if (latitude !== '') updateData.latitude = Number(latitude);
            if (longitude !== '') updateData.longitude = Number(longitude);

            await updateChief(id, updateData, photoFile);
            toast({ title: "Modifications enregistrées", description: "La fiche du chef a été mise à jour avec succès." });
            router.push(`/chiefs/${id}`);
        } catch (err: any) {
            setError(err.message || "Erreur lors de l'enregistrement.");
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder les modifications." });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Chargement de la fiche...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-4 pb-10 max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-slate-100">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Annuler
                </Button>
                <h1 className="text-xl font-bold tracking-tight">Modifier la Fiche d'Autorité</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="border-none shadow-xl">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <Avatar className="h-20 w-20 rounded-xl border-2 border-white shadow-md transition-all group-hover:opacity-80">
                                    <AvatarImage src={photoPreview} className="object-cover" />
                                    <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">{lastName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="h-6 w-6 text-white drop-shadow-md" />
                                </div>
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handlePhotoChange} 
                                    title="Changer la photo"
                                    aria-label="Changer la photo de profil du chef"
                                />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">{title} {firstName} {lastName}</CardTitle>
                                <CardDescription>Modification des données administratives et territoriales</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="pt-6">
                        <Accordion type="multiple" defaultValue={['id', 'loc', 'cult', 'legal']} className="w-full">
                            <AccordionItem value="id" className="border-slate-100">
                                <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-2 font-bold text-slate-700 text-sm uppercase tracking-widest"><User className="h-4 w-4" /> Identité</div></AccordionTrigger>
                                <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Nom</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} required /></div>
                                    <div className="space-y-2"><Label>Prénom(s)</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} required /></div>
                                    <div className="space-y-2"><Label>Titre Officiel</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
                                    <div className="space-y-2"><Label>Rôle Traditionnel (Principal)</Label>
                                        <Select value={role} onValueChange={(v) => { setRole(v as ChiefRole); setAdditionalRoles(additionalRoles.filter(r => r !== v)); }}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Roi">Roi</SelectItem>
                                                <SelectItem value="Chef de province">Chef de province</SelectItem>
                                                <SelectItem value="Chef de canton">Chef de canton</SelectItem>
                                                <SelectItem value="Chef de tribu">Chef de tribu</SelectItem>
                                                <SelectItem value="Chef de Village">Chef de Village</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Casquettes Supplémentaires (Optionnel)</Label>
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
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${additionalRoles.includes(r) ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Domaines Coutumiers - Affichés selon les rôles */}
                                    {(role === 'Roi' || additionalRoles.includes('Roi')) && (
                                        <div className="space-y-2">
                                            <Label className="text-blue-600">Nom du Royaume</Label>
                                            <CreatableSelect items={royaumeOptions} value={royaumeName} onValueChange={setRoyaumeName} placeholder="Saisir ou sélectionner..." />
                                        </div>
                                    )}
                                    {(role === 'Chef de province' || additionalRoles.includes('Chef de province')) && (
                                        <div className="space-y-2">
                                            <Label className="text-blue-600">Nom de la Province</Label>
                                            <CreatableSelect items={provinceOptions} value={provinceName} onValueChange={setProvinceName} placeholder="Saisir ou sélectionner..." />
                                        </div>
                                    )}
                                    {(role === 'Chef de canton' || additionalRoles.includes('Chef de canton')) && (
                                        <div className="space-y-2">
                                            <Label className="text-blue-600">Nom du Canton</Label>
                                            <CreatableSelect items={cantonOptions} value={cantonName} onValueChange={setCantonName} placeholder="Saisir ou sélectionner..." />
                                        </div>
                                    )}
                                    {(role === 'Chef de tribu' || additionalRoles.includes('Chef de tribu')) && (
                                        <div className="space-y-2">
                                            <Label className="text-blue-600">Nom de la Tribu</Label>
                                            <CreatableSelect items={tribuOptions} value={tribuName} onValueChange={setTribuName} placeholder="Saisir ou sélectionner..." />
                                        </div>
                                    )}
                                    <div className="w-full h-px bg-slate-100 md:col-span-2 my-2"></div>
                                    <div className="space-y-2"><Label>Sexe</Label>
                                        <Select value={sexe} onValueChange={(v) => setSexe(v as Chief['sexe'])}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2"><Label>Téléphone Principal</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+225 0700000000" /></div>
                                    <div className="space-y-2"><Label>Contact Secondaire</Label><Input value={contact} onChange={e => setContact(e.target.value)} /></div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="loc" className="border-slate-100">
                                <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-2 font-bold text-slate-700 text-sm uppercase tracking-widest"><MapPin className="h-4 w-4" /> Territoire</div></AccordionTrigger>
                                <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Région</Label>
                                        <Select value={selectedRegion} onValueChange={v => { setSelectedRegion(v); setSelectedDepartment(''); setSelectedSubPrefecture(''); setSelectedVillage(''); }}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{IVORIAN_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2"><Label>Département</Label>
                                        <Select value={selectedDepartment} onValueChange={v => { setSelectedDepartment(v); setSelectedSubPrefecture(''); setSelectedVillage(''); }} disabled={!selectedRegion || selectedRegion === 'AUTRE'}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100 space-y-4">
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Localisation SIG</Label>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="lg:col-span-2">
                                                <LocationPicker 
                                                    onLocationSelectAction={(lat, lng) => {
                                                        setLatitude(lat);
                                                        setLongitude(lng);
                                                    }}
                                                    initialLat={latitude !== '' ? Number(latitude) : undefined}
                                                    initialLng={longitude !== '' ? Number(longitude) : undefined}
                                                    className="border shadow-sm rounded-xl bg-slate-50/50"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="latitude" className="text-[10px] font-black uppercase text-slate-400">Latitude</Label>
                                                        <Input 
                                                            id="latitude" 
                                                            type="number" 
                                                            step="any" 
                                                            value={latitude} 
                                                            onChange={e => setLatitude(e.target.value ? parseFloat(e.target.value) : '')} 
                                                            className="bg-white border-slate-200 focus-visible:ring-blue-500/20"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="longitude" className="text-[10px] font-black uppercase text-slate-400">Longitude</Label>
                                                        <Input 
                                                            id="longitude" 
                                                            type="number" 
                                                            step="any" 
                                                            value={longitude} 
                                                            onChange={e => setLongitude(e.target.value ? parseFloat(e.target.value) : '')} 
                                                            className="bg-white border-slate-200 focus-visible:ring-blue-500/20"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-400 italic">
                                                    Utilisez la carte pour ajuster précisément la position de l'autorité.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="cult" className="border-slate-100">
                                <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-2 font-bold text-slate-700 text-sm uppercase tracking-widest"><Info className="h-4 w-4" /> Biographie & Culture</div></AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="space-y-2"><Label>Biographie / Historique</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={6} className="bg-slate-50/30" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Groupe Ethnique</Label><EthnicityCombobox value={ethnicGroup} onValueChange={(v) => setEthnicGroup(v as string)} /></div>
                                        <div className="space-y-2"><Label>Langues parlées</Label><Input value={languages} onChange={e => setLanguages(e.target.value)} /></div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="legal" className="border-none">
                                <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-2 font-bold text-slate-700 text-sm uppercase tracking-widest"><Shield className="h-4 w-4" /> Administration</div></AccordionTrigger>
                                <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>N° Enregistrement CNRCT</Label><Input value={CNRCTRegistrationNumber} onChange={e => setCNRCTRegistrationNumber(e.target.value)} /></div>
                                    <div className="space-y-2">
                                        <Label>Affiliation CNRCT</Label>
                                        <Select value={cnrctAffiliation} onValueChange={(v) => setCnrctAffiliation(v as Chief['cnrctAffiliation'])}>
                                            <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Aucune">Aucune</SelectItem>
                                                <SelectItem value="Directoire">Directoire</SelectItem>
                                                <SelectItem value="Comité Régional">Comité Régional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {cnrctAffiliation !== 'Aucune' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-blue-600">Début de mandat CNRCT</Label>
                                                <Input type="date" value={mandatDebut} onChange={e => {
                                                    setMandatDebut(e.target.value);
                                                    if (e.target.value && !mandatFin) {
                                                        const start = new Date(e.target.value);
                                                        start.setFullYear(start.getFullYear() + 6);
                                                        setMandatFin(start.toISOString().split('T')[0]);
                                                    }
                                                }} className="border-blue-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-blue-600">Fin de mandat CNRCT</Label>
                                                <Input type="date" value={mandatFin} onChange={e => setMandatFin(e.target.value)} className="border-blue-200" />
                                            </div>
                                            <div className="space-y-2 flex flex-col justify-end">
                                                <div className="flex items-center space-x-2 h-10">
                                                    <input type="checkbox" id="reconduitEdit" checked={estRenouvele} onChange={e => setEstRenouvele(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" title="Mandat Reconduit" aria-label="Mandat Reconduit" />
                                                    <Label htmlFor="reconduitEdit" className="font-bold text-slate-700 cursor-pointer">Mandat Reconduit</Label>
                                                </div>
                                            </div>
                                            <div className="col-span-1 md:col-span-2 mt-4 p-4 border border-blue-100 bg-blue-50/20 rounded-xl space-y-4">
                                                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                                    <Label className="text-xs font-black uppercase text-blue-700">Historique des Nominations (CNRCT)</Label>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => setHistoriqueNominations([...historiqueNominations, { id: crypto.randomUUID(), periode: "", poste: "", region: "" }])} className="h-7 text-[10px] border-blue-200 text-blue-600 hover:bg-blue-50">
                                                        <Plus className="mr-1 h-3 w-3" /> Ajouter
                                                    </Button>
                                                </div>
                                                {historiqueNominations.length === 0 ? (
                                                    <div className="text-center text-blue-400 text-xs italic">Aucune ancienne nomination répertoriée.</div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {historiqueNominations.map((hist, index) => (
                                                            <div key={hist.id} className="relative flex gap-2 items-center bg-white p-2 border border-blue-100 rounded-lg group">
                                                                <div className="flex-1 grid grid-cols-3 gap-2">
                                                                    <Input className="h-8 text-xs border-blue-100" value={hist.poste} onChange={(e) => { const newHist = [...historiqueNominations]; newHist[index].poste = e.target.value; setHistoriqueNominations(newHist); }} placeholder="Poste" />
                                                                    <Input className="h-8 text-xs border-blue-100" value={hist.periode} onChange={(e) => { const newHist = [...historiqueNominations]; newHist[index].periode = e.target.value; setHistoriqueNominations(newHist); }} placeholder="Période" />
                                                                    <Input className="h-8 text-xs border-blue-100" value={hist.region || ''} onChange={(e) => { const newHist = [...historiqueNominations]; newHist[index].region = e.target.value; setHistoriqueNominations(newHist); }} placeholder="Région" />
                                                                </div>
                                                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0" onClick={() => setHistoriqueNominations(historiqueNominations.filter(h => h.id !== hist.id))}><TrashIcon className="h-3 w-3" /></Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    <div className="space-y-2"><Label>Mode de Désignation</Label>
                                        <Select value={designationMode} onValueChange={(v) => setDesignationMode(v as DesignationMode)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="Héritage">Héritage</SelectItem><SelectItem value="Élection">Élection</SelectItem><SelectItem value="Nomination coutumière">Nomination coutumière</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2"><Label>Date de Désignation</Label><Input type="date" value={designationDate} onChange={e => setDesignationDate(e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Date d'accession au Trône</Label><Input type="date" value={throneAccessionDate} onChange={e => setThroneAccessionDate(e.target.value)} /></div>
                                    <div className="col-span-1 md:col-span-2 space-y-2"><Label>Documents Officiels (Arrêtés, Décrets)</Label><Textarea value={officialDocuments} onChange={e => setOfficialDocuments(e.target.value)} rows={2} /></div>
                                </AccordionContent>
                            </AccordionItem>

                            {canEditCareer && (
                                <AccordionItem value="career" className="border-none">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2 font-bold text-slate-700 text-sm uppercase tracking-widest">
                                            <Award className="h-4 w-4" /> Parcours & Carrière
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-4 pt-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">ÉVÉNEMENTS MARQUANTS</Label>
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-8 rounded-lg text-[10px] font-black uppercase hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                    onClick={() => setCareer([...career, { id: crypto.randomUUID(), date: "", title: "", type: "Intronisation", description: "" }])}
                                                >
                                                    <Plus className="mr-1.5 h-3 w-3" /> Ajouter
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {career.length === 0 && (
                                                    <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs italic">
                                                        Aucun événement ajouté à la timeline.
                                                    </div>
                                                )}
                                                {career.map((event, index) => (
                                                    <div key={event.id} className="relative group p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60 hover:border-blue-200 transition-all duration-300">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => setCareer(career.filter(e => e.id !== event.id))}
                                                        >
                                                            <TrashIcon className="h-3.5 w-3.5" />
                                                        </Button>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[9px] font-black uppercase text-slate-400">Type d'événement</Label>
                                                                <Select value={event.type} onValueChange={(v) => {
                                                                    const newCareer = [...career];
                                                                    newCareer[index].type = v as any;
                                                                    setCareer(newCareer);
                                                                }}>
                                                                    <SelectTrigger className="h-9 bg-white border-slate-200 text-xs font-bold">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Intronisation" className="text-xs">Intronisation</SelectItem>
                                                                        <SelectItem value="Médaille" className="text-xs">Médaille / Décoration</SelectItem>
                                                                        <SelectItem value="Médiation" className="text-xs">Médiation de Conflit</SelectItem>
                                                                        <SelectItem value="Mission" className="text-xs">Mission Officielle</SelectItem>
                                                                        <SelectItem value="Autre" className="text-xs">Autre</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[9px] font-black uppercase text-slate-400">Date / Période</Label>
                                                                <Input 
                                                                    className="h-9 bg-white border-slate-200 text-xs font-bold" 
                                                                    placeholder="ex: 12 Jan 2024" 
                                                                    value={event.date}
                                                                    onChange={(e) => {
                                                                        const newCareer = [...career];
                                                                        newCareer[index].date = e.target.value;
                                                                        setCareer(newCareer);
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="col-span-2 space-y-2">
                                                                <Label className="text-[9px] font-black uppercase text-slate-400">Titre de l'événement</Label>
                                                                <Input 
                                                                    className="h-9 bg-white border-slate-200 text-xs font-bold" 
                                                                    placeholder="ex: Médiation à Agboville"
                                                                    value={event.title}
                                                                    onChange={(e) => {
                                                                        const newCareer = [...career];
                                                                        newCareer[index].title = e.target.value;
                                                                        setCareer(newCareer);
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="col-span-2 space-y-2">
                                                                <Label className="text-[9px] font-black uppercase text-slate-400">Description détaillée</Label>
                                                                <Textarea 
                                                                    className="bg-white border-slate-200 text-xs font-medium min-h-[60px]" 
                                                                    placeholder="Précisez le contexte et l'impact..."
                                                                    value={event.description}
                                                                    onChange={(e) => {
                                                                        const newCareer = [...career];
                                                                        newCareer[index].description = e.target.value;
                                                                        setCareer(newCareer);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-4 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400">GÉNÉALOGIE / PRÉDÉCESSEURS</Label>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => setPredecessors([...predecessors, { id: crypto.randomUUID(), name: "", period: "", notes: "" }])} className="h-8 rounded-lg text-[10px] font-black uppercase hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                                        <Plus className="mr-1.5 h-3 w-3" /> Ajouter Prédécesseur
                                                    </Button>
                                                </div>
                                                
                                                {predecessors.length === 0 ? (
                                                    <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs italic">Aucun prédécesseur renseigné.</div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {predecessors.map((pred, index) => (
                                                            <div key={pred.id} className="relative p-4 bg-white border border-slate-200 rounded-xl shadow-sm group">
                                                                <Button type="button" variant="ghost" size="icon" className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity border border-red-100" onClick={() => setPredecessors(predecessors.filter(p => p.id !== pred.id))}><TrashIcon className="h-4 w-4" /></Button>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div className="col-span-2 space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Nom du Prédécesseur</Label><Input className="h-9 text-xs" value={pred.name} onChange={(e) => { const newPreds = [...predecessors]; newPreds[index].name = e.target.value; setPredecessors(newPreds); }} placeholder="Ex: Nanan Kouamé..." /></div>
                                                                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Période de Règne</Label><Input className="h-9 text-xs" value={pred.period} onChange={(e) => { const newPreds = [...predecessors]; newPreds[index].period = e.target.value; setPredecessors(newPreds); }} placeholder="Ex: 1990 - 2010" /></div>
                                                                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-400">Notes</Label><Input className="h-9 text-xs" value={pred.notes || ''} onChange={(e) => { const newPreds = [...predecessors]; newPreds[index].notes = e.target.value; setPredecessors(newPreds); }} placeholder="Décès, etc." /></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                        </Accordion>
                        {error && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-bold border border-red-100"><AlertCircle className="h-4 w-4" /> {error}</div>}
                    </CardContent>
                    
                    <CardFooter className="flex justify-between border-t bg-slate-50/50 p-6 rounded-b-xl">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Abandonner</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 px-5 font-bold">
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="mr-2 h-4 w-4" /> Sauvegarder les modifications</>}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
