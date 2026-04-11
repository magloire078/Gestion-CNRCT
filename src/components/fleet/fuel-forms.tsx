"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
    addFuelProvider,
    addFuelCard,
    addFuelTransaction,
    updateFuelProvider,
    updateFuelCard
} from "@/services/fuel-card-service";
import { FuelProvider, FuelCard } from "@/types/fuel";
import { Employe, Fleet } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";

// --- SCHEMAS ---

const providerSchema = z.object({
    name: z.string().min(2, "Le nom est requis"),
    contactPerson: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email("Email invalide").optional().or(z.string().length(0)),
    contractNumber: z.string().optional(),
});

const cardSchema = z.object({
    cardNumber: z.string().min(5, "Le numéro de carte est requis"),
    label: z.string().optional(),
    providerId: z.string().min(1, "Le prestataire est requis"),
    assignmentType: z.enum(["vehicle", "employee", "generic", "unassigned"]),
    assignmentId: z.string().optional(),
    expiryDate: z.string().optional(),
});

const rechargeSchema = z.object({
    cardId: z.string().min(1, "La carte est requise"),
    amount: z.coerce.number().positive("Le montant doit être positif"),
    date: z.string().min(1, "La date est requise"),
    notes: z.string().optional(),
});

const expenseSchema = z.object({
    cardId: z.string().min(1, "La carte est requise"),
    amount: z.coerce.number().positive("Le montant doit être positif"),
    liters: z.coerce.number().positive("Le litrage doit être positif").optional(),
    date: z.string().min(1, "La date est requise"),
    odometer: z.coerce.number().optional(),
    vehiclePlate: z.string().optional(),
    driverName: z.string().optional(),
    receiptNumber: z.string().optional(),
    missionNumber: z.string().optional(),
    missionRoute: z.string().optional(),
    missionDuration: z.string().optional(),
    missionHead: z.string().optional(),
    unitPrice: z.coerce.number().optional(),
    service: z.string().optional(),
    notes: z.string().optional(),
});

// --- COMPONENTS ---

export function FuelProviderDialog({
    open,
    onOpenChangeAction,
    provider
}: {
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
    provider?: FuelProvider | null;
}) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm<z.infer<typeof providerSchema>>({
        resolver: zodResolver(providerSchema),
        values: provider ? {
            name: provider.name,
            contactPerson: provider.contactPerson || "",
            phoneNumber: provider.phoneNumber || "",
            email: provider.email || "",
            contractNumber: provider.contractNumber || ""
        } : { name: "", contactPerson: "", phoneNumber: "", email: "", contractNumber: "" },
    });

    async function onSubmit(values: z.infer<typeof providerSchema>) {
        setLoading(true);
        try {
            if (provider?.id) {
                await updateFuelProvider(provider.id, values);
                toast({ title: "Succès", description: "Prestataire mis à jour." });
            } else {
                await addFuelProvider({
                    ...values,
                    status: 'active'
                });
                toast({ title: "Succès", description: "Prestataire ajouté avec succès." });
            }
            form.reset();
            onOpenChangeAction(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Operation échouée." });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-white/10 bg-slate-50/95 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl">
                <DialogHeader className="p-8 bg-slate-900 text-white space-y-2 relative">
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-emerald-400" />
                        </div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">
                            {provider ? "Régulation Prestataire" : "Accrédiation Prestataire"}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-11">
                        Identification et conventionnement fournisseur
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Identité Corporative</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="ex: TotalEnergies, Shell..." 
                                                className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px] uppercase font-bold" />
                                    </FormItem>
                                )}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="contactPerson"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Référent</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Prénoms & Nom" 
                                                    className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Ligne Directe</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="xx xx xx xx" 
                                                    className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="contractNumber"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">N° Convention cadre</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="CNRCT-FUE-2024-XXX" 
                                                className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-mono uppercase"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-2">
                                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-slate-900 shadow-xl shadow-slate-900/20 font-black uppercase tracking-widest text-[11px] hover:bg-black active:scale-95 transition-all text-white">
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        provider ? "Valider les Rectifications" : "Certifier le Prestataire"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function FuelCardDialog({
    open,
    onOpenChangeAction,
    providers,
    employees,
    vehicles,
    card
}: {
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
    providers: FuelProvider[];
    employees: Employe[];
    vehicles: Fleet[];
    card?: FuelCard | null;
}) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm<z.infer<typeof cardSchema>>({
        resolver: zodResolver(cardSchema),
        values: card ? {
            cardNumber: card.cardNumber,
            label: card.label || "",
            providerId: card.providerId,
            assignmentType: card.assignmentType,
            assignmentId: card.assignmentId || "",
            expiryDate: card.expiryDate || ""
        } : {
            cardNumber: "",
            assignmentType: "unassigned",
            providerId: "",
            label: "",
            assignmentId: "",
            expiryDate: ""
        },
    });

    async function onSubmit(values: z.infer<typeof cardSchema>) {
        setLoading(true);
        try {
            const assignmentId = (values.assignmentType === 'unassigned' || values.assignmentType === 'generic')
                ? ""
                : values.assignmentId;

            if (card?.id) {
                await updateFuelCard(card.id, { ...values, assignmentId });
                toast({ title: "Succès", description: "Carte mise à jour." });
            } else {
                await addFuelCard({
                    ...values,
                    assignmentId,
                    currentBalance: 0,
                    status: 'active' as const
                });
                toast({ title: "Succès", description: "Carte ajoutée avec succès." });
            }
            form.reset();
            onOpenChangeAction(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Operation échouée." });
        } finally {
            setLoading(false);
        }
    }

    const assignmentType = form.watch("assignmentType");

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-white/10 bg-slate-50/95 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl">
                <DialogHeader className="p-8 bg-slate-900 text-white space-y-2 relative">
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-blue-400" />
                        </div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">
                            {card ? "Paramétrage Carte" : "Initialisation Carte"}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-11">
                        Dotation et affectation de moyen de paiement
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="cardNumber"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Identifiant Carte</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="0000 0000..." 
                                                    className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="providerId"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Réseau Pétrolier</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm">
                                                        <SelectValue placeholder="Choisir" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                                    {providers.map(p => (
                                                        <SelectItem key={p.id} value={p.id} className="font-bold py-3">{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="label"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Désignation Interne (Optionnel)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="ex: CARTE POOL MISSION" 
                                                className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all uppercase"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="assignmentType"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Typologie d'Affectation</FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                form.setValue("assignmentId", "");
                                            }}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm">
                                                    <SelectValue placeholder="Définir l'usage" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                                <SelectItem value="vehicle" className="font-bold py-3">Unité Mobile (Véhicule)</SelectItem>
                                                <SelectItem value="employee" className="font-bold py-3">Agent Individuel</SelectItem>
                                                <SelectItem value="generic" className="font-bold py-3">Usage Mutualisé (Pool)</SelectItem>
                                                <SelectItem value="unassigned" className="font-bold py-3">Réserve / Stock</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {assignmentType === 'employee' && (
                                <FormField
                                    control={form.control}
                                    name="assignmentId"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Agent Bénéficiaire</FormLabel>
                                            <SearchableSelect
                                                items={employees.map(e => ({
                                                    value: e.id,
                                                    label: e.name,
                                                    searchTerms: `${e.name} ${e.matricule || ''}`
                                                }))}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Rechercher un agent..."
                                                className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm"
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {assignmentType === 'vehicle' && (
                                <FormField
                                    control={form.control}
                                    name="assignmentId"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Unité Mobile Cible</FormLabel>
                                            <SearchableSelect
                                                items={vehicles.map(v => ({
                                                    value: v.plate,
                                                    label: `${v.makeModel} (${v.plate})`,
                                                    searchTerms: `${v.makeModel} ${v.plate}`
                                                }))}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Sélectionner le véhicule..."
                                                className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm"
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {assignmentType === 'generic' && (
                                <FormField
                                    control={form.control}
                                    name="assignmentId"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Précision de l'usage</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ex: Groupe électrogène B, Maintenance..." className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="pt-4">
                                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-slate-900 shadow-xl shadow-slate-900/20 font-black uppercase tracking-widest text-[11px] hover:bg-black active:scale-95 transition-all text-white">
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        card ? "Appliquer les Modifications" : "Engager la Carte"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function FuelRechargeDialog({
    open,
    onOpenChangeAction,
    cards,
    defaultCardId
}: {
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
    cards: FuelCard[];
    defaultCardId?: string;
}) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const form = useForm<z.infer<typeof rechargeSchema>>({
        resolver: zodResolver(rechargeSchema),
        defaultValues: {
            cardId: defaultCardId || "",
            amount: 0,
            date: new Date().toISOString().split('T')[0]
        },
    });

    async function onSubmit(values: z.infer<typeof rechargeSchema>) {
        setLoading(true);
        try {
            await addFuelTransaction({
                ...values,
                type: 'recharge',
                liters: 0,
                performedBy: user?.name || "Admin"
            });
            toast({ title: "Succès", description: "Rechargement effectué." });
            form.reset();
            onOpenChangeAction(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erreur", description: error.message || "Impossible de recharger." });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-white/10 bg-slate-50/95 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl">
                <DialogHeader className="p-8 bg-slate-900 text-white space-y-2 relative">
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <PlusCircle className="h-4 w-4 text-emerald-400" />
                        </div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">
                            Alimentation de Compte
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-11">
                        Créditer une carte de paiement carburant
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="cardId"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Moyen de paiement cible</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm">
                                                    <SelectValue placeholder="Choisir la carte" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                                {cards.map(c => (
                                                    <SelectItem key={c.id} value={c.id} className="font-bold py-3">
                                                        {c.cardNumber} — {c.currentBalance.toLocaleString()} <span className="text-[10px] opacity-60">FCFA</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Valeur Nominale (F)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    className="h-12 rounded-xl border-slate-200 bg-white font-black text-lg focus:ring-2 focus:ring-emerald-500/20 transition-all text-emerald-600"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Date d'effet</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="date" 
                                                    className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Justificatif / Observations</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="ex: Dotation trimestrielle, Rectification..." 
                                                className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-2">
                                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-emerald-600 shadow-xl shadow-emerald-600/20 font-black uppercase tracking-widest text-[11px] hover:bg-emerald-700 active:scale-95 transition-all text-white">
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        "Validation du Versement"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function FuelExpenseDialog({
    open,
    onOpenChangeAction,
    cards,
    employees,
    vehicles
}: {
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
    cards: FuelCard[];
    employees: Employe[];
    vehicles: Fleet[];
}) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const form = useForm<z.infer<typeof expenseSchema>>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            cardId: "",
            amount: 0,
            date: new Date().toISOString().split('T')[0]
        },
    });

    async function onSubmit(values: z.infer<typeof expenseSchema>) {
        setLoading(true);
        try {
            await addFuelTransaction({
                ...values,
                type: 'expense',
                performedBy: user?.name || "Admin"
            });
            toast({ title: "Succès", description: "Dépense enregistrée." });
            form.reset();
            onOpenChangeAction(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erreur", description: error.message || "Impossible d'enregistrer le plein." });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-white/10 bg-slate-50/95 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl">
                <DialogHeader className="p-8 bg-slate-900 text-white space-y-2 relative">
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <Fuel className="h-4 w-4 text-orange-400" />
                        </div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">
                            Déclaration Consommation
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-11">
                        Saisie des détails de transaction carburant
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Section Source */}
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/70 mb-2">Moyen de Paiement</div>
                                    <FormField
                                        control={form.control}
                                        name="cardId"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Carte Utilisée</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm">
                                                            <SelectValue placeholder="Choisir la carte" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                                        {cards.filter(c => c.currentBalance > 0).map(c => (
                                                            <SelectItem key={c.id} value={c.id} className="font-bold py-3">
                                                                {c.cardNumber} ({c.currentBalance.toLocaleString()} F)
                                                            </SelectItem>
                                                        ))}
                                                        {cards.filter(c => c.currentBalance <= 0).length > 0 && (
                                                            <SelectItem value="none" disabled className="text-[10px] uppercase font-bold text-rose-500 bg-rose-50 py-2">--- Solde insuffisant ---</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Date</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="receiptNumber"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">N° Ticket</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="00123" className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Section Mobilité */}
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/70 mb-2">Affectation Mobilité</div>
                                    <FormField
                                        control={form.control}
                                        name="vehiclePlate"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Unité (Véhicule)</FormLabel>
                                                <SearchableSelect
                                                    items={vehicles.map(v => ({
                                                        value: v.plate,
                                                        label: `${v.makeModel} (${v.plate})`,
                                                        searchTerms: `${v.makeModel} ${v.plate}`
                                                    }))}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    placeholder="Plaque ou Modèle"
                                                    className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm"
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="driverName"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Conducteur / Déposant</FormLabel>
                                                <SearchableSelect
                                                    items={employees.map(e => ({
                                                        value: e.name,
                                                        label: e.name,
                                                        searchTerms: `${e.name} ${e.matricule || ''}`
                                                    }))}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    placeholder="Rechercher..."
                                                    className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm"
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Section Financière & Technique */}
                            <div className="p-5 bg-slate-100/50 rounded-2xl space-y-4 border border-slate-200/50">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 text-center">Données Quantitatives & Financières</div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1 text-center block w-full">Montant (F)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" className="h-14 rounded-xl border-slate-200 bg-white font-black text-xl text-center focus:ring-2 focus:ring-orange-500/20 text-slate-900 shadow-inner" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="liters"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1 text-center block w-full">Volume (Litres)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" className="h-14 rounded-xl border-slate-200 bg-white font-black text-xl text-center focus:ring-2 focus:ring-blue-500/20 text-blue-600 shadow-inner" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="odometer"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1 text-center block w-full">Odomètre (KM)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" className="h-14 rounded-xl border-slate-200 bg-white font-black text-base text-center focus:ring-2 focus:ring-slate-500/20 text-slate-600 shadow-inner" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Section Administrative (Mission) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <FormField
                                    control={form.control}
                                    name="missionNumber"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Référence Mission (Si applicable)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="N° Ordre de Mission" className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm uppercase" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="service"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Entité / Service</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ex: DAFP, DAS..." className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm uppercase" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="pt-4">
                                <Button type="submit" disabled={loading} className="w-full h-14 rounded-xl bg-slate-900 shadow-xl shadow-slate-900/40 font-black uppercase tracking-widest text-xs hover:bg-black active:scale-95 transition-all text-white flex items-center justify-center gap-2">
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                            Confirmer l'inscription comptable
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
