"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { format, parseISO, differenceInYears } from "date-fns";
import { fr } from "date-fns/locale";
import { PlusCircle, Search, Download, Printer, Eye, Pencil, Trash2, MoreHorizontal, ShieldCheck, Globe, Building, BarChart3, Shield } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationControls } from "@/components/common/pagination-controls";
import { useAuth } from "@/hooks/use-auth";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { InstitutionalReportWrapper } from "@/components/reports/institutional-report-wrapper";
import { EmployeeOfficialReport } from "@/components/reports/employee-official-report";
import { EmployeeAnalytics } from "@/components/employees/employee-analytics";

import { divisions } from "@/lib/ivory-coast-divisions";
import dynamic from 'next/dynamic';
import { useTransition } from "react";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { cn } from "@/lib/utils";

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

import { allColumns, chiefColumns, type ColumnKeys } from "@/lib/constants/employee";
import { DebouncedInput } from "@/components/ui/debounced-input";

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

  useEffect(() => {
    setPersonnelTypeFilter(initialFilter || 'all');
  }, [initialFilter]);

  useEffect(() => {
    if (personnelTypeFilter === 'directoire' || personnelTypeFilter === 'all-geo' || personnelTypeFilter === 'regional') {
      const timer = setTimeout(() => setShowDirectoireMap(true), 300);
      return () => clearTimeout(timer);
    }
  }, [personnelTypeFilter]);

  useEffect(() => {
    if (!user || authLoading) return;

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

    return () => unsubEmployees();
  }, [user, authLoading]);

  useEffect(() => {
    if (isPrinting) {
      const originalTitle = document.title;
      document.title = `Liste_Personnel_${pageTitle.replace(/\s+/g, '_')}`;
      // Logic managed by InstitutionalReportWrapper
    }
  }, [isPrinting, pageTitle]);

  const handleAddEmployee = async (newEmployeeData: Omit<Employe, 'id'>, photoFile: File | null) => {
    try {
      await addEmployee(newEmployeeData, photoFile);
      setIsAddSheetOpen(false);
      toast({
        title: "Employé ajouté",
        description: `${newEmployeeData.lastName} ${newEmployeeData.firstName} a été ajouté avec succès.`,
      });
    } catch (err) {
      console.error("Failed to add employee:", err);
      throw err;
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
        comparison = (a.matricule || '').localeCompare(b.matricule || '') ||
                     (a.lastName || '').localeCompare(b.lastName || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

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
      return `'${String(str).replace(/'/g, "''")}'`;
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
      setCurrentPage(1);

      if (value === 'directoire') {
        setShowDirectoireMap(false);
        setTimeout(() => setShowDirectoireMap(true), 300);
      } else {
        setShowDirectoireMap(false);
      }

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
    <PermissionGuard permission="page:employees:view">
      <div className={isPrinting ? 'print-hidden' : ''}>
        <div className="flex flex-col gap-6 main-content">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
            <div>
              <h1 className="text-4vw md:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                {pageTitle}
              </h1>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full shadow-lg shadow-slate-900/10">
                  <Shield className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Registre National RH</span>
                </div>
                <span className="h-4 w-px bg-slate-200" />
                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" /> Administration Centrale
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="outline" 
                className="h-14 px-6 rounded-[1.5rem] border-slate-200 bg-white/50 backdrop-blur-md shadow-sm font-black uppercase tracking-widest text-[10px] hover:bg-white hover:scale-105 transition-all"
                onClick={() => setTimeout(() => setIsPrintDialogOpen(true), 50)}
              >
                <Printer className="mr-2 h-4 w-4 text-blue-600" />
                Liste Officielle
              </Button>
              {canExport && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-14 px-6 rounded-[1.5rem] border-slate-200 bg-white/50 backdrop-blur-md shadow-sm font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all">
                      <Download className="mr-2 h-4 w-4 text-emerald-600" />
                      Exporter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 p-2">Formats Systèmes</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => setTimeout(handleExportCsv, 50)} className="rounded-xl font-bold p-3">CSV (Compatible Excel)</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setTimeout(handleExportJson, 50)} className="rounded-xl font-bold p-3">JSON (Structure de données)</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setTimeout(handleExportSql, 50)} className="rounded-xl font-bold p-3">SQL (Base de données)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button 
                onClick={() => setTimeout(() => setIsAddSheetOpen(true), 50)} 
                className="h-14 px-8 rounded-[1.5rem] bg-slate-900 shadow-2xl shadow-slate-900/20 font-black uppercase tracking-widest text-[10px] hover:bg-black active:scale-95 transition-all text-white border-t border-white/10"
              >
                <PlusCircle className="mr-3 h-5 w-5 text-emerald-400" />
                Intégrer Agent
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Effectif Total", value: employees.length, sub: "Collaborateurs enregistrés", icon: Users2, color: "text-blue-600", bg: "bg-blue-50/50" },
              { label: "Agents Actifs", value: employees.filter(e => e.status === 'Actif').length, sub: "En poste actuellement", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50/50" },
              { label: "Nouveaux / 30j", value: employees.filter(e => e.dateEmbauche && new Date(e.dateEmbauche) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length, sub: "Derniers recrutements", icon: Zap, color: "text-amber-600", bg: "bg-amber-50/50" },
              { label: "Parité H/F", value: `${Math.round((employees.filter(e => e.sexe === 'Homme').length / employees.length) * 100) || 0}%`, sub: "Ratio Hommes / Femmes", icon: Heart, color: "text-rose-600", bg: "bg-rose-50/50" }
            ].map((stat, i) => (
              <Card key={i} className="border-none bg-white/40 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white/20 hover:scale-[1.02] transition-all group overflow-hidden">
                <CardContent className="p-8 relative">
                  <div className={cn("absolute -top-4 -right-4 h-24 w-24 rounded-full opacity-5 transition-transform group-hover:scale-150 duration-700", stat.bg)} />
                  <div className="flex flex-col gap-4">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner border border-white/50", stat.bg)}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.sub}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs value={personnelTypeFilter} onValueChange={handleTabChange}>
            <TabsList className="bg-white/40 backdrop-blur-md border border-white/20 p-1.5 rounded-[2rem] shadow-xl shadow-slate-200/50 flex h-auto overflow-x-auto no-scrollbar gap-1 mb-8">
              {!isGeoTab && (
                <>
                  <TabsTrigger value="all" className="rounded-3xl px-8 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">Effectif Global</TabsTrigger>
                  <TabsTrigger value="directoire" className="rounded-3xl px-8 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">Directoire</TabsTrigger>
                  <TabsTrigger value="personnel-siege" className="rounded-3xl px-8 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">Personnel Siège</TabsTrigger>
                  <TabsTrigger value="chauffeur-directoire" className="rounded-3xl px-8 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">Chauffeurs</TabsTrigger>
                  <TabsTrigger value="regional" className="rounded-3xl px-8 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">Comités Régionaux</TabsTrigger>
                </>
              )}
              {isGeoTab && (
                <>
                  <TabsTrigger value="all-geo" className="rounded-3xl px-10 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">Membres Géo-localisés</TabsTrigger>
                  <TabsTrigger value="directoire" className="rounded-3xl px-10 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">Directoire</TabsTrigger>
                  <TabsTrigger value="regional" className="rounded-3xl px-10 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">Comités Régionaux</TabsTrigger>
                </>
              )}
              <TabsTrigger value="analytics" className="rounded-3xl px-8 py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all gap-2">
                <BarChart3 className="h-4 w-4" /> Synthèse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="mt-0">
               <EmployeeAnalytics employees={filteredEmployees} />
            </TabsContent>

            {!['analytics'].includes(personnelTypeFilter) && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {isGeoTab && personnelTypeFilter !== 'directoire' && personnelTypeFilter !== 'regional' && showDirectoireMap && (
                  <div className="mb-6">
                    <DirectoireMap members={filteredEmployees} className="h-[1000px]" />
                  </div>
                )}

                <Card className="border-none bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden mb-8">
                  <CardHeader className="py-8 px-10 border-b border-white/10 bg-slate-50/10">
                    <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Registre du Personnel</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
                      Gestion administrative et tactique des collaborateurs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    {isGeoTab && (
                      <div className="flex flex-col md:flex-row gap-4 mb-8 p-6 bg-slate-900/5 rounded-3xl border border-slate-200/50">
                        <Select
                          value={regionFilter}
                          onValueChange={(val) => startTransition(() => {
                            setRegionFilter(val);
                            setGeoDepartementFilter('all');
                            setSubPrefectureFilter('all');
                            setCurrentPage(1);
                          })}
                        >
                          <SelectTrigger className="h-12 flex-1 min-w-[200px] rounded-xl border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest">
                            <SelectValue placeholder="Région" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                            <SelectItem value="all" className="font-bold py-3 uppercase text-[9px] tracking-widest">Toutes les régions</SelectItem>
                            {Object.keys(divisions).sort().map(reg => (
                              <SelectItem key={reg} value={reg} className="font-bold py-3 uppercase text-[9px] tracking-widest">{reg}</SelectItem>
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
                          <SelectTrigger className="h-12 flex-1 min-w-[200px] rounded-xl border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest">
                            <SelectValue placeholder="Département" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                            <SelectItem value="all" className="font-bold py-3 uppercase text-[9px] tracking-widest">Tous les départements</SelectItem>
                            {Object.keys(divisions[regionFilter] || {}).sort().map(dep => (
                              <SelectItem key={dep} value={dep} className="font-bold py-3 uppercase text-[9px] tracking-widest">{dep}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <DebouncedInput
                            placeholder="RECHERCHER PAR VILLAGE..."
                            className="h-12 pl-12 rounded-xl border-slate-200 bg-white font-black text-[10px] tracking-widest"
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
                    
                    <div className="flex flex-wrap gap-4 mb-8 items-center bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                      <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <DebouncedInput
                          placeholder="IDENTIFICATION AGENT / MATRICULE..."
                          className="h-12 pl-12 rounded-xl border-slate-200 bg-white font-black text-[10px] tracking-widest shadow-sm focus:bg-white transition-all"
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
                          <SelectTrigger className="h-12 flex-1 min-w-[200px] rounded-xl border-slate-200 bg-white font-black uppercase text-[9px] tracking-widest">
                            <SelectValue placeholder="Section / Département" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                            <SelectItem value="all" className="font-bold py-3 uppercase text-[9px] tracking-widest">Tous les départements</SelectItem>
                            {departments.map(dep => <SelectItem key={dep.id} value={dep.id} className="font-bold py-3 uppercase text-[9px] tracking-widest">{dep.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}

                      <Select value={statusFilter} onValueChange={(val) => startTransition(() => {
                        setStatusFilter(val);
                        setCurrentPage(1);
                      })}>
                        <SelectTrigger className="h-12 flex-1 min-w-[180px] rounded-xl border-slate-200 bg-white font-black uppercase text-[9px] tracking-widest text-slate-900 shadow-sm">
                          <SelectValue placeholder="Statut Actuel" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                          <SelectItem value="all" className="font-bold py-3 uppercase text-[9px] tracking-widest">Tous les statuts</SelectItem>
                          <SelectItem value="Actif" className="font-bold py-3 uppercase text-[9px] tracking-widest text-emerald-600">Actif</SelectItem>
                          <SelectItem value="En congé" className="font-bold py-3 uppercase text-[9px] tracking-widest text-blue-600">En congé</SelectItem>
                          <SelectItem value="Retraité" className="font-bold py-3 uppercase text-[9px] tracking-widest text-slate-500">Retraité</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={sexeFilter} onValueChange={(val) => startTransition(() => {
                        setSexeFilter(val);
                        setCurrentPage(1);
                      })}>
                        <SelectTrigger className="h-12 w-[140px] rounded-xl border-slate-200 bg-white font-black uppercase text-[9px] tracking-widest text-slate-900 shadow-sm">
                          <SelectValue placeholder="Genre" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                          <SelectItem value="all" className="font-bold py-3 uppercase text-[9px] tracking-widest">Tous</SelectItem>
                          <SelectItem value="Homme" className="font-bold py-3 uppercase text-[9px] tracking-widest">Homme</SelectItem>
                          <SelectItem value="Femme" className="font-bold py-3 uppercase text-[9px] tracking-widest">Femme</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={`${sortBy}-${sortOrder}`} onValueChange={(val) => {
                        const [newSortBy, newSortOrder] = val.split('-') as [any, any];
                        setSortBy(newSortBy);
                        setSortOrder(newSortOrder);
                      }}>
                        <SelectTrigger className="h-12 w-[220px] rounded-xl border-slate-900 bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest shadow-lg">
                          <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                          <SelectItem value="name-asc" className="font-bold py-3 uppercase text-[9px] tracking-widest">Nom (ALPHA A-Z)</SelectItem>
                          <SelectItem value="name-desc" className="font-bold py-3 uppercase text-[9px] tracking-widest">Nom (ALPHA Z-A)</SelectItem>
                          <SelectItem value="matricule-asc" className="font-bold py-3 uppercase text-[9px] tracking-widest">Matricule (CROISSANT)</SelectItem>
                          <SelectItem value="Date_Naissance-asc" className="font-bold py-3 uppercase text-[9px] tracking-widest">Âge (PLUS ÂGÉ)</SelectItem>
                          {isGeoTab && <SelectItem value="Region-asc" className="font-bold py-3 uppercase text-[9px] tracking-widest">Région (A-Z)</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mb-4 text-sm text-muted-foreground">
                      {filteredEmployees.length} résultat(s) trouvé(s).
                    </div>

                    {error && <p className="text-destructive text-center py-4">{error}</p>}

                    <div className="overflow-x-auto border rounded-xl shadow-inner bg-slate-50/20">
                      <Table>
                        <TableHeader className="bg-slate-100/50">
                          <TableRow>
                            {isGeoTab && <TableHead className="w-[50px]">N°</TableHead>}
                            <TableHead className="w-[80px]">Photo</TableHead>
                            <TableHead>{isGeoTab ? 'Nom et prénoms' : 'NOM & Prénoms'}</TableHead>
                            <TableHead>{isGeoTab ? 'N° MAT' : 'Matricule'}</TableHead>
                            {isGeoTab ? (
                              <>
                                <TableHead>Titre / Fonction</TableHead>
                                <TableHead>Région</TableHead>
                                <TableHead>Département</TableHead>
                                <TableHead>Sous-Préfecture</TableHead>
                                <TableHead>Village</TableHead>
                                <TableHead>Référence</TableHead>
                              </>
                            ) : (
                              <>
                                <TableHead>Poste</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>CNPS</TableHead>
                              </>
                            )}
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                              <TableRow key={i}>
                                {isGeoTab && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
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
                            paginatedEmployees.map((employee, index) => (
                              <TableRow 
                                key={employee.id} 
                                onClick={() => router.push(`/employees/${employee.id}`)}
                                className="cursor-pointer border-b border-slate-50 hover:bg-white/60 transition-all group h-20"
                              >
                                {isGeoTab && <TableCell className="text-center font-black text-slate-300">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>}
                                <TableCell>
                                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm transition-transform group-hover:scale-110">
                                    <AvatarImage src={employee.photoUrl || ''} alt={employee.name} className="object-cover" />
                                    <AvatarFallback className={cn("font-black text-[10px]", getAvatarBgClass(employee.sexe))}>
                                      {(employee.lastName || '').charAt(0)}{(employee.firstName || '').charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-black text-slate-900 uppercase tracking-tight text-sm group-hover:text-blue-600 transition-colors">
                                      {`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}
                                    </span>
                                    {isGeoTab ? (
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{employee.Village}</span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{employee.poste}</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-black text-xs text-slate-500">{employee.matricule}</TableCell>
                                
                                {isGeoTab ? (
                                  <>
                                    <TableCell className="text-xs truncate max-w-[150px] font-bold text-slate-700">{employee.poste}</TableCell>
                                    <TableCell className="text-xs font-black uppercase tracking-tighter text-slate-500">{employee.Region}</TableCell>
                                    <TableCell className="text-xs font-bold text-slate-500">{employee.Departement}</TableCell>
                                    <TableCell className="text-xs">{employee.subPrefecture}</TableCell>
                                    <TableCell className="text-[10px] uppercase font-black tracking-widest text-slate-400">{employee.Num_Decision}</TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell className="text-xs font-bold text-slate-500 truncate max-w-[150px]">{getEmployeeOrgUnit(employee)}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariantMap[employee.status as Status] || 'default'} className="font-black text-[9px] uppercase tracking-widest rounded-lg px-3 py-1 border-none shadow-sm">
                                          {employee.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {employee.CNPS && <ShieldCheck className="h-5 w-5 text-emerald-500" />}
                                    </TableCell>
                                  </>
                                )}
                                
                                <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl hover:bg-slate-200/50 transition-colors">
                                        <MoreHorizontal className="h-5 w-5 text-slate-600" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl">
                                      <DropdownMenuLabel className="px-3 py-2 font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Actions Dossier</DropdownMenuLabel>
                                      <DropdownMenuItem onSelect={() => router.push(`/employees/${employee.id}`)} className="rounded-xl font-bold py-2.5 px-3 focus:bg-slate-100 cursor-pointer">
                                          <Eye className="mr-2 h-4 w-4 text-blue-500" /> Profil Complet
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onSelect={() => router.push(`/employees/${employee.id}/edit`)} className="rounded-xl font-bold py-2.5 px-3 focus:bg-slate-100 cursor-pointer">
                                          <Pencil className="mr-2 h-4 w-4 text-amber-500" /> Modifier Données
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onSelect={() => setTimeout(() => setDeleteTarget(employee), 50)} 
                                        className="rounded-xl text-rose-600 font-bold py-2.5 px-3 focus:bg-rose-50 focus:text-rose-600 cursor-pointer"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" /> Radiation Agent
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
                      <div className="text-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed mt-4">
                        <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Aucun collaborateur identifié pour ce périmètre.</p>
                      </div>
                    )}
                  </CardContent>
                  
                  {totalPages > 1 && (
                    <CardFooter className="bg-slate-50/50 border-t">
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => startTransition(() => setCurrentPage(page))}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={setItemsPerPage}
                        totalItems={filteredEmployees.length}
                        isPending={isPending}
                      />
                    </CardFooter>
                  )}
                </Card>
              </div>
            )}
          </Tabs>

          <AddEmployeeSheet
            isOpen={isAddSheetOpen}
            onCloseAction={() => setIsAddSheetOpen(false)}
            onAddEmployeeAction={handleAddEmployee}
          />
          <PrintDialog
            isOpen={isPrintDialogOpen}
            onClose={() => setIsPrintDialogOpen(false)}
            onPrint={handlePrint}
            allColumns={isGeoTab ? chiefColumns : allColumns}
          />
          <ConfirmationDialog
            isOpen={!!deleteTarget}
            onCloseAction={() => setDeleteTarget(null)}
            onConfirmAction={() => deleteTarget && handleDeleteEmployee(deleteTarget.id)}
            title={`Confirmer la radiation ?`}
            description={`Êtes-vous sûr de vouloir supprimer ${deleteTarget?.lastName} ${deleteTarget?.firstName} définitivement ? Cette action archive son dossier de base.`}
          />
        </div>
      </div>

      {/* --- INSTITUTIONAL PRINT PORTAL --- */}
      {isPrinting && (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting} 
            onAfterPrint={() => setIsPrinting(false)}
        >
            <EmployeeOfficialReport 
                employees={filteredEmployees}
                logos={organizationLogos}
                unitLabel={pageTitle}
                stats={{
                    total: filteredEmployees.length,
                    active: filteredEmployees.filter(e => e.status === 'Actif').length,
                    men: filteredEmployees.filter(e => e.sexe === 'Homme').length,
                    women: filteredEmployees.filter(e => e.sexe === 'Femme').length
                }}
            />
        </InstitutionalReportWrapper>
      )}
    </PermissionGuard>
  );
}
