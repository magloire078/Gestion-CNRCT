
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import type { Employee } from "@/lib/data";
import { subscribeToEmployees, addEmployee, deleteEmployee, updateEmployee } from "@/services/employee-service";

import { AddEmployeeSheet } from "@/components/employees/add-employee-sheet";
import { EditEmployeeSheet } from "@/components/employees/edit-employee-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export default function AdminPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribeEmployees = subscribeToEmployees(
      (employeeList) => {
        setEmployees(employeeList);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError("Impossible de charger les employés.");
        console.error(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeEmployees();
    };
  }, []);
  
  const handleAddEmployee = async (newEmployeeData: Omit<Employee, 'id'>) => {
    try {
        await addEmployee(newEmployeeData);
        setIsAddSheetOpen(false);
        toast({
          title: "Employé ajouté",
          description: `${newEmployeeData.name} a été ajouté avec succès.`,
        });
    } catch (err) {
        toast({ variant: "destructive", title: "Erreur", description: err instanceof Error ? err.message : "Impossible d'ajouter l'employé." });
    }
  };
  
  const handleUpdateEmployee = async (employeeId: string, updatedEmployeeData: Omit<Employee, 'id'>) => {
    try {
      await updateEmployee(employeeId, updatedEmployeeData);
      setIsEditSheetOpen(false);
      toast({
        title: "Employé mis à jour",
        description: `Les informations de ${updatedEmployeeData.name} ont été mises à jour.`,
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour l'employé." });
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
      try {
        await deleteEmployee(employeeId);
        toast({ title: "Employé supprimé", description: "L'employé a été supprimé avec succès." });
      } catch (err) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'employé." });
      }
    }
  };
  
  const openEditSheet = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditSheetOpen(true);
  };


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
       <Card>
        <CardHeader>
          <CardTitle>Gestion des Employés</CardTitle>
          <CardDescription>
            Ajoutez, modifiez ou supprimez les employés de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un employé
            </Button>
          </div>
          {error && <p className="text-destructive text-center py-4">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Photo</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="hidden md:table-cell">Matricule</TableHead>
                <TableHead className="hidden md:table-cell">Rôle</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                        <Avatar>
                            <AvatarImage src={employee.photoUrl} alt={employee.name} data-ai-hint="employee photo" />
                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground md:hidden">{employee.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{employee.matricule}</TableCell>
                    <TableCell className="hidden md:table-cell">{employee.role}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditSheet(employee)}>Modifier</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteEmployee(employee.id)}>Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddEmployeeSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onAddEmployee={handleAddEmployee}
      />
       {selectedEmployee && (
            <EditEmployeeSheet
            isOpen={isEditSheetOpen}
            onClose={() => {setIsEditSheetOpen(false); setSelectedEmployee(null)}}
            onUpdateEmployee={handleUpdateEmployee}
            employee={selectedEmployee}
            />
        )}
    </div>
  );
}
