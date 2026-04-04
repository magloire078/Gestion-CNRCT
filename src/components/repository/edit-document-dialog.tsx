"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { updateDocument } from "@/services/repository-service";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@/lib/data";
import { Loader2, Settings2 } from "lucide-react";

interface EditDocumentDialogProps {
    document: Document | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const CATEGORIES: Document['category'][] = [
    'Actes Royaux', 'Procès-Verbaux', 'Rapports d\'Activité', 'Courriers', 'Communication', 'Autres'
];

const REGIONS = [
    "Abidjan", "Agnéby-Tiassa", "Bafing", "Bagoué", "Bélier", "Béré", "Bounkani", 
    "Cavally", "Folon", "Gbeke", "Gboklè", "Goh", "Gontougo", "Grands-Ponts", 
    "Guémon", "Hambol", "Haut-Sassandra", "Iffou", "Indénié-Djuablin", "Kabadougou", 
    "Kavadougou", "Lôh-Djiboua", "Marahoué", "Mé", "N'Zi", "Nawa", "Poro", 
    "Région des Ponts", "San-Pédro", "Sud-Comoé", "Tchologo", "Tonkpi", "Worodougou", "Zanzan"
];

export function EditDocumentDialog({ document, open, onOpenChange }: EditDocumentDialogProps) {
    const { toast } = useToast();
    const [category, setCategory] = useState<Document['category']>('Autres');
    const [region, setRegion] = useState<string>("National");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (document) {
            setCategory(document.category || 'Autres');
            setRegion(document.region || 'National');
        }
    }, [document]);

    const handleUpdate = async () => {
        if (!document) return;

        setIsUpdating(true);
        try {
            await updateDocument(document.id, {
                category,
                region: region === 'National' ? undefined : region
            });
            toast({
                title: "Document mis à jour",
                description: "Les informations du document ont été enregistrées avec succès.",
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update document", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de mettre à jour le document.",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (!document) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <Settings2 className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                            <DialogTitle>Modifier le Document</DialogTitle>
                            <DialogDescription className="truncate max-w-[250px]">
                                {document.fileName}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Catégorie</Label>
                        <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                            <SelectTrigger className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(cat => <SelectItem key={cat} value={cat!}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Région associée</Label>
                        <Select value={region} onValueChange={setRegion}>
                            <SelectTrigger className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="National">National (Global)</SelectItem>
                                {REGIONS.map(reg => <SelectItem key={reg} value={reg}>{reg}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating} className="px-6">
                        Annuler
                    </Button>
                    <Button onClick={handleUpdate} disabled={isUpdating} className="px-8 bg-blue-600 hover:bg-blue-700">
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Enregistrer les modifications
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
