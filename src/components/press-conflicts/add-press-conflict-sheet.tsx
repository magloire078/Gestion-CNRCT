"use client";

import { useState } from "react";
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
import { Loader2, Plus, Newspaper } from "lucide-react";

interface AddPressConflictSheetProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onAddAction: (conflict: Omit<PressConflict, "id">) => Promise<void>;
}

const POPULAR_SOURCES = [
  "Fraternité Matin",
  "Notre Voie",
  "L'Inter",
  "Soir Info",
  "Le Patriote",
  "Le Nouveau Réveil",
  "Le Mandat",
  "L'Expression",
  "L'Intelligent",
  "L'Avenir",
  "Terrain / Correspondant local"
];

export function AddPressConflictSheet({
  isOpen,
  onCloseAction,
  onAddAction,
}: AddPressConflictSheetProps) {
  const [dateOfFacts, setDateOfFacts] = useState<string>(new Date().toISOString().split("T")[0]);
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

  const resetForm = () => {
    setDateOfFacts(new Date().toISOString().split("T")[0]);
    setSource("");
    setRegion("");
    setLocality("");
    setCategory("Conflit");
    setConflictType("Foncier");
    setDescription("");
    setStatus("En cours");
    setObservations("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const formattedRegion = region.trim() 
        ? (region.startsWith("Région") || region.startsWith("District") || region.startsWith("À vérifier") ? region : `Région de ${region}`)
        : "À vérifier (région non précisée)";

      await onAddAction({
        dateOfFacts,
        source: source.trim(),
        region: formattedRegion,
        locality: locality.trim(),
        category,
        conflictType,
        description: description.trim(),
        status,
        observations: observations.trim() || undefined,
      });

      resetForm();
      onCloseAction();
    } catch (err: any) {
      console.error("Error adding press conflict:", err);
      setError(err?.message || "Erreur lors de l'enregistrement du fait signalé.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onCloseAction(); }}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 bg-background">
        <SheetHeader className="px-6 py-4 border-b bg-muted/40">
          <div className="flex items-center gap-2 text-primary">
            <Newspaper className="h-5 w-5" />
            <SheetTitle>Consigner un Fait Signalé / Presse</SheetTitle>
          </div>
          <SheetDescription>
            Enregistrement d'un fait relevé dans la presse écrite ou sur le terrain (non rattaché aux saisines officielles CNRCT).
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <form id="add-press-conflict-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded-lg bg-destructive/15 text-destructive font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dateOfFacts">Date des faits / Parution *</Label>
                <Input
                  id="dateOfFacts"
                  placeholder="ex: 16/07/2026 ou 03-14/07/2026"
                  value={dateOfFacts}
                  onChange={(e) => setDateOfFacts(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="source">Source / Journal (ex: L'Inter n°8341) *</Label>
                <Input
                  id="source"
                  list="popular-sources"
                  placeholder="Nom du journal et n° de parution..."
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  required
                />
                <datalist id="popular-sources">
                  {POPULAR_SOURCES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="region">Région</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger id="region">
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
                <Label htmlFor="locality">Localité / Village *</Label>
                <Input
                  id="locality"
                  placeholder="ex: Grand-Bassam, Éloka-To..."
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={category} onValueChange={(val: PressConflictCategory) => setCategory(val)}>
                  <SelectTrigger id="category">
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
                <Label htmlFor="conflictType">Type de conflit *</Label>
                <Select value={conflictType} onValueChange={(val: PressConflictType) => setConflictType(val)}>
                  <SelectTrigger id="conflictType">
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
                <Label htmlFor="status">Statut du suivi *</Label>
                <Select value={status} onValueChange={(val: PressConflictStatus) => setStatus(val)}>
                  <SelectTrigger id="status">
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
              <Label htmlFor="description">Description des faits *</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Détails du différend, résumé de l'article de presse, acteurs mentionnés..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observations">Observations / Notes d'analyse</Label>
              <Textarea
                id="observations"
                rows={3}
                placeholder="Risques d'escalade, recoupement juridique, saisine potentielle de la CNRCT..."
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
          <Button type="submit" form="add-press-conflict-form" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Enregistrer la fiche
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
