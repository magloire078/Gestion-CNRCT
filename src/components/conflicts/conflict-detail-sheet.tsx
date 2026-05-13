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
            <SheetContent className="sm:max-w-2xl p-0 h-full flex flex-col gap-0 border-l border-slate-200 shadow-[-20px_0_50px_rgba(0,0,0,0.1)]">
                <SheetHeader className="p-10 bg-slate-950 text-white shrink-0 text-left relative overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] p-8 opacity-20 rotate-12 transition-transform duration-700 group-hover:rotate-45">
                        <Gavel className="h-64 w-64 text-indigo-500" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-500 to-rose-500" />
                    
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[10px] font-black tracking-[0.3em] bg-white/5 text-white border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
                                {conflict.trackingId || "CONF-UNIT-47"}
                            </Badge>
                            <div className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border",
                                conflict.status === 'Résolu' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                conflict.status === 'En médiation' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                conflict.status === 'Classé sans suite' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-white/5 text-slate-400 border-white/10"
                            )}>
                                <span className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]", 
                                    conflict.status === 'Résolu' ? "bg-emerald-400" :
                                    conflict.status === 'En médiation' ? "bg-indigo-400 animate-pulse" : "bg-rose-400"
                                )} />
                                {conflict.status || 'Ouvert'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <SheetTitle className="text-4xl font-black text-white leading-none uppercase tracking-tighter italic">
                                {conflict.village}
                            </SheetTitle>
                            <div className="h-1 w-20 bg-primary rounded-full" />
                        </div>
                        <SheetDescription className="text-slate-400 font-bold flex flex-wrap items-center gap-x-8 gap-y-3 mt-4">
                            <span className="flex items-center gap-2.5 hover:text-white transition-colors cursor-default"><MapPin className="h-4 w-4 text-primary" /> {conflict.region || 'Secteur Non Défini'}</span>
                            <span className="flex items-center gap-2.5 hover:text-white transition-colors cursor-default"><Calendar className="h-4 w-4 text-primary" /> Signalé le {format(parseISO(conflict.reportedDate), 'dd MMMM yyyy', { locale: fr })}</span>
                        </SheetDescription>
                    </div>
                </SheetHeader>

                <div className="grid grid-cols-2 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-20">
                    <Button 
                        variant="ghost" 
                        onClick={handlePrint}
                        className="h-16 rounded-none border-r border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all gap-3"
                    >
                        <Printer className="h-4 w-4 text-slate-400" /> Générer Fiche MGP
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="h-16 rounded-none font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                    >
                        Fermer le dossier
                    </Button>
                </div>

                <ScrollArea className="flex-1 bg-slate-50/30">
                    <div className="p-10 space-y-12 pb-32">
                        {/* Section Details - Upgraded */}
                        <section className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nature du Dossier</h3>
                                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{conflict.type}</span>
                                    </div>
                                </div>
                                <Badge variant="outline" className="font-black text-[9px] border-slate-200 text-slate-400 uppercase tracking-widest px-3 py-1 rounded-lg">ID: {conflict.id.slice(0, 8)}</Badge>
                            </div>
                            
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:scale-110" />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-slate-50 relative z-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Parties Prenantes</label>
                                        <p className="text-sm font-black text-slate-900 leading-relaxed italic border-l-4 border-slate-900 pl-4">{conflict.parties || "Analyse en cours..."}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Arbitre Référent</label>
                                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-xs text-slate-900 border border-slate-100">
                                                {conflict.mediatorName ? conflict.mediatorName.substring(0, 2).toUpperCase() : "M"}
                                            </div>
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{conflict.mediatorName || "Non assigné"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Exposé Stratégique</label>
                                    <div className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-6 rounded-2xl border border-dashed border-slate-200">
                                        "{conflict.description}"
                                    </div>
                                    {conflict.impact && (
                                        <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100/50 flex gap-4 shadow-sm">
                                            <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-1">Impact & Risques Potentiels</p>
                                                <p className="text-xs text-rose-900/70 font-bold leading-relaxed">{conflict.impact}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Status Management - Action Focus */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                                    <ArrowRight className="h-5 w-5" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pilotage de l'État d'Avancement</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                                                "h-auto py-5 px-3 flex flex-col gap-3 rounded-[1.5rem] font-black transition-all duration-500 border-slate-100",
                                                isActive 
                                                    ? "bg-slate-950 text-white border-slate-950 shadow-[0_15px_30px_rgba(0,0,0,0.15)] ring-4 ring-slate-100 -translate-y-1" 
                                                    : "hover:bg-white hover:border-slate-300 bg-white/50 text-slate-400 hover:text-slate-900"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-500",
                                                isActive ? "bg-white/10 scale-110" : "bg-slate-100"
                                            )}>
                                                <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
                                            </div>
                                            <span className="text-[9px] uppercase tracking-widest text-center leading-tight">{opt.label}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Journal de Bord - Timeline Focus */}
                        <section className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                                    <History className="h-5 w-5" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registre Chronologique des Actes</h3>
                            </div>
                            
                            <div className="bg-white border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] rounded-[2rem] overflow-hidden focus-within:ring-8 focus-within:ring-primary/5 transition-all duration-500">
                                <Textarea 
                                    className="border-none focus-visible:ring-0 resize-none min-h-[140px] text-sm p-8 font-bold text-slate-900 placeholder:text-slate-300 placeholder:italic leading-relaxed"
                                    placeholder="Consignez ici les détails de la médiation, les résolutions et les engagements..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <div className="bg-slate-50/80 backdrop-blur-md p-5 flex justify-between items-center border-t border-slate-100">
                                    <div className="flex items-center gap-2 ml-3">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Acte de Médiation Officiel</p>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        className="rounded-[1rem] px-8 font-black h-11 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95" 
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim() || isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                        Enregistrer l'Acte
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-10 pt-6">
                                {sortedComments.length > 0 ? (
                                    sortedComments.map((comment, idx) => (
                                        <div key={comment.id} className="relative pl-12 pb-10 border-l-2 border-slate-100 last:pb-0 group/time">
                                            <div className={cn(
                                                "absolute -left-[11px] top-0 h-5 w-5 rounded-full border-4 border-white transition-all duration-500 transform group-hover/time:scale-125 z-10",
                                                idx === 0 ? "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.4)] scale-110" : "bg-slate-200"
                                            )} />
                                            
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                        {comment.author.charAt(0)}
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                        {comment.author}
                                                    </span>
                                                    {comment.type === 'Statut' && (
                                                        <Badge className="bg-slate-900 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md">Système</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black tabular-nums bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                                    <Clock className="h-3 w-3" />
                                                    {format(parseISO(comment.date), 'dd MMM yyyy • HH:mm', { locale: fr })}
                                                </div>
                                            </div>
                                            
                                            <div className={cn(
                                                "text-sm leading-relaxed p-7 rounded-[1.75rem] border transition-all duration-500 relative",
                                                comment.type === 'Statut' 
                                                    ? "bg-slate-50 border-slate-200 text-slate-700 font-black italic shadow-inner" 
                                                    : "bg-white border-slate-100 text-slate-600 shadow-sm group-hover/time:border-slate-300 group-hover/time:shadow-md"
                                            )}>
                                                {comment.content}
                                                {idx === 0 && <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-ping" />}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-inner">
                                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                            <History className="h-10 w-10 text-slate-200" />
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-300">Aucun historique de médiation</p>
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
            </SheetContent>
        </Sheet>
    );
}
