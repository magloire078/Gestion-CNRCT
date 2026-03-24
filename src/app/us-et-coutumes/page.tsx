"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    PlusCircle, Search, BookText, Edit, Trash2, 
    Eye, Quote, Globe, MapPin, History,
    Users, Landmark, Scroll, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Custom } from "@/lib/data";
import { subscribeToCustoms, addCustom, deleteCustom } from "@/services/customs-service";
import { AddCustomSheet } from "@/components/customs/add-custom-sheet";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function UsEtCoutumesPage() {
  const [customs, setCustoms] = useState<Custom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<Custom | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeToCustoms(
      (data) => {
        setCustoms(data);
        setLoading(false);
      },
      (err) => {
        setError("Impossible de charger les données sur les us et coutumes.");
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAddCustom = async (newCustomData: Omit<Custom, "id">) => {
    try {
      await addCustom(newCustomData);
      setIsSheetOpen(false);
      toast({
        title: "Fiche ajoutée",
        description: `La fiche pour le groupe ${newCustomData.ethnicGroup} a été ajoutée.`,
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteCustom = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustom(deleteTarget.id);
      toast({
        title: "Fiche supprimée",
        description: `La fiche pour ${deleteTarget.ethnicGroup} a été supprimée.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de supprimer la fiche.`,
      });
    } finally {
        setDeleteTarget(null);
    }
  };

  const filteredCustoms = useMemo(() => {
    return customs.filter((custom) =>
      custom.ethnicGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custom.regions.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customs, searchTerm]);

  return (
    <div className="flex flex-col gap-10 pb-20">
      {/* Hero Header */}
      <div className="relative h-[200px] rounded-[2rem] overflow-hidden bg-slate-900 flex flex-col justify-end p-8 md:p-12 mb-2 group">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523805081730-61444927f07a?auto=format&fit=crop&q=80')] opacity-20 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
         <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
                <Badge className="bg-amber-500/20 text-amber-400 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Patrimoine Culturel</Badge>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Us & Coutumes</h1>
                <p className="text-slate-400 text-sm max-w-xl font-medium italic">Répertoire encyclopédique des traditions et institutions traditionnelles de Côte d'Ivoire.</p>
            </div>
            <Button onClick={() => setIsSheetOpen(true)} className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-12 px-6 font-bold shadow-2xl">
                <PlusCircle className="mr-2 h-5 w-5" />
                Enregistrer une tradition
            </Button>
         </div>
      </div>

      <div className="flex flex-col gap-8 px-2">
          {/* Controls */}
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
              <div className="relative group w-full md:w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <Input
                  placeholder="Rechercher une ethnie, une région, un rite..."
                  className="pl-12 h-14 rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white focus:ring-slate-900 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-10 px-4 rounded-xl border-slate-200 bg-white text-slate-500 font-bold">
                      {filteredCustoms.length} Fiches répertoriées
                  </Badge>
              </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[400px] rounded-3xl bg-slate-100 animate-pulse" />
              ))
            ) : filteredCustoms.length > 0 ? (
              filteredCustoms.map((custom) => (
                <Card 
                    key={custom.id} 
                    className="flex flex-col border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-500 group"
                >
                    <div className="h-24 bg-slate-50 flex items-end px-6 relative overflow-hidden">
                        <div className="absolute top-4 right-6 opacity-5 transition-transform group-hover:scale-125">
                            <Landmark className="h-24 w-24" />
                        </div>
                        <div className="flex items-center gap-3 mb-[-12px] z-10">
                            <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg group-hover:-translate-y-1 transition-transform">
                                <Scroll className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>
                    <CardHeader className="pt-8 px-6">
                        <CardTitle className="text-xl font-black text-slate-900 group-hover:text-slate-700 transition-colors">
                            {custom.ethnicGroup}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 font-bold text-slate-400 uppercase text-[10px] tracking-widest pt-1">
                            <MapPin className="h-3 w-3" /> {custom.regions}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow px-6">
                        <div className="relative">
                            <Quote className="absolute -top-1 -left-1 h-6 w-6 text-slate-50 opacity-50" />
                            <p className="text-sm text-slate-500 leading-relaxed line-clamp-4 italic pl-4 border-l-2 border-slate-50 mt-2">
                                {custom.historicalOrigin || "Le récit historique de ce peuple n'a pas encore été documenté dans cette fiche."}
                            </p>
                        </div>
                        
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50/50 border border-slate-50">
                                <Users className="h-3.5 w-3.5 text-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Organisation</span>
                                <span className="text-[11px] font-bold text-slate-700 truncate">Traditionnelle</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50/50 border border-slate-50">
                                <History className="h-3.5 w-3.5 text-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Origine</span>
                                <span className="text-[11px] font-bold text-slate-700 truncate">Ancienne</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="p-6 pt-2 flex justify-between gap-2 border-t border-slate-50 bg-slate-50/30">
                        <Button variant="ghost" size="sm" className="h-9 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={(e) => { e.stopPropagation(); setDeleteTarget(custom); }}>
                            <Trash2 className="mr-2 h-4 w-4"/>
                        </Button>
                        <div className="flex gap-2">
                             <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 font-bold" asChild>
                                <Link href={`/us-et-coutumes/${custom.id}/edit`}><Edit className="mr-2 h-3.5 w-3.5"/> Éditer</Link>
                            </Button>
                             <Button size="sm" className="h-9 rounded-xl bg-slate-900 font-bold px-4 hover:shadow-lg transition-all" asChild>
                               <Link href={`/us-et-coutumes/${custom.id}`}>Consulter <ChevronRight className="ml-1 h-3.5 w-3.5"/></Link>
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
              ))
            ) : (
                <div className="md:col-span-2 lg:col-span-3">
                    <Card className="border-none shadow-none bg-slate-50/50 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center">
                        <div className="h-32 w-32 bg-white rounded-full flex items-center justify-center shadow-xl mb-8">
                            <BookText className="h-16 w-16 text-slate-200" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">La bibliothèque est vide</h2>
                        <p className="mt-2 text-slate-400 max-w-sm italic">
                            Aucune fiche n'a été trouvée pour votre recherche. Soyez le premier à documenter ces coutumes millénaires !
                        </p>
                        <Button onClick={() => setIsSheetOpen(true)} className="mt-8 bg-slate-900 rounded-2xl h-12 px-8 font-bold">
                            Commencer l'archivage
                        </Button>
                    </Card>
                </div>
            )}
          </div>
      </div>

      <AddCustomSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddCustom={handleAddCustom}
      />
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onCloseAction={() => setDeleteTarget(null)}
        onConfirmAction={handleDeleteCustom}
        title={`Supprimer l'archive ?`}
        description={`Confirmez-vous la suppression définitive des données sur les ${deleteTarget?.ethnicGroup} ? Cette action impactera la mémoire institutionnelle.`}
      />
    </div>
  );
}
