
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { subscribeToEmployees, updateEmployee } from "@/services/employee-service";
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


type EmployeeWithDetails = Employe & { netSalary?: number; grossSalary?: number };

export default function PayrollPage() {
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { hasPermission } = useAuth();
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

        unsubscribe = subscribeToEmployees(
          async (fetchedEmployees) => {
            if (!isMounted) return;
            const payrollEmployees = fetchedEmployees.filter(e => e.status === 'Actif' || e.status === 'En congé');

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
          },
          (err) => {
            setError("Impossible de charger les données des employés. Veuillez vérifier votre connexion et les permissions Firestore.");
            console.error(err);
            setLoading(false);
          }
        );
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

    let url = `/payroll/${selectedEmployee.id}?payslipDate=${formattedDate}`;
    if (generationMode === 'period') {
      const endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
      const lastDayEnd = lastDayOfMonth(endDate);
      url += `&endDate=${lastDayEnd.toISOString().split('T')[0]}`;
    }

    router.push(url);
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
      const matchesSearchTerm = fullName.includes(searchTerm.toLowerCase()) || (employee.matricule || '').toLowerCase().includes(searchTerm.toLowerCase());
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
  };


  return (
    <>
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Masse Salariale (Filtrée)</CardTitle>
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-32" /> : (
                    <div className="text-2xl font-bold">{formatCurrency(totalPayroll)}</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Basé sur les {filteredEmployees.length} employés affichés
                  </p>
                </CardContent>
              </Card>
            </div>
          )}


          <Card>
            <CardHeader>
              <CardTitle>Employés sur la Paie</CardTitle>
              <CardDescription>
                Gérez le salaire et les informations financières de tous les employés actifs.
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
                  <TableHeader>
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead>Employé</TableHead>
                      <TableHead>Poste</TableHead>
                      <TableHead>Date d'embauche</TableHead>
                      {canViewSalaries && <TableHead className="text-right">Salaire Net</TableHead>}
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          {canViewSalaries && <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>}
                          <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : paginatedEmployees.length > 0 ? (
                      paginatedEmployees.map((employee, index) => (
                        <TableRow key={employee.id}>
                          <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                          <TableCell className="font-medium">{`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}</TableCell>
                          <TableCell>{employee.poste}</TableCell>
                          <TableCell>{employee.dateEmbauche ? format(parseISO(employee.dateEmbauche), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                          {canViewSalaries && <TableCell className="text-right font-mono whitespace-nowrap">{formatCurrency(employee.netSalary)}</TableCell>}
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
                                {canViewSalaries && (
                                  <DropdownMenuItem onClick={() => openEditSheet(employee)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Modifier les infos de paie
                                  </DropdownMenuItem>
                                )}
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
                              <DropdownMenuItem onClick={() => openEditSheet(employee)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openDateDialog(employee)}>
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
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  totalItems={filteredEmployees.length}
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
                    <SelectItem value="period">Période Personnalisée</SelectItem>
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
                      {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
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
                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
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
                          return (
                            <SelectItem
                              key={m.value}
                              value={m.value}
                              disabled={isBeforeStart}
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
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bulk-month">Mois</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger id="bulk-month"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
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

      {isProcessingBulk && bulkPayslips.length > 0 && (
        <div id="print-section" className="bg-white text-black print:shadow-none print:border-none print:p-0">
          {bulkPayslips.map((payslip, index) => (
            <div key={index} className={`payslip-wrapper ${index > 0 ? 'print:break-before-page' : ''}`}>
              <PayslipTemplate payslipDetails={payslip} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
