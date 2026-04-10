"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { getSupplies } from "@/services/supply-service";
import { createSupplyRequest } from "@/services/supply-request-service";
import type { Supply, SupplyRequestItem } from "@/types/supply";
import { Package, ShoppingCart, Trash2, Plus, Minus, Send, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SupplyRequestDialogProps {
    onSuccess?: () => void;
}

export function SupplyRequestDialog({ onSuccess }: SupplyRequestDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [selectedSupplyId, setSelectedSupplyId] = useState<string>("");
    const [items, setItems] = useState<SupplyRequestItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            const fetchSupplies = async () => {
                try {
                    const data = await getSupplies();
                    setSupplies(data.filter(s => s.quantity > 0)); // Only allow requesting what's in stock
                } catch (error) {
                    console.error("Failed to fetch supplies:", error);
                }
            };
            fetchSupplies();
        } else {
            // Reset on close
            setItems([]);
            setSelectedSupplyId("");
        }
    }, [isOpen]);

    const supplyOptions: SearchableSelectItem[] = useMemo(() =>
        supplies.map(s => ({
            value: s.id,
            label: `${s.name} (Stock: ${s.quantity})`,
            searchTerms: `${s.name} ${s.code} ${s.category}`.toLowerCase()
        })),
    [supplies]);

    const addItem = () => {
        if (!selectedSupplyId) return;
        
        const supply = supplies.find(s => s.id === selectedSupplyId);
        if (!supply) return;

        // Check if already in list
        if (items.find(i => i.supplyId === selectedSupplyId)) {
            toast({ title: "Déjà ajouté", description: "Cet article est déjà dans votre liste." });
            return;
        }

        setItems([...items, {
            supplyId: supply.id,
            supplyName: supply.name,
            quantity: 1,
            photoUrl: supply.photoUrl
        }]);
        setSelectedSupplyId("");
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.supplyId !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setItems(items.map(item => {
            if (item.supplyId === id) {
                const supply = supplies.find(s => s.id === id);
                const max = supply?.quantity || 999;
                const newQty = Math.max(1, Math.min(max, item.quantity + delta));
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleSubmit = async () => {
        if (items.length === 0) {
            toast({ variant: "destructive", title: "Liste vide", description: "Ajoutez au moins un article." });
            return;
        }

        if (!user) return;

        setSubmitting(true);
        try {
            await createSupplyRequest({
                employeeId: user.id,
                employeeName: user.name || user.email,
                departmentId: user.departmentId,
                items,
            });

            toast({
                title: "Demande envoyée",
                description: "Votre demande a été transmise pour validation.",
            });
            setIsOpen(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Failed to submit request:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible d'envoyer la demande."
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-slate-900 rounded-xl font-bold shadow-lg shadow-slate-200 hover:shadow-xl transition-all h-11 px-6">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Nouvelle Demande
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl gap-0 p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-slate-900 p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                            <ShoppingCart className="h-6 w-6 text-blue-400" />
                            Demande de Fournitures
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Composez votre liste d'articles à demander au stock.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6 bg-white">
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Choisir un article</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <SearchableSelect
                                    items={supplyOptions}
                                    value={selectedSupplyId}
                                    onValueChange={setSelectedSupplyId}
                                    placeholder="Rechercher un produit..."
                                    className="rounded-xl border-slate-200"
                                />
                            </div>
                            <Button 
                                onClick={addItem} 
                                disabled={!selectedSupplyId}
                                className="bg-blue-600 hover:bg-blue-700 rounded-xl w-11 p-0 flex-shrink-0"
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    <Separator className="bg-slate-100" />

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Ma Liste ({items.length})</Label>
                            {items.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => setItems([])} className="text-[10px] font-black uppercase text-red-500 h-6 px-2">
                                    Tout effacer
                                </Button>
                            )}
                        </div>
                        
                        <ScrollArea className="h-[250px] pr-4">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[200px] border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 gap-3">
                                    <Package className="h-10 w-10 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Aucun article sélectionné</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <div key={item.supplyId} className="group flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-colors border border-slate-100">
                                            <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                {item.photoUrl ? (
                                                    <img src={item.photoUrl} alt={item.supplyName} crossOrigin="anonymous" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="h-5 w-5 text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{item.supplyName}</p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 rounded-sm"
                                                    onClick={() => updateQuantity(item.supplyId, -1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 rounded-sm"
                                                    onClick={() => updateQuantity(item.supplyId, 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeItem(item.supplyId)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 mt-0">
                    <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={submitting} className="rounded-xl font-bold">
                        Annuler
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={submitting || items.length === 0}
                        className="bg-slate-900 hover:bg-black rounded-xl px-8 font-black shadow-lg shadow-slate-200"
                    >
                        {submitting ? "Envoi..." : "Envoyer la Demande"}
                        {!submitting && <Send className="ml-2 h-4 w-4" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
