"use client";

import { useState } from "react";
import type { ChiefArchiveReason } from "@/types/chief";
import type { SuccessionData } from "@/services/chief-service";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle, Skull, ShieldOff, HandshakeIcon, RefreshCcw, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const ARCHIVE_REASONS: { value: ChiefArchiveReason; label: string; description: string; color: string; icon: any }[] = [
    { value: "Décès",                    label: "Décès",                    description: "Le chef est décédé",                          color: "text-slate-600 bg-slate-100",   icon: Skull },
    { value: "Déchéance",                label: "Déchéance",                description: "Révocation ou perte du titre",                color: "text-rose-600 bg-rose-100",     icon: ShieldOff },
    { value: "Démission",                label: "Démission",                description: "Démission volontaire",                        color: "text-amber-600 bg-amber-100",   icon: HandshakeIcon },
    { value: "Succession générationnelle", label: "Succession générationnelle", description: "Transmission naturelle à un successeur", color: "text-emerald-600 bg-emerald-100", icon: RefreshCcw },
    { value: "Autre",                    label: "Autre motif",              description: "Précisez dans les notes",                     color: "text-blue-600 bg-blue-100",     icon: FileText },
];

interface SuccessionDialogProps {
    isOpen: boolean;
    outgoingChiefName: string;
    incomingChiefName?: string; // si null → siège vacant
    onConfirm: (data: SuccessionData) => Promise<void>;
    onCancel: () => void;
}

export function SuccessionDialog({
    isOpen,
    outgoingChiefName,
    incomingChiefName,
    onConfirm,
    onCancel,
}: SuccessionDialogProps) {
    const [reason, setReason] = useState<ChiefArchiveReason | "">("");
    const [archiveDate, setArchiveDate] = useState(new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleConfirm = async () => {
        if (!reason) { setError("Veuillez sélectionner un motif."); return; }
        if (!archiveDate) { setError("Veuillez renseigner la date de fin de règne."); return; }
        setError("");
        setIsSubmitting(true);
        try {
            await onConfirm({
                reason: reason as ChiefArchiveReason,
                archiveDate: new Date(archiveDate).toISOString(),
                archiveNote: note || undefined,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Une erreur est survenue.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedReason = ARCHIVE_REASONS.find(r => r.value === reason);

    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl">
                {/* Header */}
                <div className="bg-slate-950 text-white p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/20" />
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500" />
                    <AlertDialogHeader className="relative z-10 text-left">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                                Acte de Succession
                            </span>
                        </div>
                        <AlertDialogTitle className="text-xl font-black text-white">
                            Fin de règne : {outgoingChiefName}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400 font-medium text-sm">
                            {incomingChiefName
                                ? <>Ce chef sera archivé et remplacé par <span className="text-white font-bold">{incomingChiefName}</span>.</>
                                : "Ce chef sera archivé et le siège restera vacant."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5 bg-white">
                    {/* Motif */}
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Motif de la cessation de fonctions *
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                            {ARCHIVE_REASONS.map(r => {
                                const Icon = r.icon;
                                const isActive = reason === r.value;
                                return (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => { setReason(r.value); setError(""); }}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200",
                                            isActive
                                                ? "border-slate-900 bg-slate-950 text-white shadow-lg shadow-slate-900/20"
                                                : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                                            isActive ? "bg-white/10" : r.color
                                        )}>
                                            <Icon className={cn("h-4 w-4", isActive ? "text-white" : "")} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black">{r.label}</p>
                                            <p className={cn("text-[10px]", isActive ? "text-slate-400" : "text-slate-400")}>{r.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label htmlFor="archive-date" className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Date de fin de règne *
                        </Label>
                        <Input
                            id="archive-date"
                            type="date"
                            value={archiveDate}
                            onChange={e => setArchiveDate(e.target.value)}
                            className="h-10 rounded-xl border-slate-200"
                        />
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <Label htmlFor="archive-note" className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Observations (optionnel)
                        </Label>
                        <Textarea
                            id="archive-note"
                            rows={2}
                            placeholder="Ex: Fils aîné désigné successeur, décision du conseil coutumier..."
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="rounded-xl border-slate-200 resize-none text-sm"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
                            {error}
                        </p>
                    )}
                </div>

                <AlertDialogFooter className="p-4 pt-0 bg-white flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={onCancel} disabled={isSubmitting}>
                        Annuler
                    </Button>
                    <Button
                        className="flex-1 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20"
                        onClick={handleConfirm}
                        disabled={isSubmitting || !reason}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmer la succession
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
