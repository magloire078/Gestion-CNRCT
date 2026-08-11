"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PlusCircle } from "lucide-react";
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
  const [make, setMake] = useState("");
  const [modelType, setModelType] = useState("");
  const [initialPlate, setInitialPlate] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [dateMiseService, setDateMiseService] = useState("");
  const [tutelle, setTutelle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [maintenanceDue, setMaintenanceDue] = useState("");
  const [status, setStatus] = useState<Fleet['status']>('Disponible');
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setPlate("");
    setMakeModel("");
    setMake("");
    setModelType("");
    setInitialPlate("");
    setChassisNumber("");
    setDateMiseService("");
    setTutelle("");
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
      setError("Veuillez remplir tous les champs obligatoires (Immatriculation, Marque & Modèle, Prochain Entretien).");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
        await onAddVehicle({ 
          plate, 
          makeModel, 
          make,
          modelType,
          initialPlate,
          chassisNumber,
          dateMiseService,
          tutelle,
          assignedTo, 
          maintenanceDue, 
          status 
        });
        handleClose();
    } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'ajout du véhicule. Veuillez réessayer.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl p-0 border-none bg-slate-50 overflow-hidden rounded-3xl shadow-3xl">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
          <DialogHeader className="p-6 bg-slate-900 text-white space-y-4">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <PlusCircle className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                    <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Intégration Véhicule</DialogTitle>
                    <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                        Enregistrement technique dans le registre du parc
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plate */}
                <div className="space-y-1 text-left">
                  <Label htmlFor="plate" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Plaque d'Immatriculation <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="plate"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all px-4 text-sm"
                    placeholder="EX: 1234 AB 01"
                    required
                  />
                </div>

                {/* Initial Plate */}
                <div className="space-y-1 text-left">
                  <Label htmlFor="initialPlate" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Immatriculation Initiale
                  </Label>
                  <Input
                    id="initialPlate"
                    value={initialPlate}
                    onChange={(e) => setInitialPlate(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all px-4 text-sm"
                    placeholder="EX: 5678 CD 01 (Si applicable)"
                  />
                </div>

                {/* MakeModel */}
                <div className="space-y-1 text-left sm:col-span-2">
                  <Label htmlFor="makeModel" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Désignation (Marque & Modèle) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="makeModel"
                    value={makeModel}
                    onChange={(e) => setMakeModel(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all px-4 text-sm"
                    placeholder="EX: TOYOTA LAND CRUISER"
                    required
                  />
                </div>

                {/* Make */}
                <div className="space-y-1 text-left">
                  <Label htmlFor="make" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Marque
                  </Label>
                  <Input
                    id="make"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all px-4 text-sm"
                    placeholder="EX: TOYOTA"
                  />
                </div>

                {/* ModelType */}
                <div className="space-y-1 text-left">
                  <Label htmlFor="modelType" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Type
                  </Label>
                  <Input
                    id="modelType"
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all px-4 text-sm"
                    placeholder="EX: SUV V8"
                  />
                </div>

                {/* ChassisNumber */}
                <div className="space-y-1 text-left">
                  <Label htmlFor="chassisNumber" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Numéro de Châssis
                  </Label>
                  <Input
                    id="chassisNumber"
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all px-4 text-sm"
                    placeholder="EX: JTEKB9FJ808..."
                  />
                </div>

                {/* DateMiseService */}
                <div className="space-y-1 text-left">
                  <Label htmlFor="dateMiseService" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Date de mise en service
                  </Label>
                  <Input
                    id="dateMiseService"
                    type="date"
                    value={dateMiseService}
                    onChange={(e) => setDateMiseService(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white font-bold transition-all px-4 text-sm"
                  />
                </div>

                {/* Tutelle */}
                <div className="space-y-1 text-left">
                  <Label htmlFor="tutelle" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Tutelle
                  </Label>
                  <Input
                    id="tutelle"
                    value={tutelle}
                    onChange={(e) => setTutelle(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all px-4 text-sm"
                    placeholder="EX: CNRCT / Présidence"
                  />
                </div>

                {/* AssignedTo */}
                <div className="space-y-1 text-left">
                  <Label htmlFor="assignedTo" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Affectation (Service / Utilisateur)
                  </Label>
                  <Input
                    id="assignedTo"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700 focus:ring-4 focus:ring-slate-900/5 transition-all px-4 text-sm"
                    placeholder="EX: Secrétariat Général / M. Koffi"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1 text-left">
                  <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Statut Opérationnel
                  </Label>
                  <Select value={status} onValueChange={(value: Fleet['status']) => setStatus(value)}>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white font-bold uppercase text-[9px] tracking-widest">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-2xl">
                          <SelectItem value="Disponible" className="font-bold py-3 uppercase text-[9px] tracking-widest">Disponible</SelectItem>
                          <SelectItem value="En mission" className="font-bold py-3 uppercase text-[9px] tracking-widest">En mission</SelectItem>
                          <SelectItem value="En maintenance" className="font-bold py-3 uppercase text-[9px] tracking-widest">En maintenance</SelectItem>
                          <SelectItem value="Hors service" className="font-bold py-3 uppercase text-[9px] tracking-widest">Hors service</SelectItem>
                          <SelectItem value="Réformé" className="font-bold py-3 uppercase text-[9px] tracking-widest">Réformé</SelectItem>
                      </SelectContent>
                  </Select>
                </div>

                {/* MaintenanceDue */}
                <div className="space-y-1 text-left">
                  <Label htmlFor="maintenanceDue" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Prochain Entretien <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="maintenanceDue"
                    type="date"
                    value={maintenanceDue}
                    onChange={(e) => setMaintenanceDue(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white font-bold transition-all px-4 text-sm"
                    required
                  />
                </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest text-center">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="p-6 border-t border-slate-100 bg-white">
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-end">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" onClick={handleClose} className="h-12 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-50 w-full sm:w-auto">
                    Annuler l'Opération
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="h-12 px-5 rounded-xl bg-slate-900 shadow-xl shadow-slate-900/20 font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all text-white w-full sm:w-auto">
                  {isSubmitting ? "Traitement..." : "Consigner le Véhicule"}
                </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
