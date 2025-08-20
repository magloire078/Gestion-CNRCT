
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
import type { Mission, Employe } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";
import { getLatestMissionNumber } from "@/services/mission-service";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, X, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "../ui/badge";

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
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [lieuMission, setLieuMission] = useState("");
  const [moyenTransport, setMoyenTransport] = useState("");
  const [immatriculation, setImmatriculation] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [status, setStatus] = useState<Mission['status']>('Planifiée');
  
  const [allEmployees, setAllEmployees] = useState<Employe[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function fetchInitialData() {
        setLoadingInitial(true);
        try {
          const [employees, missionNumber] = await Promise.all([
            getEmployees(),
            getLatestMissionNumber(),
          ]);
          setAllEmployees(employees.filter(e => e.status === 'Actif'));
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
    setAssignedTo([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setLieuMission("");
    setMoyenTransport("");
    setImmatriculation("");
    setStatus("Planifiée");
    setError("");
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || assignedTo.length === 0 || !startDate || !endDate) {
      setError("Le titre, au moins un participant et les dates sont obligatoires.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
        await onAddMission({ 
            numeroMission,
            title, 
            description, 
            assignedTo, 
            startDate: format(startDate, "yyyy-MM-dd"),
            endDate: format(endDate, "yyyy-MM-dd"),
            status,
            lieuMission,
            moyenTransport,
            immatriculation
        });
        handleClose();
    } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'ajout de la mission.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const toggleAssigned = (employeeName: string) => {
    setAssignedTo(prev => 
      prev.includes(employeeName) 
        ? prev.filter(name => name !== employeeName)
        : [...prev, employeeName]
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter une nouvelle mission</SheetTitle>
            <SheetDescription>
              Remplissez les détails pour planifier une nouvelle mission.
            </SheetDescription>
          </SheetHeader>
          {loadingInitial ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="numeroMission" className="text-right">N° Mission</Label>
                <Input id="numeroMission" value={numeroMission} className="col-span-3 bg-muted" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Titre</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Participants</Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start font-normal text-muted-foreground">
                        {assignedTo.length > 0 ? `${assignedTo.length} sélectionné(s)` : "Sélectionner des employés..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Rechercher un employé..."/>
                        <CommandList>
                          <CommandEmpty>Aucun employé trouvé.</CommandEmpty>
                          <CommandGroup>
                            {allEmployees.map(emp => (
                              <CommandItem key={emp.id} onSelect={() => toggleAssigned(emp.name)}>
                                <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", assignedTo.includes(emp.name) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
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
                  <div className="mt-2 flex flex-wrap gap-1">
                    {assignedTo.map(name => (
                      <Badge key={name} variant="secondary">
                        {name}
                        <button type="button" onClick={() => toggleAssigned(name)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lieuMission" className="text-right">Lieu</Label>
                <Input id="lieuMission" value={lieuMission} onChange={(e) => setLieuMission(e.target.value)} className="col-span-3" placeholder="Ville ou lieu de la mission"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="moyenTransport" className="text-right">Transport</Label>
                <Input id="moyenTransport" value={moyenTransport} onChange={(e) => setMoyenTransport(e.target.value)} className="col-span-3" placeholder="Ex: Véhicule de service, Avion..."/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="immatriculation" className="text-right">Immatriculation</Label>
                <Input id="immatriculation" value={immatriculation} onChange={(e) => setImmatriculation(e.target.value)} className="col-span-3" placeholder="Si véhicule de service"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">Date de début</Label>
                  <Popover>
                  <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Choisissez une date</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus/>
                  </PopoverContent>
                  </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">Date de fin</Label>
                  <Popover>
                  <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Choisissez une date</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus/>
                  </PopoverContent>
                  </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Statut</Label>
                <Select value={status} onValueChange={(value: Mission['status']) => setStatus(value)}>
                    <SelectTrigger className="col-span-3">
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
              {error && (
                <p className="col-span-4 text-center text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}
          <SheetFooter>
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
