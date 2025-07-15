
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { employeeData, Leave } from "@/lib/data";

interface AddLeaveRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLeaveRequest: (leaveRequest: Omit<Leave, "id" | "status">) => void;
}

export function AddLeaveRequestSheet({
  isOpen,
  onClose,
  onAddLeaveRequest,
}: AddLeaveRequestSheetProps) {
  const [employee, setEmployee] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!employee || !leaveType || !startDate || !endDate) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (endDate < startDate) {
      setError("La date de fin ne peut pas être antérieure à la date de début.");
      return;
    }
    onAddLeaveRequest({
      employee,
      type: leaveType,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    });
    setError("");
    onClose();
    // Reset form
    setEmployee("");
    setLeaveType("");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
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
                {employeeData.map((emp) => (
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
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </SheetClose>
          <Button type="submit" onClick={handleSubmit}>
            Soumettre la Demande
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
