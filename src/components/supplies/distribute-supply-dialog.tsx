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
            <DialogContent className="sm:max-w-[450px] rounded-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black">
                        <Package className="h-5 w-5 text-slate-400" />
                        Sortie de Stock : {supply.name}
                    </DialogTitle>
                    <DialogDescription>
                        Enregistrez la distribution de cet article à un membre du personnel.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <User className="h-3 w-3" /> Bénéficiaire
                            </Label>
                            <SearchableSelect
                                items={employeeOptions}
                                value={recipientId}
                                onValueChange={handleRecipientChange}
                                placeholder="Sélectionner un employé..."
                                searchPlaceholder="Rechercher par nom ou matricule..."
                                disabled={loading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <Hash className="h-3 w-3" /> Quantité
                                </Label>
                                <Input 
                                    type="number" 
                                    min={1} 
                                    max={supply.quantity}
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    className="rounded-lg border-slate-200 focus:ring-slate-900" 
                                />
                                <p className="text-[10px] text-slate-400 font-medium">
                                    Stock disponible: <span className="font-bold text-slate-900">{supply.quantity}</span>
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
                                    className="rounded-lg border-slate-200 focus:ring-slate-900" 
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onCloseAction} disabled={submitting} className="rounded-lg">
                            Annuler
                        </Button>
                        <Button type="submit" disabled={submitting || supply.quantity <= 0} className="bg-slate-900 rounded-lg px-8">
                            {submitting ? "Traitement..." : "Valider la Sortie"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
