
"use client";

import { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Plus, 
    Trash2, 
    Edit2, 
    Save, 
    X, 
    AlertTriangle,
    Tag,
    Hash
} from 'lucide-react';
import { 
    SupplyCategory, 
    subscribeToCategories, 
    addCategory, 
    updateCategory, 
    deleteCategory 
} from '@/services/supply-category-service';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ManageCategoriesDialogProps {
    isOpen: boolean;
    onCloseAction: () => void;
}

export function ManageCategoriesDialog({ isOpen, onCloseAction }: ManageCategoriesDialogProps) {
    const [categories, setCategories] = useState<SupplyCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryAccount, setNewCategoryAccount] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editAccount, setEditAccount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            const unsubscribe = subscribeToCategories(
                (data) => setCategories(data),
                (err) => toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les catégories." })
            );
            return () => unsubscribe();
        }
    }, [isOpen, toast]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        
        setIsSubmitting(true);
        try {
            await addCategory({ 
                name: newCategoryName.trim(), 
                syscohadaAccount: newCategoryAccount.trim() || undefined 
            });
            setNewCategoryName('');
            setNewCategoryAccount('');
            toast({ title: "Succès", description: "Catégorie ajoutée." });
        } catch (err) {
            toast({ variant: "destructive", title: "Erreur", description: "Échec de l'ajout." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartEdit = (cat: SupplyCategory) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditAccount(cat.syscohadaAccount || '');
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editName.trim()) return;
        
        setIsSubmitting(true);
        try {
            await updateCategory(editingId, { 
                name: editName.trim(), 
                syscohadaAccount: editAccount.trim() || undefined 
            });
            setEditingId(null);
            toast({ title: "Succès", description: "Catégorie mise à jour." });
        } catch (err) {
            toast({ variant: "destructive", title: "Erreur", description: "Échec de la mise à jour." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette catégorie ? Cela n'affectera pas les articles existants mais ils perdront leur lien de catégorie.")) return;
        
        try {
            await deleteCategory(id);
            toast({ title: "Succès", description: "Catégorie supprimée." });
        } catch (err) {
            toast({ variant: "destructive", title: "Erreur", description: "Échec de la suppression." });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onCloseAction}>
            <DialogContent className="max-w-md bg-white border-none shadow-2xl rounded-[2rem] p-0 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full" />
                
                <div className="p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                            <Tag className="h-6 w-6 text-indigo-500" />
                            Gestion des Catégories
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Ajoutez ou modifiez les catégories de fournitures et leurs comptes SYSCOHADA.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Formulaire d'ajout */}
                    <form onSubmit={handleAdd} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="new-name" className="text-[10px] uppercase font-black text-slate-400 ml-1">Nom</Label>
                                <Input 
                                    id="new-name"
                                    placeholder="Ex: Archivage" 
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="h-10 rounded-xl border-slate-200 bg-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="new-account" className="text-[10px] uppercase font-black text-slate-400 ml-1">Compte (6xxx)</Label>
                                <Input 
                                    id="new-account"
                                    placeholder="Ex: 6211" 
                                    value={newCategoryAccount}
                                    onChange={(e) => setNewCategoryAccount(e.target.value)}
                                    className="h-10 rounded-xl border-slate-200 bg-white font-mono"
                                />
                            </div>
                        </div>
                        <Button 
                            type="submit" 
                            disabled={!newCategoryName || isSubmitting}
                            className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 font-bold"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Ajouter la catégorie
                        </Button>
                    </form>

                    {/* Liste des catégories */}
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {categories.map((cat) => (
                            <Card key={cat.id} className="p-3 border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group rounded-xl overflow-hidden">
                                {editingId === cat.id ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input 
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="h-9 rounded-lg text-sm"
                                            />
                                            <Input 
                                                value={editAccount}
                                                onChange={(e) => setEditAccount(e.target.value)}
                                                className="h-9 rounded-lg text-sm font-mono"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 p-0 rounded-lg text-slate-400">
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="default" onClick={handleSaveEdit} className="h-8 px-3 rounded-lg bg-green-600 hover:bg-green-700 font-bold text-[10px] uppercase tracking-wider">
                                                <Save className="mr-2 h-3 w-3" /> Enregistrer
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                                <Tag className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 leading-tight">{cat.name}</span>
                                                {cat.syscohadaAccount && (
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1">
                                                        <Hash className="h-2.5 w-2.5" /> Compte {cat.syscohadaAccount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" onClick={() => handleStartEdit(cat)} className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(cat.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>

                    {categories.length === 0 && (
                        <div className="py-10 text-center flex flex-col items-center gap-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <AlertTriangle className="h-8 w-8 text-slate-300" />
                            <p className="text-xs text-slate-400 font-medium">Aucune catégorie définie.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100">
                    <Button onClick={onCloseAction} variant="outline" className="w-full h-11 rounded-xl font-bold text-slate-600 border-slate-200">
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
