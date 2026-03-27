

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { format, parseISO, differenceInYears } from "date-fns";
import { fr } from "date-fns/locale";
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
import type { Employe, Department, Direction, Service, OrganizationSettings } from "@/lib/data";
import { AddEmployeeSheet } from "@/components/employees/add-employee-sheet";
import { PrintDialog } from "@/components/employees/print-dialog";
import { subscribeToEmployees, addEmployee, deleteEmployee, getEmployeeGroup, getOrganizationalUnits } from "@/services/employee-service";
import { getOrganizationSettings } from "@/services/organization-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Papa from "papaparse";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationControls } from "@/components/common/pagination-controls";
import { ImportEmployeesDataCard } from "@/components/employees/import-employees-data-card";
import { useAuth } from "@/hooks/use-auth";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { PrintLayout } from "@/components/reports/print-layout";


import { divisions } from "@/lib/ivory-coast-divisions";
import dynamic from 'next/dynamic';
import { useTransition } from "react";
const DirectoireMap = dynamic<{ members: any[]; className?: string }>(() => import('@/components/employees/directoire-map').then(m => m.DirectoireMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-xl" />,
});

type Status = 'Actif' | 'En congé' | 'Licencié' | 'Retraité' | 'Décédé';

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  'Actif': 'default',
  'En congé': 'secondary',
  'Licencié': 'destructive',
  'Retraité': 'outline',
  'Décédé': 'outline',
};

import { allColumns, type ColumnKeys } from "@/lib/constants/employee";
import { DebouncedInput } from "@/components/ui/debounced-input";

// Simplified debounced input to keep typing local and fast

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading, hasPermission } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<Employe | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const [regionFilter, setRegionFilter] = useState("all");
  const [geoDepartementFilter, setGeoDepartementFilter] = useState("all");
  const [subPrefectureFilter, setSubPrefectureFilter] = useState("all");
  const [villageFilter, setVillageFilter] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [debouncedVillageFilter, setDebouncedVillageFilter] = useState("");

  const [columnsToPrint, setColumnsToPrint] = useState<ColumnKeys[]>(Object.keys(allColumns) as ColumnKeys[]);
  const [organizationLogos, setOrganizationLogos] = useState<OrganizationSettings | null>(null);

  const [printDate, setPrintDate] = useState('');
  const [showDirectoireMap, setShowDirectoireMap] = useState(false);

  // Sorting state
  const [sortBy, setSortBy] = useState<'matricule' | 'name' | 'Date_Naissance' | 'Region'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const canImport = hasPermission('feature:employees:import');
  const canExport = hasPermission('feature:employees:export');

  const isGeoTab = personnelTypeFilter === 'directoire' || personnelTypeFilter === 'regional' || personnelTypeFilter === 'all-geo';

  const pageTitle = useMemo(() => {
    switch (personnelTypeFilter) {
      case 'directoire': return 'Membres du Directoire';
      case 'personnel-siege': return 'Personnel Siège';
      case 'chauffeur-directoire': return 'Chauffeurs du Directoire';
      case 'regional': return 'Comités Régionaux';
      case 'all-geo': return 'Directoire & Comités Régionaux';
      case 'garde-republicaine': return 'Garde Républicaine';
      case 'gendarme': return 'Gendarmes';
      default: return 'Effectif Global';
    }
  }, [personnelTypeFilter]);

  useEffect(() => {
    setPrintDate(format(new Date(), 'dd/MM/yyyy HH:mm'));
  }, []);

  // Handle initial filter from URL
  useEffect(() => {
    setPersonnelTypeFilter(initialFilter || 'all');
  }, [initialFilter]);

  // Secondary permission check
  useEffect(() => {
    if (!authLoading && !hasPermission('page:employees:view')) {
      router.replace('/intranet');
      toast({
        variant: "destructive",
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions pour accéder à cette page."
      });
    }
  }, [authLoading, hasPermission, router, toast]);

  useEffect(() => {
    if (personnelTypeFilter === 'directoire' || personnelTypeFilter === 'all-geo' || personnelTypeFilter === 'regional') {
      const timer = setTimeout(() => setShowDirectoireMap(true), 300);
      return () => clearTimeout(timer);
    }
  }, [personnelTypeFilter]);

// Handled by DebouncedInput components directly

  useEffect(() => {
    if (!user || authLoading || !hasPermission('page:employees:view')) return;

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
  }, [user, authLoading]);

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
      }, 1500);
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

  const enrichedEmployees = useMemo(() => {
    return employees.map(emp => ({
      ...emp,
      calculatedGroup: getEmployeeGroup(emp, departments)
    }));
  }, [employees, departments]);

  const filteredEmployees = useMemo(() => {
    const filtered = enrichedEmployees.filter(employee => {
      const fullName = (employee.lastName || '').toLowerCase() + ' ' + (employee.firstName || '').toLowerCase();
      const matchesSearchTerm = fullName.includes(debouncedSearchTerm.toLowerCase()) || (employee.matricule || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || employee.departmentId === departmentFilter;
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      const matchesCnps = cnpsFilter === 'all' || employee.CNPS === cnpsFilter;
      const matchesSexe = sexeFilter === 'all' || employee.sexe === sexeFilter;

      const matchesPersonnelType = personnelTypeFilter === 'all' || 
                                   (personnelTypeFilter === 'all-geo' ? (employee.calculatedGroup === 'directoire' || employee.calculatedGroup === 'regional') : personnelTypeFilter === employee.calculatedGroup);

      const matchesRegion = !isGeoTab || regionFilter === 'all' || employee.Region === regionFilter;
      const matchesGeoDept = !isGeoTab || geoDepartementFilter === 'all' || employee.Departement === geoDepartementFilter;
      const matchesSubPref = !isGeoTab || subPrefectureFilter === 'all' || employee.subPrefecture === subPrefectureFilter || employee.Commune === subPrefectureFilter;
      const matchesVillageFiltered = !isGeoTab || debouncedVillageFilter === "" || (employee.Village || "").toLowerCase().includes(debouncedVillageFilter.toLowerCase());

      return matchesSearchTerm && matchesDepartment && matchesStatus && matchesCnps && matchesSexe && matchesPersonnelType &&
             matchesRegion && matchesGeoDept && matchesSubPref && matchesVillageFiltered;
    });

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.lastName || '').localeCompare(b.lastName || '') || 
                     (a.firstName || '').localeCompare(b.firstName || '') ||
                     (a.matricule || '').localeCompare(b.matricule || '');
      } else if (sortBy === 'Date_Naissance') {
        const dateA = a.Date_Naissance ? new Date(a.Date_Naissance).getTime() : 0;
        const dateB = b.Date_Naissance ? new Date(b.Date_Naissance).getTime() : 0;
        comparison = dateA - dateB || (a.lastName || '').localeCompare(b.lastName || '');
      } else if (sortBy === 'Region') {
        comparison = (a.Region || '').localeCompare(b.Region || '') ||
                     (a.lastName || '').localeCompare(b.lastName || '') ||
                     (a.firstName || '').localeCompare(b.firstName || '') ||
                     (a.matricule || '').localeCompare(b.matricule || '');
      } else {
        // Default to matricule
        comparison = (a.matricule || '').localeCompare(b.matricule || '') ||
                     (a.lastName || '').localeCompare(b.lastName || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Reset page to 1 if filters change and current page is out of bounds
    if (currentPage > Math.ceil(sorted.length / itemsPerPage)) {
      setCurrentPage(1);
    }
    return sorted;
  }, [enrichedEmployees, debouncedSearchTerm, departmentFilter, statusFilter, cnpsFilter, sexeFilter, personnelTypeFilter, currentPage, itemsPerPage, departments, debouncedVillageFilter, isGeoTab, regionFilter, geoDepartementFilter, subPrefectureFilter, sortBy, sortOrder]);

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
      department: departments.find(d => d.id === e.departmentId)?.name || '',
      status: e.status,
      photoUrl: e.photoUrl
    })), {
      header: true,
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
      return `'\'\'\'${String(str).replace(/'/g, "''")}\'\'\''`;
    };

    const tableName = 'employees';
    const columns = ['id', 'matricule', 'firstName', 'lastName', 'name', 'email', 'poste', 'departmentId', 'status', 'photoUrl'];

    const sqlContent = filteredEmployees.map(emp => {
      const values = [
        escapeSql(emp.id),
        escapeSql(emp.matricule),
        escapeSql(emp.firstName),
        escapeSql(emp.lastName),
        escapeSql(emp.name),
        escapeSql(emp.email),
        escapeSql(emp.poste),
        escapeSql(emp.departmentId),
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

    const logos = await getOrganizationSettings();
    setOrganizationLogos(logos);

    setIsPrintDialogOpen(false);
    setIsPrinting(true);
  };

  const printSubtitle = useMemo(() => {
    let subtitle = `Effectif: ${filteredEmployees.length} | Date: ${printDate}`;
    if (regionFilter !== 'all') subtitle += ` | Région: ${regionFilter}`;
    if (geoDepartementFilter !== 'all') subtitle += ` | Dept: ${geoDepartementFilter}`;
    if (subPrefectureFilter !== 'all') subtitle += ` | S/P: ${subPrefectureFilter}`;
    if (villageFilter) subtitle += ` | Village: ${villageFilter}`;
    return subtitle;
  }, [filteredEmployees.length, printDate, regionFilter, geoDepartementFilter, subPrefectureFilter, villageFilter]);

  const getAvatarBgClass = (sexe?: 'Homme' | 'Femme' | 'Autre') => {
    switch (sexe) {
      case 'Homme': return 'bg-blue-200 dark:bg-blue-800';
      case 'Femme': return 'bg-pink-200 dark:bg-pink-800';
      default: return 'bg-muted';
    }
  };

  const showDepartmentFilter = personnelTypeFilter === 'all' || personnelTypeFilter === 'personnel-siege';

  const handleTabChange = (value: string) => {
    startTransition(() => {
      setPersonnelTypeFilter(value);
      setCurrentPage(1); // Reset to first page on tab change

      // Defer the map rendering to improve INP on tab switch
      if (value === 'directoire') {
        setShowDirectoireMap(false);
        setTimeout(() => setShowDirectoireMap(true), 300);
      } else {
        setShowDirectoireMap(false);
      }

      // Reset geo filters when switching tabs
      setRegionFilter('all');
      setGeoDepartementFilter('all');
      setSubPrefectureFilter('all');
      setVillageFilter('');

      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        params.delete('filter');
      } else {
        params.set('filter', value);
      }
      router.push(`/employees?${params.toString()}`);
    });
  }

  const getEmployeeOrgUnit = (employee: Employe) => {
    const service = services.find(s => s.id === employee.serviceId);
    if (service) return service.name;
    const direction = directions.find(d => d.id === employee.directionId);
    if (direction) return direction.name;
    const department = departments.find(d => d.id === employee.departmentId);
    if (department) return department.name;
    return 'Non spécifié';
  }


  return (
    <>
      <div className={isPrinting ? 'print-hidden' : ''}>
        <div className="flex flex-col gap-6 main-content">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
            <div className="flex gap-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setTimeout(() => setIsPrintDialogOpen(true), 50)}>
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
                    <DropdownMenuItem onSelect={() => setTimeout(handleExportCsv, 50)}>Exporter en CSV</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setTimeout(handleExportJson, 50)}>Exporter en JSON</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setTimeout(handleExportSql, 50)}>Exporter en SQL</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button onClick={() => setTimeout(() => setIsAddSheetOpen(true), 50)} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </div>

          <Tabs value={personnelTypeFilter} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-7 mb-6">
              <TabsTrigger value="all">Effectif Global</TabsTrigger>
              <TabsTrigger value="directoire">Directoire</TabsTrigger>
              <TabsTrigger value="personnel-siege">Personnel Siège</TabsTrigger>
              <TabsTrigger value="chauffeur-directoire">Chauffeur Directoire</TabsTrigger>
              <TabsTrigger value="regional">Comités Régionaux</TabsTrigger>
              <TabsTrigger value="garde-republicaine">Garde Républicaine</TabsTrigger>
              <TabsTrigger value="gendarme">Gendarmes</TabsTrigger>
            </TabsList>
          </Tabs>

          {canImport && (personnelTypeFilter === 'all' || personnelTypeFilter === 'personnel-siege') && (
            <div className="mb-6">
              <ImportEmployeesDataCard />
            </div>
          )}

          {isGeoTab && showDirectoireMap && (
            <div className="mb-6">
              <DirectoireMap members={filteredEmployees} className="h-[1000px]" />
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
              {isGeoTab && (
                <div className="flex flex-col sm:flex-row gap-2 mb-4 flex-wrap w-full border-b pb-4">
                  <Select
                    value={regionFilter}
                    onValueChange={(val) => startTransition(() => {
                      setRegionFilter(val);
                      setGeoDepartementFilter('all');
                      setSubPrefectureFilter('all');
                      setCurrentPage(1);
                    })}
                  >
                    <SelectTrigger className="flex-1 min-w-[200px]">
                      <SelectValue placeholder="Filtrer par Région" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les régions</SelectItem>
                      {Object.keys(divisions).sort().map(reg => (
                        <SelectItem key={reg} value={reg}>{reg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={geoDepartementFilter}
                    onValueChange={(val) => startTransition(() => {
                      setGeoDepartementFilter(val);
                      setSubPrefectureFilter('all');
                      setCurrentPage(1);
                    })}
                    disabled={regionFilter === 'all'}
                  >
                    <SelectTrigger className="flex-1 min-w-[200px]">
                      <SelectValue placeholder="Filtrer par Département" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les départements</SelectItem>
                      {Object.keys(divisions[regionFilter] || {}).sort().map(dep => (
                        <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={subPrefectureFilter}
                    onValueChange={(val) => startTransition(() => {
                      setSubPrefectureFilter(val);
                      setCurrentPage(1);
                    })}
                    disabled={geoDepartementFilter === 'all'}
                  >
                    <SelectTrigger className="flex-1 min-w-[200px]">
                      <SelectValue placeholder="Filtrer par Sous-Préfecture" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les sous-préfectures</SelectItem>
                      {Object.keys(divisions[regionFilter]?.[geoDepartementFilter] || {}).sort().map(sp => (
                        <SelectItem key={sp} value={sp}>{sp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <DebouncedInput
                      placeholder="Rechercher par village..."
                      className="pl-10"
                      value={villageFilter}
                      onChange={(val) => startTransition(() => {
                        const sVal = String(val);
                        setVillageFilter(sVal);
                        setDebouncedVillageFilter(sVal);
                      })}
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <DebouncedInput
                    placeholder="Rechercher par nom, matricule..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(val) => startTransition(() => {
                      const sVal = String(val);
                      setSearchTerm(sVal);
                      setDebouncedSearchTerm(sVal);
                    })}
                  />
                </div>
                {showDepartmentFilter && (
                  <Select value={departmentFilter} onValueChange={(val) => startTransition(() => {
                    setDepartmentFilter(val);
                    setCurrentPage(1);
                  })}>
                    <SelectTrigger className="flex-1 min-w-[180px]">
                      <SelectValue placeholder="Filtrer par service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les départements</SelectItem>
                      {departments.map(dep => <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Select value={statusFilter} onValueChange={(val) => startTransition(() => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                })}>
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
                <Select value={String(cnpsFilter)} onValueChange={(val) => startTransition(() => {
                  setCnpsFilter(val === 'all' ? 'all' : val === 'true');
                  setCurrentPage(1);
                })}>
                  <SelectTrigger className="flex-1 min-w-[150px]">
                    <SelectValue placeholder="Filter par CNPS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous (CNPS)</SelectItem>
                    <SelectItem value="true">Déclaré</SelectItem>
                    <SelectItem value="false">Non Déclaré</SelectItem>
                  </SelectContent>
                </Select>
                  <Select value={sexeFilter} onValueChange={(val) => startTransition(() => {
                    setSexeFilter(val);
                    setCurrentPage(1);
                  })}>
                    <SelectTrigger className="flex-1 min-w-[150px]">
                      <SelectValue placeholder="Filter par Sexe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les sexes</SelectItem>
                      <SelectItem value="Homme">Homme</SelectItem>
                      <SelectItem value="Femme">Femme</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={(val) => {
                    const [newSortBy, newSortOrder] = val.split('-') as [any, any];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}>
                    <SelectTrigger className="flex-1 min-w-[180px]">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Nom (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Nom (Z-A)</SelectItem>
                      <SelectItem value="matricule-asc">Matricule (Croissant)</SelectItem>
                      <SelectItem value="matricule-desc">Matricule (Décroissant)</SelectItem>
                      <SelectItem value="Date_Naissance-asc">Date Naissance (Plus âgé)</SelectItem>
                      <SelectItem value="Date_Naissance-desc">Date Naissance (Plus jeune)</SelectItem>
                      {isGeoTab && <SelectItem value="Region-asc">Région (A-Z)</SelectItem>}
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
                      <TableHead>NOM &amp; Prénoms</TableHead>
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
                            <div>
                              <Badge variant={statusVariantMap[employee.status as Status] || 'default'}>{employee.status}</Badge>
                              {employee.status === 'Actif' && employee.dateEmbauche && (
                                <div className="text-xs text-muted-foreground">
                                  depuis le {format(parseISO(employee.dateEmbauche), 'dd/MM/yyyy')}
                                </div>
                              )}
                            </div>
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
                                <DropdownMenuItem 
                                  onSelect={() => {
                                    setTimeout(() => setDeleteTarget(employee), 50);
                                  }} 
                                  className="text-destructive focus:text-destructive"
                                >
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

              {!loading && filteredEmployees.length === 0 && (
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
            onCloseAction={() => setIsAddSheetOpen(false)}
            onAddEmployeeAction={handleAddEmployee}
          />
          <PrintDialog
            isOpen={isPrintDialogOpen}
            onClose={() => setIsPrintDialogOpen(false)}
            onPrint={handlePrint}
            allColumns={allColumns}
          />
          <ConfirmationDialog
            isOpen={!!deleteTarget}
            onCloseAction={() => setDeleteTarget(null)}
            onConfirmAction={() => deleteTarget && handleDeleteEmployee(deleteTarget.id)}
            title={`Supprimer ${deleteTarget?.name} ?`}
            description="Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible."
          />
        </div>
      </div>

      {isPrinting && organizationLogos && (
        <PrintLayout
          logos={organizationLogos}
          title={`LISTE DU PERSONNEL - ${pageTitle.toUpperCase()}`}
          subtitle={printSubtitle}
          columns={columnsToPrint.map(key => {
            const widthMap: Record<string, string> = {
              index: 'w-[3%]',
              matricule: 'w-[7%]',
              name: 'w-[18%]',
              poste: 'w-[14%]',
              department: 'w-[12%]',
              sexe: 'w-[4%]',
              age: 'w-[4%]',
              Date_Naissance: 'w-[8%]',
              Lieu_Naissance: 'w-[10%]',
              email: 'w-[12%]',
              status: 'w-[6%]',
              CNPS: 'w-[4%]',
              dateEmbauche: 'w-[10%]',
              Date_Depart: 'w-[7%]',
            };

            const isTextColumn = ['name', 'poste', 'department', 'Lieu_Naissance', 'email'].includes(key);

            return {
              header: allColumns[key],
              key,
              align: ['index', 'matricule', 'sexe', 'Date_Naissance', 'dateEmbauche', 'Date_Depart', 'CNPS', 'status', 'age'].includes(key) ? 'center' : 'left',
              className: `${widthMap[key] || ''} ${isTextColumn ? 'whitespace-normal' : 'whitespace-nowrap'} overflow-hidden`,
            };
          })}
          data={filteredEmployees.map((employee, index) => {
            const now = new Date();
            const row: Record<string, any> = {
              index: index + 1,
              name: `${(employee.lastName || '').toUpperCase()} ${employee.firstName || ''}`.trim(),
            };
            
            columnsToPrint.forEach(key => {
              if (key === 'index' || key === 'name') return;
              
              if (key === 'age') {
                if (!employee.Date_Naissance) {
                  row[key] = 'N/A';
                } else {
                  try {
                    const birthDate = parseISO(employee.Date_Naissance);
                    row[key] = differenceInYears(now, birthDate).toString();
                  } catch {
                    row[key] = 'N/A';
                  }
                }
              } else if (key === 'department') {
                row[key] = getEmployeeOrgUnit(employee);
              } else if (key === 'sexe') {
                const s = (employee[key] || '').toLowerCase();
                row[key] = s.startsWith('m') ? 'H' : (s.startsWith('f') ? 'F' : employee[key]);
              } else if (key === 'Date_Naissance' || key === 'Date_Depart') {
                const val = employee[key as keyof Employe];
                if (val && typeof val === 'string') {
                  const d = parseISO(val);
                  row[key] = !isNaN(d.getTime()) ? format(d, 'dd/MM/yyyy') : val;
                } else {
                  row[key] = '';
                }
              } else if (key === 'CNPS') {
                row[key] = employee.CNPS ? 'Oui' : 'Non';
              } else {
                row[key] = employee[key as keyof Employe] || '';
              }
            });
            return row;
          })}
        />
      )}
    </>
  );
}
