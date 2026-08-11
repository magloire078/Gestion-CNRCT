
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Mission } from "@/lib/data";
import { getLatestMissionNumber } from "@/services/mission-service";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, LogOut, PlusCircle, MapPin, FileText, AlertCircle, Bookmark } from "lucide-react";


interface AddMissionSheetProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onAddMissionAction: (mission: Omit<Mission, "id">) => Promise<void>;
}

export function AddMissionSheet({
  isOpen,
  onCloseAction,
  onAddMissionAction,
}: AddMissionSheetProps) {
  const [numeroMission, setNumeroMission] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lieuMission, setLieuMission] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [status, setStatus] = useState<Mission['status']>('Planifiée');
  const [isRegularisation, setIsRegularisation] = useState(false);

  const [loadingInitial, setLoadingInitial] = useState(true);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function fetchInitialData() {
        setLoadingInitial(true);
        try {
          const missionNumber = await getLatestMissionNumber(true);
          setNumeroMission(missionNumber.toString().padStart(3, '0'));
        } catch (err) {
          console.error("Failed to load initial data for mission sheet", err);
          setError("Impossible de charger les données initiales.");
        } finally {
          setLoadingInitial(false);
        }
      }
      fetchInitialData();
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate(undefined);
    setEndDate(undefined);
    setLieuMission("");
    setStatus("Planifiée");
    setIsRegularisation(false);
    setError("");
  }

  const handleClose = () => {
    resetForm();
    onCloseAction();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      setError("Le titre et les dates sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onAddMissionAction({
        numeroMission,
        title,
        description,
        participants: [],
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        status,
        lieuMission,
        isRegularisation,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de la mission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl border-none p-0 overflow-hidden bg-slate-50 rounded-2xl sm:rounded-[1.5rem] shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="p-6 bg-slate-900 text-white space-y-1.5 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <LogOut className="h-24 w-24 rotate-180 text-white" />
            </div>
            <div className="relative z-10 pr-8">
              <DialogTitle className="text-xl font-extrabold uppercase tracking-tight text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-400" />
                Planification Mission
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-semibold uppercase text-[10px] tracking-widest mt-1">
                Ouverture d'un nouveau dossier d'ordre de mission
              </DialogDescription>
            </div>
          </DialogHeader>

          {loadingInitial ? (
            <div className="flex flex-col items-center justify-center h-80 gap-4 bg-slate-50">
              <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Génération du numéro de dossier...</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[65vh] p-6 bg-slate-50 space-y-4">
              {/* Status & ID Header */}
              <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">N° Dossier</Label>
                  <p className="font-extrabold text-lg text-slate-900 tracking-tight">ORD-{numeroMission}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Nouveau Dossier
                </div>
              </div>

              {/* Regularisation Toggle */}
              <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="space-y-0.5">
                  <Label htmlFor="isRegularisation" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mission de Régularisation</Label>
                  <p className="text-[10px] text-slate-400">Cette mission a déjà été effectuée</p>
                </div>
                <Switch 
                  id="isRegularisation" 
                  checked={isRegularisation} 
                  onCheckedChange={setIsRegularisation} 
                />
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-0.5 flex items-center gap-1">
                    <Bookmark className="h-3.5 w-3.5 text-slate-400" /> Désignation de la Mission
                  </Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Ex: Mission d'inspection technique..."
                    className="h-12 rounded-xl border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all pl-4"
                  />
                </div>

                {/* Lieu */}
                <div className="space-y-1.5">
                  <Label htmlFor="lieuMission" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-0.5 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> Localité de Déploiement
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      id="lieuMission" 
                      value={lieuMission} 
                      onChange={(e) => setLieuMission(e.target.value)} 
                      placeholder="Ville, District ou localité cible..."
                      className="h-12 rounded-xl border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all pl-10"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-0.5 flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5 text-slate-400" /> Date de Départ
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button id="startDate" variant={"outline"} className={cn("h-12 w-full justify-start text-left font-semibold rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-sm", !startDate && "text-slate-400")}>
                          <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                          {startDate ? format(startDate, "dd MMM yyyy") : <span>Départ</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl z-50">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="rounded-2xl bg-white" />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-0.5 flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5 text-slate-400" /> Date de Retour
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button id="endDate" variant={"outline"} className={cn("h-12 w-full justify-start text-left font-semibold rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-sm", !endDate && "text-slate-400")}>
                          <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                          {endDate ? format(endDate, "dd MMM yyyy") : <span>Retour</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl z-50">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="rounded-2xl bg-white" />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-0.5 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-slate-400" /> Synthèse Opérationnelle
                  </Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={3} 
                    placeholder="Détails complémentaires sur les objectifs de la mission..."
                    className="rounded-xl border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all p-3"
                  />
                </div>

                {/* Status / Priority */}
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-0.5 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-slate-400" /> Priorité de Traitement
                  </Label>
                  <Select value={status} onValueChange={(value: Mission['status']) => setStatus(value)}>
                    <SelectTrigger id="status" className="h-12 rounded-xl border-slate-200 bg-white font-semibold text-sm">
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl bg-white">
                      <SelectItem value="Planifiée" className="font-bold py-3 hover:bg-slate-50 cursor-pointer">Planifiée (Standard)</SelectItem>
                      <SelectItem value="En cours" className="font-bold py-3 hover:bg-slate-50 cursor-pointer">Départ Immédiat</SelectItem>
                      <SelectItem value="Terminée" className="font-bold py-3 hover:bg-slate-50 cursor-pointer">Terminée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase text-center tracking-widest">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="p-6 bg-white border-t border-slate-100 sm:flex-row gap-3 rounded-b-[1.5rem] mt-auto">
            <DialogClose asChild>
              <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider text-[11px] text-slate-500 hover:bg-slate-50">
                Annuler
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isSubmitting || loadingInitial}
              className="flex-[2] h-12 rounded-xl bg-slate-900 shadow-xl shadow-slate-900/20 font-bold uppercase tracking-wider text-[11px] hover:bg-black active:scale-95 transition-all text-white"
            >
              {isSubmitting ? "Initialisation..." : "Créer et Programmer l'Équipage"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
