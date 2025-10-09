
"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle, Search, BookText, Edit, Trash2, Eye } from "lucide-react";
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Us & Coutumes</h1>
        <Button onClick={() => setIsSheetOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une Fiche
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Répertoire des Us et Coutumes</CardTitle>
          <CardDescription>
            Consultez et gérez les fiches descriptives des traditions de Côte d'Ivoire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par groupe ethnique, région..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
            ) : filteredCustoms.length > 0 ? (
              filteredCustoms.map((custom) => (
                <Card key={custom.id} className="flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            {custom.ethnicGroup}
                        </CardTitle>
                        <CardDescription>{custom.regions}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground line-clamp-3 h-[60px]">{custom.historicalOrigin || "Aucune description."}</p>
                    </CardContent>
                    <CardFooter className="mt-auto pt-4 flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(custom); }}>
                            <Trash2 className="mr-2 h-4 w-4 text-destructive"/> Supprimer
                        </Button>
                         <Button variant="outline" size="sm" asChild>
                            <Link href={`/us-et-coutumes/${custom.id}/edit`}><Edit className="mr-2 h-4 w-4"/> Modifier</Link>
                        </Button>
                         <Button size="sm" asChild>
                           <Link href={`/us-et-coutumes/${custom.id}`}><Eye className="mr-2 h-4 w-4"/> Voir</Link>
                        </Button>
                    </CardFooter>
                </Card>
              ))
            ) : (
                 <div className="md:col-span-2 lg:col-span-3">
                     <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                        <BookText className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">
                            Aucune fiche de coutume trouvée.
                        </p>
                    </div>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
      <AddCustomSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddCustom={handleAddCustom}
      />
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCustom}
        title={`Supprimer la fiche : ${deleteTarget?.ethnicGroup} ?`}
        description="Êtes-vous sûr de vouloir supprimer cette fiche ? Cette action est irréversible."
      />
    </div>
  );
}
