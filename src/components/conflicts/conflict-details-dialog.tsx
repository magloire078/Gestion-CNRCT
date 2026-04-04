"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { 
    MapPin, 
    Calendar, 
    User, 
    ShieldAlert, 
    History, 
    PlusCircle,
    Info,
    Hash
} from "lucide-react";
import type { Conflict, ConflictComment } from "@/types/common";
import { conflictTypeVariantMap } from "@/lib/data";
import { ConflictTimeline } from "./conflict-timeline";
import { addConflictComment } from "@/services/conflict-service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

interface ConflictDetailsDialogProps {
    conflict: Conflict | null;
    isOpen: boolean;
    onClose: () => void;
}

const statusVariantMap: Record<string, "destructive" | "default" | "secondary"> = {
    "En cours": "destructive",
    "Résolu": "default",
    "En médiation": "secondary",
};

export function ConflictDetailsDialog({ conflict, isOpen, onClose }: ConflictDetailsDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [stepType, setStepType] = useState<ConflictComment['type']>('Note');

    if (!conflict) return null;

    const handleAddStep = async () => {
        if (!newComment.trim()) return;
        
        setIsSubmitting(true);
        try {
            await addConflictComment(conflict.id, {
                author: user?.name || "Anonyme",
                content: newComment.trim(),
                date: new Date().toISOString(),
                type: stepType
            });
            
            setNewComment("");
            setStepType('Note');
            toast({
                title: "Étape ajoutée",
                description: "Le journal de médiation a été mis à jour.",
            });
        } catch (error) {
            console.error("Error adding step:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible d'ajouter l'étape de médiation.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50">
                <DialogHeader className="p-6 pb-4 bg-white border-b shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <ShieldAlert className="h-5 w-5 text-slate-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Détails du Conflit</DialogTitle>
                                <DialogDescription className="flex items-center gap-2 mt-1">
                                    <Hash className="h-3 w-3" />
                                    <span className="font-mono text-xs uppercase tracking-tighter">{conflict.trackingId || conflict.id.substring(0, 8)}</span>
                                </DialogDescription>
                            </div>
                        </div>
                        <Badge variant={statusVariantMap[conflict.status] || 'default'} className="px-3 py-1 text-xs font-bold uppercase shadow-sm">
                            {conflict.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left Panel: Information Summary */}
                    <div className="w-full md:w-80 bg-white border-r p-6 space-y-6 shrink-0 overflow-y-auto">
                        <section className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info className="h-3.5 w-3.5" /> Résumé
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> Localisation
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">{conflict.village}</p>
                                    <p className="text-xs text-slate-500">{conflict.region || 'Nationnal'}</p>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                        <History className="h-3 w-3" /> Typologie
                                    </p>
                                    <Badge variant={(conflictTypeVariantMap as any)[conflict.type] || 'outline'} className="text-[10px] font-bold">
                                        {conflict.type}
                                    </Badge>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Signalé le
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {(() => {
                                            const d = parseISO(conflict.reportedDate);
                                            return isValid(d) ? format(d, 'dd MMMM yyyy', { locale: fr }) : conflict.reportedDate;
                                        })()}
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                        <User className="h-3 w-3" /> Médiateur
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">{conflict.mediatorName || 'À assigner'}</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3 pt-4 border-t border-slate-100">
                             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Parties prenantes</h3>
                             <p className="text-xs text-slate-600 leading-relaxed italic">{conflict.parties || 'Non identifiées'}</p>
                        </section>
                    </div>

                    {/* Right Panel: Timeline & Actions */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <ScrollArea className="flex-1 p-6">
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <History className="h-4 w-4 text-slate-500" /> Journal des Étapes & Médiation
                                    </h3>
                                    <ConflictTimeline comments={conflict.comments} />
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Quick Comment Input */}
                        <div className="shrink-0 p-6 bg-white border-t space-y-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <Select value={stepType} onValueChange={(v: any) => setStepType(v)}>
                                    <SelectTrigger className="w-[180px] h-9 text-xs font-semibold">
                                        <SelectValue placeholder="Type d'action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Note">Note Interne</SelectItem>
                                        <SelectItem value="Réunion">Réunion de médiation</SelectItem>
                                        <SelectItem value="Document">Dépôt de document</SelectItem>
                                        <SelectItem value="Résolution">Résolution Finale</SelectItem>
                                        <SelectItem value="Autre">Autre Action</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Ajouter une étape au dossier</span>
                            </div>
                            <div className="flex gap-3">
                                <Textarea 
                                    placeholder="Rédiger une note ou un compte-rendu d'étape..." 
                                    className="min-h-[80px] text-sm resize-none border-slate-200 focus:ring-slate-400 transition-all"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <Button 
                                    className="h-auto px-6 font-bold"
                                    onClick={handleAddStep}
                                    disabled={isSubmitting || !newComment.trim()}
                                >
                                    {isSubmitting ? "..." : <PlusCircle className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-slate-50 shrink-0">
                    <Button variant="outline" onClick={onClose} className="px-8 font-bold">Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
