import React, { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createNews, updateNews } from "@/services/news-service";
import { useAuth } from "@/hooks/use-auth";
import type { NewsItem } from "@/types/common";
import { Loader2 } from "lucide-react";

interface EditNewsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    newsItem?: NewsItem | null;
}

const CATEGORIES = ['Général', 'Événement', 'RH', 'Directoire'] as const;

export function EditNewsSheet({ isOpen, onClose, newsItem }: EditNewsSheetProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const isEditing = !!newsItem;

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<NewsItem>>({
        title: "",
        summary: "",
        content: "",
        imageUrl: "",
        category: "Général",
        published: false,
        tags: [],
    });

    useEffect(() => {
        if (isOpen) {
            if (newsItem) {
                setFormData({
                    title: newsItem.title,
                    summary: newsItem.summary,
                    content: newsItem.content,
                    imageUrl: newsItem.imageUrl || "",
                    category: newsItem.category,
                    published: newsItem.published,
                    tags: newsItem.tags || [],
                });
            } else {
                setFormData({
                    title: "",
                    summary: "",
                    content: "",
                    imageUrl: "",
                    category: "Général",
                    published: false,
                    tags: [],
                });
            }
        }
    }, [isOpen, newsItem]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData((prev) => ({ ...prev, published: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.title || !formData.summary || !formData.content) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Veuillez remplir les champs obligatoires (Titre, Résumé, Contenu).",
            });
            return;
        }

        setIsLoading(true);
        try {
            const dataToSave = {
                title: formData.title!,
                summary: formData.summary!,
                content: formData.content!,
                imageUrl: formData.imageUrl || undefined,
                category: formData.category as NewsItem['category'],
                published: formData.published!,
                tags: formData.tags,
            };

            if (isEditing && newsItem) {
                await updateNews(newsItem.id, dataToSave);
                toast({ title: "Actualité modifiée avec succès" });
            } else {
                await createNews({
                    ...dataToSave,
                    authorId: user.id,
                    authorName: user.name,
                });
                toast({ title: "Actualité créée avec succès" });
            }
            onClose();
        } catch (error) {
            console.error("Error saving news:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Une erreur est survenue lors de la sauvegarde.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>{isEditing ? "Modifier l'actualité" : "Créer une actualité"}</SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? "Modifiez les informations de l'article."
                            : "Rédigez un nouvel article pour le portail intranet."}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre <span className="text-destructive">*</span></Label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Ex: Nouvelle plateforme RH"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Catégorie <span className="text-destructive">*</span></Label>
                        <Select
                            value={formData.category}
                            onValueChange={(v) => handleSelectChange('category', v)}
                        >
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Sélectionnez une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">URL de l'image de couverture (optionnel)</Label>
                        <Input
                            id="imageUrl"
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="summary">Résumé court <span className="text-destructive">*</span></Label>
                        <Textarea
                            id="summary"
                            name="summary"
                            value={formData.summary}
                            onChange={handleChange}
                            placeholder="Un paragraphe d'accroche (visible sur la carte)..."
                            rows={3}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Contenu complet (HTML autorisé) <span className="text-destructive">*</span></Label>
                        <Textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Rédigez le contenu complet de l'article ici..."
                            className="min-h-[250px] font-mono text-sm"
                            required
                        />
                    </div>

                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Publier immmediatement</Label>
                            <p className="text-sm text-muted-foreground">
                                Désactivez pour garder cet article en brouillon.
                            </p>
                        </div>
                        <Switch
                            checked={formData.published}
                            onCheckedChange={handleSwitchChange}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Mettre à jour" : "Créer l'actualité"}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
