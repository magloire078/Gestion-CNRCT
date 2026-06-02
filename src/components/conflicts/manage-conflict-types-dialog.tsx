"use client";

import { useState } from "react";
import { Tags, Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { conflictTypes, type ConflictTypeData } from "@/types/common";
import { addConflictType, deleteConflictType } from "@/services/conflict-type-service";

interface ManageConflictTypesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dynamicTypes: ConflictTypeData[];
}

export function ManageConflictTypesDialog({ open, onOpenChange, dynamicTypes }: ManageConflictTypesDialogProps) {
    const { toast } = useToast();
    const [newTypeName, setNewTypeName] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<ConflictTypeData | null>(null);

    const handleAdd = async () => {
        const name = newTypeName.trim();
        if (!name) return;
        setIsAdding(true);
        try {
            await addConflictType(name);
            toast({ title: "Type ajouté", description: `« ${name} » a été ajouté à la nomenclature.` });
            setNewTypeName("");
        } catch {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter ce type." });
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async () => {
        if (!typeToDelete) return;
        try {
            await deleteConflictType(typeToDelete.id);
            toast({ title: "Type supprimé", description: `« ${typeToDelete.name} » a été retiré.` });
            setTypeToDelete(null);
        } catch {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer ce type." });
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="rounded-2xl max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Tags className="h-5 w-5 text-primary" /> Nomenclature des conflits
                        </DialogTitle>
                        <DialogDescription>
                            Étendez la nomenclature standard avec des types personnalisés propres au contexte de votre région.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nouveau type de conflit..."
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                                className="rounded-xl"
                            />
                            <Button onClick={handleAdd} disabled={isAdding || !newTypeName.trim()} className="rounded-xl font-bold">
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Types standards (non modifiables)</p>
                            <div className="flex flex-wrap gap-2">
                                {conflictTypes.map(t => (
                                    <Badge key={t} variant="outline" className="rounded-full font-bold">{t}</Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Types personnalisés ({dynamicTypes.length})
                            </p>
                            {dynamicTypes.length === 0 ? (
                                <p className="text-xs italic text-slate-400 text-center py-4">Aucun type personnalisé. Ajoutez-en un ci-dessus.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {dynamicTypes.map(t => (
                                        <div key={t.id} className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary font-bold text-xs">
                                            {t.name}
                                            <button
                                                onClick={() => setTypeToDelete(t)}
                                                className="h-5 w-5 inline-flex items-center justify-center rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors"
                                                aria-label={`Supprimer ${t.name}`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Fermer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!typeToDelete} onOpenChange={(o) => !o && setTypeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce type ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Le type « <span className="font-bold">{typeToDelete?.name}</span> » sera retiré de la nomenclature. Les dossiers existants conservent cette valeur mais ne pourront plus la sélectionner.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
