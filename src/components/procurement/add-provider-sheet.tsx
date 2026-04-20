"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
    Sheet, SheetContent, SheetDescription, 
    SheetHeader, SheetTitle, SheetTrigger, SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem,
    FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Building2, MapPin, Phone, Mail, User, ShieldCheck } from "lucide-react";
import { addProvider } from "@/services/procurement-service";
import { toast } from "sonner";
import { ProviderCategory } from "@/lib/data";

const formSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    category: z.enum(["Travaux", "Fournitures", "Services", "Prestations Intellectuelles"]),
    enterpriseType: z.enum(["Entreprise Individuelle", "SARL / SARL U", "SA", "SAS / SAS U", "ONG / Association", "Autre"]),
    rccm: z.string().min(2, "Le RCCM est requis"),
    idu: z.string().min(2, "L'IDU est requis"),
    address: z.string().min(5, "L'adresse est requise"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(8, "Téléphone invalide"),
    contactPerson: z.string().min(2, "Nom du contact requis"),
    status: z.enum(["Actif", "Inactif"]),
});

export function AddProviderSheet() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            category: "Fournitures",
            enterpriseType: "SARL / SARL U",
            rccm: "",
            idu: "",
            address: "",
            email: "",
            phone: "",
            contactPerson: "",
            status: "Actif",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            await addProvider(values);
            toast.success("Prestataire enregistré avec succès");
            form.reset();
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="bg-slate-900 rounded-xl">
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un Prestataire
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" /> Nouveau Prestataire
                    </SheetTitle>
                    <SheetDescription>
                        Renseignez les informations légales et de contact du prestataire.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Raison Sociale / Nom</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: GESTION SARL" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Catégorie</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choisir une catégorie" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Travaux">Travaux</SelectItem>
                                                <SelectItem value="Fournitures">Fournitures</SelectItem>
                                                <SelectItem value="Services">Services</SelectItem>
                                                <SelectItem value="Prestations Intellectuelles">Intellectuelles</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Statut</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Statut" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Actif">Actif</SelectItem>
                                                <SelectItem value="Inactif">Inactif</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="enterpriseType"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Type d'Entreprise</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 rounded-xl">
                                                    <SelectValue placeholder="Choisir le type juridique" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="Entreprise Individuelle">Entreprise Individuelle</SelectItem>
                                                <SelectItem value="SARL / SARL U">SARL / SARL U</SelectItem>
                                                <SelectItem value="SA">SA (Société Anonyme)</SelectItem>
                                                <SelectItem value="SAS / SAS U">SAS / SAS U</SelectItem>
                                                <SelectItem value="ONG / Association">ONG / Association</SelectItem>
                                                <SelectItem value="Autre">Autre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="rccm"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>N° RCCM</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <ShieldCheck className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-9 h-11 rounded-xl" placeholder="RCCM-XX-XXX" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="idu"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>IDU / Compte Contribuable</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <ShieldCheck className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-9 h-11 rounded-xl" placeholder="IDU XXXXXXXXX" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <h3 className="text-sm font-bold flex items-center gap-2"><MapPin className="h-4 w-4" /> Contact & Siège</h3>
                            
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adresse Géographique</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Quartier, Ville, Rue..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input className="pl-9" placeholder="contact@domaine.com" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Téléphone</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input className="pl-9" placeholder="+225 ..." {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="contactPerson"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Personne de Contact (Responsable)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-9" placeholder="Nom et Prénoms" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <SheetFooter className="pt-4">
                            <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 h-12 rounded-xl text-lg font-bold">
                                {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                Enregistrer le Prestataire
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
