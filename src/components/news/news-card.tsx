import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, User } from 'lucide-react';
import type { NewsItem } from '@/types/common';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewsCardProps {
    news: NewsItem;
    onClick: (news: NewsItem) => void;
    onEdit?: (e: React.MouseEvent, news: NewsItem) => void;
    onDelete?: (e: React.MouseEvent, news: NewsItem) => void;
}

const categoryColors: Record<NewsItem['category'], "default" | "secondary" | "destructive" | "outline"> = {
    'Général': 'default',
    'Événement': 'outline',
    'RH': 'secondary',
    'Directoire': 'destructive'
};

export function NewsCard({ news, onClick, onEdit, onDelete }: NewsCardProps) {
    const formattedDate = news.category === 'Événement' && news.eventDate
        ? format(parseISO(news.eventDate), 'dd MMMM yyyy', { locale: fr })
        : formatDistanceToNow(parseISO(news.createdAt), { addSuffix: true, locale: fr });

    return (
        <Card
            className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 border-border/50 group"
            onClick={() => onClick(news)}
        >
            {news.imageUrl && (
                <div className="w-full h-48 overflow-hidden relative">
                    <img
                        src={news.imageUrl}
                        alt={news.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            )}

            <CardHeader className={news.imageUrl ? "pb-2 pt-4" : "pb-2"}>
                <div className="flex justify-between items-start mb-2">
                    <Badge variant={categoryColors[news.category]}>{news.category}</Badge>
                    <div className="flex items-center gap-1">
                        {(onEdit || onDelete) && (
                            <div className="flex gap-1 mr-2">
                                {onEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                        onClick={(e) => onEdit(e, news)}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                                {onDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => onDelete(e, news)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        )}
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formattedDate}</span>
                        </div>
                    </div>
                </div>
                <CardTitle className="text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {news.title}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {news.summary}
                </p>
            </CardContent>

            <CardFooter className="pt-0 flex justify-between items-center text-xs text-muted-foreground w-full">
                <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{news.authorName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Eye className="h-3 w-3" />
                    <span>{news.viewCount} vues</span>
                </div>
            </CardFooter>
        </Card>
    );
}
