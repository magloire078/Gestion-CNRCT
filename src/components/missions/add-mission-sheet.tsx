

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
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Mission, Employe, MissionParticipant, Fleet } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";
import { getLatestMissionNumber } from "@/services/mission-service";
import { getVehicles } from "@/services/fleet-service";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, X, Check, Trash2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "../ui/scroll-area";


interface AddMissionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMission: (mission: Omit<Mission, "id">) => Promise<void>;
}

export function AddMissionSheet({
  isOpen,
  onClose,
  onAddMission,
}: AddMissionSheetProps) {
  const [numeroMission, setNumeroMission] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<MissionParticipant[]>([]);
  const [lieuMission, setLieuMission] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [status, setStatus] = useState<Mission['status']>('Planifiée');
  
  const [allEmployees, setAllEmployees] = useState<Employe[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<Fleet[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function fetchInitialData() {
        setLoadingInitial(true);
        try {
          const [employees, missionNumber, vehicles] = await Promise.all([
            getEmployees(),
            getLatestMissionNumber(true),
            getVehicles(),
          ]);
          setAllEmployees(employees.filter(e => e.status === 'Actif'));
          setFleetVehicles(vehicles);
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
    setParticipants([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setLieuMission("");
    setStatus("Planifiée");
    setError("");
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || participants.length === 0 || !startDate || !endDate) {
      setError("Le titre, au moins un participant et les dates sont obligatoires.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
        let lastOrderNumber = await getLatestMissionNumber(false); 
        const participantsWithOrderNumber = participants.map(p => {
            const nextOrderNumber = lastOrderNumber++;
            return {
                ...p,
                numeroOrdre: nextOrderNumber.toString().padStart(5,'0')
            }
        });

        await onAddMission({ 
            numeroMission,
            title, 
            description, 
            participants: participantsWithOrderNumber,
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

  const handleAddParticipant = (employeeName: string) => {
    if (!participants.some(p => p.employeeName === employeeName)) {
        setParticipants(prev => [...prev, { employeeName, moyenTransport: undefined, immatriculation: '' }]);
    }
  };
  
  const handleRemoveParticipant = (employeeName: string) => {
    setParticipants(prev => prev.filter(p => p.employeeName !== employeeName));
  };

  const handleParticipantVehicleChange = (employeeName: string, field: keyof Omit<MissionParticipant, 'employeeName' | 'numeroOrdre'>, value: string) => {
    setParticipants(prev => prev.map(p => 
        p.employeeName === employeeName ? { ...p, [field]: value } : p
    ));
  };


  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <SheetHeader className="p-6">
            <SheetTitle>Ajouter une nouvelle mission</SheetTitle>
            <SheetDescription>
              Remplissez les détails pour planifier une nouvelle mission.
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1 px-6">
            {loadingInitial ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroMission">N° Dossier Mission</Label>
                  <Input id="numeroMission" value={numeroMission} className="bg-muted" readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lieuMission">Lieu</Label>
                  <Input id="lieuMission" value={lieuMission} onChange={(e) => setLieuMission(e.target.value)} placeholder="Ville ou lieu de la mission"/>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Date de début</Label>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>Choisissez une date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus/>
                        </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDate">Date de fin</Label>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>Choisissez une date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus/>
                        </PopoverContent>
                        </Popover>
                    </div>
                 </div>
                 <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select value={status} onValueChange={(value: Mission['status']) => setStatus(value)}>
                      <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un statut" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Planifiée">Planifiée</SelectItem>
                          <SelectItem value="En cours">En cours</SelectItem>
                          <SelectItem value="Terminée">Terminée</SelectItem>
                          <SelectItem value="Annulée">Annulée</SelectItem>
                      </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <Label>Participants & Véhicules</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start font-normal">Ajouter un participant...</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder="Rechercher un employé..."/>
                            <CommandList>
                            <CommandEmpty>Aucun employé trouvé.</CommandEmpty>
                            <CommandGroup>
                                {allEmployees.map(emp => (
                                <CommandItem key={emp.id} onSelect={() => handleAddParticipant(emp.name)} disabled={participants.some(p => p.employeeName === emp.name)}>
                                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", participants.some(p => p.employeeName === emp.name) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                    <Check className="h-4 w-4" />
                                    </div>
                                    <span>{emp.name}</span>
                                </CommandItem>
                                ))}
                            </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>

                    <div className="space-y-4">
                        {participants.map(p => (
                            <div key={p.employeeName} className="p-3 border rounded-md space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium">{p.employeeName}</p>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveParticipant(p.employeeName)}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor={`transport-${p.employeeName}`} className="text-xs">Moyen de Transport</Label>
                                         <Select value={p.moyenTransport} onValueChange={(value: MissionParticipant['moyenTransport']) => handleParticipantVehicleChange(p.employeeName, 'moyenTransport', value!)}>
                                            <SelectTrigger id={`transport-${p.employeeName}`}>
                                                <SelectValue placeholder="Sélectionnez..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Véhicule personnel">Véhicule personnel</SelectItem>
                                                <SelectItem value="Véhicule CNRCT">Véhicule CNRCT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                     <div className="space-y-1">
                                        <Label htmlFor={`immat-${p.employeeName}`} className="text-xs">Immatriculation</Label>
                                        <Select value={p.immatriculation} onValueChange={(value) => handleParticipantVehicleChange(p.employeeName, 'immatriculation', value)}>
                                            <SelectTrigger id={`immat-${p.employeeName}`}>
                                                <SelectValue placeholder="Sélectionnez un véhicule..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Aucun</SelectItem>
                                                {fleetVehicles.map(v => (
                                                    <SelectItem key={v.plate} value={v.plate}>{v.plate} ({v.makeModel})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                  <p className="text-center text-sm text-destructive">{error}</p>
                )}
              </div>
            )}
          </ScrollArea>
          
          <SheetFooter className="p-6 border-t">
            <SheetClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>Annuler</Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting || loadingInitial}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer la Mission"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
