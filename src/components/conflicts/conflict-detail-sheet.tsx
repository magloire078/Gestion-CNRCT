import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
    FileText,
    Printer,
    ArrowRight,
    Gavel,
    ShieldCheck
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
import { PrintConflictDetail } from "./conflict-print-templates";

interface ConflictDetailSheetProps {
    conflict: Conflict | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS: { label: string; value: ConflictStatus; color: string; icon: any }[] = [
    { label: "Ouvert", value: "Ouvert", color: "bg-slate-100 text-slate-700", icon: Clock },
    { label: "En Médiation", value: "En médiation", color: "bg-blue-100 text-blue-700", icon: MessageSquare },
    { label: "Résolu", value: "Résolu", color: "bg-emerald-100 text-emerald-700", icon: ShieldCheck },
    { label: "Classé sans suite", value: "Classé sans suite", color: "bg-red-100 text-red-700", icon: AlertTriangle },
];

export function ConflictDetailSheet({ conflict, open, onOpenChange }: ConflictDetailSheetProps) {
    const { toast } = useToast();
    const { user, settings } = useAuth();
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

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

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => setIsPrinting(false), 3000);
    };

    const sortedComments = [...(conflict.comments || [])].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl p-0 h-full flex flex-col gap-0 border-l border-slate-200">
                <SheetHeader className="p-8 bg-slate-900 text-white shrink-0 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                        <Gavel className="h-32 w-32" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Badge variant="outline" className="text-[10px] font-black tracking-widest bg-white/10 text-white border-white/20 px-3 py-1">
                                {conflict.trackingId || "CONF-PENDING"}
                            </Badge>
                            <Badge className={cn("text-[10px] uppercase font-black px-3 py-1", 
                                conflict.status === 'Résolu' ? "bg-emerald-500 text-white" :
                                conflict.status === 'En médiation' ? "bg-blue-500 text-white" :
                                conflict.status === 'Classé sans suite' ? "bg-red-500 text-white" : "bg-white/20 text-white"
                            )}>
                                {conflict.status || 'Ouvert'}
                            </Badge>
                        </div>
                        <SheetTitle className="text-2xl font-black text-white leading-tight uppercase tracking-tight">
                            {conflict.village}
                        </SheetTitle>
                        <SheetDescription className="text-slate-400 font-medium flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {conflict.region || 'Secteur Non Défini'}</span>
                            <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Signalé le {format(parseISO(conflict.reportedDate), 'dd MMMM yyyy', { locale: fr })}</span>
                        </SheetDescription>
                    </div>
                </SheetHeader>

                <div className="grid grid-cols-2 border-b border-slate-100">
                    <Button 
                        variant="ghost" 
                        onClick={handlePrint}
                        className="h-14 rounded-none border-r border-slate-100 font-bold text-slate-600 hover:text-primary hover:bg-slate-50 transition-all"
                    >
                        <Printer className="mr-2 h-4 w-4" /> Impression MGP
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="h-14 rounded-none font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        Fermer le volet
                    </Button>
                </div>

                <ScrollArea className="flex-1 bg-slate-50/30">
                    <div className="p-8 space-y-10 pb-32">
                        {/* Section Details - Upgraded */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <div className="p-1.5 bg-slate-100 rounded-lg">
                                        <FileText className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Nature du Dossier</h3>
                                </div>
                                <Badge variant="outline" className="font-bold text-[10px] border-slate-200 text-slate-400 uppercase">{conflict.type}</Badge>
                            </div>
                            
                            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-50">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Parties Prenantes</label>
                                        <p className="text-sm font-bold text-slate-800 leading-relaxed">{conflict.parties || "Non spécifiées"}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Médiateur Référent</label>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500 border border-slate-200">
                                                {conflict.mediatorName ? conflict.mediatorName.substring(0, 2).toUpperCase() : "M"}
                                            </div>
                                            <p className="text-sm font-bold text-slate-800">{conflict.mediatorName || "Non assigné"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Exposé des Faits</label>
                                    <p className="text-sm text-slate-600 leading-relaxed italic">"{conflict.description}"</p>
                                    {conflict.impact && (
                                        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100/50 flex gap-3">
                                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Impact & Risques</p>
                                                <p className="text-xs text-amber-900/70 font-medium leading-relaxed">{conflict.impact}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Status Management - Action Focus */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-900">
                                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Mise à jour de l'état</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {STATUS_OPTIONS.map((opt) => {
                                    const Icon = opt.icon;
                                    const isActive = conflict.status === opt.value;
                                    return (
                                        <Button
                                            key={opt.value}
                                            variant="outline"
                                            onClick={() => handleStatusUpdate(opt.value)}
                                            disabled={isSubmitting || isActive}
                                            className={cn(
                                                "h-auto py-3 px-2 flex flex-col gap-2 rounded-2xl font-bold transition-all border-slate-200",
                                                isActive ? "bg-slate-900 text-white border-slate-900 ring-4 ring-slate-100 shadow-lg" : "hover:bg-white hover:border-primary/20 bg-white/50"
                                            )}
                                        >
                                            <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
                                            <span className="text-[10px] uppercase tracking-tighter text-center">{opt.label}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Journal de Bord - Timeline Focus */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 text-slate-900">
                                <div className="p-1.5 bg-slate-100 rounded-lg">
                                    <History className="h-4 w-4 text-slate-600" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Parcours de Médiation</h3>
                            </div>
                            
                            {/* Comment Input Upgraded */}
                            <div className="bg-white border border-slate-100 shadow-sm rounded-[1.5rem] overflow-hidden focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                                <Textarea 
                                    className="border-none focus-visible:ring-0 resize-none min-h-[120px] text-sm p-6 font-medium placeholder:text-slate-400 placeholder:italic"
                                    placeholder="Décrivez l'avancée de la médiation, les engagements pris par les parties..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <div className="bg-slate-50/50 p-4 flex justify-between items-center border-t border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Note Officielle</p>
                                    <Button 
                                        size="sm" 
                                        className="rounded-xl px-6 font-black h-10 shadow-lg shadow-primary/20" 
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim() || isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-2" />}
                                        Enregistrer
                                    </Button>
                                </div>
                            </div>

                            {/* Timeline Items - Enhanced Premium */}
                            <div className="space-y-8 pt-4">
                                {sortedComments.length > 0 ? (
                                    sortedComments.map((comment, idx) => (
                                        <div key={comment.id} className="relative pl-8 pb-8 border-l-2 border-slate-100 last:pb-0 group">
                                            <div className={cn(
                                                "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white transition-all transform group-hover:scale-125",
                                                idx === 0 ? "bg-primary shadow-[0_0_0_4px_rgba(var(--primary),0.1)] scale-110" : "bg-slate-300"
                                            )} />
                                            
                                            <div className="flex items-center justify-between gap-4 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic flex items-center gap-1.5">
                                                        <User className="h-3 w-3 text-slate-400" /> {comment.author}
                                                    </span>
                                                    {comment.type === 'Statut' && (
                                                        <Badge className="bg-slate-900 text-white text-[9px] font-black uppercase px-2 py-0">Mise à jour</Badge>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-bold tabular-nums bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/50">
                                                    {format(parseISO(comment.date), 'dd MMM yyyy • HH:mm', { locale: fr })}
                                                </span>
                                            </div>
                                            
                                            <div className={cn(
                                                "text-sm leading-relaxed p-5 rounded-[1.25rem] border transition-all",
                                                comment.type === 'Statut' ? "bg-slate-50 border-slate-200 text-slate-700 font-bold" : "bg-white border-slate-100 text-slate-600 shadow-sm group-hover:border-slate-200"
                                            )}>
                                                {comment.content}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <History className="h-8 w-8 text-slate-200" />
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-300">Aucun historique de médiation</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </ScrollArea>

                {/* Print Template Overlay */}
                {isPrinting && (
                    <div className="hidden">
                        <PrintConflictDetail 
                            conflict={conflict} 
                            organizationSettings={settings} 
                        />
                    </div>
                )}
            </div>
        </Sheet>
    );
}
