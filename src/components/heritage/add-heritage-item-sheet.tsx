
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HeritageItem, HeritageCategory } from "@/types/heritage";
import { heritageCategoryLabels } from "@/types/heritage";
import { LocationPicker } from "@/components/common/location-picker";

interface AddHeritageItemSheetProps {
    isOpen: boolean;
    onCloseAction: () => void;
    onAddItemAction: (itemData: Omit<HeritageItem, "id">) => Promise<void>;
    category: HeritageCategory;
}

export function AddHeritageItemSheet({ isOpen, onCloseAction, onAddItemAction, category }: AddHeritageItemSheetProps) {
    const [formData, setFormData] = useState<Partial<Omit<HeritageItem, 'id'>>>({
        category: category
    });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value
        }));
    };

    const resetForm = () => {
        setFormData({ category });
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onCloseAction();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            setError("Le nom est obligatoire.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            await onAddItemAction({ ...formData, category } as Omit<HeritageItem, 'id'>);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Échec de l'ajout.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const categoryLabel = heritageCategoryLabels[category];

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent className="sm:max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle>Ajouter : {categoryLabel}</SheetTitle>
                        <SheetDescription>
                            Enregistrez un nouvel élément dans le répertoire {categoryLabel.toLowerCase()}.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="h-[calc(100vh-150px)]">
                        <ScrollArea className="h-full w-full pr-6 py-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom / Intitulé</Label>
                                    <Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ethnicGroup">Groupe Ethnique</Label>
                                    <Input id="ethnicGroup" name="ethnicGroup" value={formData.ethnicGroup || ''} onChange={handleInputChange} placeholder="Ex: Baoulé, Bété..." />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="region">Région / Localité</Label>
                                    <Select 
                                        value={formData.region || ''} 
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, region: v }))}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Sélectionnez une région..." /></SelectTrigger>
                                        <SelectContent>
                                            {IVORIAN_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="village">Village (Optionnel)</Label>
                                    <Input id="village" name="village" value={formData.village || ''} onChange={handleInputChange} />
                                </div>

                                <div className="pt-4 border-t border-slate-100 space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-sm font-bold text-slate-700">Source Géographique</Label>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Sélectionnez l'emplacement précis sur la carte</p>
                                    </div>
                                    
                                    <LocationPicker 
                                        onLocationSelectAction={(lat, lng) => {
                                            setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                        }}
                                        initialLat={formData.latitude}
                                        initialLng={formData.longitude}
                                        className="border shadow-sm rounded-xl bg-slate-50/50"
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="latitude" className="text-[10px] font-black uppercase text-slate-400">Latitude</Label>
                                            <Input 
                                                id="latitude" 
                                                name="latitude" 
                                                type="number" 
                                                step="any" 
                                                value={formData.latitude ?? ''} 
                                                onChange={handleInputChange} 
                                                placeholder="0.0000" 
                                                className="bg-white border-slate-200 focus-visible:ring-blue-500/20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="longitude" className="text-[10px] font-black uppercase text-slate-400">Longitude</Label>
                                            <Input 
                                                id="longitude" 
                                                name="longitude" 
                                                type="number" 
                                                step="any" 
                                                value={formData.longitude ?? ''} 
                                                onChange={handleInputChange} 
                                                placeholder="0.0000" 
                                                className="bg-white border-slate-200 focus-visible:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description Générale</Label>
                                    <Textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} rows={4} required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="historicalContext">Contexte Historique</Label>
                                    <Textarea id="historicalContext" name="historicalContext" value={formData.historicalContext || ''} onChange={handleInputChange} rows={3} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="significance">Signification Culturelle</Label>
                                    <Textarea id="significance" name="significance" value={formData.significance || ''} onChange={handleInputChange} rows={3} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl">URL de l'image (Optionnel)</Label>
                                    <Input id="imageUrl" name="imageUrl" value={formData.imageUrl || ''} onChange={handleInputChange} />
                                </div>

                                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                            </div>
                        </ScrollArea>
                    </div>
                    <SheetFooter className="border-t pt-4">
                        <SheetClose asChild>
                            <Button type="button" variant="outline">Annuler</Button>
                        </SheetClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
