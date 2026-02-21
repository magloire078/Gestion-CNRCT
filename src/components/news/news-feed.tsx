import React, { useEffect, useState } from 'react';
import { subscribeToPublishedNews, incrementNewsView } from '@/services/news-service';
import type { NewsItem } from '@/types/common';
import { NewsCard } from './news-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, User, Newspaper } from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from "@/components/ui/scroll-area";

export function NewsFeed() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
    const { toast } = useToast();

    useEffect(() => {
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
    }, [toast]);

    const handleNewsClick = (item: NewsItem) => {
        setSelectedNews(item);
        incrementNewsView(item.id);
    };

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-6">
                <Newspaper className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold tracking-tight">À la une de la CNRCT</h2>
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
            ) : news.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {news.map((item) => (
                        <NewsCard key={item.id} news={item} onClick={handleNewsClick} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                    <Newspaper className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Aucune actualité disponible pour le moment.</p>
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
                                            <span>{format(parseISO(selectedNews.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
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
        </div>
    );
}
