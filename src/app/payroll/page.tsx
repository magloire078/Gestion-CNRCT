
"use client";

import { useState, useEffect } from "react";
import { Eye, MoreHorizontal, Pencil, CalendarClock } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import type { Employe } from "@/lib/data";
import { subscribeToEmployees, updateEmployee } from "@/services/employee-service";
import { getPayslipDetails } from "@/services/payslip-details-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { EditPayrollSheet } from "@/components/payroll/edit-payroll-sheet";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { lastDayOfMonth } from "date-fns";

type EmployeeWithNetSalary = Employe & { netSalary?: number };

export default function PayrollPage() {
  const [employees, setEmployees] = useState<EmployeeWithNetSalary[]>([]);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // State for the new date selection dialog
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());


  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToEmployees(
      async (fetchedEmployees) => {
        // Filter for employees who should be on payroll
        const payrollEmployees = fetchedEmployees.filter(e => e.status === 'Actif' || e.status === 'En congé');
        
        // Calculate net salary for each employee for the current month
        const today = new Date();
        const lastDayOfCurrentMonth = lastDayOfMonth(today).toISOString().split('T')[0];
        const employeesWithSalary = await Promise.all(
            payrollEmployees.map(async (emp) => {
                try {
                    const details = await getPayslipDetails(emp, lastDayOfCurrentMonth);
                    return { ...emp, netSalary: details.totals.netAPayer };
                } catch {
                    return { ...emp, netSalary: 0 }; // Default to 0 if calculation fails
                }
            })
        );
        
        setEmployees(employeesWithSalary);
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
  
  const openEditSheet = (employee: Employe) => {
    setSelectedEmployee(employee);
    setIsEditSheetOpen(true);
  };
  
  const openDateDialog = (employee: Employe) => {
    setSelectedEmployee(employee);
    setIsDateDialogOpen(true);
  };

  const handleNavigateToPayslip = () => {
    if (!selectedEmployee) return;

    const selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const lastDay = lastDayOfMonth(selectedDate);
    const formattedDate = lastDay.toISOString().split('T')[0]; // YYYY-MM-DD

    setIsDateDialogOpen(false);
    router.push(`/payroll/${selectedEmployee.id}?payslipDate=${formattedDate}`);
  };

  const handleUpdatePayroll = async (employeeId: string, updatedPayrollData: Partial<Employe>) => {
    try {
      if(updatedPayrollData.firstName || updatedPayrollData.lastName) {
          const originalEmployee = employees.find(e => e.id === employeeId);
          const firstName = updatedPayrollData.firstName || originalEmployee?.firstName;
          const lastName = updatedPayrollData.lastName || originalEmployee?.lastName;
          updatedPayrollData.name = `${firstName} ${lastName}`.trim();
      }
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
  
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { value: "1", label: "Janvier" }, { value: "2", label: "Février" },
    { value: "3", label: "Mars" }, { value: "4", label: "Avril" },
    { value: "5", label: "Mai" }, { value: "6", label: "Juin" },
    { value: "7", label: "Juillet" }, { value: "8", label: "Août" },
    { value: "9", label: "Septembre" }, { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" }, { value: "12", label: "Décembre" },
  ];

  const formatCurrency = (value: number | undefined) => {
      if (value === undefined) return 'N/A';
      return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " FCFA";
  }


  return (
    <>
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
                    <TableHead>Poste</TableHead>
                    <TableHead className="text-right">Salaire Net</TableHead>
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
                        <TableCell className="font-medium">{`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}</TableCell>
                        <TableCell>{employee.poste}</TableCell>
                        <TableCell className="text-right font-mono">
                         {formatCurrency(employee.netSalary)}
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
                                    <DropdownMenuItem onClick={() => openDateDialog(employee)}>
                                       <Eye className="mr-2 h-4 w-4" />
                                       Afficher le bulletin
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
                                    <p className="font-bold">{`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}</p>
                                    <p className="text-sm text-muted-foreground">{employee.poste}</p>
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
                                        <DropdownMenuItem onClick={() => openDateDialog(employee)}>
                                           <Eye className="mr-2 h-4 w-4" />
                                           Afficher le bulletin
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="mt-2 space-y-1">
                                <p className="text-sm"><span className="font-medium">Salaire Net:</span> {formatCurrency(employee.netSalary)}</p>
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
    </div>
       
       {selectedEmployee && (
        <EditPayrollSheet
            isOpen={isEditSheetOpen}
            onClose={() => setIsEditSheetOpen(false)}
            onUpdatePayroll={handleUpdatePayroll}
            employee={selectedEmployee}
        />
       )}
        <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Choisir la Période du Bulletin</DialogTitle>
                    <DialogDescription>
                        Sélectionnez le mois et l'année pour générer le bulletin de paie de {selectedEmployee?.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="year">Année</Label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="month">Mois</Label>
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger id="month"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleNavigateToPayslip}>Générer le Bulletin</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
