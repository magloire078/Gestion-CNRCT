import React, { useEffect, useState, useMemo } from 'react';
import { subscribeToPublishedNews, incrementNewsView } from '@/services/news-service';
import type { NewsItem } from '@/types/common';
import { NewsCard } from './news-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Pencil, Trash2, CalendarDays, ChevronLeft, ChevronRight, Newspaper, Calendar, Eye, User } from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { EditNewsSheet } from './edit-news-sheet';
import { deleteNews } from '@/services/news-service';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { subDays, addDays, isWithinInterval, getYear } from "date-fns";
import { getHolidayNewsItems } from '@/lib/holidays';

export function NewsFeed() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null);
    const { toast } = useToast();
    const { user, loading: authLoading, hasPermission } = useAuth();
    const canManageNews = hasPermission('page:admin:view');

    useEffect(() => {
        if (authLoading || !user) return;

        const unsubscribe = subscribeToPublishedNews(
            (fetchedNews) => {
                setNews(fetchedNews);
                setLoading(false);
            },
            (error) => {
                console.error("Erreur lors du chargement des actualités", error);
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Impossible de charger le fil d'actualité."
                });
                setLoading(false);
            },
            10 // Fetch last 10 news items
        );

        return () => unsubscribe();
    }, [toast, user, authLoading]);

    const handleNewsClick = (item: NewsItem) => {
        setSelectedNews(item);
        incrementNewsView(item.id);
    };

    const handleEditNews = (e: React.MouseEvent, item: NewsItem) => {
        e.stopPropagation();
        setEditingNews(item);
        setIsEditSheetOpen(true);
    };

    const handleDeleteClick = (e: React.MouseEvent, item: NewsItem) => {
        e.stopPropagation();
        setDeleteTarget(item);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteNews(deleteTarget.id);
            setNews(news.filter(n => n.id !== deleteTarget.id));
            toast({ title: "Actualité supprimée" });
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'actualité." });
        } finally {
            setDeleteTarget(null);
        }
    };

    const combinedNews = useMemo(() => {
        const year = getYear(new Date());
        const holidays = getHolidayNewsItems(year);
        // Merge holidays with firestore news
        return [...news, ...holidays];
    }, [news]);

    const eventNews = useMemo(() => {
        const today = new Date();
        const twoWeeksAgo = subDays(today, 14);
        const twoWeeksFromNow = addDays(today, 14);

        return combinedNews.filter(item => {
            if (item.category !== 'Événement' || !item.eventDate) return false;
            try {
                const eventDate = parseISO(item.eventDate);
                // We check if the event happens in the window [today - 14, today + 14]
                return isWithinInterval(eventDate, { start: twoWeeksAgo, end: twoWeeksFromNow });
            } catch {
                return false;
            }
        });
    }, [combinedNews]);

    const regularNews = useMemo(() => {
        const eventIds = new Set(eventNews.map(e => e.id));
        return combinedNews.filter(n => !eventIds.has(n.id) && n.authorId !== 'system');
    }, [combinedNews, eventNews]);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Newspaper className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold tracking-tight">À la une de la CNRCT</h2>
                    </div>
                    <Badge variant="outline" className="hidden sm:flex bg-primary/5 text-primary border-primary/20 font-medium px-3 py-1 capitalize">
                        {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                    </Badge>
                </div>
                {canManageNews && (
                    <Button size="sm" onClick={() => setIsAddSheetOpen(true)} className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Ajouter
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[125px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Events Carousel */}
                    {eventNews.length > 0 && (
                        <div className="relative group">
                            <div className="flex items-center gap-2 mb-4">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Évènements Proches</h3>
                            </div>
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                className="w-full"
                            >
                                <CarouselContent className="-ml-2 md:-ml-4">
                                    {eventNews.map((item) => (
                                        <CarouselItem key={item.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/2">
                                            <NewsCard
                                                news={item}
                                                onClick={handleNewsClick}
                                                onEdit={canManageNews ? handleEditNews : undefined}
                                                onDelete={canManageNews ? handleDeleteClick : undefined}
                                            />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="hidden md:flex -left-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CarouselNext className="hidden md:flex -right-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Carousel>
                        </div>
                    )}

                    {/* Regular News Grid */}
                    <div className="space-y-4">
                        {eventNews.length > 0 && regularNews.length > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Autres Actualités</h3>
                            </div>
                        )}
                        {regularNews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                {regularNews.map((item) => (
                                    <NewsCard
                                        key={item.id}
                                        news={item}
                                        onClick={handleNewsClick}
                                        onEdit={canManageNews ? handleEditNews : undefined}
                                        onDelete={canManageNews ? handleDeleteClick : undefined}
                                    />
                                ))}
                            </div>
                        ) : eventNews.length === 0 && (
                            <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                                <Newspaper className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">Aucune actualité disponible pour le moment.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal for Reading Full News */}
            <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
                    {selectedNews && (
                        <>
                            {selectedNews.imageUrl && (
                                <div className="w-full h-64 relative bg-muted shrink-0">
                                    <img
                                        src={selectedNews.imageUrl}
                                        alt={selectedNews.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute bottom-4 left-6 right-6">
                                        <Badge className="mb-2 bg-primary/90 text-primary-foreground hover:bg-primary/90">
                                            {selectedNews.category}
                                        </Badge>
                                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                            {selectedNews.title}
                                        </h2>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-auto">
                                <div className="p-6 md:p-8">
                                    {/* Header info if no image */}
                                    {!selectedNews.imageUrl && (
                                        <div className="mb-6">
                                            <Badge className="mb-3">{selectedNews.category}</Badge>
                                            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                                                {selectedNews.title}
                                            </h2>
                                        </div>
                                    )}

                                    {/* Meta Bar */}
                                    <div className="flex flex-wrap items-center gap-4 py-4 mb-6 border-b border-border text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-4 w-4" />
                                            <span className="font-medium text-foreground">{selectedNews.authorName}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {selectedNews.category === 'Événement' && selectedNews.eventDate
                                                    ? format(parseISO(selectedNews.eventDate), "d MMMM yyyy", { locale: fr })
                                                    : format(parseISO(selectedNews.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <Eye className="h-4 w-4" />
                                            <span>{selectedNews.viewCount + 1} vues</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div
                                        className="prose prose-sm md:prose-base prose-neutral dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: selectedNews.content }}
                                    />

                                    {/* Tags */}
                                    {selectedNews.tags && selectedNews.tags.length > 0 && (
                                        <div className="mt-8 flex flex-wrap gap-2">
                                            {selectedNews.tags.map(tag => (
                                                <Badge key={tag} variant="secondary">#{tag}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="p-4 border-t border-border shrink-0 bg-background/50 backdrop-blur-sm">
                                <Button variant="outline" onClick={() => setSelectedNews(null)}>Fermer</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <EditNewsSheet
                isOpen={isAddSheetOpen}
                onCloseAction={() => setIsAddSheetOpen(false)}
            />

            <EditNewsSheet
                isOpen={isEditSheetOpen}
                onCloseAction={() => {
                    setIsEditSheetOpen(false);
                    setEditingNews(null);
                }}
                newsItem={editingNews}
            />

            <ConfirmationDialog
                isOpen={!!deleteTarget}
                onCloseAction={() => setDeleteTarget(null)}
                onConfirmAction={confirmDelete}
                title="Supprimer l'actualité ?"
                description={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.title}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="destructive"
            />
        </div>
    );
}
