
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { PlusCircle, Search, Download, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/lib/data";
import { AddEmployeeSheet } from "@/components/employees/add-employee-sheet";
import { PrintDialog } from "@/components/employees/print-dialog";
import { subscribeToEmployees, addEmployee, updateEmployee, deleteEmployee } from "@/services/employee-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Papa from "papaparse";
import Image from "next/image";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InlineEditRow } from "@/components/employees/inline-edit-row";


type Status = 'Active' | 'On Leave' | 'Terminated';

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> = {
  'Active': 'default',
  'On Leave': 'secondary',
  'Terminated': 'destructive',
};

export const departments = ["Engineering", "Marketing", "Sales", "HR", "Operations", "Informatique", "Secretariat Général", "Communication", "Direction Administrative", "Direction des Affaires financières et du patrimoine", "Protocole", "Cabinet", "Direction des Affaires sociales", "Directoire", "Comités Régionaux", "Other"];

const allColumns = {
  matricule: "N° MAT",
  name: "NOM ET PRENOMS",
  role: "FONCTION",
  department: "REGION", // Mapped to department for now
  email: "CONTACT", // Mapped to email
  status: "Statut",
};
export type ColumnKeys = keyof typeof allColumns;


export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const printSectionRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [columnsToPrint, setColumnsToPrint] = useState<ColumnKeys[]>(Object.keys(allColumns) as ColumnKeys[]);

  const [printDate, setPrintDate] = useState('');

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
        const { firstName, lastName } = newEmployeeData;
        const name = `${firstName} ${lastName}`;
        await addEmployee({ ...newEmployeeData, firstName, lastName, name });
        // No need to update state here, onSnapshot will do it
        setIsAddSheetOpen(false);
        toast({
          title: "Employé ajouté",
          description: `${name} a été ajouté avec succès.`,
        });
    } catch (err) {
        console.error("Failed to add employee:", err);
        throw err; // Re-throw to be caught in the sheet
    }
  };

  const handleUpdateEmployee = async (employeeId: string, updatedEmployeeData: Partial<Employee>) => {
    try {
      const originalEmployee = employees.find(e => e.id === employeeId);
      if (!originalEmployee) throw new Error("Employé non trouvé");

      // Merge original data with updated data to prevent overwriting fields not in the form
      const dataToUpdate = { ...originalEmployee, ...updatedEmployeeData };
      
      await updateEmployee(employeeId, dataToUpdate);
      setEditingEmployeeId(null);
      toast({
        title: "Employé mis à jour",
        description: `Les informations de ${dataToUpdate.name} ont été mises à jour.`,
      });
    } catch (err) {
      console.error("Failed to update employee:", err);
      toast({
        variant: "destructive",
        title: "Erreur de mise à jour",
        description: err instanceof Error ? err.message : "Une erreur est survenue.",
      });
      throw err;
    }
  };
  
  const handleDeleteEmployee = async (employeeId: string) => {
      if (confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
          try {
              await deleteEmployee(employeeId);
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

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const fullName = (employee.firstName && employee.lastName) ? `${employee.firstName} ${employee.lastName}`.toLowerCase() : (employee.name || '').toLowerCase();
      const matchesSearchTerm = fullName.includes(searchTerm.toLowerCase()) || (employee.matricule || '').toLowerCase().includes(searchTerm.toLowerCase());
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
    const csvData = Papa.unparse(filteredEmployees.map(e => ({
        matricule: e.matricule, 
        name: e.firstName ? `${e.firstName} ${e.lastName}` : e.name, 
        email: e.email, 
        role: e.role, 
        department: e.department, 
        status: e.status, 
        photoUrl: e.photoUrl
    })), {
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
  
  const handleExportSql = () => {
    if (filteredEmployees.length === 0) {
      toast({ variant: "destructive", title: "Aucune donnée à exporter" });
      return;
    }

    const escapeSql = (str: string | undefined | null) => {
      if (str === null || str === undefined) return 'NULL';
      return `'${str.replace(/'/g, "''")}'`;
    };

    const tableName = 'employees';
    const columns = ['id', 'matricule', 'firstName', 'lastName', 'name', 'email', 'role', 'department', 'status', 'photoUrl'];
    
    const sqlContent = filteredEmployees.map(emp => {
      const values = [
        escapeSql(emp.id),
        escapeSql(emp.matricule),
        escapeSql(emp.firstName),
        escapeSql(emp.lastName),
        escapeSql(emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.name),
        escapeSql(emp.email),
        escapeSql(emp.role),
        escapeSql(emp.department),
        escapeSql(emp.status),
        escapeSql(emp.photoUrl),
      ].join(', ');
      return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
    }).join('\n');

    downloadFile(sqlContent, 'export_employes.sql', 'application/sql');
    toast({ title: "Exportation SQL réussie" });
  };


  const handlePrint = async (selectedColumns: ColumnKeys[]) => {
    setColumnsToPrint(selectedColumns);
    const now = new Date();
    setPrintDate(now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    setIsPrinting(true);
  
    await new Promise(resolve => setTimeout(resolve, 100));
  
    const printContent = printSectionRef.current;
    if (printContent) {
      try {
        const canvas = await html2canvas(printContent, {
          scale: 2,
          useCORS: true,
          logging: true,
        });
  
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        let width = pdfWidth - 20;
        let height = width / ratio;
  
        if (height > pdfHeight - 20) {
            height = pdfHeight - 20;
            width = height * ratio;
        }
  
        const x = (pdfWidth - width) / 2;
        const y = 10;
  
        pdf.addImage(imgData, 'PNG', x, y, width, height);
        pdf.output('dataurlnewwindow');
  
      } catch (error) {
        console.error("Error generating PDF: ", error);
        toast({
          variant: "destructive",
          title: "Erreur PDF",
          description: "Impossible de générer le document PDF."
        });
      }
    }
    setIsPrinting(false);
  };

  return (
    <>
        <div className="flex flex-col gap-6 main-content">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Gestion des Employés</h1>
                <div className="flex gap-2">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsPrintDialogOpen(true)} disabled={isPrinting}>
                      {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                      Imprimer
                    </Button>
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
                        <DropdownMenuItem onClick={handleExportSql}>Exporter en SQL</DropdownMenuItem>
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
                
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[80px]">Photo</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Matricule</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Département</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                            <TableCell><div className="flex gap-2 justify-end"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                            </TableRow>
                        ))
                        ) : (
                        filteredEmployees.map((employee) => (
                           <InlineEditRow 
                             key={employee.id} 
                             employee={employee}
                             isEditing={editingEmployeeId === employee.id}
                             onEdit={() => setEditingEmployeeId(employee.id)}
                             onCancel={() => setEditingEmployeeId(null)}
                             onSave={handleUpdateEmployee}
                             onDelete={handleDeleteEmployee}
                             statusVariantMap={statusVariantMap}
                            />
                        ))
                        )}
                    </TableBody>
                    </Table>
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
             <PrintDialog
                isOpen={isPrintDialogOpen}
                onClose={() => setIsPrintDialogOpen(false)}
                onPrint={handlePrint}
                allColumns={allColumns}
            />
        </div>
        
        {/* This section is hidden by default and only used for printing to PDF */}
        <div id="print-section" ref={printSectionRef} className="fixed -left-[9999px] top-0 bg-white text-black p-8 w-[210mm] opacity-0 -z-50">
            <header className="flex justify-between items-start mb-8">
                <div className="text-center">
                    <h2 className="font-bold">Chambre Nationale des Rois</h2>
                    <h2 className="font-bold">et Chefs Traditionnels</h2>
                    <Image src="https://placehold.co/100x100.png" alt="Logo CNRCT" width={80} height={80} className="mx-auto mt-2" data-ai-hint="logo traditional" />
                    <p className="font-bold mt-1 text-sm">UN CHEF NOUVEAU</p>
                    <p className="text-xs mt-4">LE DIRECTOIRE</p>
                    <p className="text-xs">LE CABINET / LE SERVICE INFORMATIQUE</p>
                </div>
                <div className="text-center">
                    <h2 className="font-bold">République de Côte d'Ivoire</h2>
                    <Image src="https://placehold.co/100x100.png" alt="Logo Cote d'Ivoire" width={80} height={80} className="mx-auto mt-2" data-ai-hint="emblem ivory coast"/>
                    <p className="mt-1">Union - Discipline - Travail</p>
                </div>
            </header>

            <div className="text-center my-6">
                <h1 className="text-lg font-bold underline">LISTE ALPHABETIQUE DES MEMBRES DU DIRECTIORE EN DATE DU {printDate}</h1>
                <h2 className="text-md font-bold mt-4">PERSONNELS ACTIFS</h2>
            </div>
            
            <table className="w-full text-xs border-collapse border border-black">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-black p-1">N°</th>
                        {columnsToPrint.map(key => <th key={key} className="border border-black p-1 text-left font-bold">{allColumns[key]}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {filteredEmployees.map((employee, index) => (
                        <tr key={employee.id}>
                            <td className="border border-black p-1 text-center">{index + 1}</td>
                            {columnsToPrint.map(key => {
                                let value: React.ReactNode = employee[key as keyof Employee] as string || '';
                                if (key === 'name' && (employee.firstName || employee.lastName)) {
                                    value = `${employee.lastName || ''} ${employee.firstName || ''}`.trim();
                                }
                                return <td key={key} className="border border-black p-1">{value}</td>
                           })}
                        </tr>
                    ))}
                </tbody>
            </table>

            <footer className="mt-8 text-xs">
                <div className="flex justify-between items-end">
                    <div>
                        <p>{new Date().toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold">Chambre Nationale de Rois et Chefs Traditionnels (CNRCT)</p>
                        <p>Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63</p>
                        <p>www.cnrct.ci - Email : info@cnrct.ci</p>
                    </div>
                    <div>
                        <p>1</p>
                    </div>
                </div>
            </footer>
        </div>
    </>
  );
}

    