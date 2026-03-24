

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Conflict, Chief, ConflictType, Employe } from "@/lib/data";
import { conflictTypes, conflictStatuses } from "@/lib/data";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { getChiefs } from "@/services/chief-service";
import { getEmployees } from "@/services/employee-service";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { LocationPicker } from "@/components/common/location-picker";
import { Switch } from "@/components/ui/switch";
import { Check, ChevronsUpDown, Info } from "lucide-react";
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

interface AddConflictDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onAddConflictAction: (conflict: Omit<Conflict, "id">) => Promise<void>;
  availableTypes?: readonly string[];
}

export function AddConflictSheet({
  isOpen,
  onCloseAction,
  onAddConflictAction,
  availableTypes = conflictTypes,
}: AddConflictDialogProps) {
  const { hasPermission, user: currentUser } = useAuth();
  const canAssignMediator = hasPermission('page:conflicts:view') || hasPermission('group:personnel:view');

  const [allChiefs, setAllChiefs] = useState<Chief[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employe[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  
  const [isVillageComboboxOpen, setIsVillageComboboxOpen] = useState(false);

  const [village, setVillage] = useState("");
  const [description, setDescription] = useState("");
  const [conflictType, setConflictType] = useState<string>("Autre");
  const [status, setStatus] = useState<Conflict['status']>('En cours');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [reportedDate, setReportedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mediatorName, setMediatorName] = useState<string | undefined>(undefined);
  const [district, setDistrict] = useState("");
  const [region, setRegion] = useState("");
  const [parties, setParties] = useState("");
  const [impact, setImpact] = useState("");
  const [incidentDate, setIncidentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function fetchInitialData() {
        try {
          setLoadingInitialData(true);
          const chiefsPromise = getChiefs();
          const employeesPromise = canAssignMediator ? getEmployees() : Promise.resolve([]);
          
          const [chiefs, employees] = await Promise.all([chiefsPromise, employeesPromise]);
          setAllChiefs(chiefs);
          if (canAssignMediator) {
            setAllEmployees(employees.filter(e => e.status === 'Actif'));
          }
        } catch (error) {
          console.error("Failed to fetch initial data:", error);
          setError("Impossible de charger certaines données de référence.");
        } finally {
          setLoadingInitialData(false);
        }
      }
      fetchInitialData();
    }
  }, [isOpen]);

  const resetForm = () => {
    setVillage("");
    setDescription("");
    setConflictType("Autre");
    setStatus("En cours");
    setLatitude('');
    setLongitude('');
    setMediatorName(undefined);
    setReportedDate(new Date().toISOString().split('T')[0]);
    setDistrict("");
    setRegion("");
    setParties("");
    setImpact("");
    setIncidentDate(new Date().toISOString().split('T')[0]);
    setIsAnonymous(false);
    setError("");
  }

  const handleClose = () => {
    resetForm();
    onCloseAction();
  }

  const handleSelectChief = (chief: Chief) => {
    setVillage(chief.village);
    if(chief.latitude) setLatitude(chief.latitude.toString());
    if(chief.longitude) setLongitude(chief.longitude.toString());
    setRegion(chief.region);
    setIsVillageComboboxOpen(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!village || !description || !conflictType) {
      setError("Le village, la description et le type de conflit sont obligatoires.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
        const conflictData: Omit<Conflict, "id"> = { 
            village, 
            type: conflictType as any,
            description, 
            status, 
            reportedDate,
            mediatorName: mediatorName === 'none' ? undefined : mediatorName,
            district,
            region,
            parties,
            impact,
            incidentDate,
            isAnonymous,
        };

        if (latitude && longitude) {
            conflictData.latitude = parseFloat(latitude);
            conflictData.longitude = parseFloat(longitude);
        }

        await onAddConflictAction(conflictData);
        handleClose();
    } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'ajout du conflit.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Signaler un nouveau conflit</DialogTitle>
            <DialogDescription>
              Remplissez les détails ci-dessous pour enregistrer un nouveau conflit.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            {/* Colonne Gauche */}
            <div className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="village">Village / Localité</Label>
                 <Popover open={isVillageComboboxOpen} onOpenChange={setIsVillageComboboxOpen}>
                      <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={isVillageComboboxOpen}
                              className="w-full justify-between font-normal"
                              disabled={loadingInitialData}
                          >
                              {village || "Sélectionnez ou entrez un village..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                              <CommandInput 
                                  placeholder="Rechercher un village..."
                                  value={village}
                                  onValueChange={setVillage}
                              />
                              <CommandList>
                                  <CommandEmpty>Aucun village trouvé. Vous pouvez entrer une nouvelle valeur.</CommandEmpty>
                                  <CommandGroup>
                                      {allChiefs.filter(c => c.village).map((chief) => (
                                          <CommandItem
                                              key={chief.id}
                                              value={chief.village}
                                              onSelect={() => handleSelectChief(chief)}
                                          >
                                              <Check
                                                  className={cn(
                                                      "mr-2 h-4 w-4",
                                                      village === chief.village ? "opacity-100" : "opacity-0"
                                                  )}
                                              />
                                              {chief.village} <span className="text-xs text-muted-foreground ml-2">({chief.region})</span>
                                          </CommandItem>
                                      ))}
                                  </CommandGroup>
                              </CommandList>
                          </Command>
                      </PopoverContent>
                  </Popover>
              </div>

               <div className="space-y-2">
                <Label htmlFor="conflictType">Typologie du Conflit</Label>
                 <Select value={conflictType} onValueChange={(value) => setConflictType(value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une typologie..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                 </Select>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="status">Statut Initial</Label>
                   <Select value={status} onValueChange={(value: Conflict['status']) => setStatus(value)}>
                      <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un statut" />
                      </SelectTrigger>
                      <SelectContent>
                          {conflictStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                   </Select>
              </div>

               <div className="space-y-2">
                  <Label htmlFor="reportedDate">Date du conflit</Label>
                  <Input 
                      id="reportedDate" 
                      type="date" 
                      value={reportedDate} 
                      onChange={(e) => setReportedDate(e.target.value)} 
                  />
              </div>

               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="incidentDate">Date de l'incident</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">La date réelle à laquelle les faits se sont produits.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input 
                      id="incidentDate" 
                      type="date" 
                      value={incidentDate} 
                      onChange={(e) => setIncidentDate(e.target.value)} 
                  />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input 
                  id="district" 
                  value={district} 
                  onChange={(e) => setDistrict(e.target.value)} 
                  placeholder="Ex: District Autonome d'Abidjan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Région</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Sélectionnez une région..." />
                  </SelectTrigger>
                  <SelectContent>
                    {IVORIAN_REGIONS.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Colonne Droite */}
            <div className="space-y-4">
              {canAssignMediator && (
                <div className="space-y-2">
                    <Label htmlFor="mediatorName">Médiateur / Responsable assigné</Label>
                    <Select value={mediatorName} onValueChange={setMediatorName}>
                        <SelectTrigger><SelectValue placeholder="Assigner un responsable..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Non assigné</SelectItem>
                            {allEmployees.map(emp => (
                                <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              )}

               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Soumission Anonyme</Label>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Standard MGP : Protection du plaignant</p>
                  </div>
                  <Switch 
                    checked={isAnonymous} 
                    onCheckedChange={setIsAnonymous} 
                  />
              </div>

               <div className="space-y-2">
                <Label htmlFor="parties">Parties impliquées</Label>
                <Input 
                  id="parties" 
                  value={parties} 
                  onChange={(e) => setParties(e.target.value)} 
                  placeholder="Ex: Famille A vs Famille B"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Résumé des faits</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Décrivez la nature du conflit..."
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Impact / Suites du conflit</Label>
                <Textarea
                  id="impact"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  rows={3}
                  placeholder="Conséquences, blessés, dégâts matériels..."
                  className="resize-none"
                />
              </div>
            </div>

            {/* Section Localisation - Pleine largeur */}
            <div className="md:col-span-2 pt-4 border-t border-primary/5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-bold">Localisation Géographique</Label>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Indispensable pour la cartographie et l'analyse IA</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-2">
                    <LocationPicker 
                        onLocationSelectAction={(lat, lng) => {
                            setLatitude(lat.toString());
                            setLongitude(lng.toString());
                        }}
                        initialLat={latitude ? parseFloat(latitude) : undefined}
                        initialLng={longitude ? parseFloat(longitude) : undefined}
                        className="border shadow-sm rounded-2xl bg-slate-50/50"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                      <div className="space-y-2">
                          <Label htmlFor="latitude" className="text-xs font-bold uppercase text-muted-foreground">Latitude</Label>
                          <Input 
                              id="latitude" 
                              type="number" 
                              step="any" 
                              value={latitude} 
                              onChange={e => setLatitude(e.target.value)} 
                              placeholder="0.000000"
                              className="bg-white border-primary/10 focus-visible:ring-primary/20"
                          />
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="longitude" className="text-xs font-bold uppercase text-muted-foreground">Longitude</Label>
                          <Input 
                              id="longitude" 
                              type="number" 
                              step="any" 
                              value={longitude} 
                              onChange={e => setLongitude(e.target.value)} 
                              placeholder="0.000000"
                              className="bg-white border-primary/10 focus-visible:ring-primary/20"
                          />
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                      Cliquez sur la carte ou utilisez le bouton "Ma position" pour remplir automatiquement ces coordonnées.
                    </p>
                  </div>
                </div>
            </div>

            {error && (
              <div className="md:col-span-2 p-3 rounded-lg bg-destructive/5 border border-destructive/10 text-center text-sm text-destructive font-medium">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-primary/5">
            <DialogClose asChild>
              <Button type="button" variant="ghost" onClick={handleClose}>
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" className="min-w-[150px]" disabled={isSubmitting || loadingInitialData}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer le signalement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
