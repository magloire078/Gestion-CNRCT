"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { subscribeToAllNewsAdmin, deleteNews } from "@/services/news-service";
import type { NewsItem } from "@/types/common";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { EditNewsSheet } from "@/components/news/edit-news-sheet";

export default function AdminNewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = subscribeToAllNewsAdmin(
            (data) => {
                setNews(data);
                setLoading(false);
            },
            (error) => {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Impossible de charger les actualités.",
                });
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [toast]);

    const filteredNews = news.filter(
        (item) =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = () => {
        setSelectedNews(null);
        setIsEditSheetOpen(true);
    };

    const handleEdit = (item: NewsItem) => {
        setSelectedNews(item);
        setIsEditSheetOpen(true);
    };

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer l'actualité "${title}" ?`)) {
            try {
                await deleteNews(id);
                toast({
                    title: "Actualité supprimée",
                    description: `L'article "${title}" a été supprimé.`,
                });
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "La suppression a échoué.",
                });
            }
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Gestion des Actualités</h1>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouvelle Actualité
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Articles et Communications</CardTitle>
                    <CardDescription>
                        Gérez le fil d'actualité de l'intranet. Créez des articles, gérez les brouillons et suivez les vues.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4 w-full md:w-1/3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par titre, catégorie..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Titre</TableHead>
                                    <TableHead>Catégorie</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Date création</TableHead>
                                    <TableHead className="text-right">Vues</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={`skeleton-${i}`}>
                                            <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-4 w-[40px] ml-auto" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredNews.length > 0 ? (
                                    filteredNews.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                <div className="line-clamp-1">{item.title}</div>
                                            </TableCell>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell>
                                                {item.published ? (
                                                    <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                                                        <Eye className="w-3 h-3" /> Publié
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <EyeOff className="w-3 h-3" /> Brouillon
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{format(parseISO(item.createdAt), 'dd MMM yyyy', { locale: fr })}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{item.viewCount}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id, item.title)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Aucune actualité trouvée.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <EditNewsSheet
                isOpen={isEditSheetOpen}
                onCloseAction={() => setIsEditSheetOpen(false)}
                newsItem={selectedNews}
            />
        </div>
    );
}
