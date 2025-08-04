
"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle, Search, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Chief } from "@/lib/data";
import { subscribeToChiefs, addChief, deleteChief } from "@/services/chief-service";
import { AddChiefSheet } from "@/components/chiefs/add-chief-sheet";

export default function ChiefsPage() {
  const [chiefs, setChiefs] = useState<Chief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToChiefs(
      (data) => {
        setChiefs(data);
        setLoading(false);
      },
      (err) => {
        setError("Impossible de charger le répertoire des chefs.");
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAddChief = async (newChiefData: Omit<Chief, "id">) => {
    try {
      await addChief(newChiefData);
      setIsSheetOpen(false);
      toast({
        title: "Chef ajouté",
        description: `${newChiefData.name} a été ajouté au répertoire.`,
      });
    } catch (err) {
      console.error(err);
      throw err; // Re-throw to be handled in the sheet component
    }
  };

  const handleDeleteChief = async (chief: Chief) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${chief.name} du répertoire ?`)) {
      try {
        await deleteChief(chief.id);
        toast({
          title: "Chef supprimé",
          description: `${chief.name} a été retiré du répertoire.`,
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: `Impossible de supprimer ${chief.name}.`,
        });
      }
    }
  };

  const filteredChiefs = useMemo(() => {
    return chiefs.filter((chief) =>
      chief.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chief.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chief.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chief.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chiefs, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rois et Chefs Traditionnels</h1>
        <Button onClick={() => setIsSheetOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un Chef
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Répertoire Officiel</CardTitle>
          <CardDescription>
            Consultez et gérez le répertoire des autorités traditionnelles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, région, village..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-destructive text-center py-4">{error}</p>}
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Photo</TableHead>
                  <TableHead>Nom & Titre</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><div className="flex justify-end"><Skeleton className="h-8 w-8" /></div></TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredChiefs.map((chief) => (
                    <TableRow key={chief.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={chief.photoUrl} alt={chief.name} data-ai-hint="chief portrait" />
                          <AvatarFallback>{chief.name?.charAt(0) || 'C'}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{chief.name}</div>
                        <div className="text-sm text-muted-foreground">{chief.title}</div>
                      </TableCell>
                       <TableCell>
                        <div className="font-medium">{chief.village}</div>
                        <div className="text-sm text-muted-foreground">{chief.region} / {chief.department}</div>
                      </TableCell>
                      <TableCell>{chief.contact}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ouvrir le menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                               <Eye className="mr-2 h-4 w-4" /> Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                               <Pencil className="mr-2 h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteChief(chief)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && filteredChiefs.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              Aucun chef trouvé.
            </div>
          )}
        </CardContent>
      </Card>
      <AddChiefSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddChief={handleAddChief}
      />
    </div>
  );
}
