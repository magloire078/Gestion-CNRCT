
"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/lib/data";
import { AddEmployeeSheet } from "@/components/employees/add-employee-sheet";
import { EditEmployeeSheet } from "@/components/employees/edit-employee-sheet";
import { subscribeToEmployees, addEmployee, updateEmployee, deleteEmployee } from "@/services/employee-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import Papa from "papaparse";


type Status = 'Active' | 'On Leave' | 'Terminated';

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> = {
  'Active': 'default',
  'On Leave': 'secondary',
  'Terminated': 'destructive',
};

const departments = ["Engineering", "Marketing", "Sales", "HR", "Operations", "Informatique", "Secretariat Général", "Communication", "Direction Administrative", "Direction des Affaires financières et du patrimoine", "Protocole", "Cabinet", "Direction des Affaires sociales", "Directoire", "Comités Régionaux", "Other"];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const unsubscribe = subscribeToEmployees((fetchedEmployees) => {
        setEmployees(fetchedEmployees);
        setLoading(false);
        setError(null);
    }, (err) => {
        setError("Impossible de charger les employés. Veuillez vérifier la configuration de votre base de données Firestore et les règles de sécurité.");
        console.error(err);
        setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  const handleAddEmployee = async (newEmployeeData: Omit<Employee, 'id'>) => {
    try {
        const newEmployee = await addEmployee(newEmployeeData);
        // No need to update state here, onSnapshot will do it
        setIsAddSheetOpen(false);
        toast({
          title: "Employé ajouté",
          description: `${newEmployee.firstName} ${newEmployee.lastName} a été ajouté avec succès.`,
        });
    } catch (err) {
        console.error("Failed to add employee:", err);
        throw err; // Re-throw to be caught in the sheet
    }
  };

  const handleUpdateEmployee = async (employeeId: string, updatedEmployeeData: Omit<Employee, 'id'>) => {
    try {
      const updatedEmployee = await updateEmployee(employeeId, updatedEmployeeData);
      // No need to update state here, onSnapshot will do it
      setIsEditSheetOpen(false);
      toast({
        title: "Employé mis à jour",
        description: `Les informations de ${updatedEmployee.firstName} ${updatedEmployee.lastName} ont été mises à jour.`,
      });
    } catch (err) {
      console.error("Failed to update employee:", err);
      throw err; // Re-throw to be caught in the sheet
    }
  };
  
  const handleDeleteEmployee = async (employeeId: string) => {
      if (confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
          try {
              await deleteEmployee(employeeId);
              // No need to update state here, onSnapshot will do it
              toast({
                  title: "Employé supprimé",
                  description: "L'employé a été supprimé avec succès.",
              });
          } catch (err) {
              toast({
                  variant: "destructive",
                  title: "Erreur",
                  description: "Impossible de supprimer l'employé.",
              });
          }
      }
  };

  const openEditSheet = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditSheetOpen(true);
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      const matchesSearchTerm = fullName.includes(searchTerm.toLowerCase()) || employee.matricule.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      return matchesSearchTerm && matchesDepartment && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);
  
  const downloadFile = (content: string, fileName: string, contentType: string) => {
      const blob = new Blob([content], { type: contentType });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleExportCsv = () => {
    if (filteredEmployees.length === 0) {
      toast({ variant: "destructive", title: "Aucune donnée à exporter" });
      return;
    }
    const csvData = Papa.unparse(filteredEmployees.map(e => ({...e, name: `${e.firstName} ${e.lastName}`})), {
        header: true,
        columns: ["matricule", "name", "email", "role", "department", "status", "photoUrl"]
    });
    downloadFile(csvData, 'export_employes.csv', 'text/csv;charset=utf-8;');
    toast({ title: "Exportation CSV réussie" });
  };
  
  const handleExportJson = () => {
    if (filteredEmployees.length === 0) {
      toast({ variant: "destructive", title: "Aucune donnée à exporter" });
      return;
    }
    const jsonData = JSON.stringify(filteredEmployees, null, 2);
    downloadFile(jsonData, 'export_employes.json', 'application/json;charset=utf-8;');
    toast({ title: "Exportation JSON réussie" });
  };


  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Employés</h1>
            <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Exporter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportCsv}>Exporter en CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportJson}>Exporter en JSON</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => setIsAddSheetOpen(true)} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un employé
                </Button>
            </div>
        </div>
        <Card>
            <CardHeader>
            <CardTitle>Liste des employés</CardTitle>
            <CardDescription>Une liste complète de tous les employés de l'entreprise.</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Rechercher par nom, matricule..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrer par département" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous les départements</SelectItem>
                    {departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
                </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="Active">Actif</SelectItem>
                    <SelectItem value="On Leave">En congé</SelectItem>
                    <SelectItem value="Terminated">Licencié</SelectItem>
                </SelectContent>
                </Select>
            </div>

            {error && <p className="text-destructive text-center py-4">{error}</p>}
            
            <div className="hidden md:block">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[80px]">Photo</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                        <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))
                    ) : (
                    filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                        <TableCell>
                            <Avatar>
                            <AvatarImage src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} data-ai-hint="employee photo" />
                            <AvatarFallback>{employee.firstName?.charAt(0) || ''}{employee.lastName?.charAt(0) || ''}</AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{`${employee.firstName} ${employee.lastName}`}</TableCell>
                        <TableCell>{employee.matricule}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>
                            <Badge variant={statusVariantMap[employee.status as Status] || 'default'}>{employee.status}</Badge>
                        </TableCell>
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
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
                {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-8" />
                    </CardContent>
                    </Card>
                ))
                ) : (
                filteredEmployees.map((employee) => (
                    <Card key={employee.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} data-ai-hint="employee photo" />
                            <AvatarFallback>{employee.firstName?.charAt(0) || ''}{employee.lastName?.charAt(0) || ''}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <p className="font-medium">{`${employee.firstName} ${employee.lastName}`}</p>
                            <p className="text-sm text-muted-foreground">{employee.role}</p>
                            <p className="text-sm text-muted-foreground">{employee.department} - {employee.matricule}</p>
                            <Badge variant={statusVariantMap[employee.status as Status] || 'default'} className="mt-1">{employee.status}</Badge>
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
                                <DropdownMenuItem onClick={() => openEditSheet(employee)}>Modifier</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteEmployee(employee.id)}>Supprimer</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardContent>
                    </Card>
                ))
                )}
            </div>

            { !loading && filteredEmployees.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    Aucun employé trouvé.
                </div>
            )}
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
            onClose={() => setIsEditSheetOpen(false)}
            onUpdateEmployee={handleUpdateEmployee}
            employee={selectedEmployee}
            />
        )}
    </div>
  );
}

