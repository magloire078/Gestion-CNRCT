"use client";

import { useState } from "react";
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { logSupplyTransaction } from "@/services/supply-service";
import type { Supply } from "@/lib/data";
import { Package, Truck, Hash, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { subscribeToProviders } from "@/services/procurement-service";
import type { Provider } from "@/lib/data";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

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
    const [providers, setProviders] = useState<Provider[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        return subscribeToProviders(
            (data) => setProviders(data),
            (error) => console.error("Error fetching providers:", error)
        );
    }, [isOpen]);

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
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white/95 backdrop-blur-xl">
                <div className="bg-emerald-600 px-6 py-8 text-white relative overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                                <Truck className="h-5 w-5 text-white" />
                            </div>
                            Entrée de Stock
                        </DialogTitle>
                        <DialogDescription className="text-emerald-100 text-sm font-medium mt-2">
                            Réapprovisionnement pour <span className="text-white font-bold">{supply.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                    <Truck className="h-3.5 w-3.5 text-slate-400" /> Source / Fournisseur
                                </Label>
                                <Select onValueChange={setSourceName} value={sourceName}>
                                    <SelectTrigger className="rounded-2xl border-slate-200 focus:ring-emerald-600 h-12 bg-slate-50/50">
                                        <SelectValue placeholder="Sélectionnez un fournisseur..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-200">
                                        <SelectItem value="Stock Interne">Stock Interne / Direct</SelectItem>
                                        <SelectItem value="Don / Partenariat">Don / Partenariat</SelectItem>
                                        {providers.map((p) => (
                                            <SelectItem key={p.id} value={p.name}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                        <Hash className="h-3.5 w-3.5 text-slate-400" /> Quantité Reçue
                                    </Label>
                                    <Input 
                                        type="number" 
                                        min={1} 
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                                        className="rounded-2xl border-slate-200 focus:ring-emerald-600 h-12 bg-slate-50/50" 
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold px-1 uppercase tracking-tighter">
                                        Stock actuel: <span className="text-slate-900 font-black">{supply.quantity}</span>
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" /> Date
                                    </Label>
                                    <Input 
                                        type="date" 
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="rounded-2xl border-slate-200 focus:ring-emerald-600 h-12 bg-slate-50/50" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={onCloseAction} disabled={submitting} className="flex-1 rounded-2xl h-12 font-bold text-slate-500">
                                Annuler
                            </Button>
                            <Button type="submit" disabled={submitting} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
                                {submitting ? "Traitement..." : "Enregistrer l'Entrée"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
