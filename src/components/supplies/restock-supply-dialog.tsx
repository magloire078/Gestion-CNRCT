"use client";

import { useState } from "react";
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { logSupplyTransaction } from "@/services/supply-service";
import type { Supply } from "@/lib/data";
import { Package, Truck, Hash, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface RestockSupplyDialogProps {
    isOpen: boolean;
    onCloseAction: () => void;
    supply: Supply;
}

export function RestockSupplyDialog({ isOpen, onCloseAction, supply }: RestockSupplyDialogProps) {
    const [submitting, setSubmitting] = useState(false);
    const [sourceName, setSourceName] = useState<string>("");
    const [quantity, setQuantity] = useState<number>(1);
    const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
    const { toast } = useToast();
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (quantity <= 0) {
            toast({
                variant: "destructive",
                title: "Quantité invalide",
                description: "La quantité doit être supérieure à 0."
            });
            return;
        }

        setSubmitting(true);
        try {
            await logSupplyTransaction({
                supplyId: supply.id,
                supplyName: supply.name,
                recipientName: sourceName || 'Réapprovisionnement',
                quantity: quantity,
                date: date,
                type: 'restock',
                performedBy: user?.name || user?.email || 'Utilisateur inconnu'
            });

            toast({
                title: "Réapprovisionnement enregistré",
                description: `${quantity} ${supply.name} ajouté(s) au stock.`
            });
            onCloseAction();
        } catch (error) {
            console.error("Failed to restock supply:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible d'enregistrer le réapprovisionnement."
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onCloseAction}>
            <DialogContent className="sm:max-w-[450px] rounded-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black">
                        <Package className="h-5 w-5 text-slate-400" />
                        Entrée de Stock : {supply.name}
                    </DialogTitle>
                    <DialogDescription>
                        Enregistrez l'arrivée de nouvelles unités pour cet article.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <Truck className="h-3 w-3" /> Source / Fournisseur
                            </Label>
                            <Input 
                                value={sourceName}
                                onChange={(e) => setSourceName(e.target.value)}
                                placeholder="Nom du fournisseur ou origine..."
                                className="rounded-lg border-slate-200 focus:ring-emerald-600" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <Hash className="h-3 w-3" /> Quantité Reçue
                                </Label>
                                <Input 
                                    type="number" 
                                    min={1} 
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    className="rounded-lg border-slate-200 focus:ring-emerald-600" 
                                />
                                <p className="text-[10px] text-slate-400 font-medium">
                                    Stock actuel: <span className="font-bold text-slate-900">{supply.quantity}</span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <Calendar className="h-3 w-3" /> Date
                                </Label>
                                <Input 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="rounded-lg border-slate-200 focus:ring-emerald-600" 
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onCloseAction} disabled={submitting} className="rounded-lg">
                            Annuler
                        </Button>
                        <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-8">
                            {submitting ? "Traitement..." : "Enregistrer l'Entrée"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
