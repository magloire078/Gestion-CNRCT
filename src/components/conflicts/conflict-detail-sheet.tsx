"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Calendar, 
    MessageSquare, 
    User, 
    MapPin, 
    CheckCircle2, 
    Clock, 
    Send, 
    Loader2, 
    AlertTriangle,
    History,
    FileText
} from "lucide-react";
import type { Conflict, ConflictComment, ConflictStatus } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { addConflictComment, updateConflictStatus } from "@/services/conflict-service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface ConflictDetailSheetProps {
    conflict: Conflict | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS: { label: string; value: ConflictStatus; color: string }[] = [
    { label: "Ouvert", value: "Ouvert", color: "bg-slate-100 text-slate-700" },
    { label: "En Médiation", value: "En médiation", color: "bg-blue-100 text-blue-700" },
    { label: "Résolu", value: "Résolu", color: "bg-emerald-100 text-emerald-700" },
    { label: "Classé sans suite", value: "Classé sans suite", color: "bg-red-100 text-red-700" },
];

export function ConflictDetailSheet({ conflict, open, onOpenChange }: ConflictDetailSheetProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!conflict) return null;

    const handleAddComment = async () => {
        if (!newComment.trim() || !user) return;
        setIsSubmitting(true);
        try {
            await addConflictComment(conflict.id, {
                author: user.name || user.email || "Utilisateur",
                content: newComment,
                date: new Date().toISOString(),
                type: 'Note'
            });
            setNewComment("");
            toast({ title: "Commentaire ajouté", description: "Votre note a été enregistrée au journal de bord." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter le commentaire." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusUpdate = async (status: ConflictStatus) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await updateConflictStatus(
                conflict.id, 
                status, 
                user.name || user.email || "Utilisateur",
                status === 'Résolu' ? "Dossier marqué comme résolu par le médiateur." : undefined
            );
            toast({ title: "Statut mis à jour", description: `Le dossier est désormais: ${status}` });
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le statut." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const sortedComments = [...(conflict.comments || [])].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl p-0 h-full flex flex-col gap-0 border-l border-slate-200">
                <SheetHeader className="p-6 bg-slate-50 border-b shrink-0 text-left">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] font-bold bg-white">{conflict.trackingId || "ID-EN-COURS"}</Badge>
                        <Badge className={cn("text-[10px] uppercase font-black", 
                            conflict.status === 'Résolu' ? "bg-emerald-500 hover:bg-emerald-600" :
                            conflict.status === 'En médiation' ? "bg-blue-500 hover:bg-blue-600" :
                            conflict.status === 'Classé sans suite' ? "bg-red-500 hover:bg-red-600" : "bg-slate-500 hover:bg-slate-600"
                        )}>
                            {conflict.status || 'Ouvert'}
                        </Badge>
                    </div>
                    <SheetTitle className="text-xl font-bold tracking-tight">{conflict.description.substring(0, 80)}...</SheetTitle>
                    <SheetDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {conflict.village}, {conflict.region}</span>
                        <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {format(parseISO(conflict.reportedDate), 'dd MMM yyyy', { locale: fr })}</span>
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8 pb-32">
                        {/* Section Details */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-900">
                                <FileText className="h-4 w-4 text-slate-500" />
                                <h3 className="text-xs font-bold uppercase tracking-wider">Informations Générales</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Parties en conflit</label>
                                    <p className="text-sm font-medium mt-1">{conflict.parties || "Non spécifiées"}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Type de conflit</label>
                                    <p className="text-sm font-medium mt-1">{conflict.type}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Description complète</label>
                                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{conflict.description}</p>
                                </div>
                            </div>
                        </section>

                        {/* Status Management */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-900">
                                <History className="h-4 w-4 text-slate-500" />
                                <h3 className="text-xs font-bold uppercase tracking-wider">Action Médiateur</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map((opt) => (
                                    <Button
                                        key={opt.value}
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "h-9 px-4 rounded-full text-xs font-bold transition-all",
                                            conflict.status === opt.value ? opt.color + " border-transparent ring-2 ring-slate-200" : "hover:bg-slate-50"
                                        )}
                                        onClick={() => handleStatusUpdate(opt.value)}
                                        disabled={isSubmitting || conflict.status === opt.value}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </section>

                        {/* Journal de Bord */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-900">
                                <MessageSquare className="h-4 w-4 text-slate-500" />
                                <h3 className="text-xs font-bold uppercase tracking-wider">Journal de Bord</h3>
                            </div>
                            
                            {/* Comment Input */}
                            <div className="bg-white border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <Textarea 
                                    className="border-none focus-visible:ring-0 resize-none min-h-[100px] text-sm p-4"
                                    placeholder="Ajouter une note importante, un compte-rendu de médiation..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <div className="bg-slate-50 p-2 flex justify-end">
                                    <Button 
                                        size="sm" 
                                        className="h-8 bg-blue-600 hover:bg-blue-700" 
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim() || isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-2" />}
                                        Enregistrer la note
                                    </Button>
                                </div>
                            </div>

                            {/* Timeline Items */}
                            <div className="space-y-4 pt-4">
                                {sortedComments.length > 0 ? (
                                    sortedComments.map((comment) => (
                                        <div key={comment.id} className="relative pl-6 pb-6 border-l border-slate-100 last:pb-0">
                                            <div className={cn(
                                                "absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full",
                                                comment.type === 'Résolution' ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" : "bg-slate-300"
                                            )} />
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                                                    <User className="h-3 w-3 text-slate-400" /> {comment.author}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium tracking-tighter uppercase tabular-nums">
                                                    {format(parseISO(comment.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "text-sm leading-relaxed p-3 rounded-lg border",
                                                comment.type === 'Résolution' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-slate-50 border-slate-100 text-slate-600"
                                            )}>
                                                {comment.content}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                        <History className="h-8 w-8 mb-2 opacity-10" />
                                        <p className="text-xs font-medium">Aucun historique pour le moment.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </ScrollArea>

                <SheetFooter className="p-4 bg-slate-50 border-t shrink-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">Fermer les détails</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
