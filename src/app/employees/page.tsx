

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { PlusCircle, Search, Download, Printer, Eye, Pencil, Trash2, MoreHorizontal, ShieldCheck, Globe, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Employe, Department, Direction, Service } from "@/lib/data";
import { AddEmployeeSheet } from "@/components/employees/add-employee-sheet";
import { PrintDialog } from "@/components/employees/print-dialog";
import { subscribeToEmployees, addEmployee, deleteEmployee, getOrganizationSettings, updateEmployee, getEmployeeGroup, getOrganizationalUnits } from "@/services/employee-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Papa from "papaparse";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationControls } from "@/components/common/pagination-controls";
import { ImportDataCard } from "@/components/admin/import-data-card";
import { useAuth } from "@/hooks/use-auth";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";


type Status = 'Actif' | 'En congé' | 'Licencié' | 'Retraité' | 'Décédé';

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  'Actif': 'default',
  'En congé': 'secondary',
  'Licencié': 'destructive',
  'Retraité': 'outline',
  'Décédé': 'outline',
};

export const allColumns = {
  matricule: "N° MAT",
  name: "NOM ET PRENOMS",
  poste: "POSTE",
  department: "SERVICE", 
  email: "CONTACT",
  status: "Statut",
  CNPS: "CNPS",
};
export type ColumnKeys = keyof typeof allColumns;


export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<Employe | null>(null);


  const [departments, setDepartments] = useState<Department[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter');

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cnpsFilter, setCnpsFilter] = useState<boolean | 'all'>('all');
  const [sexeFilter, setSexeFilter] = useState('all');
  const [personnelTypeFilter, setPersonnelTypeFilter] = useState(initialFilter || 'all');

  const [columnsToPrint, setColumnsToPrint] = useState<ColumnKeys[]>(Object.keys(allColumns) as ColumnKeys[]);
  const [organizationLogos, setOrganizationLogos] = useState({ mainLogoUrl: '', secondaryLogoUrl: '', organizationName: '' });

  const [printDate, setPrintDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const canImport = hasPermission('feature:employees:import');
  const canExport = hasPermission('feature:employees:export');

  const pageTitle = useMemo(() => {
    switch (personnelTypeFilter) {
      case 'directoire': return 'Membres du Directoire';
      case 'regional': return 'Comités Régionaux';
      case 'personnel': return 'Personnel';
      case 'garde-republicaine': return 'Garde Républicaine';
      case 'gendarme': return 'Gendarmes';
      default: return 'Effectif Global';
    }
  }, [personnelTypeFilter]);

  // Handle initial filter from URL
  useEffect(() => {
    setPersonnelTypeFilter(initialFilter || 'all');
  }, [initialFilter]);


  useEffect(() => {
    const unsubEmployees = subscribeToEmployees((fetchedEmployees) => {
        setEmployees(fetchedEmployees);
        setLoading(false);
        setError(null);
    }, (err) => {
        setError("Impossible de charger les employés. Veuillez vérifier la configuration de votre base de données Firestore et les règles de sécurité.");
        console.error(err);
        setLoading(false);
    });

    async function fetchOrgData() {
        try {
            const { departments, directions, services } = await getOrganizationalUnits();
            setDepartments(departments);
            setDirections(directions);
            setServices(services);
        } catch (error) {
            console.error("Failed to fetch organizational structure", error);
        }
    }
    
    getOrganizationSettings().then(setOrganizationLogos);
    fetchOrgData();
    
    // Cleanup subscription on component unmount
    return () => unsubEmployees();
  }, []);

  useEffect(() => {
    if (isPrinting) {
      const originalTitle = document.title;
      document.title = `Liste_Personnel_${pageTitle.replace(/\s+/g, '_')}`;
      
      const style = document.createElement('style');
      style.innerHTML = `@media print { @page { size: landscape; margin: 1cm; } }`;
      document.head.appendChild(style);

      setTimeout(() => {
        window.print();
        document.head.removeChild(style);
        document.title = originalTitle;
        setIsPrinting(false);
      }, 500);
    }
  }, [isPrinting, pageTitle]);

  const handleAddEmployee = async (newEmployeeData: Omit<Employe, 'id'>, photoFile: File | null) => {
    try {
        await addEmployee(newEmployeeData, photoFile);
        // No need to update state here, onSnapshot will do it
        setIsAddSheetOpen(false);
        toast({
          title: "Employé ajouté",
          description: `${newEmployeeData.name} a été ajouté avec succès.`,
        });
    } catch (err) {
        console.error("Failed to add employee:", err);
        throw err; // Re-throw to be caught in the sheet
    }
  };
  
  const handleDeleteEmployee = async (employeeId: string) => {
      setDeleteTarget(null);
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
  };
  
  const departmentOptions = useMemo(() => {
    const allDepartments = employees.map(e => e.department).filter(Boolean);
    return [...new Set(allDepartments)].sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const filtered = employees.filter(employee => {
      const fullName = (employee.lastName || '').toLowerCase() + ' ' + (employee.firstName || '').toLowerCase();
      const matchesSearchTerm = fullName.includes(searchTerm.toLowerCase()) || (employee.matricule || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || employee.departmentId === departmentFilter;
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      const matchesCnps = cnpsFilter === 'all' || employee.CNPS === cnpsFilter;
      const matchesSexe = sexeFilter === 'all' || employee.sexe === sexeFilter;
      
      const employeeGroup = getEmployeeGroup(employee);
      const matchesPersonnelType = personnelTypeFilter === 'all' || personnelTypeFilter === employeeGroup;
      
      return matchesSearchTerm && matchesDepartment && matchesStatus && matchesCnps && matchesSexe && matchesPersonnelType;
    });
     // Reset page to 1 if filters change and current page is out of bounds
    if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
        setCurrentPage(1);
    }
    return filtered;
  }, [employees, searchTerm, departmentFilter, statusFilter, cnpsFilter, sexeFilter, personnelTypeFilter, currentPage, itemsPerPage]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  
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
        nom: e.lastName,
        prenom: e.firstName,
        email: e.email, 
        poste: e.poste, 
        department: e.department, 
        status: e.status, 
        photoUrl: e.photoUrl
    })), {
        header: true,
        columns: ["matricule", "nom", "prenom", "email", "poste", "department", "status", "photoUrl"]
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
      return `'${String(str).replace(/'/g, "''")}'`;
    };

    const tableName = 'employees';
    const columns = ['id', 'matricule', 'firstName', 'lastName', 'name', 'email', 'poste', 'department', 'status', 'photoUrl'];
    
    const sqlContent = filteredEmployees.map(emp => {
      const values = [
        escapeSql(emp.id),
        escapeSql(emp.matricule),
        escapeSql(emp.firstName),
        escapeSql(emp.lastName),
        escapeSql(emp.name),
        escapeSql(emp.email),
        escapeSql(emp.poste),
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
    
    // Fetch logos before printing
    const logos = await getOrganizationSettings();
    setOrganizationLogos(logos);

    setIsPrintDialogOpen(false);
    setIsPrinting(true);
  };

  const getAvatarBgClass = (sexe?: 'Homme' | 'Femme' | 'Autre') => {
    switch (sexe) {
      case 'Homme': return 'bg-blue-200 dark:bg-blue-800';
      case 'Femme': return 'bg-pink-200 dark:bg-pink-800';
      default: return 'bg-muted';
    }
  };
  
  const showDepartmentFilter = personnelTypeFilter === 'all' || personnelTypeFilter === 'personnel';

  const handleTabChange = (value: string) => {
    setPersonnelTypeFilter(value);
    setCurrentPage(1); // Reset to first page on tab change
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
        params.delete('filter');
    } else {
        params.set('filter', value);
    }
    router.push(`/employees?${params.toString()}`);
  }
  
  const getEmployeeOrgUnit = (employee: Employe) => {
      const service = services.find(s => s.id === employee.serviceId);
      if (service) return service.name;
      const direction = directions.find(d => d.id === employee.directionId);
      if (direction) return direction.name;
      const department = departments.find(d => d.id === employee.departmentId);
      if (department) return department.name;
      return employee.department || 'Non spécifié';
  }


  return (
    <>
        <div className={isPrinting ? 'print-hidden' : ''}>
            <div className="flex flex-col gap-6 main-content">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsPrintDialogOpen(true)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Imprimer
                        </Button>
                        {canExport && (
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
                        )}
                        <Button onClick={() => setIsAddSheetOpen(true)} className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ajouter
                        </Button>
                    </div>
                </div>

                <Tabs value={personnelTypeFilter} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
                        <TabsTrigger value="all">Effectif Global</TabsTrigger>
                        <TabsTrigger value="directoire">Membres du Directoire</TabsTrigger>
                        <TabsTrigger value="regional">Comités Régionaux</TabsTrigger>
                        <TabsTrigger value="personnel">Personnel</TabsTrigger>
                        <TabsTrigger value="garde-republicaine">Garde Républicaine</TabsTrigger>
                        <TabsTrigger value="gendarme">Gendarmes</TabsTrigger>
                    </TabsList>
                </Tabs>
                
                {canImport && (personnelTypeFilter === 'all' || personnelTypeFilter === 'personnel') && (
                  <div className="mb-6">
                      <ImportDataCard />
                  </div>
                )}

                <Card>
                    <CardHeader>
                    <CardTitle>Liste des employés</CardTitle>
                    <CardDescription>
                      Une liste complète de tous les employés de la catégorie sélectionnée.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2 mb-4 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par nom, matricule..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        </div>
                        {showDepartmentFilter && (
                           <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                           <SelectTrigger className="flex-1 min-w-[180px]">
                               <SelectValue placeholder="Filtrer par service" />
                           </SelectTrigger>
                           <SelectContent>
                               <SelectItem value="all">Tous les départements</SelectItem>
                               {departments.map(dep => <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>)}
                           </SelectContent>
                           </Select>
                        )}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="flex-1 min-w-[180px]">
                            <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="Actif">Actif</SelectItem>
                            <SelectItem value="En congé">En congé</SelectItem>
                            <SelectItem value="Licencié">Licencié</SelectItem>
                            <SelectItem value="Retraité">Retraité</SelectItem>
                            <SelectItem value="Décédé">Décédé</SelectItem>
                        </SelectContent>
                        </Select>
                        <Select value={String(cnpsFilter)} onValueChange={(val) => setCnpsFilter(val === 'all' ? 'all' : val === 'true')}>
                          <SelectTrigger className="flex-1 min-w-[150px]">
                            <SelectValue placeholder="Filter par CNPS" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous (CNPS)</SelectItem>
                            <SelectItem value="true">Déclaré</SelectItem>
                            <SelectItem value="false">Non Déclaré</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={sexeFilter} onValueChange={setSexeFilter}>
                          <SelectTrigger className="flex-1 min-w-[150px]">
                            <SelectValue placeholder="Filter par Sexe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les sexes</SelectItem>
                            <SelectItem value="Homme">Homme</SelectItem>
                            <SelectItem value="Femme">Femme</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="mb-4 text-sm text-muted-foreground">
                        {filteredEmployees.length} résultat(s) trouvé(s).
                    </div>

                    {error && <p className="text-destructive text-center py-4">{error}</p>}
                    
                    <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-[80px]">Photo</TableHead>
                            <TableHead>NOM & Prénoms</TableHead>
                            <TableHead>Matricule</TableHead>
                            <TableHead>Poste</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>CNPS</TableHead>
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
                                <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                                <TableCell><div className="flex gap-2 justify-end"><Skeleton className="h-8 w-8" /></div></TableCell>
                                </TableRow>
                            ))
                            ) : (
                                paginatedEmployees.map((employee) => (
                                   <TableRow key={employee.id}>
                                        <TableCell>
                                            <Avatar>
                                                <AvatarImage src={employee.photoUrl || ''} alt={employee.name} data-ai-hint="employee photo" />
                                                <AvatarFallback className={getAvatarBgClass(employee.sexe)}>
                                                    {(employee.lastName || '').charAt(0)}{(employee.firstName || '').charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}</div>
                                        </TableCell>
                                        <TableCell>{employee.matricule}</TableCell>
                                        <TableCell>{employee.poste}</TableCell>
                                        <TableCell>{getEmployeeOrgUnit(employee)}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariantMap[employee.status as Status] || 'default'}>{employee.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {employee.CNPS && <ShieldCheck className="h-5 w-5 text-green-600" />}
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Ouvrir le menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/employees/${employee.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Voir les détails
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                      <Link href={`/employees/${employee.id}/edit`}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Modifier
                                                      </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setDeleteTarget(employee)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Supprimer
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
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
                    {totalPages > 1 && (
                        <CardFooter>
                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                onItemsPerPageChange={setItemsPerPage}
                                totalItems={filteredEmployees.length}
                            />
                        </CardFooter>
                    )}
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
                 <ConfirmationDialog
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={() => deleteTarget && handleDeleteEmployee(deleteTarget.id)}
                    title={`Supprimer ${deleteTarget?.name} ?`}
                    description="Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible."
                />
            </div>
        </div>
        
        {isPrinting && (
            <div id="print-section" className="bg-white text-black p-8 w-full print:shadow-none print:border-none print:p-0">
                <header className="flex justify-between items-start mb-8">
                    <div className="text-center">
                        <h2 className="font-bold">Chambre Nationale des Rois et Chefs Traditionnels</h2>
                         {organizationLogos.mainLogoUrl && <img src={organizationLogos.mainLogoUrl} alt="Logo CNRCT" width={80} height={80} className="mx-auto mt-2" />}
                        <p className="font-bold mt-1 text-sm">UN CHEF NOUVEAU</p>
                        <p className="text-xs mt-4">LE DIRECTOIRE</p>
                        <p className="text-xs">LE CABINET / LE SERVICE INFORMATIQUE</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold">République de Côte d'Ivoire</p>
                        {organizationLogos.secondaryLogoUrl && <img src={organizationLogos.secondaryLogoUrl} alt="Logo Cote d'Ivoire" width={80} height={80} className="mx-auto my-2" />}
                        <p>Union - Discipline - Travail</p>
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
                        {filteredEmployees.filter(e => e.status === 'Actif').map((employee, index) => (
                            <tr key={employee.id}>
                                <td className="border border-black p-1 text-center">{index + 1}</td>
                                {columnsToPrint.map(key => {
                                    let value: React.ReactNode = employee[key as keyof Employe] as string || '';
                                    if (key === 'name') {
                                        value = `${(employee.lastName || '').toUpperCase()} ${employee.firstName || ''}`.trim();
                                    }
                                    if (key === 'CNPS') {
                                        value = employee.CNPS ? 'Oui' : 'Non';
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
                            
                        </div>
                        <div className="text-center">
                            <p className="font-bold">{organizationLogos.organizationName || "Chambre Nationale de Rois et Chefs Traditionnels (CNRCT)"}</p>
                        </div>
                        <div>
                            <p>1</p>
                        </div>
                    </div>
                </footer>
            </div>
        )}
    </>
  );
}

    

    



    
