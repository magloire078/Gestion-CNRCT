"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { getEmployeeDirectory } from "@/services/employee-service";
import { logSupplyTransaction } from "@/services/supply-service";
import type { Supply, Employe } from "@/lib/data";
import { Package, User, Hash, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface DistributeSupplyDialogProps {
    isOpen: boolean;
    onCloseAction: () => void;
    supply: Supply;
}

export function DistributeSupplyDialog({ isOpen, onCloseAction, supply }: DistributeSupplyDialogProps) {
    const [employees, setEmployees] = useState<Employe[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [recipientId, setRecipientId] = useState<string>("");
    const [recipientName, setRecipientName] = useState<string>("");
    const [quantity, setQuantity] = useState<number>(1);
    const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            const fetchEmployees = async () => {
                setLoading(true);
                try {
                    const data = await getEmployeeDirectory();
                    setEmployees(data);
                } catch (error) {
                    console.error("Failed to fetch employees:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchEmployees();
        }
    }, [isOpen]);

    const employeeOptions: SearchableSelectItem[] = useMemo(() => 
        employees.map(emp => ({
            value: emp.id,
            label: `${emp.lastName} ${emp.firstName} (${emp.matricule || 'Sans matricule'})`,
            searchTerms: `${emp.lastName} ${emp.firstName} ${emp.matricule}`.toLowerCase()
        })),
    [employees]);

    const handleRecipientChange = useCallback((id: string) => {
        setRecipientId(id);
        const emp = employees.find(e => e.id === id);
        if (emp) {
            setRecipientName(`${emp.lastName} ${emp.firstName}`);
        }
    }, [employees]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!recipientName) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Veuillez sélectionner un bénéficiaire."
            });
            return;
        }

        if (quantity <= 0 || quantity > supply.quantity) {
            toast({
                variant: "destructive",
                title: "Quantité invalide",
                description: `La quantité doit être entre 1 et ${supply.quantity}.`
            });
            return;
        }

        setSubmitting(true);
        try {
            await logSupplyTransaction({
                supplyId: supply.id,
                supplyName: supply.name,
                recipientId: recipientId || undefined,
                recipientName: recipientName,
                quantity: quantity,
                date: date,
                type: 'distribution',
                performedBy: user?.name || user?.email || 'Utilisateur inconnu'
            });

            toast({
                title: "Distribution enregistrée",
                description: `${quantity} ${supply.name} donné(s) à ${recipientName}.`
            });
            onCloseAction();
        } catch (error) {
            console.error("Failed to distribute supply:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible d'enregistrer la distribution."
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onCloseAction}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white/95 backdrop-blur-xl">
                <div className="bg-slate-900 px-6 py-8 text-white relative overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                    
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                            <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            Sortie de Stock
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm font-medium mt-2">
                            Distribution de <span className="text-white font-bold">{supply.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                    <User className="h-3.5 w-3.5 text-slate-400" /> Bénéficiaire
                                </Label>
                                <SearchableSelect
                                    items={employeeOptions}
                                    value={recipientId}
                                    onValueChange={handleRecipientChange}
                                    placeholder="Sélectionner un employé..."
                                    searchPlaceholder="Rechercher par nom ou matricule..."
                                    disabled={loading}
                                    className="rounded-2xl h-12 bg-slate-50/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                        <Hash className="h-3.5 w-3.5 text-slate-400" /> Quantité
                                    </Label>
                                    <Input 
                                        type="number" 
                                        min={1} 
                                        max={supply.quantity}
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                                        className="rounded-2xl border-slate-200 focus:ring-slate-900 h-12 bg-slate-50/50" 
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold px-1 uppercase tracking-tighter">
                                        Stock dispo: <span className="text-slate-900 font-black">{supply.quantity}</span>
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
                                        className="rounded-2xl border-slate-200 focus:ring-slate-900 h-12 bg-slate-50/50" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={onCloseAction} disabled={submitting} className="flex-1 rounded-2xl h-12 font-bold text-slate-500">
                                Annuler
                            </Button>
                            <Button type="submit" disabled={submitting || supply.quantity <= 0} className="flex-[2] bg-slate-900 hover:bg-black text-white rounded-2xl h-12 font-black shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
                                {submitting ? "Traitement..." : "Valider la Sortie"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
