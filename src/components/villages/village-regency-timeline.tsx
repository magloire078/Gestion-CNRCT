"use client";

import { useEffect, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { Crown, History, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { deleteRegencyHistory, subscribeToRegencyHistory } from "@/services/regency-service";
import type { RegencyHistory } from "@/types/regency";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RegencyEntryDialog } from "./regency-entry-dialog";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";

type Props = {
  villageId: string;
  villageName: string;
};

function safeFormat(date?: string): string {
  if (!date) return "—";
  try {
    const d = parseISO(date);
    if (isValid(d)) return format(d, "dd MMM yyyy", { locale: fr });
    if (/^\d{4}$/.test(date)) return date;
    return date;
  } catch {
    return date;
  }
}

export function VillageRegencyTimeline({ villageId, villageName }: Props) {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canEdit = hasPermission("chiefs:update");

  const [history, setHistory] = useState<RegencyHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RegencyHistory | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<RegencyHistory | null>(null);

  useEffect(() => {
    if (!villageId) return;
    setLoading(true);
    const unsubscribe = subscribeToRegencyHistory(villageId, (items) => {
      setHistory(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [villageId]);

  const openAdd = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (entry: RegencyHistory) => {
    setEditing(entry);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRegencyHistory(deleteTarget.id);
      toast({ title: "Entrée supprimée", description: `${deleteTarget.chiefName} a été retiré de l'historique.` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ variant: "destructive", title: "Suppression impossible", description: message });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <Button onClick={openAdd} size="sm" className="rounded-xl">
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter une entrée
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
          <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            Aucun historique de régence renseigné
          </p>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
            {canEdit
              ? "Cliquez sur « Ajouter une entrée » pour démarrer la chronologie."
              : "La succession des chefs s'enrichit au fil des saisies dans le module Chefferie."}
          </p>
        </div>
      ) : (
        <ol className="relative space-y-6 border-l-2 border-slate-100 ml-3">
          {history.map((entry) => (
            <li key={entry.id} className="ml-6">
              <span
                className={cn(
                  "absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white",
                  entry.isCurrent ? "bg-emerald-500" : "bg-slate-300"
                )}
                aria-hidden="true"
              >
                <Crown className="h-3 w-3 text-white" />
              </span>
              <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 rounded-xl border border-slate-100 shrink-0">
                    <AvatarImage src={entry.photoUrl || ""} alt={entry.chiefName} />
                    <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px] font-black">
                      {entry.chiefName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900 tracking-tight">{entry.chiefName}</h3>
                      {entry.chiefTitle && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {entry.chiefTitle}
                        </span>
                      )}
                      {entry.isCurrent && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none rounded-md text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                          En fonction
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {safeFormat(entry.startDate)} → {entry.endDate ? safeFormat(entry.endDate) : "Présent"}
                    </p>
                    {entry.achievements && (
                      <p className="mt-3 text-sm text-slate-700 leading-relaxed">{entry.achievements}</p>
                    )}
                    {entry.notes && (
                      <p className="mt-2 text-xs italic text-slate-500">{entry.notes}</p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Modifier l'entrée de ${entry.chiefName}`}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100"
                        onClick={() => openEdit(entry)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Supprimer l'entrée de ${entry.chiefName}`}
                        className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => setDeleteTarget(entry)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}

      {canEdit && (
        <RegencyEntryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          villageId={villageId}
          villageName={villageName}
          entry={editing}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onCloseAction={() => setDeleteTarget(null)}
        onConfirmAction={confirmDelete}
        title="Supprimer cette entrée ?"
        description={
          deleteTarget
            ? `L'entrée de régence de ${deleteTarget.chiefName} sera retirée de l'historique. Cette action est irréversible.`
            : ""
        }
        confirmText="Supprimer"
      />
    </div>
  );
}
