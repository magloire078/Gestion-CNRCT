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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    Plus, Loader2, Activity,
    MapPin, Users, Building2, Droplets, Zap, School, Church, Moon as Mosque,
    ChevronRight, ChevronLeft
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addVillage } from "@/services/village-service";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { divisions } from "@/lib/ivory-coast-divisions";
import { calculateDevelopmentScore } from "@/services/village-service";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { LocationPicker } from "@/components/common/location-picker";
import { Label } from "@/components/ui/label";
import { CreatableSelect } from "@/components/ui/creatable-select";
import { useCustomaryDivisions } from "@/services/customary-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
    canton: z.string().optional(),
    tribu: z.string().optional(),
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

const STEPS = [
  { id: 1, title: "Identité", description: "Nom et rattachement", fields: ["name", "region", "department", "subPrefecture", "commune", "canton", "tribu", "codeINS", "chiefTitle"] },
  { id: 2, title: "SIG & Géo", description: "Coordonnées et accès", fields: ["latitude", "longitude", "altitude", "distanceFromCapital", "distanceFromChefLieu", "accessRoads"] },
  { id: 3, title: "Infrastructures", description: "Équipements et ressources", fields: ["hasSchool", "hasHealthCenter", "hasElectricity", "hasWater", "hasMosque", "hasChurch", "hasMarket", "infrastructureNotes"] },
  { id: 4, title: "Démographie", description: "Population et socio-éco", fields: ["population", "populationYear", "numberOfHouseholds", "mainEthnicGroups", "languages", "mainActivities", "naturalResources", "mainCrops"] },
  { id: 5, title: "Histoire", description: "Traditions et culture", fields: ["history", "customs", "traditionalPractices", "annualEvents"] }
];

export function AddVillageSheet() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const { toast } = useToast();

    const form = useForm<VillageFormValues>({
        resolver: zodResolver(villageSchema),
        defaultValues: {
            name: "", region: "", department: "", subPrefecture: "", commune: "", canton: "", tribu: "", codeINS: "",
            latitude: null, longitude: null, altitude: undefined, distanceFromCapital: undefined, distanceFromChefLieu: undefined, accessRoads: "",
            population: undefined, populationYear: 2024, numberOfHouseholds: undefined, mainEthnicGroups: "", languages: "",
            history: "", customs: "", traditionalPractices: "", annualEvents: "",
            mainActivities: "", naturalResources: "", mainCrops: "",
            hasSchool: false, hasHealthCenter: false, hasElectricity: false, hasWater: false, hasMosque: false, hasChurch: false, hasMarket: false, infrastructureNotes: "",
            chiefTitle: "Chef de Village",
        },
    });

    const selectedRegion = form.watch("region");
    const selectedDepartment = form.watch("department");

    const departments = selectedRegion ? Object.keys(divisions[selectedRegion] || {}) : [];
    const subPrefectures = (selectedRegion && selectedDepartment) 
        ? Object.keys(divisions[selectedRegion][selectedDepartment] || {}) 
        : [];
        
    const { cantons, tribus } = useCustomaryDivisions();
    const cantonItems = cantons.map(c => ({ value: c, label: c }));
    const tribuItems = tribus.map(t => ({ value: t, label: t }));

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

    const nextStep = async () => {
        const fieldsToValidate = STEPS[step - 1].fields as any[];
        const isStepValid = await form.trigger(fieldsToValidate);
        if (isStepValid) {
            setDirection(1);
            setStep(s => Math.min(s + 1, STEPS.length));
        }
    };

    const prevStep = () => {
        setDirection(-1);
        setStep(s => Math.max(s - 1, 1));
    };

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
            setStep(1);
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter le village." });
        } finally {
            setIsSubmitting(false);
        }
    }

    const slideVariants = {
        hidden: (direction: number) => ({ x: direction > 0 ? '50%' : '-50%', opacity: 0 }),
        visible: { x: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
        exit: (direction: number) => ({ x: direction > 0 ? '-50%' : '50%', opacity: 0, transition: { duration: 0.2 } })
    };

    const handleClose = () => {
        form.reset();
        setStep(1);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else setOpen(true); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl h-14 px-5 font-bold border-slate-200 hover:bg-slate-50 w-full sm:w-auto">
                    <Plus className="mr-2 h-5 w-5" />
                    Nouveau Village
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-slate-50 w-full h-[100dvh] sm:h-[85vh] max-h-[100dvh]">
                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Sidebar Wizard Navigation */}
                    <div className="w-full md:w-64 bg-white border-b md:border-r md:border-b-0 border-slate-100 p-4 md:p-6 shrink-0 flex flex-col justify-between">
                        <div>
                            <div className="hidden md:block mb-4">
                                <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Ajout Localité</h2>
                                <p className="text-xs text-slate-500 mt-1 font-medium">Registre Territorial</p>
                            </div>
                            <div className="flex flex-row md:flex-col justify-between md:justify-start space-y-0 md:space-y-6 overflow-x-auto no-scrollbar pb-2">
                                {STEPS.map((s) => (
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

                        <div className="hidden md:block mt-4">
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">IDL Prévisionnel</span>
                                    <span className="text-sm font-black text-blue-700">{liveScore}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                                    <Progress value={liveScore} className="h-full w-full bg-blue-100" indicatorClassName="bg-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 flex flex-col relative bg-white overflow-hidden min-h-0">
                        <DialogHeader className="p-6 border-b border-slate-100 bg-white z-10 shrink-0">
                            <DialogTitle className="text-xl">{STEPS[step-1].title}</DialogTitle>
                            <DialogDescription>{STEPS[step-1].description}</DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 p-6 relative overflow-y-auto">
                                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                                        <motion.div
                                            key={step}
                                            custom={direction}
                                            variants={slideVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            className="space-y-6 pb-10"
                                        >
                                            {/* STEP 1: Identité */}
                                            {step === 1 && (
                                                <div className="space-y-4">
                                                    <FormField control={form.control} name="name" render={({ field }) => (
                                                        <FormItem><FormLabel className="font-bold">Nom du village/localité *</FormLabel>
                                                        <FormControl><Input placeholder="Ex: Ebouassue" className="h-11 rounded-lg" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="chiefTitle" render={({ field }) => (
                                                        <FormItem><FormLabel className="font-bold">Titre de l'autorité locale</FormLabel>
                                                        <FormControl><Input placeholder="Ex: Chef de Village" className="h-11 rounded-lg" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="region" render={({ field }) => (
                                                        <FormItem><FormLabel className="font-bold">Région *</FormLabel>
                                                        <Select onValueChange={(v) => { field.onChange(v); form.setValue("department", ""); form.setValue("subPrefecture", ""); }} defaultValue={field.value}>
                                                            <FormControl><SelectTrigger className="h-11 rounded-lg"><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                                                            <SelectContent className="max-h-[300px]">{IVORIAN_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                                        </Select><FormMessage /></FormItem>
                                                    )} />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="department" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Département *</FormLabel>
                                                            <Select onValueChange={(v) => { field.onChange(v); form.setValue("subPrefecture", ""); }} defaultValue={field.value} disabled={!selectedRegion}>
                                                                <FormControl><SelectTrigger className="h-11 rounded-lg"><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                                                                <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                                            </Select><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="subPrefecture" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Sous-Préfecture *</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedDepartment}>
                                                                <FormControl><SelectTrigger className="h-11 rounded-lg"><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                                                                <SelectContent>{subPrefectures.map(sp => <SelectItem key={sp} value={sp}>{sp}</SelectItem>)}</SelectContent>
                                                            </Select><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="commune" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Commune</FormLabel><FormControl><Input placeholder="Ex: Abidjan" className="h-11 rounded-lg" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="canton" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Canton</FormLabel>
                                                            <CreatableSelect items={cantonItems} value={field.value} onValueChange={field.onChange} placeholder="Sélectionner/Créer" /><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="tribu" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Tribu</FormLabel>
                                                            <CreatableSelect items={tribuItems} value={field.value} onValueChange={field.onChange} placeholder="Sélectionner/Créer" /><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="codeINS" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Code INS</FormLabel><FormControl><Input placeholder="Ex: CIV0101" className="h-11 rounded-lg" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* STEP 2: SIG & Géo */}
                                            {step === 2 && (
                                                <div className="space-y-4">
                                                    <LocationPicker 
                                                        onLocationSelectAction={(lat, lng) => { form.setValue("latitude", lat); form.setValue("longitude", lng); }}
                                                        className="border shadow-sm rounded-xl"
                                                    />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="latitude" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Latitude</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || null)} className="h-11 rounded-lg" /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="longitude" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Longitude</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || null)} className="h-11 rounded-lg" /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <FormField control={form.control} name="altitude" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Altitude (m)</FormLabel><FormControl><Input type="number" {...field} className="h-11 rounded-lg" /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="distanceFromCapital" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Dist. Abidjan (km)</FormLabel><FormControl><Input type="number" {...field} className="h-11 rounded-lg" /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="distanceFromChefLieu" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Dist. Chef-lieu (km)</FormLabel><FormControl><Input type="number" {...field} className="h-11 rounded-lg" /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                    <FormField control={form.control} name="accessRoads" render={({ field }) => (
                                                        <FormItem><FormLabel className="font-bold">Voies d'accès (État et type)</FormLabel><FormControl><Textarea className="min-h-[80px]" placeholder="Ex: Route non bitumée..." {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                            )}

                                            {/* STEP 3: Infrastructures */}
                                            {step === 3 && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="hasSchool" render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl"><div className="space-y-0.5 flex items-center gap-3"><div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><School className="h-4 w-4" /></div><div><FormLabel className="font-bold text-base">École primaire</FormLabel><p className="text-xs text-slate-500">Présence d'établissement</p></div></div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-5 w-5" /></FormControl></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="hasHealthCenter" render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl"><div className="space-y-0.5 flex items-center gap-3"><div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600"><Activity className="h-4 w-4" /></div><div><FormLabel className="font-bold text-base">Centre de santé</FormLabel><p className="text-xs text-slate-500">Dispensaire ou hôpital</p></div></div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-5 w-5" /></FormControl></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="hasElectricity" render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl"><div className="space-y-0.5 flex items-center gap-3"><div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600"><Zap className="h-4 w-4" /></div><div><FormLabel className="font-bold text-base">Électricité</FormLabel><p className="text-xs text-slate-500">Raccordé au réseau</p></div></div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-5 w-5" /></FormControl></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="hasWater" render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl"><div className="space-y-0.5 flex items-center gap-3"><div className="h-8 w-8 bg-cyan-100 rounded-lg flex items-center justify-center text-cyan-600"><Droplets className="h-4 w-4" /></div><div><FormLabel className="font-bold text-base">Eau potable</FormLabel><p className="text-xs text-slate-500">Forage ou réseau</p></div></div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-5 w-5" /></FormControl></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="hasMarket" render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl"><div className="space-y-0.5 flex items-center gap-3"><div className="h-8 w-8 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600"><Building2 className="h-4 w-4" /></div><div><FormLabel className="font-bold text-base">Marché local</FormLabel><p className="text-xs text-slate-500">Activité commerciale</p></div></div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-5 w-5" /></FormControl></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="hasChurch" render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl"><div className="space-y-0.5 flex items-center gap-3"><div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600"><Church className="h-4 w-4" /></div><div><FormLabel className="font-bold text-base">Église / Temple</FormLabel><p className="text-xs text-slate-500">Lieu de culte</p></div></div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-5 w-5" /></FormControl></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="hasMosque" render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl"><div className="space-y-0.5 flex items-center gap-3"><div className="h-8 w-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600"><Mosque className="h-4 w-4" /></div><div><FormLabel className="font-bold text-base">Mosquée</FormLabel><p className="text-xs text-slate-500">Lieu de culte</p></div></div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-5 w-5" /></FormControl></FormItem>
                                                        )} />
                                                    </div>
                                                    <FormField control={form.control} name="infrastructureNotes" render={({ field }) => (
                                                        <FormItem><FormLabel className="font-bold">Observations sur les infrastructures</FormLabel><FormControl><Textarea className="min-h-[80px]" placeholder="Projets en cours, infrastructures dégradées..." {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                            )}

                                            {/* STEP 4: Socio-Éco */}
                                            {step === 4 && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <FormField control={form.control} name="population" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Population Totale</FormLabel><FormControl><Input type="number" {...field} className="h-11 rounded-lg" /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="populationYear" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Année Recensement</FormLabel><FormControl><Input type="number" {...field} className="h-11 rounded-lg" /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="numberOfHouseholds" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Nombre de Foyers</FormLabel><FormControl><Input type="number" {...field} className="h-11 rounded-lg" /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="mainEthnicGroups" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Ethnies principales</FormLabel><FormControl><Input placeholder="Baoulé, Bété (séparés par virgule)" className="h-11 rounded-lg" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="languages" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Langues parlées</FormLabel><FormControl><Input placeholder="Français, Dioula..." className="h-11 rounded-lg" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                    <FormField control={form.control} name="mainActivities" render={({ field }) => (
                                                        <FormItem><FormLabel className="font-bold">Activités économiques</FormLabel><FormControl><Input placeholder="Agriculture, Commerce, Pêche..." className="h-11 rounded-lg" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="mainCrops" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Cultures principales</FormLabel><FormControl><Input placeholder="Cacao, Igname..." className="h-11 rounded-lg" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="naturalResources" render={({ field }) => (
                                                            <FormItem><FormLabel className="font-bold">Ressources naturelles</FormLabel><FormControl><Input placeholder="Or, Forêt classée..." className="h-11 rounded-lg" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* STEP 5: Histoire */}
                                            {step === 5 && (
                                                <div className="space-y-4">
                                                    <FormField control={form.control} name="history" render={({ field }) => (
                                                        <FormItem><FormLabel className="font-bold">Histoire et origines</FormLabel><FormControl><Textarea className="min-h-[120px]" placeholder="Récit de fondation, mythes d'origine..." {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="customs" render={({ field }) => (
                                                        <FormItem><FormLabel className="font-bold">Coutumes et totems</FormLabel><FormControl><Textarea className="min-h-[80px]" placeholder="Interdits alimentaires, jours sacrés..." {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="traditionalPractices" render={({ field }) => (
                                                        <FormItem><FormLabel className="font-bold">Pratiques traditionnelles</FormLabel><FormControl><Textarea className="min-h-[80px]" placeholder="Danses, rituels initiatiques..." {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="annualEvents" render={({ field }) => (
                                                        <FormItem><FormLabel className="font-bold">Fêtes et événements annuels</FormLabel><FormControl><Input placeholder="Fête des ignames, Dipri..." className="h-11 rounded-lg" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={prevStep}
                                        disabled={step === 1 || isSubmitting}
                                        className="h-12 px-6 rounded-xl font-bold"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" /> Retour
                                    </Button>

                                    {step < STEPS.length ? (
                                        <Button
                                            type="button"
                                            onClick={nextStep}
                                            className="h-12 px-8 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800"
                                        >
                                            Suivant <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="h-12 px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                                        >
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Terminer et Enregistrer"}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
