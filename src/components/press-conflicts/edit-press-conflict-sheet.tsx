"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Loader2, Save, Pencil, MapPin } from "lucide-react";

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

  // Helper to parse region name for backward compatibility
  const parseRegionName = (regStr: string) => {
    if (!regStr) return "";
    return regStr
      .replace("Région de la ", "")
      .replace("Région de l'", "")
      .replace("Région de ", "")
      .replace("Région du ", "")
      .replace("Région des ", "")
      .replace("District de ", "")
      .replace("District des ", "")
      .replace("District Autonome de ", "")
      .replace("District Autonome d'", "")
      .replace("District Autonome des ", "")
      .trim();
  };

  useEffect(() => {
    if (conflict) {
      setDateOfFacts(conflict.dateOfFacts || "");
      setSource(conflict.source || "");
      
      const parsedReg = parseRegionName(conflict.region || "");
      setRegion(parsedReg);
      
      setDepartment(conflict.department || "");
      setSubPrefecture(conflict.subPrefecture || "");
      setLocality(conflict.locality || "");
      setCategory(conflict.category || "Conflit");
      setConflictType(conflict.conflictType || "Foncier");
      setDescription(conflict.description || "");
      setStatus(conflict.status || "En cours");
      setObservations(conflict.observations || "");
      setLatitude(conflict.latitude ? conflict.latitude.toString() : "");
      setLongitude(conflict.longitude ? conflict.longitude.toString() : "");
      setError("");
    }
  }, [conflict]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conflict) return;

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

      await onUpdateAction(conflict.id, {
        dateOfFacts: dateOfFacts.trim(),
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCloseAction(); }}>
      <DialogContent className="sm:max-w-4xl p-0 flex flex-col max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0 text-left bg-slate-50/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Pencil className="h-5 w-5" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900">Modifier le Fait Signalé {conflict?.trackingId ? `(${conflict.trackingId})` : ""}</DialogTitle>
          </div>
          <DialogDescription className="text-slate-500">
            Mise à jour des informations relevées pour la fiche N° {conflict?.orderNumber || ""}.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-press-conflict-form" onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-dateOfFacts" className="text-slate-700 font-bold text-sm">Date des faits / Parution *</Label>
                  <Input
                    id="edit-dateOfFacts"
                    value={dateOfFacts}
                    onChange={(e) => setDateOfFacts(e.target.value)}
                    required
                    className="rounded-xl h-10 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-source" className="text-slate-700 font-bold text-sm">Source / Journal *</Label>
                  <Input
                    id="edit-source"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    required
                    className="rounded-xl h-10 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-region" className="text-slate-700 font-bold text-sm">Région *</Label>
                  <Select value={region} onValueChange={handleRegionChange}>
                    <SelectTrigger id="edit-region" className="rounded-xl h-10 border-slate-200">
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
                    <Label htmlFor="edit-department" className="text-slate-700 font-bold text-sm">Département</Label>
                    <Select value={department} onValueChange={handleDepartmentChange} disabled={!region || departments.length === 0}>
                      <SelectTrigger id="edit-department" className="rounded-xl h-10 border-slate-200">
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
                    <Label htmlFor="edit-subPrefecture" className="text-slate-700 font-bold text-sm">Sous-préfecture</Label>
                    <Select value={subPrefecture} onValueChange={setSubPrefecture} disabled={!department || subPrefectures.length === 0}>
                      <SelectTrigger id="edit-subPrefecture" className="rounded-xl h-10 border-slate-200">
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
                  <Label htmlFor="edit-locality" className="text-slate-700 font-bold text-sm">Localité / Village *</Label>
                  <Input
                    id="edit-locality"
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
                    <Label htmlFor="edit-category" className="text-slate-700 font-bold text-sm">Catégorie *</Label>
                    <Select value={category} onValueChange={(val: PressConflictCategory) => setCategory(val)}>
                      <SelectTrigger id="edit-category" className="rounded-xl h-10 border-slate-200 text-xs">
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
                    <Label htmlFor="edit-conflictType" className="text-slate-700 font-bold text-sm">Type *</Label>
                    <Select value={conflictType} onValueChange={(val: PressConflictType) => setConflictType(val)}>
                      <SelectTrigger id="edit-conflictType" className="rounded-xl h-10 border-slate-200 text-xs">
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
                    <Label htmlFor="edit-status" className="text-slate-700 font-bold text-sm">Statut *</Label>
                    <Select value={status} onValueChange={(val: PressConflictStatus) => setStatus(val)}>
                      <SelectTrigger id="edit-status" className="rounded-xl h-10 border-slate-200 text-xs">
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
                  <Label htmlFor="edit-description" className="text-slate-700 font-bold text-sm">Description des faits *</Label>
                  <Textarea
                    id="edit-description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="rounded-xl resize-none border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-observations" className="text-slate-700 font-bold text-sm">Observations / Notes d'analyse</Label>
                  <Textarea
                    id="edit-observations"
                    rows={3}
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
                        <Label htmlFor="edit-latitude" className="text-xs font-bold uppercase text-slate-500">Latitude</Label>
                        <Input 
                          id="edit-latitude" 
                          type="number" 
                          step="any" 
                          value={latitude} 
                          onChange={e => setLatitude(e.target.value)} 
                          placeholder="0.000000"
                          className="bg-white border-slate-200 rounded-xl h-10 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-longitude" className="text-xs font-bold uppercase text-slate-500">Longitude</Label>
                        <Input 
                          id="edit-longitude" 
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
            <Button type="submit" form="edit-press-conflict-form" disabled={isSubmitting} className="min-w-[150px] rounded-xl font-bold shadow-lg shadow-primary/10 gap-2">
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
