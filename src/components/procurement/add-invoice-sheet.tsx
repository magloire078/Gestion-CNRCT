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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, FileText, Calendar, DollarSign } from "lucide-react";
import { addInvoice, syncContractPayments } from "@/services/procurement-service";
import { toast } from "sonner";
import type { Contract } from "@/lib/data";

const formSchema = z.object({
    reference: z.string().min(2, "La référence de facture est requise"),
    amount: z.coerce.number().min(1, "Le montant doit être supérieur à 0"),
    date: z.string().min(1, "La date est requise"),
    dueDate: z.string().optional(),
    status: z.enum(['En attente', 'Validée', 'Payée', 'Annulée']),
    observations: z.string().optional(),
});

interface AddInvoiceSheetProps {
    contract: Contract;
}

export function AddInvoiceSheet({ contract }: AddInvoiceSheetProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reference: "",
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            dueDate: "",
            status: "En attente",
            observations: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            await addInvoice({
                ...values,
                contractId: contract.id,
                contractRef: contract.reference,
            });
            
            // Sync contract amountPaid
            await syncContractPayments(contract.id);
            
            toast.success("Facture enregistrée");
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
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                    <Plus className="mr-2 h-4 w-4" /> Enregistrer Facture
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[440px]">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" /> Nouvelle Facture
                    </SheetTitle>
                    <SheetDescription>
                        Enregistrer une facture pour le marché : {contract.reference}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-6">
                        <FormField
                            control={form.control}
                            name="reference"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Référence Facture</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: FACT/2026/..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Montant (FCFA)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input type="number" className="pl-9 font-bold" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date Émission</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Échéance</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                            <SelectItem value="En attente">En attente</SelectItem>
                                            <SelectItem value="Validée">Validée</SelectItem>
                                            <SelectItem value="Payée">Payée</SelectItem>
                                            <SelectItem value="Annulée">Annulée</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="observations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observations</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Détails complémentaires..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <SheetFooter className="pt-4">
                            <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl font-bold">
                                {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                Valider la Facture
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
