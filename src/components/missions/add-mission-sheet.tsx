
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Mission } from "@/lib/data";
import { getLatestMissionNumber } from "@/services/mission-service";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, LogOut, PlusCircle } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";


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
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de la mission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg border-l-white/10 bg-slate-50/95 backdrop-blur-2xl p-0 overflow-hidden rounded-l-[2rem]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader className="p-8 bg-slate-900 text-white space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <LogOut className="h-24 w-24 rotate-180" />
            </div>
            <div className="relative z-10">
              <SheetTitle className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <PlusCircle className="h-6 w-6 text-emerald-400" />
                Planification Mission
              </SheetTitle>
              <SheetDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                Ouverture d'un nouveau dossier d'ordre de mission
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden px-8 py-6">
            <ScrollArea className="h-full w-full pr-4">
              {loadingInitial ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Génération du numéro de dossier...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Status & ID Header */}
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">N° Dossier</Label>
                      <p className="font-black text-slate-900 tracking-tighter">ORD-{numeroMission}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Nouveau
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Désignation de la Mission</Label>
                      <Input 
                        id="title" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="Ex: Mission d'inspection technique..."
                        className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lieuMission" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Localité de Déploiement</Label>
                      <Input 
                        id="lieuMission" 
                        value={lieuMission} 
                        onChange={(e) => setLieuMission(e.target.value)} 
                        placeholder="Ville ou district cible"
                        className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Date de Départ</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button id="startDate" variant={"outline"} className={cn("h-12 w-full justify-start text-left font-bold rounded-xl border-slate-200 bg-white", !startDate && "text-slate-400")}>
                              <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                              {startDate ? format(startDate, "dd MMM yyyy") : <span>Départ</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl">
                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="rounded-2xl" />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Date de Retour</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button id="endDate" variant={"outline"} className={cn("h-12 w-full justify-start text-left font-bold rounded-xl border-slate-200 bg-white", !endDate && "text-slate-400")}>
                              <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                              {endDate ? format(endDate, "dd MMM yyyy") : <span>Retour</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl">
                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="rounded-2xl" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Synthèse Opérationnelle</Label>
                      <Textarea 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        rows={3} 
                        placeholder="Détails complémentaires sur les objectifs de la mission..."
                        className="rounded-xl border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Priorité de Traitement</Label>
                      <Select value={status} onValueChange={(value: Mission['status']) => setStatus(value)}>
                        <SelectTrigger id="status" className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm">
                          <SelectValue placeholder="Sélectionnez un statut" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                          <SelectItem value="Planifiée" className="font-bold py-3">Planifiée (Standard)</SelectItem>
                          <SelectItem value="En cours" className="font-bold py-3">Départ Immédiat</SelectItem>
                          <SelectItem value="Terminée" className="font-bold py-3">Terminée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {error && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-black uppercase text-center tracking-widest">
                        {error}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>

          <SheetFooter className="p-8 bg-white border-t border-slate-100 sm:flex-row gap-3">
            <SheetClose asChild>
              <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[11px] text-slate-500 hover:bg-slate-50">
                Annuler
              </Button>
            </SheetClose>
            <Button 
                type="submit" 
                disabled={isSubmitting || loadingInitial}
                className="flex-[2] h-12 rounded-xl bg-slate-900 shadow-xl shadow-slate-900/20 font-black uppercase tracking-widest text-[11px] hover:bg-black active:scale-95 transition-all text-white"
            >
              {isSubmitting ? "Initialisation..." : "Créer et Programmer l'Équipage"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
