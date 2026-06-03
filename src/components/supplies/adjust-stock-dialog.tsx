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
import { adjustSupplyStock } from "@/services/supply-service";
import type { Supply } from "@/lib/data";
import { Scale, Hash, MessageSquare, AlertTriangle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AdjustStockDialogProps {
    isOpen: boolean;
    onCloseAction: () => void;
    supply: Supply;
}

export function AdjustStockDialog({ isOpen, onCloseAction, supply }: AdjustStockDialogProps) {
    const [submitting, setSubmitting] = useState(false);
    const [physicalCount, setPhysicalCount] = useState<number>(supply.quantity);
    const [reason, setReason] = useState<string>("Inventaire périodique");
    const { toast } = useToast();
    const { user } = useAuth();

    const diff = physicalCount - supply.quantity;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (physicalCount < 0) {
            toast({
                variant: "destructive",
                title: "Valeur invalide",
                description: "Le stock physique ne peut pas être négatif."
            });
            return;
        }

        if (diff === 0) {
            onCloseAction();
            return;
        }

        setSubmitting(true);
        try {
            await adjustSupplyStock(
                supply.id,
                physicalCount,
                reason,
                user?.name || user?.email || 'Utilisateur inconnu'
            );

            toast({
                title: "Équilibrage réussi",
                description: `Le stock de "${supply.name}" a été mis à jour à ${physicalCount} unités.`
            });
            onCloseAction();
        } catch (error) {
            console.error("Failed to adjust stock:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de régulariser le stock."
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onCloseAction}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-xl bg-white/95 backdrop-blur-xl">
                <div className="bg-slate-900 px-6 py-4 text-white relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-slate-400/10 rounded-full blur-2xl" />
                    
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                                <Scale className="h-5 w-5 text-amber-400" />
                            </div>
                            Régulariser le Stock
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm font-medium mt-2">
                            Ajustement de l'inventaire pour <span className="text-white font-bold">{supply.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-4">
                    {/* Stock Comparison Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center relative group transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Stock Logique</p>
                            <p className="text-4xl font-black text-slate-400">{supply.quantity}</p>
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 border border-slate-100 shadow-sm z-10">
                                <ArrowRight className="h-3 w-3 text-slate-300" />
                            </div>
                        </div>
                        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center group transition-all hover:bg-white hover:shadow-lg hover:shadow-emerald-100/50">
                            <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-2">Réel Constaté</p>
                            <p className="text-4xl font-black text-emerald-600">{physicalCount}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                    <Hash className="h-3.5 w-3.5 text-slate-400" /> Quantité Physique Comptée
                                </Label>
                                <div className="relative group">
                                    <Input 
                                        type="number" 
                                        min={0} 
                                        value={physicalCount}
                                        onChange={(e) => setPhysicalCount(parseInt(e.target.value) || 0)}
                                        className="rounded-2xl border-slate-200 focus:ring-amber-500 h-14 text-xl font-black pl-5 bg-slate-50/50 focus:bg-white transition-all shadow-inner focus:shadow-none" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" /> Motif de l'ajustement
                                </Label>
                                <Input 
                                    placeholder="Ex: Inventaire périodique, casse..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="rounded-2xl border-slate-200 focus:ring-amber-500 h-12 text-sm font-medium pl-5 bg-slate-50/50 focus:bg-white transition-all" 
                                />
                            </div>

                            {diff !== 0 && (
                                <div className={`p-4 rounded-2xl flex items-center gap-4 border animate-in fade-in slide-in-from-top-2 duration-300 ${
                                    diff > 0 
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                                    : "bg-amber-50 border-amber-100 text-amber-800"
                                }`}>
                                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                                        diff > 0 ? "bg-emerald-100" : "bg-amber-100"
                                    }`}>
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <p className="text-xs font-bold leading-relaxed">
                                        {diff > 0 
                                            ? `Une entrée de stock de ${diff} unités sera enregistrée.` 
                                            : `Une sortie de stock de ${Math.abs(diff)} unités sera enregistrée.`}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={onCloseAction} 
                                disabled={submitting} 
                                className="flex-1 rounded-2xl h-12 font-bold text-slate-500 hover:bg-slate-50"
                            >
                                Annuler
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={submitting || diff === 0} 
                                className="flex-[2] bg-slate-900 hover:bg-black text-white rounded-2xl h-12 font-black shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                            >
                                {submitting ? "Mise à jour..." : "Confirmer l'Équilibre"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
