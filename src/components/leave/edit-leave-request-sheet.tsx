
"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Leave } from "@/lib/data";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";

interface EditLeaveRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateLeave: (id: string, leaveRequest: Partial<Omit<Leave, "id" | "status">>) => Promise<void>;
  leaveRequest: Leave | null;
}

export function EditLeaveRequestSheet({
  isOpen,
  onClose,
  onUpdateLeave,
  leaveRequest,
}: EditLeaveRequestSheetProps) {
  const [employee, setEmployee] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [numDecision, setNumDecision] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (leaveRequest) {
        setEmployee(leaveRequest.employee);
        setLeaveType(leaveRequest.type);
        setStartDate(parseISO(leaveRequest.startDate));
        setEndDate(parseISO(leaveRequest.endDate));
        setNumDecision(leaveRequest.num_decision || "");
        setReason(leaveRequest.reason || "");
    }
  }, [leaveRequest])

  const resetForm = () => {
    setEmployee("");
    setLeaveType("");
    setStartDate(undefined);
    setEndDate(undefined);
    setNumDecision("");
    setReason("");
    setError("");
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveRequest) return;

    if (!employee || !leaveType || !startDate || !endDate) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (leaveType === "Congé Personnel" && !reason) {
      setError("Le motif est obligatoire pour un congé personnel.");
      return;
    }
    if (endDate < startDate) {
      setError("La date de fin ne peut pas être antérieure à la date de début.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const dataToUpdate: Partial<Omit<Leave, 'id' | 'status'>> = {
        employee,
        type: leaveType as Leave['type'],
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        num_decision: leaveType === "Congé Annuel" ? numDecision : "",
        reason: leaveType === "Congé Personnel" ? reason : "",
      };

      await onUpdateLeave(leaveRequest.id, dataToUpdate);
      handleClose();
    } catch(err) {
       setError("Échec de la mise à jour de la demande. Veuillez réessayer.");
       console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
        <SheetHeader>
          <SheetTitle>Modifier la demande de congé</SheetTitle>
          <SheetDescription>
            Ajustez les détails de la demande de congé.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee" className="text-right">
              Employé
            </Label>
            <Input id="employee" value={employee} className="col-span-3" disabled />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="leaveType" className="text-right">
              Type
            </Label>
            <Select value={leaveType} onValueChange={(type) => {
              setLeaveType(type);
              if (type !== 'Congé Annuel') setNumDecision('');
              if (type !== 'Congé Personnel') setReason('');
            }}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionnez un type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Congé Annuel">Congé Annuel</SelectItem>
                <SelectItem value="Congé Maladie">Congé Maladie</SelectItem>
                <SelectItem value="Congé Personnel">Congé Personnel</SelectItem>
                <SelectItem value="Congé Maternité">Congé Maternité</SelectItem>
                <SelectItem value="Congé sans solde">Congé sans solde</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Date de début
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: fr }) : <span>Choisissez une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              Date de fin
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: fr }) : <span>Choisissez une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
          {leaveType === 'Congé Annuel' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numDecision" className="text-right">
                N° Décision
              </Label>
              <Input
                id="numDecision"
                value={numDecision}
                onChange={(e) => setNumDecision(e.target.value)}
                className="col-span-3"
                placeholder="Entrez le n° de décision"
              />
            </div>
          )}
          {leaveType === 'Congé Personnel' && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="reason-edit" className="text-right pt-2">
                Motif
              </Label>
              <Textarea
                id="reason-edit"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="col-span-3"
                rows={3}
                placeholder="Indiquez la raison du congé personnel..."
              />
            </div>
          )}
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
             {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
