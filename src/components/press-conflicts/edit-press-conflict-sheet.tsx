"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRESS_CONFLICT_CATEGORIES,
  PRESS_CONFLICT_TYPES,
  PRESS_CONFLICT_STATUSES,
  type PressConflict,
  type PressConflictCategory,
  type PressConflictType,
  type PressConflictStatus,
} from "@/types/press-conflict";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { Loader2, Save, Pencil } from "lucide-react";

interface EditPressConflictSheetProps {
  isOpen: boolean;
  conflict: PressConflict | null;
  onCloseAction: () => void;
  onUpdateAction: (id: string, conflict: Partial<Omit<PressConflict, "id">>) => Promise<void>;
}

export function EditPressConflictSheet({
  isOpen,
  conflict,
  onCloseAction,
  onUpdateAction,
}: EditPressConflictSheetProps) {
  const [dateOfFacts, setDateOfFacts] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [locality, setLocality] = useState<string>("");
  const [category, setCategory] = useState<PressConflictCategory>("Conflit");
  const [conflictType, setConflictType] = useState<PressConflictType>("Foncier");
  const [description, setDescription] = useState<string>("");
  const [status, setStatus] = useState<PressConflictStatus>("En cours");
  const [observations, setObservations] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (conflict) {
      setDateOfFacts(conflict.dateOfFacts || "");
      setSource(conflict.source || "");
      setRegion(conflict.region || "");
      setLocality(conflict.locality || "");
      setCategory(conflict.category || "Conflit");
      setConflictType(conflict.conflictType || "Foncier");
      setDescription(conflict.description || "");
      setStatus(conflict.status || "En cours");
      setObservations(conflict.observations || "");
      setError("");
    }
  }, [conflict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conflict) return;

    if (!source.trim()) {
      setError("La source ou le nom du journal est obligatoire.");
      return;
    }
    if (!locality.trim()) {
      setError("La localité est obligatoire.");
      return;
    }
    if (!description.trim()) {
      setError("La description des faits est obligatoire.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await onUpdateAction(conflict.id, {
        dateOfFacts: dateOfFacts.trim(),
        source: source.trim(),
        region: region.trim(),
        locality: locality.trim(),
        category,
        conflictType,
        description: description.trim(),
        status,
        observations: observations.trim() || "",
      });

      onCloseAction();
    } catch (err: any) {
      console.error("Error updating press conflict:", err);
      setError(err?.message || "Erreur lors de la mise à jour du fait signalé.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onCloseAction(); }}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 bg-background">
        <SheetHeader className="px-6 py-4 border-b bg-muted/40">
          <div className="flex items-center gap-2 text-primary">
            <Pencil className="h-5 w-5" />
            <SheetTitle>Modifier le Fait Signalé {conflict?.trackingId ? `(${conflict.trackingId})` : ""}</SheetTitle>
          </div>
          <SheetDescription>
            Mise à jour des informations relevées pour la fiche N° {conflict?.orderNumber || ""}.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <form id="edit-press-conflict-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded-lg bg-destructive/15 text-destructive font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-dateOfFacts">Date des faits / Parution *</Label>
                <Input
                  id="edit-dateOfFacts"
                  value={dateOfFacts}
                  onChange={(e) => setDateOfFacts(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-source">Source / Journal *</Label>
                <Input
                  id="edit-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-region">Région</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger id="edit-region">
                    <SelectValue placeholder="Sélectionner une région" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="District Autonome d'Abidjan">District Autonome d'Abidjan</SelectItem>
                    <SelectItem value="District Autonome de Yamoussoukro">District Autonome de Yamoussoukro</SelectItem>
                    {IVORIAN_REGIONS.map((r) => (
                      <SelectItem key={r} value={`Région du ${r}`}>
                        Région de {r}
                      </SelectItem>
                    ))}
                    <SelectItem value="À vérifier (région non précisée)">À vérifier (non précisée)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-locality">Localité / Village *</Label>
                <Input
                  id="edit-locality"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-category">Catégorie *</Label>
                <Select value={category} onValueChange={(val: PressConflictCategory) => setCategory(val)}>
                  <SelectTrigger id="edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESS_CONFLICT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-conflictType">Type de conflit *</Label>
                <Select value={conflictType} onValueChange={(val: PressConflictType) => setConflictType(val)}>
                  <SelectTrigger id="edit-conflictType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESS_CONFLICT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-status">Statut du suivi *</Label>
                <Select value={status} onValueChange={(val: PressConflictStatus) => setStatus(val)}>
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESS_CONFLICT_STATUSES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description des faits *</Label>
              <Textarea
                id="edit-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-observations">Observations / Notes d'analyse</Label>
              <Textarea
                id="edit-observations"
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>
          </form>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/20 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCloseAction} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" form="edit-press-conflict-form" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mise à jour...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
