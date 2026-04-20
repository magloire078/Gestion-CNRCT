"use client";

import { useState, useEffect } from "react";
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
    FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
    Plus, Loader2, Briefcase, Calendar, 
    DollarSign, User, Link as LinkIcon, AlertCircle
} from "lucide-react";
import { addContract, subscribeToProviders } from "@/services/procurement-service";
import { subscribeToBudgetLines } from "@/services/budget-line-service";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { Provider, BudgetLine } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
    title: z.string().min(5, "L'objet du marché doit contenir au moins 5 caractères"),
    reference: z.string().min(2, "La référence est requise"),
    providerId: z.string().min(1, "Veuillez sélectionner un prestataire"),
    budgetLineId: z.string().min(1, "Veuillez sélectionner une ligne budgétaire"),
    budgetYear: z.coerce.number().min(2020),
    totalAmount: z.coerce.number().min(0, "Le montant doit être positif"),
    engagementDate: z.string().min(1, "Date d'engagement requise"),
    startDate: z.string().min(1, "Date de début requise"),
    endDate: z.string().min(1, "Date de fin requise"),
    status: z.enum(['Passation', 'En cours', 'Avenant', 'Terminé', 'Résilié']),
    type: z.enum(['Appel d\'offres', 'Gré à gré', 'Consultation', 'Marché de gré à gré']),
    description: z.string().optional(),
});

export function AddContractSheet() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            reference: "",
            providerId: "",
            budgetLineId: "",
            budgetYear: new Date().getFullYear(),
            totalAmount: 0,
            engagementDate: new Date().toISOString().split('T')[0],
            startDate: "",
            endDate: "",
            status: "En cours",
            type: "Consultation",
            description: "",
        },
    });

    const selectedBudgetLineId = form.watch("budgetLineId");
    const amountEngaged = form.watch("totalAmount");
    
    const selectedLine = budgetLines.find(l => l.id === selectedBudgetLineId);
    const isOverBudget = selectedLine && amountEngaged > selectedLine.allocatedAmount;

    useEffect(() => {
        const unsubProviders = subscribeToProviders(setProviders, console.error);
        const unsubBudget = subscribeToBudgetLines(setBudgetLines, console.error);
        return () => {
            unsubProviders();
            unsubBudget();
        };
    }, []);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const provider = providers.find(p => p.id === values.providerId);
            const budgetLine = budgetLines.find(l => l.id === values.budgetLineId);
            
            await addContract({
                ...values,
                providerName: provider?.name || "Inconnu",
                budgetLineName: budgetLine?.name || "Inconnu",
                budgetLineCode: budgetLine?.code || "N/A",
            });
            
            toast.success("Marché enregistré avec succès");
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
                    <Plus className="mr-2 h-4 w-4" /> Nouveau Marché
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" /> Enregistrer un Marché Public
                    </SheetTitle>
                    <SheetDescription>
                        Liez un nouveau contrat à une ligne budgétaire et un prestataire.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6 pb-20">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Objet du Marché</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Acquisition de fournitures de bureau" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="reference"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>N° de Référence / Contrat</FormLabel>
                                        <FormControl>
                                            <Input placeholder="MARCHE/2026/001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mode de Passation</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choisir le mode" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Appel d'offres">Appel d'offres</SelectItem>
                                                <SelectItem value="Gré à gré">Gré à gré</SelectItem>
                                                <SelectItem value="Consultation">Consultation</SelectItem>
                                                <SelectItem value="Marché de gré à gré">Marché de gré à gré</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4 rounded-2xl bg-blue-50/50 p-4 border border-blue-100">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-blue-900"><User className="h-4 w-4" /> Prestataire</h3>
                            <FormField
                                control={form.control}
                                name="providerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Sélectionner le prestataire" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {providers.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.category})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4 rounded-2xl bg-amber-50/50 p-4 border border-amber-100 italic">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-amber-900"><LinkIcon className="h-4 w-4" /> Imputation Budgétaire</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="budgetYear"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Année Budgétaire</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="budgetLineId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ligne Budgétaire</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue placeholder="Sélectionner la ligne" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {budgetLines
                                                        .filter(l => l.year === form.getValues("budgetYear"))
                                                        .map(l => (
                                                            <SelectItem key={l.id} value={l.id}>[{l.code}] {l.name}</SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {selectedLine && (
                                <Alert className="bg-white/50 border-amber-200">
                                    <AlertDescription className="text-xs font-bold text-amber-900">
                                        Budget Alloué : {formatCurrency(selectedLine.allocatedAmount)}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <FormField
                                control={form.control}
                                name="totalAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Montant Total du Marché (FCFA)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" className="pl-9 font-black" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {isOverBudget && (
                                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Attention : Dépassement Budgétaire</AlertTitle>
                                    <AlertDescription>
                                        Le montant de ce marché dépasse le budget alloué à cette ligne ({formatCurrency(selectedLine.allocatedAmount)}).
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="engagementDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date d'Engagement</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>État d'Avancement</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Statut" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Passation">Passation</SelectItem>
                                                <SelectItem value="En cours">En cours</SelectItem>
                                                <SelectItem value="Terminé">Terminé</SelectItem>
                                                <SelectItem value="Résilié">Résilié</SelectItem>
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
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Début Exécution</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fin Prévue</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <SheetFooter className="fixed bottom-0 left-0 w-full p-6 bg-white border-t z-20">
                            <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 h-12 rounded-xl text-lg font-bold">
                                {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                Enregistrer le Marché
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
