
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
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
import type { Leave, Employee } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employee, setEmployee] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function fetchEmployees() {
        try {
          const fetchedEmployees = await getEmployees();
          setEmployees(fetchedEmployees.filter(e => e.status === 'Active'));
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
    if (endDate < startDate) {
      setError("La date de fin ne peut pas être antérieure à la date de début.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      await onAddLeaveRequest({
        employee,
        type: leaveType,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      });
      handleClose();
    } catch(err) {
       setError("Échec de l'ajout de la demande. Veuillez réessayer.");
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
            <Select value={employee} onValueChange={setEmployee}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionnez un employé..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.name}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <SelectItem value="Annual Leave">Congé Annuel</SelectItem>
                <SelectItem value="Sick Leave">Congé Maladie</SelectItem>
                <SelectItem value="Personal Leave">Congé Personnel</SelectItem>
                <SelectItem value="Maternity Leave">Congé Maternité</SelectItem>
                <SelectItem value="Unpaid Leave">Congé sans solde</SelectItem>
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
                  {startDate ? format(startDate, "PPP") : <span>Choisissez une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
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
                  {endDate ? format(endDate, "PPP") : <span>Choisissez une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
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
