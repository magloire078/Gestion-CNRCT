
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Fleet } from "@/lib/data";

interface AddVehicleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVehicle: (vehicle: Omit<Fleet, "id"> & { plate: string }) => Promise<void>;
}

export function AddVehicleSheet({
  isOpen,
  onClose,
  onAddVehicle,
}: AddVehicleSheetProps) {
  const [plate, setPlate] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [maintenanceDue, setMaintenanceDue] = useState("");
  const [status, setStatus] = useState<Fleet['status']>('Disponible');
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setPlate("");
    setMakeModel("");
    setAssignedTo("");
    setMaintenanceDue("");
    setStatus("Disponible");
    setError("");
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !makeModel || !maintenanceDue) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
        await onAddVehicle({ plate, makeModel, assignedTo, maintenanceDue, status });
        handleClose();
    } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'ajout du véhicule. Veuillez réessayer.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-xl p-0 border-none bg-slate-50 overflow-y-auto rounded-l-[3rem]">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <SheetHeader className="p-10 bg-slate-900 text-white space-y-4">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <PlusCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                    <SheetTitle className="text-2xl font-black uppercase tracking-tight text-white">Intégration Véhicule</SheetTitle>
                    <SheetDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                        Enregistrement technique dans le registre du parc
                    </SheetDescription>
                </div>
            </div>
          </SheetHeader>

          <div className="flex-1 p-10 space-y-10">
            <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="plate" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Plaque d'Immatriculation
                  </Label>
                  <Input
                    id="plate"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    className="h-14 rounded-2xl border-slate-200 bg-white font-black text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all px-6"
                    placeholder="EX: 1234 AB 01"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="makeModel" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Désignation Marque & Modèle
                  </Label>
                  <Input
                    id="makeModel"
                    value={makeModel}
                    onChange={(e) => setMakeModel(e.target.value)}
                    className="h-14 rounded-2xl border-slate-200 bg-white font-black text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all px-6"
                    placeholder="EX: TOYOTA LAND CRUISER"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="assignedTo" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Affectation / Détenteur
                  </Label>
                  <Input
                    id="assignedTo"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="h-14 rounded-2xl border-slate-200 bg-white font-bold text-slate-700 focus:ring-4 focus:ring-slate-900/5 transition-all px-6"
                    placeholder="NOM DE L'AGENT OU SERVICE"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="status" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">
                        Statut Opérationnel
                      </Label>
                      <Select value={status} onValueChange={(value: Fleet['status']) => setStatus(value)}>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest">
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-2xl">
                              <SelectItem value="Disponible" className="font-bold py-3 uppercase text-[9px] tracking-widest">Disponible</SelectItem>
                              <SelectItem value="En mission" className="font-bold py-3 uppercase text-[9px] tracking-widest">En mission</SelectItem>
                              <SelectItem value="En maintenance" className="font-bold py-3 uppercase text-[9px] tracking-widest">En maintenance</SelectItem>
                              <SelectItem value="Hors service" className="font-bold py-3 uppercase text-[9px] tracking-widest">Hors service</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="maintenanceDue" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">
                        Prochain Entretien
                      </Label>
                      <Input
                        id="maintenanceDue"
                        type="date"
                        value={maintenanceDue}
                        onChange={(e) => setMaintenanceDue(e.target.value)}
                        className="h-14 rounded-2xl border-slate-200 bg-white font-black transition-all px-6 uppercase text-xs"
                      />
                    </div>
                </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest text-center">
                {error}
              </div>
            )}
          </div>

          <SheetFooter className="p-10 border-t border-slate-100 bg-white mt-auto">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
                <SheetClose asChild>
                  <Button type="button" variant="ghost" onClick={handleClose} className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] text-slate-400 hover:bg-slate-50">
                    Annuler l'Opération
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 px-8 rounded-2xl bg-slate-900 shadow-xl shadow-slate-900/20 font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all text-white">
                  {isSubmitting ? "Traitement..." : "Consigner le Véhicule"}
                </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
