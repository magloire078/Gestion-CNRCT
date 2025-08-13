
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getChief, updateChief, getChiefs } from "@/services/chief-service";
import type { Chief, ChiefRole } from "@/lib/data";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Save, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { divisions } from "@/lib/ivory-coast-divisions";

export default function ChiefEditPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { toast } = useToast();

    const [chief, setChief] = useState<Partial<Chief> | null>(null);
    const [allChiefs, setAllChiefs] = useState<Chief[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [photoPreview, setPhotoPreview] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const departments = useMemo(() => chief?.region && divisions[chief.region] ? Object.keys(divisions[chief.region]) : [], [chief?.region]);
    const subPrefectures = useMemo(() => chief?.region && chief?.department && divisions[chief.region]?.[chief.department] ? Object.keys(divisions[chief.region][chief.department]) : [], [chief?.region, chief?.department]);
    const villages = useMemo(() => chief?.region && chief?.department && chief?.subPrefecture && divisions[chief.region]?.[chief.department]?.[chief.subPrefecture] ? divisions[chief.region][chief.department][chief.subPrefecture] : [], [chief?.region, chief?.department, chief?.subPrefecture]);

    useEffect(() => {
        if (typeof id !== 'string') return;
        async function fetchChiefData() {
            try {
                const [data, chiefsList] = await Promise.all([getChief(id), getChiefs()]);
                setChief(data);
                setAllChiefs(chiefsList.filter(c => c.id !== id)); // Exclude self from parent list
                if (data?.photoUrl) {
                    setPhotoPreview(data.photoUrl);
                }
            } catch (error) {
                console.error("Failed to fetch chief data", error);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données du chef." });
            } finally {
                setLoading(false);
            }
        }
        fetchChiefData();
    }, [id, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setChief(prev => (prev ? { ...prev, [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value } : null));
    };

    const handleSelectChange = (name: string, value: string) => {
        setChief(prev => {
            if (!prev) return null;
            const newState = { ...prev, [name]: value };
            if (name === 'region') { newState.department = ''; newState.subPrefecture = ''; newState.village = ''; }
            if (name === 'department') { newState.subPrefecture = ''; newState.village = ''; }
            if (name === 'subPrefecture') { newState.village = ''; }
            return newState;
        });
    };
    
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

    const handleSave = async () => {
        if (!chief || typeof id !== 'string') return;
        setIsSaving(true);

        const dataToSave: Partial<Chief> = { ...chief };
        if (dataToSave.latitude === '') delete dataToSave.latitude;
        if (dataToSave.longitude === '') delete dataToSave.longitude;
        
        try {
            await updateChief(id, dataToSave, photoFile);
            toast({ title: "Succès", description: "Les informations du chef ont été mises à jour." });
            router.push(`/chiefs/${id}`);
        } catch (error) {
            console.error("Failed to save chief", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les modifications." });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <p>Chargement...</p>; // Replace with a proper skeleton loader
    }

    if (!chief) {
        return <div className="text-center py-10">Chef non trouvé.</div>;
    }

    return (
         <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                 </Button>
                 <div>
                    <h1 className="text-2xl font-bold tracking-tight">Modifier le Profil du Chef</h1>
                    <p className="text-muted-foreground">{chief.name}</p>
                 </div>
                 <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                </Button>
            </div>
            
            <Card>
                <CardHeader><CardTitle>Informations Principales</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Photo</Label>
                        <div className="flex items-center gap-4">
                             <Avatar className="h-20 w-20">
                                <AvatarImage src={photoPreview} alt={chief.name} data-ai-hint="chief portrait" />
                                <AvatarFallback>{chief.name?.charAt(0) || 'C'}</AvatarFallback>
                             </Avatar>
                             <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" /> Changer
                             </Button>
                             <Input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange}/>
                        </div>
                    </div>
                    <div />
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom Complet</Label>
                        <Input id="name" name="name" value={chief.name || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="title">Titre</Label>
                        <Input id="title" name="title" value={chief.title || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="role">Rôle</Label>
                        <Select value={chief.role} onValueChange={(v) => handleSelectChange('role', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Chef de Village">Chef de Village</SelectItem>
                                <SelectItem value="Chef de Canton">Chef de Canton</SelectItem>
                                <SelectItem value="Roi">Roi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="parentChiefId">Chef Supérieur</Label>
                         <Select value={chief.parentChiefId || 'none'} onValueChange={(v) => handleSelectChange('parentChiefId', v === 'none' ? '' : v)}>
                            <SelectTrigger><SelectValue placeholder="Aucun"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Aucun</SelectItem>
                                {allChiefs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sexe">Sexe</Label>
                         <Select value={chief.sexe || ''} onValueChange={(v) => handleSelectChange('sexe', v)}>
                            <SelectTrigger id="sexe"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Homme">Homme</SelectItem>
                                <SelectItem value="Femme">Femme</SelectItem>
                                <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Localisation</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="region">Région</Label>
                        <Select value={chief.region} onValueChange={(v) => handleSelectChange('region', v)}>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                            <SelectContent>{Object.keys(divisions).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department">Département</Label>
                         <Select value={chief.department} onValueChange={(v) => handleSelectChange('department', v)} disabled={!chief.region}>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                            <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subPrefecture">Sous-préfecture</Label>
                        <Select value={chief.subPrefecture} onValueChange={(v) => handleSelectChange('subPrefecture', v)} disabled={!chief.department}>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                            <SelectContent>{subPrefectures.map(sp => <SelectItem key={sp} value={sp}>{sp}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="village">Village / Commune</Label>
                        <Select value={chief.village} onValueChange={(v) => handleSelectChange('village', v)} disabled={!chief.subPrefecture}>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                            <SelectContent>{villages.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input id="latitude" name="latitude" type="number" step="any" value={chief.latitude || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input id="longitude" name="longitude" type="number" step="any" value={chief.longitude || ''} onChange={handleInputChange} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Informations Additionnelles</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="contact">Contact</Label>
                        <Input id="contact" name="contact" value={chief.contact || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date de naissance</Label>
                        <Input id="dateOfBirth" name="dateOfBirth" type="date" value={chief.dateOfBirth || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="regencyStartDate">Début de régence</Label>
                        <Input id="regencyStartDate" name="regencyStartDate" type="date" value={chief.regencyStartDate || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="regencyEndDate">Fin de régence / Décès</Label>
                        <Input id="regencyEndDate" name="regencyEndDate" type="date" value={chief.regencyEndDate || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bio">Biographie</Label>
                        <Textarea id="bio" name="bio" value={chief.bio || ''} onChange={handleInputChange} rows={4} />
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
