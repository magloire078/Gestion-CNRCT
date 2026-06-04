"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
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
    Loader2, MapPin, Map as MapIcon, Users,
    Building2, Droplets, Zap, School, Activity,
    Mountain, Landmark, Coins, Heart, ShoppingBag,
    Church, Info, Calendar, History,
    Globe, FileText, Moon as Mosque,
    Image as ImageIcon, X as XIcon
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateVillage } from "@/services/village-service";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { divisions } from "@/lib/ivory-coast-divisions";
import { calculateDevelopmentScore } from "@/services/village-service";
import { Progress } from "@/components/ui/progress";
import { 
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LocationPicker } from "@/components/common/location-picker";
import { Label } from "@/components/ui/label";
import { Village } from "@/types/village";

import { villageFormSchema as villageSchema, type VillageFormValues, csvToArray } from "@/lib/schemas/village-form-schema";

interface EditVillageSheetProps {
    village: Village;
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
}

export function EditVillageSheet({ village, open, onOpenChangeAction }: EditVillageSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(village.photoUrl || null);
    const { toast } = useToast();

    const form = useForm<VillageFormValues>({
        resolver: zodResolver(villageSchema),
        defaultValues: {
            name: village.name || "",
            region: village.region || "",
            department: village.department || "",
            subPrefecture: village.subPrefecture || "",
            commune: village.commune || "",
            codeINS: village.codeINS || "",
            latitude: village.latitude ?? null,
            longitude: village.longitude ?? null,
            altitude: village.altitude || undefined,
            distanceFromCapital: village.distanceFromCapital || undefined,
            distanceFromChefLieu: village.distanceFromChefLieu || undefined,
            accessRoads: village.accessRoads || "",
            population: village.population || undefined,
            populationYear: village.populationYear || 2024,
            numberOfHouseholds: village.numberOfHouseholds || undefined,
            mainEthnicGroups: village.mainEthnicGroups?.join(", ") || "",
            languages: village.languages?.join(", ") || "",
            history: village.history || "",
            customs: village.customs || "",
            traditionalPractices: village.traditionalPractices || "",
            annualEvents: village.annualEvents || "",
            mainActivities: village.mainActivities?.join(", ") || "",
            naturalResources: village.naturalResources || "",
            mainCrops: village.mainCrops?.join(", ") || "",
            hasSchool: !!village.hasSchool,
            hasHealthCenter: !!village.hasHealthCenter,
            hasElectricity: !!village.hasElectricity,
            hasWater: !!village.hasWater,
            hasMosque: !!village.hasMosque,
            hasChurch: !!village.hasChurch,
            hasMarket: !!village.hasMarket,
            infrastructureNotes: village.infrastructureNotes || "",
            chieftaincyType: village.chieftaincyType || "",
            successionMode: village.successionMode || "",
        },
    });

    // Update form when village prop changes
    useEffect(() => {
        if (village && open) {
            setPhotoFile(null);
            setPhotoPreview(village.photoUrl || null);
            form.reset({
                name: village.name || "",
                region: village.region || "",
                department: village.department || "",
                subPrefecture: village.subPrefecture || "",
                commune: village.commune || "",
                codeINS: village.codeINS || "",
                latitude: village.latitude ?? null,
                longitude: village.longitude ?? null,
                altitude: village.altitude || undefined,
                distanceFromCapital: village.distanceFromCapital || undefined,
                distanceFromChefLieu: village.distanceFromChefLieu || undefined,
                accessRoads: village.accessRoads || "",
                population: village.population || undefined,
                populationYear: village.populationYear || 2024,
                numberOfHouseholds: village.numberOfHouseholds || undefined,
                mainEthnicGroups: village.mainEthnicGroups?.join(", ") || "",
                languages: village.languages?.join(", ") || "",
                history: village.history || "",
                customs: village.customs || "",
                traditionalPractices: village.traditionalPractices || "",
                annualEvents: village.annualEvents || "",
                mainActivities: village.mainActivities?.join(", ") || "",
                naturalResources: village.naturalResources || "",
                mainCrops: village.mainCrops?.join(", ") || "",
                hasSchool: !!village.hasSchool,
                hasHealthCenter: !!village.hasHealthCenter,
                hasElectricity: !!village.hasElectricity,
                hasWater: !!village.hasWater,
                hasMosque: !!village.hasMosque,
                hasChurch: !!village.hasChurch,
                hasMarket: !!village.hasMarket,
                infrastructureNotes: village.infrastructureNotes || "",
                chieftaincyType: village.chieftaincyType || "",
                successionMode: village.successionMode || "",
            });
        }
    }, [village, form, open]);

    const selectedRegion = form.watch("region");
    const selectedDepartment = form.watch("department");

    const departments = selectedRegion ? Object.keys(divisions[selectedRegion] || {}) : [];
    const subPrefectures = (selectedRegion && selectedDepartment) 
        ? Object.keys(divisions[selectedRegion][selectedDepartment] || {}) 
        : [];

    const watchedFields = form.watch(["hasSchool", "hasHealthCenter", "hasElectricity", "hasWater", "hasMarket", "hasMosque", "hasChurch"]);
    const currentScore = calculateDevelopmentScore({
        hasSchool: watchedFields[0],
        hasHealthCenter: watchedFields[1],
        hasElectricity: watchedFields[2],
        hasWater: watchedFields[3],
        hasMarket: watchedFields[4],
        hasMosque: watchedFields[5],
        hasChurch: watchedFields[6],
    } as any);

    async function onSubmit(values: VillageFormValues) {
        setIsSubmitting(true);
        try {
            // Transformation des champs string en tableaux
            const finalData = {
                ...values,
                mainEthnicGroups: csvToArray(values.mainEthnicGroups),
                languages: csvToArray(values.languages),
                mainActivities: csvToArray(values.mainActivities),
                mainCrops: csvToArray(values.mainCrops),
                latitude: values.latitude ?? null,
                longitude: values.longitude ?? null,
            };

            // Nettoyage des undefined pour Firebase (Firebase rejette les valeurs undefined)
            Object.keys(finalData).forEach(key => {
                if ((finalData as any)[key] === undefined) {
                    (finalData as any)[key] = null;
                }
            });

            await updateVillage(village.id, finalData as any, photoFile);
            
            toast({
                title: "Village mis à jour",
                description: `Le village ${values.name} a été modifié avec succès.`,
            });
            onOpenChangeAction(false);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de modifier le village. Veuillez réessayer.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const onError = (errors: any) => {
        console.error("Validation Errors:", errors);
        toast({
            variant: "destructive",
            title: "Champs invalides",
            description: "Veuillez vérifier tous les onglets du formulaire, certains champs obligatoires ou formats sont invalides.",
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChangeAction}>
            <SheetContent className="sm:max-w-[700px] p-0 border-none shadow-2xl">
                <div className="flex flex-col h-full bg-slate-50/30">
                    <div className="p-8 pb-4 bg-white border-b border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <SheetTitle className="text-3xl font-black text-slate-900 tracking-tighter">MODIFIER LOCALITÉ</SheetTitle>
                                <SheetDescription className="text-slate-500 font-medium">
                                    Enrichissement des données territoriales pour {village.name}
                                </SheetDescription>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">IDL Actuel</div>
                                <div className="text-2xl font-black text-blue-600 leading-none">{currentScore}%</div>
                            </div>
                        </div>
                        <Progress value={currentScore} className="h-1.5 bg-slate-100" />
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="flex-grow flex flex-col min-h-0">
                            <ScrollArea className="flex-grow px-8">
                                <Accordion type="multiple" defaultValue={["admin"]} className="py-6 space-y-4">
                                    {/* Section 1: Administration */}
                                    <AccordionItem value="admin" className="border-none bg-white rounded-3xl px-6 shadow-sm border border-slate-100/50">
                                        <AccordionTrigger className="hover:no-underline py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600"><Building2 className="h-5 w-5" /></div>
                                                <div className="text-left">
                                                    <div className="font-black text-slate-900 text-sm uppercase tracking-tight">Identité Administrative</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Localisation & Codes</div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-8 space-y-5">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nom officiel de la localité</FormLabel>
                                                        <FormControl><Input placeholder="Ex: Ebouassue" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl focus:ring-blue-500" {...field} value={field.value || ""} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="region"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Région</FormLabel>
                                                            <Select onValueChange={(v) => { field.onChange(v); form.setValue("department", ""); form.setValue("subPrefecture", ""); }} value={field.value}>
                                                                <FormControl><SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl"><SelectValue placeholder="Sél. région" /></SelectTrigger></FormControl>
                                                                <SelectContent className="max-h-[300px]">{IVORIAN_REGIONS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="department"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Département</FormLabel>
                                                            <Select onValueChange={(v) => { field.onChange(v); form.setValue("subPrefecture", ""); }} value={field.value} disabled={!selectedRegion}>
                                                                <FormControl><SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl"><SelectValue placeholder="Sél. dépt." /></SelectTrigger></FormControl>
                                                                <SelectContent>{departments.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="subPrefecture"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Sous-Préfecture</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDepartment}>
                                                                <FormControl><SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl"><SelectValue placeholder="Sél. s-préf." /></SelectTrigger></FormControl>
                                                                <SelectContent>{subPrefectures.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="codeINS"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Code INS</FormLabel>
                                                            <FormControl><Input placeholder="Ex: CIV001" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl" {...field} value={field.value || ""} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Section 2: Géographie & SIG */}
                                    <AccordionItem value="geo" className="border-none bg-white rounded-3xl px-6 shadow-sm border border-slate-100/50">
                                        <AccordionTrigger className="hover:no-underline py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600"><MapIcon className="h-5 w-5" /></div>
                                                <div className="text-left">
                                                    <div className="font-black text-slate-900 text-sm uppercase tracking-tight">Géographie & SIG</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Coordonnées & Accès</div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-8 space-y-6">
                                            <div className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner bg-slate-50">
                                                <LocationPicker 
                                                    onLocationSelectAction={(lat, lng) => {
                                                        form.setValue("latitude", lat);
                                                        form.setValue("longitude", lng);
                                                    }}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="latitude" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Latitude</FormLabel>
                                                        <FormControl><Input type="number" step="any" {...field} value={field.value || ""} onChange={e => field.onChange(parseFloat(e.target.value) || null)} className="h-12 bg-slate-50/50 rounded-xl" /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="longitude" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Longitude</FormLabel>
                                                        <FormControl><Input type="number" step="any" {...field} value={field.value || ""} onChange={e => field.onChange(parseFloat(e.target.value) || null)} className="h-12 bg-slate-50/50 rounded-xl" /></FormControl>
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <FormField control={form.control} name="altitude" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Alt. (m)</FormLabel>
                                                        <FormControl><Input type="number" {...field} value={field.value || ""} className="h-12 bg-slate-50/50 rounded-xl" /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="distanceFromCapital" render={({ field }) => (
                                                    <FormItem className="col-span-2">
                                                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Dist. Capitale (km)</FormLabel>
                                                        <FormControl><Input type="number" {...field} value={field.value || ""} className="h-12 bg-slate-50/50 rounded-xl" /></FormControl>
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <FormField control={form.control} name="accessRoads" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Voies d'accès & État</FormLabel>
                                                    <FormControl><Textarea placeholder="Ex: Bitumée en bon état, Piste carrossable..." className="min-h-[80px] bg-slate-50/50 rounded-xl resize-none" {...field} value={field.value || ""} /></FormControl>
                                                </FormItem>
                                            )} />
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Section 3: Démographie & Peuplement */}
                                    <AccordionItem value="demography" className="border-none bg-white rounded-3xl px-6 shadow-sm border border-slate-100/50">
                                        <AccordionTrigger className="hover:no-underline py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600"><Users className="h-5 w-5" /></div>
                                                <div className="text-left">
                                                    <div className="font-black text-slate-900 text-sm uppercase tracking-tight">Démographie & Peuplement</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Population & Ethnies</div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-8 space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="population" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Population Totale</FormLabel>
                                                        <FormControl><Input type="number" placeholder="Habitants" className="h-12 bg-slate-50/50 rounded-xl" {...field} value={field.value || ""} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="populationYear" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Année Recens.</FormLabel>
                                                        <FormControl><Input type="number" placeholder="Ex: 2024" className="h-12 bg-slate-50/50 rounded-xl" {...field} value={field.value || ""} /></FormControl>
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <FormField control={form.control} name="mainEthnicGroups" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ethnies majoritaires (séparées par virgule)</FormLabel>
                                                    <FormControl><Input placeholder="Ex: Baoulé, Agni, Dioula..." className="h-12 bg-slate-50/50 rounded-xl" {...field} value={field.value || ""} /></FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="languages" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Langues parlées</FormLabel>
                                                    <FormControl><Input placeholder="Ex: Français, Baoulé..." className="h-12 bg-slate-50/50 rounded-xl" {...field} value={field.value || ""} /></FormControl>
                                                </FormItem>
                                            )} />
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Section 4: Histoire & Patrimoine */}
                                    <AccordionItem value="history" className="border-none bg-white rounded-3xl px-6 shadow-sm border border-slate-100/50">
                                        <AccordionTrigger className="hover:no-underline py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-purple-50 rounded-2xl text-purple-600"><Landmark className="h-5 w-5" /></div>
                                                <div className="text-left">
                                                    <div className="font-black text-slate-900 text-sm uppercase tracking-tight">Histoire & Patrimoine</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Origines & Coutumes</div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-8 space-y-6">
                                            <FormField control={form.control} name="history" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Bref aperçu historique</FormLabel>
                                                    <FormControl><Textarea placeholder="Origine du village, fondateurs..." className="min-h-[100px] bg-slate-50/50 rounded-xl resize-none" {...field} value={field.value || ""} /></FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="customs" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Coutumes & Totems</FormLabel>
                                                    <FormControl><Textarea placeholder="Interdits, lieux sacrés..." className="min-h-[100px] bg-slate-50/50 rounded-xl resize-none" {...field} value={field.value || ""} /></FormControl>
                                                </FormItem>
                                            )} />
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Section 5: Économie */}
                                    <AccordionItem value="economy" className="border-none bg-white rounded-3xl px-6 shadow-sm border border-slate-100/50">
                                        <AccordionTrigger className="hover:no-underline py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-rose-50 rounded-2xl text-rose-600"><Coins className="h-5 w-5" /></div>
                                                <div className="text-left">
                                                    <div className="font-black text-slate-900 text-sm uppercase tracking-tight">Économie Locale</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Activités & Cultures</div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-8 space-y-6">
                                            <FormField control={form.control} name="mainActivities" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Activités principales</FormLabel>
                                                    <FormControl><Input placeholder="Ex: Agriculture, Commerce, Pêche..." className="h-12 bg-slate-50/50 rounded-xl" {...field} value={field.value || ""} /></FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="mainCrops" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cultures majeures</FormLabel>
                                                    <FormControl><Input placeholder="Ex: Cacao, Café, Hévéa, Igname..." className="h-12 bg-slate-50/50 rounded-xl" {...field} value={field.value || ""} /></FormControl>
                                                </FormItem>
                                            )} />
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Section 6: Infrastructures */}
                                    <AccordionItem value="infra" className="border-none bg-white rounded-3xl px-6 shadow-sm border border-slate-100/50">
                                        <AccordionTrigger className="hover:no-underline py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600"><Zap className="h-5 w-5" /></div>
                                                <div className="text-left">
                                                    <div className="font-black text-slate-900 text-sm uppercase tracking-tight">Infrastructures</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Équipements & IDL</div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-8 space-y-6">
                                            <div className="grid grid-cols-1 gap-4">
                                                {[
                                                    { id: "hasElectricity", label: "Électrification (CIE)", icon: Zap, color: "text-amber-500" },
                                                    { id: "hasWater", label: "Eau Potable (SODECI/HVA)", icon: Droplets, color: "text-blue-500" },
                                                    { id: "hasSchool", label: "Établissement Scolaire", icon: School, color: "text-indigo-500" },
                                                    { id: "hasHealthCenter", label: "Centre de Santé", icon: Activity, color: "text-rose-500" },
                                                    { id: "hasMarket", label: "Marché Permanent", icon: ShoppingBag, color: "text-emerald-500" },
                                                    { id: "hasMosque", label: "Mosquée", icon: Mosque, color: "text-slate-600" },
                                                    { id: "hasChurch", label: "Église", icon: Church, color: "text-slate-600" },
                                                ].map((item) => (
                                                    <FormField
                                                        key={item.id}
                                                        control={form.control}
                                                        name={item.id as any}
                                                        render={({ field }) => (
                                                            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                                <div className="flex items-center gap-3">
                                                                    <item.icon className={`h-5 w-5 ${item.color}`} />
                                                                    <Label htmlFor={item.id} className="font-bold text-slate-700 cursor-pointer">{item.label}</Label>
                                                                </div>
                                                                <FormControl><Checkbox id={item.id} checked={field.value} onCheckedChange={field.onChange} className="h-6 w-6 rounded-lg" /></FormControl>
                                                            </div>
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <FormField control={form.control} name="infrastructureNotes" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Notes sur l'état des infrastructures</FormLabel>
                                                    <FormControl><Textarea placeholder="Besoin de réhabilitation, extension..." className="min-h-[80px] bg-slate-50/50 rounded-xl resize-none" {...field} value={field.value || ""} /></FormControl>
                                                </FormItem>
                                            )} />
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Photo principale */}
                                    <AccordionItem value="media" className="border-none bg-white rounded-3xl px-6 shadow-sm border border-slate-100/50">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-pink-50 rounded-lg"><ImageIcon className="h-5 w-5 text-pink-600" /></div>
                                                <span className="font-bold text-slate-900">Photo principale</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2 pb-6">
                                            <div className="flex items-start gap-4">
                                                {photoPreview ? (
                                                    <div className="relative">
                                                        <img
                                                            src={photoPreview}
                                                            alt="Aperçu"
                                                            className="h-32 w-32 rounded-2xl object-cover border-2 border-white shadow-lg"
                                                        />
                                                        <button
                                                            type="button"
                                                            aria-label="Retirer la photo"
                                                            onClick={() => {
                                                                setPhotoFile(null);
                                                                setPhotoPreview(null);
                                                            }}
                                                            className="absolute -top-2 -right-2 rounded-full bg-rose-500 p-1 text-white shadow-md hover:bg-rose-600"
                                                        >
                                                            <XIcon className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                                                        <ImageIcon className="h-8 w-8 text-slate-300" />
                                                        <span className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ajouter</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                if (file.size > 5 * 1024 * 1024) {
                                                                    toast({
                                                                        variant: "destructive",
                                                                        title: "Image trop lourde",
                                                                        description: "5 Mo maximum.",
                                                                    });
                                                                    return;
                                                                }
                                                                setPhotoFile(file);
                                                                setPhotoPreview(URL.createObjectURL(file));
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                                <div className="flex-1 text-xs text-slate-500 leading-relaxed">
                                                    <p className="font-bold text-slate-700 mb-1">JPG / PNG, 5 Mo max.</p>
                                                    <p>Remplace la photo actuelle utilisée sur la fiche territoriale et dans les rapports imprimés.</p>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </ScrollArea>

                            <div className="p-8 bg-white border-t border-slate-100 flex gap-4">
                                <Button variant="outline" type="button" onClick={() => onOpenChangeAction(false)} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-slate-50">
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest bg-slate-900 border-none hover:bg-slate-800 shadow-xl shadow-slate-200">
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Synchronisation...</div>
                                    ) : "Mettre à jour la fiche"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
