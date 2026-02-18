
"use client";

import { useState, useEffect } from "react";
import type { Conflict, Employe, ConflictType } from "@/lib/data";
import { conflictTypes, conflictStatuses } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EditConflictSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateConflict: (id: string, data: Partial<Omit<Conflict, 'id'>>) => Promise<void>;
    conflict: Conflict | null;
}

export function EditConflictSheet({ isOpen, onClose, onUpdateConflict, conflict }: EditConflictSheetProps) {
    const { toast } = useToast();

    const [formData, setFormData] = useState<Partial<Conflict>>({});
    const [employees, setEmployees] = useState<Employe[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEmployees() {
            try {
                const employeesData = await getEmployees();
                setEmployees(employeesData.filter(e => e.status === 'Actif'));
            } catch (error) {
                console.error("Failed to fetch employees", error);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger la liste des médiateurs." });
            }
        }

        if (isOpen) {
            setLoading(true);
            if (conflict) {
                setFormData(conflict);
            }
            fetchEmployees().finally(() => setLoading(false));
        }
    }, [conflict, isOpen, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof Conflict, value: string) => {
        const finalValue = value === 'none' ? undefined : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!conflict) return;

        if (!formData.village || !formData.type || !formData.description) {
            setError("Le village, le type et la description sont obligatoires.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await onUpdateConflict(conflict.id, formData);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Une erreur est survenue.");
            console.error("Failed to save conflict", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!conflict) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-lg">
                <form onSubmit={handleSave}>
                    <SheetHeader>
                        <SheetTitle>Modifier le Conflit</SheetTitle>
                        <SheetDescription>Mettez à jour les détails du conflit à <span className="font-semibold">{conflict.village}</span>.</SheetDescription>
                    </SheetHeader>
                    <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                        {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
                            <>
                                <div className="space-y-2">
                                    <Label>Village / Localité</Label>
                                    <Input value={formData.village || ''} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type de Conflit</Label>
                                    <Select value={formData.type || ''} onValueChange={(v: ConflictType) => handleSelectChange('type', v)}>
                                        <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {conflictTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} rows={5} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Statut</Label>
                                    <Select value={formData.status || ''} onValueChange={(v: Conflict['status']) => handleSelectChange('status', v)}>
                                        <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {conflictStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mediatorName">Médiateur / Gestionnaire</Label>
                                    <Select value={formData.mediatorName || 'none'} onValueChange={(v) => handleSelectChange('mediatorName', v)}>
                                        <SelectTrigger id="mediatorName"><SelectValue placeholder="Non assigné" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Non assigné</SelectItem>
                                            {employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
                    </div>
                    <SheetFooter>
                        <SheetClose asChild><Button type="button" variant="outline">Annuler</Button></SheetClose>
                        <Button type="submit" disabled={isSaving || loading}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Enregistrer
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
