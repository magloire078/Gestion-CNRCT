"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
    Globe, FileText, Moon as Mosque
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateVillage } from "@/services/village-service";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { divisions } from "@/lib/ivory-coast-divisions";
import { calculateDevelopmentScore } from "@/services/village-service";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LocationPicker } from "@/components/common/location-picker";
import { Label } from "@/components/ui/label";
import { Village } from "@/types/village";

const preprocessNumber = (val: any) => {
    if (val === "" || val === undefined || val === null) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
};

const villageSchema = z.object({
    // Identité administrative
    name: z.string().min(2, "Le nom du village doit avoir au moins 2 caractères"),
    region: z.string().min(1, "La région est requise"),
    department: z.string().min(1, "Le département est requis"),
    subPrefecture: z.string().min(1, "La sous-préfecture est requise"),
    commune: z.string().optional(),
    codeINS: z.string().optional(),
    
    // Position SIG & Géo
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    altitude: z.preprocess(preprocessNumber, z.number().optional()),
    distanceFromCapital: z.preprocess(preprocessNumber, z.number().optional()),
    distanceFromChefLieu: z.preprocess(preprocessNumber, z.number().optional()),
    accessRoads: z.string().optional(),

    // Démographie
    population: z.preprocess(preprocessNumber, z.number().optional()),
    populationYear: z.preprocess(preprocessNumber, z.number().optional()),
    numberOfHouseholds: z.preprocess(preprocessNumber, z.number().optional()),
    mainEthnicGroups: z.string().optional(),
    languages: z.string().optional(),

    // Histoire & Culture
    history: z.string().optional(),
    customs: z.string().optional(),
    traditionalPractices: z.string().optional(),
    annualEvents: z.string().optional(),

    // Économie
    mainActivities: z.string().optional(),
    naturalResources: z.string().optional(),
    mainCrops: z.string().optional(),

    // Infrastructures
    hasSchool: z.boolean().default(false),
    hasHealthCenter: z.boolean().default(false),
    hasElectricity: z.boolean().default(false),
    hasWater: z.boolean().default(false),
    hasMosque: z.boolean().default(false),
    hasChurch: z.boolean().default(false),
    hasMarket: z.boolean().default(false),
    infrastructureNotes: z.string().optional(),

    // Chefferie
    chieftaincyType: z.string().optional(),
    successionMode: z.string().optional(),
});

type VillageFormValues = z.infer<typeof villageSchema>;

interface EditVillageSheetProps {
    village: Village;
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
}

export function EditVillageSheet({ village, open, onOpenChangeAction }: EditVillageSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
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
                mainEthnicGroups: values.mainEthnicGroups ? values.mainEthnicGroups.split(",").map(s => s.trim()).filter(s => s !== "") : [],
                languages: values.languages ? values.languages.split(",").map(s => s.trim()).filter(s => s !== "") : [],
                mainActivities: values.mainActivities ? values.mainActivities.split(",").map(s => s.trim()).filter(s => s !== "") : [],
                mainCrops: values.mainCrops ? values.mainCrops.split(",").map(s => s.trim()).filter(s => s !== "") : [],
                latitude: values.latitude ?? null,
                longitude: values.longitude ?? null,
            };

            // Nettoyage des undefined pour Firebase (Firebase rejette les valeurs undefined)
            Object.keys(finalData).forEach(key => {
                if ((finalData as any)[key] === undefined) {
                    (finalData as any)[key] = null;
                }
            });

            await updateVillage(village.id, finalData as any);
            
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
            <SheetContent className="sm:max-w-[700px] bg-white border-l-0 sm:border-l p-0 flex flex-col h-[100dvh] shadow-2xl">
                <div className="flex flex-col h-full">
                    <div className="p-5 pb-4 bg-white border-b border-slate-100">
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
                        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="flex flex-col flex-1 overflow-hidden min-h-0">
                            <Tabs defaultValue="admin" className="w-full h-full flex flex-col overflow-hidden min-h-0">
                                <div className="border-b border-slate-100 shrink-0 bg-white">
                                    <TabsList className="w-full flex overflow-x-auto no-scrollbar justify-start bg-transparent p-0 h-auto rounded-none">
                                        <TabsTrigger value="admin" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">Identité</TabsTrigger>
                                        <TabsTrigger value="geo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">SIG & Géo</TabsTrigger>
                                        <TabsTrigger value="demography" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">Démographie</TabsTrigger>
                                        <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">Histoire</TabsTrigger>
                                        <TabsTrigger value="economy" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">Économie</TabsTrigger>
                                        <TabsTrigger value="infra" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">Infra.</TabsTrigger>
                                        <TabsTrigger value="chief" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">Autorité</TabsTrigger>
                                    </TabsList>
                                </div>
                                <ScrollArea className="flex-1 px-5 pb-24 h-full">
                                    {/* Section 1: Administration */}
                                    <TabsContent value="admin" className="mt-4 outline-none">
                                        <div className="pt-4 space-y-4 h-full">
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
                                        </div>
                                    </TabsContent>

                                    {/* Section 2: Géographie & SIG */}
                                    <TabsContent value="geo" className="mt-0 h-full flex-grow">
                                        
                                        <div className="pt-4 space-y-4 h-full">
                                            <div className="rounded-xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50">
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
                                        </div>
                                    </TabsContent>

                                    {/* Section 3: Démographie & Peuplement */}
                                    <TabsContent value="demography" className="mt-0 h-full flex-grow">
                                        
                                        <div className="pt-4 space-y-4 h-full">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="population" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Population Totale</FormLabel>
                                                        <FormControl><Input type="number" inputMode="numeric" placeholder="Habitants" className="h-12 bg-slate-50/50 rounded-xl" {...field} value={field.value || ""} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="populationYear" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Année Recens.</FormLabel>
                                                        <FormControl><Input type="number" inputMode="numeric" placeholder="Ex: 2024" className="h-12 bg-slate-50/50 rounded-xl" {...field} value={field.value || ""} /></FormControl>
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
                                        </div>
                                    </TabsContent>

                                    {/* Section 4: Histoire & Patrimoine */}
                                    <TabsContent value="history" className="mt-0 h-full flex-grow">
                                        
                                        <div className="pt-4 space-y-4 h-full">
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
                                        </div>
                                    </TabsContent>

                                    {/* Section 5: Économie */}
                                    <TabsContent value="economy" className="mt-0 h-full flex-grow">
                                        
                                        <div className="pt-4 space-y-4 h-full">
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
                                        </div>
                                    </TabsContent>

                                    {/* Section 6: Infrastructures */}
                                    <TabsContent value="infra" className="mt-0 h-full flex-grow">
                                        
                                        <div className="pt-4 space-y-4 h-full">
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
                                        </div>
                                    </TabsContent>
                                </ScrollArea>
                            </Tabs>

                            <div className="p-5 bg-white border-t border-slate-100 flex gap-4">
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
