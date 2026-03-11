"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ChevronLeft, Save, Upload, 
    MapPin, User, Shield, Info,
    CheckCircle2, AlertCircle, Loader2
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
import { getChief, updateChief } from "@/services/chief-service";
import type { Chief, ChiefRole, DesignationMode } from "@/lib/data";
import { divisions } from "@/lib/ivory-coast-divisions";

export default function EditChiefPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form states
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [title, setTitle] = useState("");
    const [role, setRole] = useState<ChiefRole>("Chef de Village");
    const [designationDate, setDesignationDate] = useState("");
    const [designationMode, setDesignationMode] = useState<DesignationMode | "">("");
    const [sexe, setSexe] = useState<Chief['sexe'] | "">("");
    const [contact, setContact] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [ethnicGroup, setEthnicGroup] = useState("");
    const [languages, setLanguages] = useState("");
    const [CNRCTRegistrationNumber, setCNRCTRegistrationNumber] = useState("");
    const [officialDocuments, setOfficialDocuments] = useState("");
    const [bio, setBio] = useState("");
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

    useEffect(() => {
        async function fetchChief() {
            try {
                const data = await getChief(id);
                if (data) {
                    setFirstName(data.firstName || "");
                    setLastName(data.lastName || "");
                    setTitle(data.title || "");
                    setRole(data.role || "Chef de Village");
                    setDesignationDate(data.designationDate || "");
                    setDesignationMode(data.designationMode || "");
                    setSexe(data.sexe || "");
                    setContact(data.contact || "");
                    setEmail(data.email || "");
                    setAddress(data.address || "");
                    setEthnicGroup(data.ethnicGroup || "");
                    setLanguages(data.languages?.join(", ") || "");
                    setCNRCTRegistrationNumber(data.CNRCTRegistrationNumber || "");
                    setOfficialDocuments(data.officialDocuments || "");
                    setBio(data.bio || "");
                    setPhotoUrl(data.photoUrl || "");
                    setPhotoPreview(data.photoUrl || "");
                    
                    // Division loading
                    if (data.region && divisions[data.region]) {
                        setSelectedRegion(data.region);
                        if (data.department && divisions[data.region][data.department]) {
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
                    } else {
                        setSelectedRegion("AUTRE");
                        setCustomRegion(data.region);
                    }

                    setLatitude(data.latitude ?? '');
                    setLongitude(data.longitude ?? '');
                }
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
                designationDate: designationDate || undefined,
                designationMode: designationMode as DesignationMode,
                sexe: sexe as Chief['sexe'],
                region: finalRegion,
                department: finalDepartment,
                subPrefecture: finalSubPrefecture,
                village: finalVillage,
                ethnicGroup: ethnicGroup || undefined,
                languages: languages ? languages.split(',').map(s => s.trim()) : undefined,
                contact,
                email: email || undefined,
                address: address || undefined,
                CNRCTRegistrationNumber: CNRCTRegistrationNumber || undefined,
                officialDocuments: officialDocuments || undefined,
                bio,
            };

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
            <div className="container mx-auto py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Chargement de la fiche...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 pb-20 max-w-4xl space-y-6">
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
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
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
                                    <div className="space-y-2"><Label>Rôle Traditionnel</Label>
                                        <Select value={role} onValueChange={(v) => setRole(v as ChiefRole)}>
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
                                    <div className="space-y-2"><Label>Sexe</Label>
                                        <Select value={sexe} onValueChange={(v) => setSexe(v as Chief['sexe'])}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2"><Label>Contact Téléphone</Label><Input value={contact} onChange={e => setContact(e.target.value)} /></div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="loc" className="border-slate-100">
                                <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-2 font-bold text-slate-700 text-sm uppercase tracking-widest"><MapPin className="h-4 w-4" /> Territoire</div></AccordionTrigger>
                                <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Région</Label>
                                        <Select value={selectedRegion} onValueChange={v => { setSelectedRegion(v); setSelectedDepartment(''); setSelectedSubPrefecture(''); setSelectedVillage(''); }}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{Object.keys(divisions).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2"><Label>Département</Label>
                                        <Select value={selectedDepartment} onValueChange={v => { setSelectedDepartment(v); setSelectedSubPrefecture(''); setSelectedVillage(''); }} disabled={!selectedRegion || selectedRegion === 'AUTRE'}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}<SelectItem value="AUTRE">Autre...</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Latitude</Label><Input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value ? parseFloat(e.target.value) : '')} /></div>
                                        <div className="space-y-2"><Label>Longitude</Label><Input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value ? parseFloat(e.target.value) : '')} /></div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="cult" className="border-slate-100">
                                <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-2 font-bold text-slate-700 text-sm uppercase tracking-widest"><Info className="h-4 w-4" /> Biographie & Culture</div></AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="space-y-2"><Label>Biographie / Historique</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={6} className="bg-slate-50/30" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Groupe Ethnique</Label><Input value={ethnicGroup} onChange={e => setEthnicGroup(e.target.value)} /></div>
                                        <div className="space-y-2"><Label>Langues parlées</Label><Input value={languages} onChange={e => setLanguages(e.target.value)} /></div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="legal" className="border-none">
                                <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-2 font-bold text-slate-700 text-sm uppercase tracking-widest"><Shield className="h-4 w-4" /> Administration</div></AccordionTrigger>
                                <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>N° Enregistrement CNRCT</Label><Input value={CNRCTRegistrationNumber} onChange={e => setCNRCTRegistrationNumber(e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Mode de Désignation</Label>
                                        <Select value={designationMode} onValueChange={(v) => setDesignationMode(v as DesignationMode)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="Héritage">Héritage</SelectItem><SelectItem value="Élection">Élection</SelectItem><SelectItem value="Nomination coutumière">Nomination coutumière</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2 space-y-2"><Label>Documents Officiels (Arrêtés, Décrets)</Label><Textarea value={officialDocuments} onChange={e => setOfficialDocuments(e.target.value)} rows={2} /></div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        {error && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-bold border border-red-100"><AlertCircle className="h-4 w-4" /> {error}</div>}
                    </CardContent>
                    
                    <CardFooter className="flex justify-between border-t bg-slate-50/50 p-6 rounded-b-xl">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Abandonner</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 px-8 font-bold">
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="mr-2 h-4 w-4" /> Sauvegarder les modifications</>}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
