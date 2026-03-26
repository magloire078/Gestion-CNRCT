"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    PlusCircle, Search, MapPin, 
    History, Users, Landmark, 
    ChevronRight, Loader2, Globe,
    ArrowLeft, Filter, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { subscribeToHeritage, deleteHeritageItem, addHeritageItem } from "@/services/heritage-service";
import type { HeritageItem, HeritageCategory } from "@/types/heritage";
import { heritageCategoryLabels } from "@/types/heritage";
import { AddHeritageItemSheet } from "@/components/heritage/add-heritage-item-sheet";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { IVORIAN_REGIONS } from "@/constants/regions";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HeritageCategoryPage() {
    const params = useParams();
    const router = useRouter();
    const category = params.category as HeritageCategory;
    const categoryLabel = heritageCategoryLabels[category] || "Patrimoine";

    const [items, setItems] = useState<HeritageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [regionFilter, setRegionFilter] = useState("all");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<HeritageItem | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!category) return;
        
        const unsubscribe = subscribeToHeritage(
            category,
            (data) => {
                setItems(data);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [category]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 item.ethnicGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 item.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRegion = regionFilter === "all" || item.region === regionFilter;
            return matchesSearch && matchesRegion;
        });
    }, [items, searchTerm, regionFilter]);

    const handleAddItem = async (data: Omit<HeritageItem, "id">) => {
        try {
            await addHeritageItem(data);
            toast({
                title: "Enregistrement réussi",
                description: `${data.name} a été ajouté au répertoire.`,
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible d'ajouter l'élément.",
            });
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteHeritageItem(deleteTarget.id);
            toast({
                title: "Suppression réussie",
                description: `${deleteTarget.name} a été retiré du répertoire.`,
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de supprimer l'élément.",
            });
        } finally {
            setDeleteTarget(null);
        }
    };

    // Style mapping per category
    const categoryStyles: Record<string, { icon: any, color: string, bg: string, image: string }> = {
        culinaire: { icon: Globe, color: "text-orange-500", bg: "bg-orange-500/10", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80" },
        masques: { icon: Landmark, color: "text-rose-500", bg: "bg-rose-500/10", image: "https://images.unsplash.com/photo-1523805081730-61444927f07a?auto=format&fit=crop&q=80" },
        danses: { icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10", image: "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&q=80" },
        jeux: { icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80" },
        alliances: { icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80" },
        ethnies: { icon: Users, color: "text-amber-500", bg: "bg-amber-500/10", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80" },
    };

    const style = categoryStyles[category] || categoryStyles.ethnies;

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Header Heritage */}
            <div className="relative h-[240px] rounded-[2.5rem] overflow-hidden bg-slate-900 group">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30 transition-transform duration-1000 group-hover:scale-110"
                    style={{ backgroundImage: `url(${style.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                
                <div className="relative h-full flex flex-col justify-between p-8 md:p-12 z-10">
                    <Button variant="ghost" className="w-fit text-white/70 hover:text-white hover:bg-white/10 rounded-xl" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                    </Button>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <Badge className={cn("border-none px-3 font-black text-[10px] uppercase tracking-widest", style.bg, style.color)}>
                                Répertoire National
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter flex items-center gap-4">
                                <style.icon className={cn("h-10 w-10", style.color)} />
                                {categoryLabel}
                            </h1>
                        </div>
                        <Button onClick={() => setIsSheetOpen(true)} className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-14 px-8 font-black shadow-2xl transition-all hover:-translate-y-1">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Ajouter un élément
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4 px-2">
                <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <Input
                        placeholder={`Rechercher un(e) ${categoryLabel.toLowerCase()}...`}
                        className="pl-12 h-14 rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="h-14 rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white w-full md:w-[240px] font-bold text-slate-600">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-400" />
                            <SelectValue placeholder="Région" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                        <SelectItem value="all" className="font-bold">Toutes les régions</SelectItem>
                        {IVORIAN_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Chargement du patrimoine...</p>
                </div>
            ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                    {filteredItems.map((item) => (
                        <Card key={item.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden bg-white flex flex-col h-full">
                            <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                                {item.imageUrl ? (
                                    <img 
                                        src={item.imageUrl} 
                                        alt={item.name} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <style.icon className="h-12 w-12 text-slate-200" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Badge className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 border-none font-black text-[9px] uppercase tracking-widest px-3">
                                    {item.ethnicGroup || "Traditionnel"}
                                </Badge>
                            </div>
                            
                            <CardContent className="p-8 flex flex-col flex-1">
                                <div className="space-y-4 flex-1">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.region || "Toute la Côte d'Ivoire"}</p>
                                        <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase">{item.name}</h3>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-semibold italic line-clamp-3">
                                        "{item.description}"
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-600 uppercase">
                                            <MapPin className="h-3 w-3 text-slate-400" /> {item.village || "Plusieurs localités"}
                                        </div>
                                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-600 uppercase">
                                            <History className="h-3 w-3 text-slate-400" /> {item.historicalContext ? "Documenté" : "Archivé"}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <Button variant="ghost" className="h-10 w-10 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => setDeleteTarget(item)}>
                                        <Landmark className="h-4 w-4" />
                                    </Button>
                                    <Button className="rounded-xl h-10 px-6 font-bold text-xs uppercase group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg shadow-blue-500/10" asChild>
                                        <Link href={`/heritage/${category}/${item.id}`}>
                                            Consulter <ChevronRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-none shadow-none bg-slate-50/50 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center mx-2">
                    <div className="h-32 w-32 bg-white rounded-full flex items-center justify-center shadow-xl mb-8">
                        <style.icon className="h-16 w-16 text-slate-200" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Répertoire vide</h2>
                    <p className="mt-2 text-slate-400 max-w-sm italic font-medium">
                        Aucun élément n'a été trouvé pour la catégorie <span className="font-bold text-slate-600">{categoryLabel}</span> dans cette zone.
                    </p>
                    <Button onClick={() => setIsSheetOpen(true)} className="mt-8 bg-slate-900 rounded-2xl h-12 px-8 font-bold">
                        Commencer l'archivage
                    </Button>
                </Card>
            )}

            <AddHeritageItemSheet 
                isOpen={isSheetOpen}
                category={category}
                onCloseAction={() => setIsSheetOpen(false)}
                onAddItemAction={handleAddItem}
            />

            <ConfirmationDialog 
                isOpen={!!deleteTarget}
                title="Archivage de sécurité"
                description={`Êtes-vous sûr de vouloir retirer "${deleteTarget?.name}" du répertoire national ? Cette action est irréversible.`}
                onConfirmAction={handleDelete}
                onCloseAction={() => setDeleteTarget(null)}
            />
        </div>
    );
}
