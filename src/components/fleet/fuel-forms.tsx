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
import {
    addFuelProvider,
    addFuelCard,
    addFuelTransaction
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
    notes: z.string().optional(),
});

// --- COMPONENTS ---

export function FuelProviderDialog({
    open,
    onOpenChangeAction
}: {
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
}) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm<z.infer<typeof providerSchema>>({
        resolver: zodResolver(providerSchema),
        defaultValues: { name: "" },
    });

    async function onSubmit(values: z.infer<typeof providerSchema>) {
        setLoading(true);
        try {
            await addFuelProvider({
                ...values,
                status: 'active'
            });
            toast({ title: "Succès", description: "Prestataire ajouté avec succès." });
            form.reset();
            onOpenChangeAction(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter le prestataire." });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nouveau Prestataire</DialogTitle>
                    <DialogDescription>Ajouter une compagnie pétrolière ou un fournisseur de cartes.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom du Prestataire</FormLabel>
                                    <FormControl><Input placeholder="ex: TotalEnergies, Shell..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="contactPerson"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact</FormLabel>
                                        <FormControl><Input placeholder="Nom du contact" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Téléphone</FormLabel>
                                        <FormControl><Input placeholder="xx xx xx xx" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="contractNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Numéro de Contrat</FormLabel>
                                    <FormControl><Input placeholder="CNRCT-2024-..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function FuelCardDialog({
    open,
    onOpenChangeAction,
    providers,
    employees,
    vehicles
}: {
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
    providers: FuelProvider[];
    employees: Employe[];
    vehicles: Fleet[];
}) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm<z.infer<typeof cardSchema>>({
        resolver: zodResolver(cardSchema),
        defaultValues: {
            cardNumber: "",
            assignmentType: "unassigned",
            providerId: ""
        },
    });

    async function onSubmit(values: z.infer<typeof cardSchema>) {
        setLoading(true);
        try {
            // If the assignmentType is generic or unassigned, we don't need assignmentId
            const submissionValues = {
                ...values,
                assignmentId: (values.assignmentType === 'unassigned' || values.assignmentType === 'generic')
                    ? ""
                    : values.assignmentId,
                currentBalance: 0,
                status: 'active' as const
            };

            await addFuelCard(submissionValues);
            toast({ title: "Succès", description: "Carte ajoutée avec succès." });
            form.reset();
            onOpenChangeAction(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter la carte." });
        } finally {
            setLoading(false);
        }
    }

    const assignmentType = form.watch("assignmentType");

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nouvelle Carte Carburant</DialogTitle>
                    <DialogDescription>Enregistrer une nouvelle carte et définir son affectation.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="cardNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Numéro de Carte</FormLabel>
                                    <FormControl><Input placeholder="0000 0000 0000 0000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="providerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prestataire</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner un prestataire" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {providers.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="assignmentType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type d'affectation</FormLabel>
                                    <Select
                                        onValueChange={(val) => {
                                            field.onChange(val);
                                            form.setValue("assignmentId", ""); // Reset ID when type changes
                                        }}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choisir le type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="vehicle">Véhicule spécifique</SelectItem>
                                            <SelectItem value="employee">Employé spécifique</SelectItem>
                                            <SelectItem value="generic">Usage Général (Pool / Multiples)</SelectItem>
                                            <SelectItem value="unassigned">Non assignée (Stock / Réserve)</SelectItem>
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
                                    <FormItem>
                                        <FormLabel>Employé</FormLabel>
                                        <SearchableSelect
                                            items={employees.map(e => ({
                                                value: e.id,
                                                label: e.name,
                                                searchTerms: `${e.name} ${e.matricule || ''} ${e.lastName || ''} ${e.firstName || ''}`
                                            }))}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Sélectionner l'employé"
                                            searchPlaceholder="Rechercher par nom ou matricule..."
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
                                    <FormItem>
                                        <FormLabel>Véhicule</FormLabel>
                                        <SearchableSelect
                                            items={vehicles.map(v => ({
                                                value: v.plate,
                                                label: `${v.makeModel} (${v.plate})`,
                                                searchTerms: `${v.makeModel} ${v.plate}`
                                            }))}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Sélectionner le véhicule"
                                            searchPlaceholder="Rechercher par plaque ou modèle..."
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
                                    <FormItem>
                                        <FormLabel>Description de l'usage</FormLabel>
                                        <FormControl><Input placeholder="ex: Groupe électrogène, Entretien jardin..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Créer la Carte
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
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
                performedBy: "Admin" // TODO: Get from Auth
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Recharger une Carte</DialogTitle>
                    <DialogDescription>Ajouter du crédit sur une carte carburant.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="cardId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Carte à recharger</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner la carte" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {cards.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.cardNumber} ({c.currentBalance.toLocaleString()} F)</SelectItem>
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
                                    <FormItem>
                                        <FormLabel>Montant (FCFA)</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes / Référence</FormLabel>
                                    <FormControl><Input placeholder="ex: Dotation Mars 2024" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmer le Rechargement
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
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
                performedBy: "Admin" // TODO: Get from Auth
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Enregistrer une Consommation</DialogTitle>
                    <DialogDescription>Saisir les détails d'un plein effectué avec une carte.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="cardId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Carte Utilisée</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner la carte" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {cards.filter(c => c.currentBalance > 0).map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.cardNumber} (Solde: {c.currentBalance.toLocaleString()} F)</SelectItem>
                                            ))}
                                            {cards.filter(c => c.currentBalance <= 0).length > 0 && (
                                                <SelectItem value="none" disabled>--- Solde épuisé ---</SelectItem>
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
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Montant du plein (F)</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="liters"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Litrage (L)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="vehiclePlate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Véhicule</FormLabel>
                                        <SearchableSelect
                                            items={vehicles.map(v => ({
                                                value: v.plate,
                                                label: `${v.makeModel} (${v.plate})`,
                                                searchTerms: `${v.makeModel} ${v.plate}`
                                            }))}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Sélectionner"
                                            searchPlaceholder="Rechercher..."
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="driverName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Conducteur</FormLabel>
                                        <SearchableSelect
                                            items={employees.map(e => ({
                                                value: e.name,
                                                label: e.name,
                                                searchTerms: `${e.name} ${e.matricule || ''}`
                                            }))}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Sélectionner"
                                            searchPlaceholder="Rechercher..."
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="odometer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kilométrage</FormLabel>
                                        <FormControl><Input type="number" placeholder="Km au compteur" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="receiptNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>N° Ticket / Facture</FormLabel>
                                        <FormControl><Input placeholder="Référence reçu" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Valider la dépense
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
