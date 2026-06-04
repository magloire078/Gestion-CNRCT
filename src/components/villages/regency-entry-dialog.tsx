"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
    ResponsiveDialog as Dialog,
    ResponsiveDialogContent as DialogContent,
    ResponsiveDialogDescription as DialogDescription,
    ResponsiveDialogFooter as DialogFooter,
    ResponsiveDialogHeader as DialogHeader,
    ResponsiveDialogTitle as DialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { addRegencyHistory, updateRegencyHistory } from "@/services/regency-service";
import type { RegencyHistory } from "@/types/regency";
import { useToast } from "@/hooks/use-toast";

const regencyFormSchema = z.object({
    chiefName: z.string().min(1, "Le nom du chef est requis."),
    chiefTitle: z.string().optional(),
    startDate: z.string().min(1, "La date de début est requise."),
    endDate: z.string().optional(),
    isCurrent: z.boolean().default(false),
    achievements: z.string().optional(),
    notes: z.string().optional(),
});

type RegencyFormValues = z.infer<typeof regencyFormSchema>;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    villageId: string;
    villageName: string;
    entry?: RegencyHistory; // si fourni : édition, sinon création
};

export function RegencyEntryDialog({ open, onOpenChange, villageId, villageName, entry }: Props) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEdit = !!entry;

    const form = useForm<RegencyFormValues>({
        resolver: zodResolver(regencyFormSchema),
        defaultValues: {
            chiefName: "",
            chiefTitle: "",
            startDate: "",
            endDate: "",
            isCurrent: false,
            achievements: "",
            notes: "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                chiefName: entry?.chiefName || "",
                chiefTitle: entry?.chiefTitle || "",
                startDate: entry?.startDate || "",
                endDate: entry?.endDate || "",
                isCurrent: entry?.isCurrent || false,
                achievements: entry?.achievements || "",
                notes: entry?.notes || "",
            });
        }
    }, [open, entry, form]);

    async function onSubmit(values: RegencyFormValues) {
        setIsSubmitting(true);
        try {
            const payload: Omit<RegencyHistory, "id"> = {
                villageId,
                villageName,
                chiefName: values.chiefName,
                chiefTitle: values.chiefTitle || undefined,
                startDate: values.startDate,
                endDate: values.endDate || undefined,
                isCurrent: values.isCurrent,
                achievements: values.achievements || undefined,
                notes: values.notes || undefined,
            };
            if (isEdit && entry) {
                await updateRegencyHistory(entry.id, payload);
                toast({ title: "Entrée mise à jour", description: `${values.chiefName} a été modifié.` });
            } else {
                await addRegencyHistory(payload);
                toast({ title: "Entrée ajoutée", description: `${values.chiefName} a rejoint la succession.` });
            }
            onOpenChange(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Erreur inconnue";
            toast({ variant: "destructive", title: "Erreur", description: message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Modifier l'entrée de régence" : "Ajouter une entrée de régence"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Met à jour les informations sur ce chef et sa période de régence."
                            : `Renseigne un chef ayant régné sur ${villageName}, avec sa période et ses réalisations.`}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                        <FormField
                            control={form.control}
                            name="chiefName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom du chef</FormLabel>
                                    <FormControl><Input placeholder="Nanan Yao Kouassi" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="chiefTitle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Titre (optionnel)</FormLabel>
                                    <FormControl><Input placeholder="Roi, Chef de village..." {...field} value={field.value || ""} /></FormControl>
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date de début</FormLabel>
                                        <FormControl><Input placeholder="YYYY ou YYYY-MM-DD" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date de fin (optionnel)</FormLabel>
                                        <FormControl><Input placeholder="YYYY ou vide si en fonction" {...field} value={field.value || ""} /></FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="isCurrent"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormLabel className="!mt-0">Chef en fonction actuellement</FormLabel>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="achievements"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Réalisations (optionnel)</FormLabel>
                                    <FormControl><Textarea placeholder="Médiations, infrastructures, etc." rows={3} {...field} value={field.value || ""} /></FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (optionnel)</FormLabel>
                                    <FormControl><Textarea placeholder="Sources, anecdotes..." rows={2} {...field} value={field.value || ""} /></FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isEdit ? "Enregistrer" : "Ajouter"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
