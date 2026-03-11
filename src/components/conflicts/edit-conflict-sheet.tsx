
"use client";

import { useState, useEffect } from "react";
import type { Conflict, Employe, ConflictType } from "@/lib/data";
import { conflictTypes, conflictStatuses } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
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
import { LocationPicker } from "@/components/common/location-picker";

interface EditConflictSheetProps {
    isOpen: boolean;
    onCloseAction: () => void;
    onUpdateConflictAction: (id: string, data: Partial<Omit<Conflict, 'id'>>) => Promise<void>;
    conflict: Conflict | null;
}

export function EditConflictSheet({ isOpen, onCloseAction, onUpdateConflictAction, conflict }: EditConflictSheetProps) {
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
            await onUpdateConflictAction(conflict.id, formData);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Une erreur est survenue.");
            console.error("Failed to save conflict", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!conflict) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onCloseAction}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSave}>
                    <DialogHeader>
                        <DialogTitle>Modifier le Conflit</DialogTitle>
                        <DialogDescription>Mettez à jour les détails du conflit à <span className="font-semibold text-primary">{conflict.village}</span>.</DialogDescription>
                    </DialogHeader>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Chargement des détails...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                            {/* Colonne Gauche */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Village / Localité</Label>
                                    <Input value={formData.village || ''} disabled className="bg-slate-50 font-semibold" />
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
                                    <Label htmlFor="status">Statut actuel</Label>
                                    <Select value={formData.status || ''} onValueChange={(v: Conflict['status']) => handleSelectChange('status', v)}>
                                        <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {conflictStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Colonne Droite */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="mediatorName">Médiateur / Responsable assigné</Label>
                                    <Select value={formData.mediatorName || 'none'} onValueChange={(v) => handleSelectChange('mediatorName', v)}>
                                        <SelectTrigger id="mediatorName"><SelectValue placeholder="Non assigné" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Non assigné</SelectItem>
                                            {employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description des faits</Label>
                                    <Textarea 
                                        id="description" 
                                        name="description" 
                                        value={formData.description || ''} 
                                        onChange={handleInputChange} 
                                        rows={4} 
                                        className="resize-none"
                                    />
                                </div>
                            </div>

                            {/* Section Localisation - Pleine largeur */}
                            <div className="md:col-span-2 pt-4 border-t border-primary/5 space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-base font-bold">Localisation Géographique</Label>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Précision requise pour analyse IA et SIG</div>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                    <div className="lg:col-span-2">
                                        <LocationPicker 
                                            onLocationSelectAction={(lat, lng) => {
                                                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                            }}
                                            initialLat={formData.latitude}
                                            initialLng={formData.longitude}
                                            className="border shadow-sm rounded-2xl bg-slate-50/50"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="latitude" className="text-xs font-bold uppercase text-muted-foreground">Latitude</Label>
                                                <Input 
                                                    id="latitude" 
                                                    type="number" 
                                                    step="any" 
                                                    value={formData.latitude || ''} 
                                                    onChange={handleInputChange}
                                                    name="latitude"
                                                    placeholder="0.000000"
                                                    className="bg-white border-primary/10 focus-visible:ring-primary/20"
                                                />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="longitude" className="text-xs font-bold uppercase text-muted-foreground">Longitude</Label>
                                                <Input 
                                                    id="longitude" 
                                                    type="number" 
                                                    step="any" 
                                                    value={formData.longitude || ''} 
                                                    onChange={handleInputChange}
                                                    name="longitude"
                                                    placeholder="0.000000"
                                                    className="bg-white border-primary/10 focus-visible:ring-primary/20"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                            Déplacez le marqueur sur la carte pour affiner la position précise du conflit.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 mb-4 rounded-lg bg-destructive/5 border border-destructive/10 text-center text-sm text-destructive font-medium">
                            {error}
                        </div>
                    )}

                    <DialogFooter className="gap-2 pt-2 border-t border-primary/5">
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">Annuler</Button>
                        </DialogClose>
                        <Button type="submit" className="min-w-[150px]" disabled={isSaving || loading}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer les modifications
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
