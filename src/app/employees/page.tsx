
"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { employeeData, Employee } from "@/lib/data";
import { AddEmployeeSheet } from "@/components/employees/add-employee-sheet";

type Status = 'Active' | 'On Leave' | 'Terminated';

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> = {
  'Active': 'default',
  'On Leave': 'secondary',
  'Terminated': 'destructive',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(employeeData);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleAddEmployee = (newEmployee: Omit<Employee, 'id'>) => {
    const newId = `EMP${(employees.length + 1).toString().padStart(3, '0')}`;
    setEmployees([...employees, { id: newId, ...newEmployee }]);
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Employé</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[employee.status as Status] || 'default'}>{employee.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
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
