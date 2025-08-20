
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
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
import type { Leave, Employe } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";
import { Textarea } from "../ui/textarea";
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

interface AddLeaveRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLeaveRequest: (leaveRequest: Omit<Leave, "id" | "status">) => Promise<void>;
}

export function AddLeaveRequestSheet({
  isOpen,
  onClose,
  onAddLeaveRequest,
}: AddLeaveRequestSheetProps) {
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [employee, setEmployee] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmployeeComboboxOpen, setIsEmployeeComboboxOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function fetchEmployees() {
        try {
          const fetchedEmployees = await getEmployees();
          setEmployees(fetchedEmployees.filter(e => e.status === 'Actif'));
        } catch (error) {
          console.error("Failed to fetch employees for leave request form", error);
        }
      }
      fetchEmployees();
    }
  }, [isOpen]);
  
  const resetForm = () => {
    setEmployee("");
    setLeaveType("");
    setStartDate(undefined);
    setEndDate(undefined);
    setReason("");
    setError("");
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const data: Omit<Leave, "id" | "status"> = {
        employee,
        type: leaveType as Leave['type'],
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      };

      if (leaveType === "Congé Personnel") {
        data.reason = reason;
      }

      await onAddLeaveRequest(data);
      handleClose();
    } catch(err) {
       setError("Échec de l'ajout de la demande. Veuillez réessayer.");
       console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const getDisplayName = (emp: Employe | undefined) => {
      if (!emp) return "";
      return `${emp.lastName || ''} ${emp.firstName || ''}`.trim();
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
        <SheetHeader>
          <SheetTitle>Nouvelle demande de congé</SheetTitle>
          <SheetDescription>
            Remplissez les détails ci-dessous pour soumettre une nouvelle demande de congé.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee" className="text-right">
              Employé
            </Label>
            <Popover open={isEmployeeComboboxOpen} onOpenChange={setIsEmployeeComboboxOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isEmployeeComboboxOpen}
                        className="col-span-3 justify-between font-normal"
                    >
                        {employee
                            ? getDisplayName(employees.find((emp) => emp.name === employee))
                            : "Sélectionnez un employé..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Rechercher un employé..." />
                        <CommandList>
                            <CommandEmpty>Aucun employé trouvé.</CommandEmpty>
                            <CommandGroup>
                                {employees.map((emp) => (
                                    <CommandItem
                                        key={emp.id}
                                        value={getDisplayName(emp)}
                                        onSelect={(currentValue) => {
                                            const selectedEmp = employees.find(e => getDisplayName(e).toLowerCase() === currentValue.toLowerCase());
                                            setEmployee(selectedEmp ? selectedEmp.name : "");
                                            setIsEmployeeComboboxOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                employee === emp.name ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {getDisplayName(emp)}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="leaveType" className="text-right">
              Type
            </Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
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
          {leaveType === 'Congé Personnel' && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="reason" className="text-right pt-2">
                Motif
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="col-span-3"
                rows={3}
                placeholder="Indiquez la raison du congé personnel..."
              />
            </div>
          )}
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
             {isSubmitting ? "Soumission..." : "Soumettre la Demande"}
          </Button>
        </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
