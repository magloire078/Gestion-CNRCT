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
import { Plus, Loader2, MapPin, Map as MapIcon, Users, Building2, Droplets, Zap, School, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addVillage } from "@/services/village-service";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { divisions } from "@/lib/ivory-coast-divisions";
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

const villageSchema = z.object({
    name: z.string().min(2, "Le nom du village doit avoir au moins 2 caractères"),
    region: z.string().min(1, "La région est requise"),
    department: z.string().min(1, "Le département est requis"),
    subPrefecture: z.string().min(1, "La sous-préfecture est requise"),
    commune: z.string().optional(),
    codeINS: z.string().optional(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    population: z.preprocess((val) => val === "" ? undefined : Number(val), z.number().optional()),
    populationYear: z.preprocess((val) => val === "" ? undefined : Number(val), z.number().optional()),
    hasSchool: z.boolean().default(false),
    hasHealthCenter: z.boolean().default(false),
    hasElectricity: z.boolean().default(false),
    hasWater: z.boolean().default(false),
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
            population: undefined,
            populationYear: 2024,
            hasSchool: false,
            hasHealthCenter: false,
            hasElectricity: false,
            hasWater: false,
        },
    });

    const selectedRegion = form.watch("region");
    const selectedDepartment = form.watch("department");

    const departments = selectedRegion ? Object.keys(divisions[selectedRegion] || {}) : [];
    const subPrefectures = (selectedRegion && selectedDepartment) 
        ? Object.keys(divisions[selectedRegion][selectedDepartment] || {}) 
        : [];

    async function onSubmit(values: VillageFormValues) {
        setIsSubmitting(true);
        try {
            await addVillage({
                ...values,
                latitude: values.latitude ?? undefined,
                longitude: values.longitude ?? undefined,
            });
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

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="rounded-xl h-14 px-8 font-bold border-slate-200 hover:bg-slate-50">
                    <Plus className="mr-2 h-5 w-5" />
                    Nouveau Village
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[700px]">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl font-black">Ajouter un village ou localité</SheetTitle>
                    <SheetDescription>
                        Remplissez l&apos;organisation administrative, les coordonnées SIG et les infrastructures pour l&apos;Observatoire Territorial.
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                        <ScrollArea className="flex-grow h-[calc(100vh-220px)] -mx-6 px-6">
                            <Accordion type="multiple" defaultValue={["admin"]} className="w-full h-full pb-8">
                                {/* Administrative Section */}
                                <AccordionItem value="admin" className="border-slate-100">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg"><Building2 className="h-5 w-5 text-blue-600" /></div>
                                            <span className="font-bold text-slate-900">Identité Administrative</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 space-y-4">
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
                                    </AccordionContent>
                                </AccordionItem>

                                {/* SIG & Geographic Section */}
                                <AccordionItem value="sig" className="border-slate-100">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-50 rounded-lg"><MapPin className="h-5 w-5 text-amber-600" /></div>
                                            <span className="font-bold text-slate-900">Position SIG & Carte</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 space-y-4">
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
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Demography Section */}
                                <AccordionItem value="demography" className="border-slate-100">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 rounded-lg"><Users className="h-5 w-5 text-emerald-600" /></div>
                                            <span className="font-bold text-slate-900">Démographie</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="population"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">Nombre d&apos;habitants</FormLabel>
                                                        <FormControl><Input type="number" placeholder="Ex: 5000" className="h-11 rounded-lg" {...field} /></FormControl>
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
                                                        <FormControl><Input type="number" placeholder="Ex: 2024" className="h-11 rounded-lg" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Infrastructures Section */}
                                <AccordionItem value="infrastructures" className="border-none">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-lg"><Zap className="h-5 w-5 text-indigo-600" /></div>
                                            <span className="font-bold text-slate-900">Infrastructures & Équipements</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                            <FormField
                                                control={form.control}
                                                name="hasSchool"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-6 w-6 rounded-md" /></FormControl>
                                                        <div className="flex items-center gap-2">
                                                            <School className="h-4 w-4 text-slate-400" />
                                                            <FormLabel className="text-sm font-bold text-slate-700 cursor-pointer">Établissement Scolaire</FormLabel>
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
                                                            <Activity className="h-4 w-4 text-slate-400" />
                                                            <FormLabel className="text-sm font-bold text-slate-700 cursor-pointer">Centre de Santé / Dispensaire</FormLabel>
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
                                                            <Zap className="h-4 w-4 text-slate-400" />
                                                            <FormLabel className="text-sm font-bold text-slate-700 cursor-pointer">Électrification (Réseau CIE)</FormLabel>
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
                                                            <Droplets className="h-4 w-4 text-slate-400" />
                                                            <FormLabel className="text-sm font-bold text-slate-700 cursor-pointer">Accès Eau Potable (SODECI/HVA)</FormLabel>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </ScrollArea>

                        <div className="flex justify-end gap-3 pt-6 mt-6 border-t bg-white relative z-10 p-2">
                            <Button variant="ghost" type="button" onClick={() => setOpen(false)} className="rounded-xl h-12 font-bold px-8">
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-xl h-12 font-bold px-8 bg-slate-900 border-none hover:bg-slate-800">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    "Enregistrer la localité"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
