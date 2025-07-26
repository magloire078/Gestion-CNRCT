
"use client";

import { useState, useEffect } from "react";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/lib/data";
import { subscribeToEmployees, updateEmployee } from "@/services/employee-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { EditPayrollSheet } from "@/components/payroll/edit-payroll-sheet";
import Link from "next/link";

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToEmployees(
      (fetchedEmployees) => {
        // Filter for employees who should be on payroll
        const payrollEmployees = fetchedEmployees.filter(e => e.status === 'Active' || e.status === 'On Leave');
        setEmployees(payrollEmployees);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError("Impossible de charger les données des employés. Veuillez vérifier votre connexion et les permissions Firestore.");
        console.error(err);
        setLoading(false);
      }
    );
     return () => unsubscribe();
  }, []);
  
  const openEditSheet = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditSheetOpen(true);
  };
  
  const handleUpdatePayroll = async (employeeId: string, updatedPayrollData: Partial<Employee>) => {
    try {
      // The service function now just updates the employee document
      await updateEmployee(employeeId, updatedPayrollData);
      setIsEditSheetOpen(false);
      toast({
        title: "Informations de paie mises à jour",
        description: `Les informations de paie pour ${updatedPayrollData.name} ont été modifiées.`,
      });
    } catch (err) {
      console.error("Failed to update payroll entry:", err);
      throw err;
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestion de la Paie</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Employés sur la Paie</CardTitle>
          <CardDescription>
            Gérez le salaire et les informations financières de tous les employés actifs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-destructive text-center py-4">{error}</p>}
          <div className="hidden md:block">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="text-right">Salaire de Base</TableHead>
                    <TableHead>Fréquence</TableHead>
                    <TableHead>Prochaine Date de Paie</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                    ))
                ) : employees.length > 0 ? (
                    employees.map((employee) => (
                    <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell className="text-right font-mono">
                        {(employee.baseSalary || 0).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "XOF",
                        })}
                        </TableCell>
                        <TableCell>
                        <Badge variant="outline">{employee.payFrequency || 'N/D'}</Badge>
                        </TableCell>
                        <TableCell>{employee.nextPayDate || 'N/D'}</TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => openEditSheet(employee)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier les infos de paie
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                       <Link href={`/payroll/${employee.id}`}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Afficher le bulletin
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : null}
                </TableBody>
            </Table>
           </div>
           <div className="grid grid-cols-1 gap-4 md:hidden">
             {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
                ))
             ) : employees.length > 0 ? (
                employees.map((employee) => (
                    <Card key={employee.id}>
                        <CardContent className="p-4">
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">{employee.name}</p>
                                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                                </div>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => openEditSheet(employee)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Modifier les infos de paie
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/payroll/${employee.id}`}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Afficher le bulletin
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="mt-2 space-y-1">
                                <p className="text-sm"><span className="font-medium">Salaire:</span> {(employee.baseSalary || 0).toLocaleString("fr-FR", { style: "currency", currency: "XOF",})}</p>
                                <p className="text-sm"><span className="font-medium">Prochaine paie:</span> {employee.nextPayDate || 'N/D'}</p>
                                <Badge variant="outline">{employee.payFrequency || 'N/D'}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))
             ) : null}
           </div>
           {!loading && employees.length === 0 && !error && (
            <div className="text-center py-10 text-muted-foreground">
                Aucun employé actif trouvé.
            </div>
          )}
        </CardContent>
      </Card>
       {selectedEmployee && (
        <EditPayrollSheet
            isOpen={isEditSheetOpen}
            onClose={() => setIsEditSheetOpen(false)}
            onUpdatePayroll={handleUpdatePayroll}
            employee={selectedEmployee}
        />
       )}
    </div>
  );
}
