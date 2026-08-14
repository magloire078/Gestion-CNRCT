"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { divisions } from "@/lib/ivory-coast-divisions";
import { LocationPicker } from "@/components/common/location-picker";
import { Loader2, Plus, Newspaper, MapPin } from "lucide-react";

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
  const [department, setDepartment] = useState<string>("");
  const [subPrefecture, setSubPrefecture] = useState<string>("");
  const [locality, setLocality] = useState<string>("");
  const [category, setCategory] = useState<PressConflictCategory>("Conflit");
  const [conflictType, setConflictType] = useState<PressConflictType>("Foncier");
  const [description, setDescription] = useState<string>("");
  const [status, setStatus] = useState<PressConflictStatus>("En cours");
  const [observations, setObservations] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dynamic division calculation
  const departments = useMemo(() => {
    if (!region || region.includes("vérifier") || !divisions[region]) return [];
    return Object.keys(divisions[region]).sort();
  }, [region]);

  const subPrefectures = useMemo(() => {
    if (!region || !department || !divisions[region]?.[department]) return [];
    return Object.keys(divisions[region][department]).sort();
  }, [region, department]);

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    setDepartment("");
    setSubPrefecture("");
  };

  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    setSubPrefecture("");
  };

  const resetForm = () => {
    setDateOfFacts(new Date().toISOString().split("T")[0]);
    setSource("");
    setRegion("");
    setDepartment("");
    setSubPrefecture("");
    setLocality("");
    setCategory("Conflit");
    setConflictType("Foncier");
    setDescription("");
    setStatus("En cours");
    setObservations("");
    setLatitude("");
    setLongitude("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim()) {
      setError("La source ou le nom du journal est obligatoire.");
      return;
    }
    if (!region) {
      setError("La région est obligatoire.");
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

      const formattedRegion = region.trim() || "À vérifier";

      await onAddAction({
        dateOfFacts,
        source: source.trim(),
        region: formattedRegion,
        locality: locality.trim(),
        department: department.trim() || undefined,
        subPrefecture: subPrefecture.trim() || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCloseAction(); }}>
      <DialogContent className="sm:max-w-4xl p-0 flex flex-col max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0 text-left bg-slate-50/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Newspaper className="h-5 w-5" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900">Consigner un Fait Signalé / Presse</DialogTitle>
          </div>
          <DialogDescription className="text-slate-500">
            Enregistrement d'un fait relevé dans la presse écrite ou sur le terrain (non rattaché aux saisines officielles CNRCT).
          </DialogDescription>
        </DialogHeader>

        <form id="add-press-conflict-form" onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfFacts" className="text-slate-700 font-bold text-sm">Date des faits / Parution *</Label>
                  <Input
                    id="dateOfFacts"
                    placeholder="ex: 16/07/2026 ou 03-14/07/2026"
                    value={dateOfFacts}
                    onChange={(e) => setDateOfFacts(e.target.value)}
                    required
                    className="rounded-xl h-10 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="source" className="text-slate-700 font-bold text-sm">Source / Journal (ex: L'Inter n°8341) *</Label>
                  <Input
                    id="source"
                    list="popular-sources"
                    placeholder="Nom du journal et n° de parution..."
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    required
                    className="rounded-xl h-10 border-slate-200"
                  />
                  <datalist id="popular-sources">
                    {POPULAR_SOURCES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="region" className="text-slate-700 font-bold text-sm">Région *</Label>
                  <Select value={region} onValueChange={handleRegionChange}>
                    <SelectTrigger id="region" className="rounded-xl h-10 border-slate-200">
                      <SelectValue placeholder="Sélectionner une région" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {IVORIAN_REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                      <SelectItem value="À vérifier (région non précisée)">À vérifier (non précisée)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="department" className="text-slate-700 font-bold text-sm">Département</Label>
                    <Select value={department} onValueChange={handleDepartmentChange} disabled={!region || departments.length === 0}>
                      <SelectTrigger id="department" className="rounded-xl h-10 border-slate-200">
                        <SelectValue placeholder="Département" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {departments.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subPrefecture" className="text-slate-700 font-bold text-sm">Sous-préfecture</Label>
                    <Select value={subPrefecture} onValueChange={setSubPrefecture} disabled={!department || subPrefectures.length === 0}>
                      <SelectTrigger id="subPrefecture" className="rounded-xl h-10 border-slate-200">
                        <SelectValue placeholder="Sous-préfecture" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {subPrefectures.map((sp) => (
                          <SelectItem key={sp} value={sp}>{sp}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="locality" className="text-slate-700 font-bold text-sm">Localité / Village *</Label>
                  <Input
                    id="locality"
                    placeholder="ex: Grand-Bassam, Éloka-To..."
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    required
                    className="rounded-xl h-10 border-slate-200"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="category" className="text-slate-700 font-bold text-sm">Catégorie *</Label>
                    <Select value={category} onValueChange={(val: PressConflictCategory) => setCategory(val)}>
                      <SelectTrigger id="category" className="rounded-xl h-10 border-slate-200 text-xs">
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

                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="conflictType" className="text-slate-700 font-bold text-sm">Type *</Label>
                    <Select value={conflictType} onValueChange={(val: PressConflictType) => setConflictType(val)}>
                      <SelectTrigger id="conflictType" className="rounded-xl h-10 border-slate-200 text-xs">
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

                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="status" className="text-slate-700 font-bold text-sm">Statut *</Label>
                    <Select value={status} onValueChange={(val: PressConflictStatus) => setStatus(val)}>
                      <SelectTrigger id="status" className="rounded-xl h-10 border-slate-200 text-xs">
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
                  <Label htmlFor="description" className="text-slate-700 font-bold text-sm">Description des faits *</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Détails du différend, résumé de l'article de presse, acteurs mentionnés..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="rounded-xl resize-none border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="observations" className="text-slate-700 font-bold text-sm">Observations / Notes d'analyse</Label>
                  <Textarea
                    id="observations"
                    rows={3}
                    placeholder="Risques d'escalade, recoupement juridique, saisine potentielle de la CNRCT..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="rounded-xl resize-none border-slate-200"
                  />
                </div>
              </div>

              {/* Geographic Coordinates section - Full Width */}
              <div className="md:col-span-2 pt-4 border-t border-slate-100 space-y-4">
                <div className="space-y-1">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-rose-600" />
                    Localisation Géographique
                  </Label>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                    Indispensable pour la cartographie et l'analyse IA
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-2">
                    <LocationPicker 
                      onLocationSelectAction={(lat, lng) => {
                        setLatitude(lat.toFixed(6));
                        setLongitude(lng.toFixed(6));
                      }}
                      initialLat={latitude ? parseFloat(latitude) : undefined}
                      initialLng={longitude ? parseFloat(longitude) : undefined}
                      className="border shadow-sm rounded-2xl bg-slate-50/50"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitude" className="text-xs font-bold uppercase text-slate-500">Latitude</Label>
                        <Input 
                          id="latitude" 
                          type="number" 
                          step="any" 
                          value={latitude} 
                          onChange={e => setLatitude(e.target.value)} 
                          placeholder="0.000000"
                          className="bg-white border-slate-200 rounded-xl h-10 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude" className="text-xs font-bold uppercase text-slate-500">Longitude</Label>
                        <Input 
                          id="longitude" 
                          type="number" 
                          step="any" 
                          value={longitude} 
                          onChange={e => setLongitude(e.target.value)} 
                          placeholder="0.000000"
                          className="bg-white border-slate-200 rounded-xl h-10 shadow-sm"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic leading-relaxed">
                      Utilisez la carte pour placer le repère précisément ou saisissez directement les coordonnées GPS de la localité concernée.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {error && (
              <div className="mx-6 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-100 text-center text-sm text-rose-600 font-bold">
                {error}
              </div>
            )}
          </ScrollArea>

          <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
            <Button type="button" variant="outline" onClick={onCloseAction} disabled={isSubmitting} className="rounded-xl font-bold">
              Annuler
            </Button>
            <Button type="submit" form="add-press-conflict-form" disabled={isSubmitting} className="min-w-[150px] rounded-xl font-bold shadow-lg shadow-primary/10 gap-2">
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
