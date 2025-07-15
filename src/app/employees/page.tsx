
"use client";

import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/lib/data";
import { AddEmployeeSheet } from "@/components/employees/add-employee-sheet";
import { getEmployees, addEmployee } from "@/services/employee-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Status = 'Active' | 'On Leave' | 'Terminated';

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> = {
  'Active': 'default',
  'On Leave': 'secondary',
  'Terminated': 'destructive',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        const fetchedEmployees = await getEmployees();
        setEmployees(fetchedEmployees);
        setError(null);
      } catch (err) {
        setError("Impossible de charger les employés. Veuillez vérifier la configuration de votre base de données Firestore et les règles de sécurité.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (newEmployeeData: Omit<Employee, 'id'>) => {
    try {
        const newEmployee = await addEmployee(newEmployeeData);
        setEmployees(prev => [...prev, newEmployee]);
        setIsSheetOpen(false);
    } catch (err) {
        console.error("Failed to add employee:", err);
        // Optionally, show an error to the user
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Employés</h1>
        <Button onClick={() => setIsSheetOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un employé
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Liste des employés</CardTitle>
          <CardDescription>Une liste complète de tous les employés de l'entreprise.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-destructive text-center py-4">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Photo</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
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
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariantMap[employee.status as Status] || 'default'}>{employee.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddEmployeeSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddEmployee={handleAddEmployee}
      />
    </div>
  );
}
