
"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Eye, MoreHorizontal, Pencil, Search, Printer, Loader2, Landmark, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input";
import type { Employe, PayslipDetails, Department, Direction, Service, OrganizationSettings } from "@/lib/data";
import { subscribeToEmployees, subscribeToEmployee, updateEmployee } from "@/services/employee-service";
import { getPayslipDetails } from "@/services/payslip-details-service";
import { getDirections } from "@/services/direction-service";
import { getServices } from "@/services/service-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { EditPayrollSheet } from "@/components/payroll/edit-payroll-sheet";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { lastDayOfMonth, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { PaginationControls } from "@/components/common/pagination-controls";
import { getDepartments } from "@/services/department-service";
import { PayslipTemplate } from "@/components/payroll/payslip-template";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { logPrintAction, getPrintStatsForPeriod } from "@/services/print-tracking-service";
import { useTransition } from "react";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { cn } from "@/lib/utils";

// Simplified debounced input to keep typing local and fast
function DebouncedInput({ 
  value: initialValue, 
  onChange, 
  debounce = 300, 
  ...props 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  debounce?: number; 
} & Omit<React.ComponentProps<typeof Input>, 'onChange'>) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, onChange, debounce]);

  return (
    <Input {...props} value={value} onChange={e => setValue(e.target.value)} />
  );
}


type EmployeeWithDetails = Employe & { netSalary?: number; grossSalary?: number };

export default function PayrollPage() {
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const canViewSalaries = hasPermission('page:payroll:view');

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  // State for the date selection dialog
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [endYear, setEndYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [endMonth, setEndMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [generationMode, setGenerationMode] = useState<'monthly' | 'period'>('monthly');

  // State for bulk actions
  const [isBulkPrintDialogOpen, setIsBulkPrintDialogOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'print' | 'pdf' | null>(null);
  const [bulkPayslips, setBulkPayslips] = useState<PayslipDetails[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [printStats, setPrintStats] = useState({ total: 0, print: 0, pdf: 0 });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  // Fetch print stats when period changes or after a new print
  useEffect(() => {
    const fetchStats = async () => {
      const stats = await getPrintStatsForPeriod(`${month.padStart(2, '0')}-${year}`);
      setPrintStats(stats);
    };
    fetchStats();
  }, [month, year, isProcessingBulk]);

  // Redirection logic removed in favor of PermissionGuard wrapper


  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    setLoading(true);

    const initData = async () => {
      try {
        // Fetch metadata ONCE
        const [deps, dirs, servs] = await Promise.all([
          getDepartments(),
          getDirections(),
          getServices()
        ]);

        if (!isMounted) return;

        setDepartments(deps);
        setDirections(dirs);
        setServices(servs);

        const onEmployeesFetched = async (fetchedEmployees: Employe[]) => {
          if (!isMounted) return;
          let payrollEmployees = fetchedEmployees.filter(e => e.status === 'Actif' || e.status === 'En congé');

          // Data-level filtering: If not admin/HR, only show the user's own profile
          if (!hasPermission('page:payroll:view') && user?.employeeId) {
            payrollEmployees = payrollEmployees.filter(e => e.id === user.employeeId);
          }

          if (canViewSalaries) {
            const today = new Date();
            const lastDayOfCurrentMonth = lastDayOfMonth(today).toISOString().split('T')[0];

            const employeesWithSalary = await Promise.all(
              payrollEmployees.map(async (emp) => {
                try {
                  const details = await getPayslipDetails(emp, lastDayOfCurrentMonth, {
                    departments: deps, // reusing the fetched array
                    directions: dirs,
                    services: servs
                  });
                  return { ...emp, netSalary: details.totals.netAPayer, grossSalary: details.totals.brutImposable };
                } catch {
                  return { ...emp, netSalary: 0, grossSalary: 0 };
                }
              })
            );
            setEmployees(employeesWithSalary);
          } else {
            setEmployees(payrollEmployees);
          }

          setError(null);
          setLoading(false);
        };

        const onFetchError = (err: Error) => {
          setError("Impossible de charger les données des employés. Veuillez vérifier votre connexion et les permissions Firestore.");
          console.error(err);
          setLoading(false);
        };

        if (hasPermission('page:payroll:view')) {
          unsubscribe = subscribeToEmployees(onEmployeesFetched, onFetchError);
        } else if (user?.employeeId) {
          unsubscribe = subscribeToEmployee(user.employeeId, (emp) => onEmployeesFetched([emp]), onFetchError);
        } else {
          setEmployees([]);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch initial payroll metadata", err);
        if (isMounted) setLoading(false);
      }
    };

    initData();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [canViewSalaries]);

  useEffect(() => {
    const processBulk = async () => {
      if (isProcessingBulk && bulkPayslips.length > 0) {
        // Wait a bit for all templates to render
        await new Promise(resolve => setTimeout(resolve, 800));

        if (bulkActionType === 'print') {
          window.print();
          setIsProcessingBulk(false);
          setBulkPayslips([]);
          setBulkActionType(null);
        } else if (bulkActionType === 'pdf') {
          try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const container = document.getElementById('print-section');
            if (container) {
              const wrappers = container.querySelectorAll('.payslip-wrapper');
              for (let i = 0; i < wrappers.length; i++) {
                const canvas = await html2canvas(wrappers[i] as HTMLElement, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                if (i > 0) pdf.addPage();
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const imgHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
              }
              pdf.save(`bulletins_paie_${month}_${year}.pdf`);
            }
          } catch (err) {
            console.error("Failed to generate bulk PDF", err);
            toast({ variant: "destructive", title: "Erreur", description: "Échec de la génération du PDF massif." });
          } finally {
            setIsProcessingBulk(false);
            setBulkPayslips([]);
            setBulkActionType(null);
          }
        }
      }
    };
    processBulk();
  }, [isProcessingBulk, bulkPayslips, bulkActionType, month, year, toast]);

  const openEditSheet = (employee: Employe) => {
    setSelectedEmployee(employee);
    setTimeout(() => setIsEditSheetOpen(true), 50);
  };

  const openDateDialog = (employee: Employe) => {
    setSelectedEmployee(employee);
    setTimeout(() => setIsDateDialogOpen(true), 50);
  };

  const handleNavigateToPayslip = () => {
    if (!selectedEmployee) return;

    const selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const lastDay = lastDayOfMonth(selectedDate);
    const formattedDate = lastDay.toISOString().split('T')[0]; // YYYY-MM-DD

    setIsDateDialogOpen(false);
    
    // Tiny delay to let the dialog close animation finish and the button release its state
    setTimeout(() => {
      let url = `/payroll/${selectedEmployee.id}?payslipDate=${formattedDate}`;
      if (generationMode === 'period') {
        const endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
        const lastDayEnd = lastDayOfMonth(endDate);
        url += `&endDate=${lastDayEnd.toISOString().split('T')[0]}`;
      }
      router.push(url);
    }, 100);
  };

  const handleUpdatePayroll = async (employeeId: string, updatedPayrollData: Partial<Employe>) => {
    try {
      if (updatedPayrollData.firstName || updatedPayrollData.lastName) {
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

  const filteredEmployees = useMemo(() => {
    const filtered = employees.filter(employee => {
      const fullName = (employee.firstName && employee.lastName) ? `${employee.lastName} ${employee.firstName}`.toLowerCase() : (employee.name || '').toLowerCase();
      const matchesSearchTerm = fullName.includes(debouncedSearchTerm.toLowerCase()) || (employee.matricule || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || employee.departmentId === departmentFilter;
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      return matchesSearchTerm && matchesDepartment && matchesStatus;
    });

    if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
      setCurrentPage(1);
    }
    return filtered;

  }, [employees, searchTerm, departmentFilter, statusFilter, currentPage, itemsPerPage]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const totalPayroll = useMemo(() => {
    if (!canViewSalaries) return 0;
    return filteredEmployees.reduce((acc, emp) => acc + (emp.netSalary || 0), 0);
  }, [filteredEmployees, canViewSalaries]);

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

  const handleBulkAction = async (type: 'print' | 'pdf') => {
    if (filteredEmployees.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun employé sélectionné",
        description: "Veuillez filtrer la liste pour sélectionner les employés.",
      });
      return;
    }

    setIsProcessingBulk(true);
    setBulkActionType(type);
    setIsBulkPrintDialogOpen(false);

    // Yield to main thread to allow loader and dialog closure to paint
    setTimeout(async () => {
      try {
        const selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const lastDay = lastDayOfMonth(selectedDate);
        const formattedDate = lastDay.toISOString().split('T')[0];

        const payslipPromises = filteredEmployees.map(emp => getPayslipDetails(emp, formattedDate, {
          departments,
          directions,
          services
        }));
        const allPayslips = await Promise.all(payslipPromises);

        setBulkPayslips(allPayslips);

        // Log the bulk action
        logPrintAction({
          userId: user?.id || 'anonymous',
          userName: user?.name || 'Utilisateur inconnu',
          actionType: type,
          period: `${month.padStart(2, '0')}-${year}`,
          count: allPayslips.length,
          employeeIds: filteredEmployees.map(e => e.id)
        });
      } catch (err) {
        console.error(`Failed to prepare bulk ${type}:`, err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: `Impossible de préparer les bulletins pour ${type === 'print' ? "l'impression" : "l'export PDF"}.`
        });
        setIsProcessingBulk(false);
        setBulkActionType(null);
      }
    }, 100);
  };


  return (
    <PermissionGuard permission="page:payroll:view">
      <div className={isProcessingBulk ? 'print-hidden' : ''}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Gestion de la Paie</h1>
            {canViewSalaries && (
              <Button onClick={() => setIsBulkPrintDialogOpen(true)} disabled={filteredEmployees.length === 0} className="gap-2">
                <Printer className="h-4 w-4" />
                Actions Groupées
              </Button>
            )}
          </div>

          {canViewSalaries && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-white/10 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative group transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Landmark className="h-16 w-16 rotate-12" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Masse Salariale (Filtrée)</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-32 bg-slate-700" /> : (
                    <div className="text-2xl font-black">{formatCurrency(totalPayroll)}</div>
                  )}
                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                    Basé sur les {filteredEmployees.length} employés affichés
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden relative group transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Printer className="h-16 w-16 -rotate-12" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bulletins ({months.find(m => m.value === month)?.label})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">{printStats.total}</div>
                  <div className="flex gap-4 mt-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-black">
                      <span className="text-blue-500">{printStats.print}</span> Papier
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">
                      <span className="text-indigo-500">{printStats.pdf}</span> PDF
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}


          <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-primary/5">
              <CardTitle className="text-xl font-bold">Employés sur la Paie</CardTitle>
              <CardDescription className="text-xs font-medium">
                Gérez le salaire et les informations financières de tous les employés actifs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <DebouncedInput
                    placeholder="Rechercher par nom, matricule..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(val) => startTransition(() => {
                      setSearchTerm(val);
                      setDebouncedSearchTerm(val);
                    })}
                  />
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="flex-1 min-w-[180px]">
                    <SelectValue placeholder="Filtrer par service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les services</SelectItem>
                    {departments.map(dep => <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1 min-w-[180px]">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="En congé">En congé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-4 text-sm text-muted-foreground">
                {filteredEmployees.length} résultat(s) trouvé(s).
              </div>

              {error && <p className="text-destructive text-center py-4">{error}</p>}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border/50">
                      <TableHead className="w-[50px] font-black uppercase text-[10px] tracking-wider text-center">N°</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-wider">Employé</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-wider">Poste</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-wider">Date d'embauche</TableHead>
                      {canViewSalaries && <TableHead className="text-right font-black uppercase text-[10px] tracking-wider">Salaire Net</TableHead>}
                      <TableHead className="sr-only">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-border/40">
                          <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          {canViewSalaries && <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>}
                          <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : paginatedEmployees.length > 0 ? (
                      paginatedEmployees.map((employee, index) => (
                        <TableRow key={employee.id} className="border-border/40 hover:bg-primary/5 transition-colors group">
                          <TableCell className="text-center font-bold text-muted-foreground">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                          <TableCell>
                            <div className="font-bold text-foreground">{`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{employee.matricule}</div>
                          </TableCell>
                          <TableCell className="font-medium text-muted-foreground">{employee.poste}</TableCell>
                          <TableCell className="text-sm">{employee.dateEmbauche ? format(parseISO(employee.dateEmbauche), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                          {canViewSalaries && <TableCell className="text-right font-mono font-bold text-primary">{formatCurrency(employee.netSalary)}</TableCell>}
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="font-black uppercase text-[10px] tracking-widest opacity-50">Actions</DropdownMenuLabel>
                                {canViewSalaries && (
                                  <DropdownMenuItem onSelect={() => openEditSheet(employee)} className="font-bold">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Modifier la paie
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onSelect={() => openDateDialog(employee)} className="font-bold">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Voir le bulletin
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
                ) : paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((employee, index) => (
                    <Card key={employee.id}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {(currentPage - 1) * itemsPerPage + index + 1}. {`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}
                        </CardTitle>
                        <CardDescription>{employee.poste}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="mt-2 space-y-1 text-sm">
                          <p><span className="font-medium">Embauche:</span> {employee.dateEmbauche ? format(parseISO(employee.dateEmbauche), 'dd/MM/yyyy') : 'N/A'}</p>
                          {canViewSalaries && <p><span className="font-medium">Salaire Net:</span> {formatCurrency(employee.netSalary)}</p>}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end p-4 pt-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="sm" variant="outline">
                              Actions <MoreHorizontal className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {canViewSalaries && (
                              <DropdownMenuItem onSelect={() => openEditSheet(employee)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={() => openDateDialog(employee)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Bulletin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardFooter>
                    </Card>
                  ))
                ) : null}
              </div>
              {!loading && filteredEmployees.length === 0 && !error && (
                <div className="text-center py-10 text-muted-foreground">
                  Aucun employé correspondant aux filtres.
                </div>
              )}
            </CardContent>
            {totalPages > 1 && (
              <CardFooter>
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
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Mode de génération</Label>
                <Select value={generationMode} onValueChange={(v: any) => setGenerationMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Bulletin Unique (Mensuel)</SelectItem>
                    {canViewSalaries && <SelectItem value="period">Période Personnalisée</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="month">{generationMode === 'monthly' ? 'Mois' : 'Mois de début'}</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger id="month"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {months.map(m => {
                        const isFutureMonth = parseInt(year) === new Date().getFullYear() && parseInt(m.value) > (new Date().getMonth() + 1);
                        const isFutureYear = parseInt(year) > new Date().getFullYear();
                        return (
                          <SelectItem
                            key={m.value}
                            value={m.value}
                            disabled={!canViewSalaries && (isFutureYear || isFutureMonth)}
                          >
                            {m.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {generationMode === 'period' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="endYear">Année de fin</Label>
                    <Select value={endYear} onValueChange={setEndYear}>
                      <SelectTrigger id="endYear"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {years.map(y => {
                          const isFutureYear = parseInt(y) > new Date().getFullYear();
                          return <SelectItem key={y} value={y} disabled={!canViewSalaries && isFutureYear}>{y}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endMonth">Mois de fin</Label>
                    <Select value={endMonth} onValueChange={setEndMonth}>
                      <SelectTrigger id="endMonth"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {months.map(m => {
                          const isBeforeStart = parseInt(endYear) < parseInt(year) || (parseInt(endYear) === parseInt(year) && parseInt(m.value) < parseInt(month));
                          const isFutureMonth = parseInt(endYear) === new Date().getFullYear() && parseInt(m.value) > (new Date().getMonth() + 1);
                          const isFutureYear = parseInt(endYear) > new Date().getFullYear();
                          return (
                            <SelectItem
                              key={m.value}
                              value={m.value}
                              disabled={isBeforeStart || (!canViewSalaries && (isFutureYear || isFutureMonth))}
                            >
                              {m.label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleNavigateToPayslip}>
                {generationMode === 'monthly' ? 'Générer le Bulletin' : 'Générer les Bulletins'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isBulkPrintDialogOpen} onOpenChange={setIsBulkPrintDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Imprimer les bulletins de la sélection</DialogTitle>
              <DialogDescription>
                Vous êtes sur le point d'imprimer {filteredEmployees.length} bulletin(s) de paie. Veuillez choisir la période.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="bulk-year">Année</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger id="bulk-year"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => {
                      const isFutureYear = parseInt(y) > new Date().getFullYear();
                      return <SelectItem key={y} value={y} disabled={!canViewSalaries && isFutureYear}>{y}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bulk-month">Mois</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger id="bulk-month"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => {
                      const isFutureMonth = parseInt(year) === new Date().getFullYear() && parseInt(m.value) > (new Date().getMonth() + 1);
                      const isFutureYear = parseInt(year) > new Date().getFullYear();
                      return (
                        <SelectItem 
                          key={m.value} 
                          value={m.value} 
                          disabled={!canViewSalaries && (isFutureYear || isFutureMonth)}
                        >
                          {m.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsBulkPrintDialogOpen(false)} className="sm:mr-auto">Annuler</Button>
              <Button variant="secondary" onClick={() => handleBulkAction('pdf')} disabled={isProcessingBulk} className="gap-2">
                {isProcessingBulk && bulkActionType === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Exporter en PDF
              </Button>
              <Button onClick={() => handleBulkAction('print')} disabled={isProcessingBulk} className="gap-2">
                {isProcessingBulk && bulkActionType === 'print' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                Imprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isProcessingBulk && bulkPayslips.length > 0 && (() => {
        const content = (
          <div id="print-section" className="bg-white text-black print:shadow-none print:border-none print:p-0">
            {bulkPayslips.map((payslip, index) => (
              <div key={index} className={`payslip-wrapper ${index > 0 ? 'print:break-before-page' : ''}`}>
                <PayslipTemplate payslipDetails={payslip} />
              </div>
            ))}
          </div>
        );
        return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
      })()}
    </PermissionGuard>
  );
}
