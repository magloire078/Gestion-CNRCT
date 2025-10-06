
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
import type { Conflict, Chief, ConflictType } from "@/lib/data";
import { getChiefs } from "@/services/chief-service";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddConflict: (conflict: Omit<Conflict, "id">) => Promise<void>;
}

const conflictTypes: ConflictType[] = ["Foncier", "Succession", "Intercommunautaire", "Politique", "Autre"];

export function AddConflictSheet({
  isOpen,
  onClose,
  onAddConflict,
}: AddConflictDialogProps) {
  const [allChiefs, setAllChiefs] = useState<Chief[]>([]);
  const [loadingChiefs, setLoadingChiefs] = useState(true);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  const [village, setVillage] = useState("");
  const [description, setDescription] = useState("");
  const [conflictType, setConflictType] = useState<ConflictType>("Autre");
  const [status, setStatus] = useState<Conflict['status']>('En cours');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function fetchChiefs() {
        try {
          setLoadingChiefs(true);
          const chiefs = await getChiefs();
          setAllChiefs(chiefs);
        } catch (error) {
          console.error("Failed to fetch chiefs:", error);
        } finally {
          setLoadingChiefs(false);
        }
      }
      fetchChiefs();
    }
  }, [isOpen]);

  const resetForm = () => {
    setVillage("");
    setDescription("");
    setConflictType("Autre");
    setStatus("En cours");
    setLatitude('');
    setLongitude('');
    setError("");
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const handleSelectChief = (chief: Chief) => {
    setVillage(chief.village);
    if(chief.latitude) setLatitude(chief.latitude.toString());
    if(chief.longitude) setLongitude(chief.longitude.toString());
    setIsComboboxOpen(false);
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
        const reportedDate = new Date().toISOString().split('T')[0];
        const conflictData: Omit<Conflict, "id"> = { 
            village, 
            type: conflictType,
            description, 
            status, 
            reportedDate 
        };

        if (latitude && longitude) {
            conflictData.latitude = parseFloat(latitude);
            conflictData.longitude = parseFloat(longitude);
        }

        await onAddConflict(conflictData);
        handleClose();
    } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'ajout du conflit.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Signaler un nouveau conflit</SheetTitle>
            <SheetDescription>
              Remplissez les détails ci-dessous pour enregistrer un nouveau conflit.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
              <Label htmlFor="village">Village / Localité</Label>
               <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isComboboxOpen}
                            className="w-full justify-between font-normal"
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
              <Label htmlFor="conflictType">Type de Conflit</Label>
               <Select value={conflictType} onValueChange={(value: ConflictType) => setConflictType(value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type..." />
                  </SelectTrigger>
                  <SelectContent>
                      {conflictTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Décrivez la nature du conflit..."
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="status">Statut Initial</Label>
               <Select value={status} onValueChange={(value: Conflict['status']) => setStatus(value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="En cours">En cours</SelectItem>
                      <SelectItem value="En médiation">En médiation</SelectItem>
                      <SelectItem value="Résolu">Résolu</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input id="latitude" type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="Auto-rempli ou manuel"/>
                </div>
                 <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input id="longitude" type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="Auto-rempli ou manuel"/>
                </div>
            </div>
            {error && (
              <p className="col-span-4 text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
