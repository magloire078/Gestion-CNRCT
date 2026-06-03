"use client";

import { useState } from "react";
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
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    Plus, Loader2, MapPin, Map as MapIcon, Users, 
    Building2, Droplets, Zap, School, Activity,
    Mountain, Landmark, Coins, Heart, ShoppingBag,
    Church, Info, Calendar, History,
    Globe, FileText, Moon as Mosque, Save
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addVillage } from "@/services/village-service";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { divisions } from "@/lib/ivory-coast-divisions";
import { calculateDevelopmentScore } from "@/services/village-service";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LocationPicker } from "@/components/common/location-picker";
import { Label } from "@/components/ui/label";

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
    chiefTitle: z.string().optional(),
});

type VillageFormValues = z.infer<typeof villageSchema>;

export function AddVillageSheet() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<VillageFormValues>({
        resolver: zodResolver(villageSchema),
        defaultValues: {
            name: "",
            region: "",
            department: "",
            subPrefecture: "",
            commune: "",
            codeINS: "",
            latitude: null,
            longitude: null,
            altitude: undefined,
            distanceFromCapital: undefined,
            distanceFromChefLieu: undefined,
            accessRoads: "",
            population: undefined,
            populationYear: 2024,
            numberOfHouseholds: undefined,
            mainEthnicGroups: "",
            languages: "",
            history: "",
            customs: "",
            traditionalPractices: "",
            annualEvents: "",
            mainActivities: "",
            naturalResources: "",
            mainCrops: "",
            hasSchool: false,
            hasHealthCenter: false,
            hasElectricity: false,
            hasWater: false,
            hasMosque: false,
            hasChurch: false,
            hasMarket: false,
            infrastructureNotes: "",
            chiefTitle: "Chef de Village",
        },
    });

    const selectedRegion = form.watch("region");
    const selectedDepartment = form.watch("department");

    const departments = selectedRegion ? Object.keys(divisions[selectedRegion] || {}) : [];
    const subPrefectures = (selectedRegion && selectedDepartment) 
        ? Object.keys(divisions[selectedRegion][selectedDepartment] || {}) 
        : [];

    const currentValues = form.watch();
    const liveScore = calculateDevelopmentScore({
        ...currentValues,
        latitude: currentValues.latitude ?? undefined,
        longitude: currentValues.longitude ?? undefined,
        mainEthnicGroups: typeof currentValues.mainEthnicGroups === 'string' ? (currentValues.mainEthnicGroups as string).split(',').map(s => s.trim()).filter(Boolean) : undefined,
        languages: typeof currentValues.languages === 'string' ? (currentValues.languages as string).split(',').map(s => s.trim()).filter(Boolean) : undefined,
        mainActivities: typeof currentValues.mainActivities === 'string' ? (currentValues.mainActivities as string).split(',').map(s => s.trim()).filter(Boolean) : undefined,
        mainCrops: typeof currentValues.mainCrops === 'string' ? (currentValues.mainCrops as string).split(',').map(s => s.trim()).filter(Boolean) : undefined,
    } as any);

    async function onSubmit(values: VillageFormValues) {
        setIsSubmitting(true);
        try {
            const finalData = {
                ...values,
                latitude: values.latitude ?? null,
                longitude: values.longitude ?? null,
                mainEthnicGroups: values.mainEthnicGroups ? values.mainEthnicGroups.split(',').map(s => s.trim()).filter(Boolean) : [],
                languages: values.languages ? values.languages.split(',').map(s => s.trim()).filter(Boolean) : [],
                mainActivities: values.mainActivities ? values.mainActivities.split(',').map(s => s.trim()).filter(Boolean) : [],
                mainCrops: values.mainCrops ? values.mainCrops.split(',').map(s => s.trim()).filter(Boolean) : [],
            };

            // Nettoyage des undefined pour Firebase (Firebase rejette les valeurs undefined)
            Object.keys(finalData).forEach(key => {
                if ((finalData as any)[key] === undefined) {
                    (finalData as any)[key] = null;
                }
            });

            await addVillage(finalData as any);
            toast({
                title: "Village ajouté",
                description: `Le village ${values.name} a été créé avec succès.`,
            });
            form.reset();
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible d'ajouter le village. Veuillez réessayer.",
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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="rounded-xl h-14 px-5 font-bold border-slate-200 hover:bg-slate-50 w-full sm:w-auto">
                    <Plus className="mr-2 h-5 w-5" />
                    Nouveau Village
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[700px] bg-white border-l-0 sm:border-l p-0 flex flex-col h-[100dvh]">
                <SheetHeader className="px-6 pt-6 pb-2 border-b border-slate-100 shrink-0">
                    <SheetTitle className="text-2xl font-black text-slate-900">Ajouter une localité</SheetTitle>
                    <SheetDescription className="text-slate-500">
                        Remplissez les informations pour l&apos;Observatoire Territorial.
                    </SheetDescription>
                    <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 mt-4">
                        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-200">
                            <Activity className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">IDL Prévisionnel</span>
                                <span className="text-sm font-black text-blue-700">{liveScore}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                                <Progress 
                                    value={liveScore} 
                                    className="h-full w-full bg-blue-100" 
                                    indicatorClassName="bg-blue-600"
                                />
                            </div>
                        </div>
                    </div>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onError)} className="flex flex-col flex-1 overflow-hidden min-h-0">
                        <Tabs defaultValue="admin" className="w-full h-full flex flex-col overflow-hidden min-h-0">
                            <div className="border-b border-slate-100 shrink-0 bg-white">
                                <TabsList className="w-full flex overflow-x-auto no-scrollbar justify-start bg-transparent p-0 h-auto rounded-none">
                                    <TabsTrigger value="admin" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">Identité</TabsTrigger>
                                    <TabsTrigger value="sig" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">SIG & Géo</TabsTrigger>
                                    <TabsTrigger value="geo" className="hidden">SIG & Géo</TabsTrigger>
                                    <TabsTrigger value="demography" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">Démographie</TabsTrigger>
                                    <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">Histoire</TabsTrigger>
                                    <TabsTrigger value="economy" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">Économie</TabsTrigger>
                                    <TabsTrigger value="infrastructures" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">Infra.</TabsTrigger>
                                    <TabsTrigger value="chief" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-bold whitespace-nowrap text-slate-500 transition-colors">Autorité</TabsTrigger>
                                </TabsList>
                            </div>
                            
                            <ScrollArea className="flex-1 px-6 pb-24 h-full">
                                {/* Administrative Section */}
                                <TabsContent value="admin" className="mt-4 outline-none">
                                    
                                    <div className="pt-4 space-y-4 h-full">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Nom du village/localité</FormLabel>
                                                    <FormControl><Input placeholder="Ex: Ebouassue" className="h-11 rounded-lg" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="region"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Région</FormLabel>
                                                    <Select 
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            form.setValue("department", "");
                                                            form.setValue("subPrefecture", "");
                                                        }} 
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl><SelectTrigger className="h-11 rounded-lg"><SelectValue placeholder="Sélectionner une région" /></SelectTrigger></FormControl>
                                                        <SelectContent className="max-h-[300px]">{IVORIAN_REGIONS.map((region) => (<SelectItem key={region} value={region}>{region}</SelectItem>))}</SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="department"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">Département</FormLabel>
                                                        <Select onValueChange={(v) => { field.onChange(v); form.setValue("subPrefecture", ""); }} defaultValue={field.value} disabled={!selectedRegion}>
                                                            <FormControl><SelectTrigger className="h-11 rounded-lg"><SelectValue placeholder="Sél. dépt." /></SelectTrigger></FormControl>
                                                            <SelectContent>{departments.map((dept) => (<SelectItem key={dept} value={dept}>{dept}</SelectItem>))}</SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="subPrefecture"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">Sous-Préfecture</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedDepartment}>
                                                            <FormControl><SelectTrigger className="h-11 rounded-lg"><SelectValue placeholder="Sél. s-préf." /></SelectTrigger></FormControl>
                                                            <SelectContent>{subPrefectures.map((sp) => (<SelectItem key={sp} value={sp}>{sp}</SelectItem>))}</SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="commune"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">Commune</FormLabel>
                                                        <FormControl><Input placeholder="Ex: Abidjan" className="h-11 rounded-lg" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="codeINS"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">Code INS (Optionnel)</FormLabel>
                                                        <FormControl><Input placeholder="Ex: CIV0101" className="h-11 rounded-lg" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* SIG & Geographic Section */}
                                <TabsContent value="sig" className="mt-0 h-full flex-grow">
                                    
                                    <div className="pt-4 space-y-4 h-full">
                                        <div className="flex flex-col gap-4">
                                            <LocationPicker 
                                                onLocationSelectAction={(lat, lng) => {
                                                    form.setValue("latitude", lat);
                                                    form.setValue("longitude", lng);
                                                }}
                                                className="border shadow-sm rounded-xl"
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="latitude"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] uppercase font-black text-slate-400">Latitude</FormLabel>
                                                            <FormControl><Input type="number" step="any" {...field} value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || null)} className="h-10 rounded-lg" /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="longitude"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] uppercase font-black text-slate-400">Longitude</FormLabel>
                                                            <FormControl><Input type="number" step="any" {...field} value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || null)} className="h-10 rounded-lg" /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <FormField
                                                    control={form.control}
                                                    name="altitude"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold">Altitude (m)</FormLabel>
                                                            <FormControl><Input type="number" inputMode="numeric" placeholder="Ex: 250" className="h-11 rounded-lg" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="accessRoads"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold">Type d'Accès</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl><SelectTrigger className="h-11 rounded-lg"><SelectValue placeholder="Sél. type" /></SelectTrigger></FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="bitume">Bitumé</SelectItem>
                                                                    <SelectItem value="laterite">Latérite</SelectItem>
                                                                    <SelectItem value="piste">Piste</SelectItem>
                                                                    <SelectItem value="fluvial">Fluvial / Lagunaire</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="distanceFromCapital"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold">Dist. Capitale (km)</FormLabel>
                                                            <FormControl><Input type="number" inputMode="numeric" placeholder="Ex: 240" className="h-11 rounded-lg" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="distanceFromChefLieu"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold">Dist. Chef-Lieu (km)</FormLabel>
                                                            <FormControl><Input type="number" inputMode="numeric" placeholder="Ex: 15" className="h-11 rounded-lg" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Demography Section */}
                                <TabsContent value="demography" className="mt-0 h-full flex-grow">
                                    
                                    <div className="pt-4 space-y-4 h-full">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="population"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">Nombre d'habitants</FormLabel>
                                                        <FormControl><Input type="number" inputMode="numeric" placeholder="Ex: 5000" className="h-11 rounded-lg" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="populationYear"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">Année Recensement</FormLabel>
                                                        <FormControl><Input type="number" inputMode="numeric" placeholder="Ex: 2024" className="h-11 rounded-lg" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="numberOfHouseholds"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Nombre de Ménages (Estimé)</FormLabel>
                                                    <FormControl><Input type="number" inputMode="numeric" placeholder="Ex: 850" className="h-11 rounded-lg" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="mainEthnicGroups"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold flex items-center gap-2"><Globe className="h-4 w-4 text-slate-400" /> Ethnies (séparées par virgule)</FormLabel>
                                                        <FormControl><Input placeholder="Ex: Baoulé, Agni, Dioula" className="h-11 rounded-lg" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="languages"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400" /> Langues parlées</FormLabel>
                                                        <FormControl><Input placeholder="Ex: Baoulé, Français" className="h-11 rounded-lg" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* History & Culture Section */}
                                <TabsContent value="history" className="mt-0 h-full flex-grow">
                                    
                                    <div className="pt-4 space-y-4 h-full">
                                        <FormField
                                            control={form.control}
                                            name="history"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Historique de la Fondation</FormLabel>
                                                    <FormControl><Textarea placeholder="Racontez brièvement l'origine du village..." className="min-h-[100px] rounded-xl resize-none" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="customs"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Us et Coutumes</FormLabel>
                                                    <FormControl><Textarea placeholder="Règles de vie, interdits, traditions notables..." className="min-h-[80px] rounded-xl resize-none" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="traditionalPractices"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">Pratiques Traditionnelles</FormLabel>
                                                        <FormControl><Input placeholder="Ex: Masques, danses sacrées" className="h-11 rounded-lg" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="annualEvents"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /> Événements Annuels</FormLabel>
                                                        <FormControl><Input placeholder="Ex: Fête des ignames" className="h-11 rounded-lg" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Economy Section */}
                                <TabsContent value="economy" className="mt-0 h-full flex-grow">
                                    
                                    <div className="pt-4 space-y-4 h-full">
                                        <FormField
                                            control={form.control}
                                            name="mainActivities"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Activités Principales (virgules)</FormLabel>
                                                    <FormControl><Input placeholder="Ex: Agriculture, Pêche, Commerce" className="h-11 rounded-lg" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="mainCrops"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Cultures de Rente / Vivrières</FormLabel>
                                                    <FormControl><Input placeholder="Ex: Cacao, Café, Hévéa, Igname" className="h-11 rounded-lg" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="naturalResources"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Ressources Naturelles</FormLabel>
                                                    <FormControl><Input placeholder="Ex: Or, Bois, Rivières" className="h-11 rounded-lg" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </TabsContent>

                                {/* Infrastructures Section */}
                                <TabsContent value="infrastructures" className="mt-0 h-full flex-grow">
                                    
                                    <div className="pt-4 space-y-4 h-full">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                            <FormField
                                                control={form.control}
                                                name="hasSchool"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-6 w-6 rounded-md" /></FormControl>
                                                        <div className="flex items-center gap-2">
                                                            <School className="h-4 w-4 text-slate-400" />
                                                            <FormLabel className="text-sm font-bold text-slate-700 cursor-pointer">École / Éducation</FormLabel>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="hasHealthCenter"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-6 w-6 rounded-md" /></FormControl>
                                                        <div className="flex items-center gap-2">
                                                            <Heart className="h-4 w-4 text-rose-500" />
                                                            <FormLabel className="text-sm font-bold text-slate-700 cursor-pointer">Centre de Santé</FormLabel>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="hasElectricity"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-6 w-6 rounded-md" /></FormControl>
                                                        <div className="flex items-center gap-2">
                                                            <Zap className="h-4 w-4 text-amber-500" />
                                                            <FormLabel className="text-sm font-bold text-slate-700 cursor-pointer">Électricité</FormLabel>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="hasWater"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-6 w-6 rounded-md" /></FormControl>
                                                        <div className="flex items-center gap-2">
                                                            <Droplets className="h-4 w-4 text-blue-500" />
                                                            <FormLabel className="text-sm font-bold text-slate-700 cursor-pointer">Eau Potable</FormLabel>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="hasMarket"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-6 w-6 rounded-md" /></FormControl>
                                                        <div className="flex items-center gap-2">
                                                            <ShoppingBag className="h-4 w-4 text-emerald-500" />
                                                            <FormLabel className="text-sm font-bold text-slate-700 cursor-pointer">Marché / Commerce</FormLabel>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="flex items-center gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="hasMosque"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-5 w-5 rounded-md" /></FormControl>
                                                            <Mosque className="h-4 w-4 text-slate-400" />
                                                            <FormLabel className="text-[10px] font-bold text-slate-600 cursor-pointer">Mosquée</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="hasChurch"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-5 w-5 rounded-md" /></FormControl>
                                                            <Church className="h-4 w-4 text-slate-400" />
                                                            <FormLabel className="text-[10px] font-bold text-slate-600 cursor-pointer">Église</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="infrastructureNotes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Notes sur les infrastructures</FormLabel>
                                                    <FormControl><Textarea placeholder="Précisions sur l'état des bâtiments, manques..." className="min-h-[60px] rounded-xl resize-none" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </TabsContent>

                                {/* Chefferie Section */}
                                <TabsContent value="chief" className="mt-0 h-full flex-grow">
                                    
                                    <div className="pt-4 space-y-4 h-full">
                                        <FormField
                                            control={form.control}
                                            name="chiefTitle"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Titre de l'Autorité</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger className="h-11 rounded-lg"><SelectValue placeholder="Sél. titre" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Chef de Village">Chef de Village</SelectItem>
                                                            <SelectItem value="Chef de Canton">Chef de Canton</SelectItem>
                                                            <SelectItem value="Chef de Province">Chef de Province</SelectItem>
                                                            <SelectItem value="Roi">Roi</SelectItem>
                                                            <SelectItem value="Chef de Tribu">Chef de Tribu</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-[11px] text-amber-800 font-medium">
                                            <Info className="h-4 w-4 inline mr-2 mb-1" />
                                            Le nom du chef et son statut détaillé doivent être gérés via le module "Chefferie" une fois le village créé.
                                        </div>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>

                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                            <Button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full h-14 rounded-xl font-black text-sm uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enregistrement...</>
                                ) : (
                                    <><Save className="mr-2 h-5 w-5" /> Enregistrer la localité</>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
