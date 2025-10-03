

"use client";

import { useState, useEffect, useMemo } from "react";
import { Eye, MoreHorizontal, Pencil, Search, Printer, Loader2, Landmark } from "lucide-react";
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
import type { Employe, PayslipDetails } from "@/lib/data";
import { subscribeToEmployees, updateEmployee } from "@/services/employee-service";
import { getPayslipDetails } from "@/services/payslip-details-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { EditPayrollSheet } from "@/components/payroll/edit-payroll-sheet";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { lastDayOfMonth, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import QRCode from "react-qr-code";
import { useAuth } from "@/hooks/use-auth";
import { PaginationControls } from "@/components/common/pagination-controls";


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
  const [statusFilter, setStatusFilter] = useState("all");

  // State for the date selection dialog
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());

  // State for bulk printing
  const [isBulkPrintDialogOpen, setIsBulkPrintDialogOpen] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [bulkPayslips, setBulkPayslips] = useState<PayslipDetails[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToEmployees(
      async (fetchedEmployees) => {
        // Filter for employees who should be on payroll
        const payrollEmployees = fetchedEmployees.filter(e => e.status === 'Actif' || e.status === 'En congé');
        
        if (canViewSalaries) {
            const today = new Date();
            const lastDayOfCurrentMonth = lastDayOfMonth(today).toISOString().split('T')[0];
            
            const employeesWithSalary = await Promise.all(
                payrollEmployees.map(async (emp) => {
                    try {
                        const details = await getPayslipDetails(emp, lastDayOfCurrentMonth);
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
     return () => unsubscribe();
  }, [canViewSalaries]);

  useEffect(() => {
    if (isPreparingPrint && bulkPayslips.length > 0) {
      setTimeout(() => {
        window.print();
        setIsPreparingPrint(false);
        setBulkPayslips([]);
      }, 500);
    }
  }, [isPreparingPrint, bulkPayslips]);
  
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
          updatedPayrollData.name = `${lastName} ${firstName}`.trim();
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

  const departments = useMemo(() => {
    const allDepartments = employees.map(e => e.department).filter(Boolean);
    return [...new Set(allDepartments)].sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const filtered = employees.filter(employee => {
      const fullName = (employee.lastName && employee.firstName) ? `${employee.lastName} ${employee.firstName}`.toLowerCase() : (employee.name || '').toLowerCase();
      const matchesSearchTerm = fullName.includes(searchTerm.toLowerCase()) || (employee.matricule || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
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

  const handleBulkPrint = async () => {
    if (filteredEmployees.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun employé sélectionné",
        description: "Veuillez filtrer la liste pour sélectionner les employés à imprimer.",
      });
      return;
    }

    setIsPreparingPrint(true);
    setIsBulkPrintDialogOpen(false);
    
    try {
        const selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const lastDay = lastDayOfMonth(selectedDate);
        const formattedDate = lastDay.toISOString().split('T')[0];

        const payslipPromises = filteredEmployees.map(emp => getPayslipDetails(emp, formattedDate));
        const allPayslips = await Promise.all(payslipPromises);
        
        setBulkPayslips(allPayslips);
    } catch(err) {
        console.error("Failed to prepare bulk payslips:", err);
        toast({
            variant: "destructive",
            title: "Erreur d'impression",
            description: "Impossible de générer les bulletins de paie."
        });
        setIsPreparingPrint(false);
    }
  };


  return (
    <>
      <div className={isPreparingPrint ? 'print-hidden' : ''}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Gestion de la Paie</h1>
            {canViewSalaries && (
                <Button onClick={() => setIsBulkPrintDialogOpen(true)} disabled={filteredEmployees.length === 0}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimer la Sélection
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
                      {departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
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
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            {canViewSalaries && <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>}
                            <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                        </TableRow>
                        ))
                    ) : paginatedEmployees.length > 0 ? (
                        paginatedEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                            <TableCell className="font-medium">{`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}</TableCell>
                            <TableCell>{employee.poste}</TableCell>
                            <TableCell>{employee.dateEmbauche ? format(parseISO(employee.dateEmbauche), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                            {canViewSalaries && <TableCell className="text-right font-mono">{formatCurrency(employee.netSalary)}</TableCell>}
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
                    paginatedEmployees.map((employee) => (
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
                                </div>
                                <div className="mt-2 space-y-1 text-sm">
                                    <p><span className="font-medium">Embauche:</span> {employee.dateEmbauche ? format(parseISO(employee.dateEmbauche), 'dd/MM/yyyy') : 'N/A'}</p>
                                    {canViewSalaries && <p><span className="font-medium">Salaire Net:</span> {formatCurrency(employee.netSalary)}</p>}
                                </div>
                            </CardContent>
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
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsBulkPrintDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleBulkPrint} disabled={isPreparingPrint}>
                        {isPreparingPrint ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                        Imprimer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

       {isPreparingPrint && bulkPayslips.length > 0 && (
         <div id="print-section" className="bg-white text-black print:shadow-none print:border-none print:p-0">
           {bulkPayslips.map((payslip, index) => (
             <PayslipTemplate key={index} payslipDetails={payslip} />
           ))}
         </div>
       )}
    </>
  );
}


// A self-contained component for rendering a single payslip, for reuse in bulk printing.
function PayslipTemplate({ payslipDetails }: { payslipDetails: PayslipDetails }) {
    const { employeeInfo, earnings, deductions, totals, employerContributions, organizationLogos } = payslipDetails;
    const fullName = `${employeeInfo.lastName || ''} ${employeeInfo.firstName || ''}`.trim() || employeeInfo.name;
    const qrCodeValue = `${fullName} | ${employeeInfo.matricule} | ${employeeInfo.department}`;

    const payslipDate = lastDayOfMonth(new Date(payslipDetails.employeeInfo.paymentDate || ''));
    const periodDisplay = format(payslipDate, "MMMM yyyy", { locale: fr });
    const paymentDateDisplay = format(new Date(payslipDetails.employeeInfo.paymentDate!), "EEEE dd MMMM yyyy", { locale: fr });
    
    const formatCurrency = (value: number) => {
        if (value === 0) return '0';
        return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    return (
        <div className="w-full max-w-4xl mx-auto bg-white p-6 border-b border-gray-300 text-black font-arial text-[8px] leading-tight print-page-break">
           {/* Header */}
            <header className="flex justify-between items-center pt-4 pb-2 mb-2 h-[120px]">
                <div className="w-1/4 text-center flex flex-col justify-center items-center h-full">
                     <div className='font-bold text-[10px] leading-tight'>
                        <p>Chambre Nationale des Rois</p>
                        <p className="-mt-1">et Chefs Traditionnels</p>
                    </div>
                     {organizationLogos.mainLogoUrl && <img src={organizationLogos.mainLogoUrl} alt="Logo CNRCT" className="max-h-20 max-w-full h-auto w-auto mt-1" />}
                </div>
                
                 <div className="w-2/4 text-center pt-2">
                   {/* Content removed as requested */}
                </div>

                <div className="w-1/4 text-center flex flex-col justify-center items-center h-full">
                    <p className="font-bold text-[10px] leading-tight">REPUBLIQUE DE CÔTE D'IVOIRE</p>
                    {organizationLogos.secondaryLogoUrl && <img src={organizationLogos.secondaryLogoUrl} alt="Emblème de la Côte d'Ivoire" className="max-h-[80px] max-w-full h-auto w-auto my-1" />}
                    <p className="text-[9px]">Union - Discipline - Travail</p>
                </div>
            </header>
            <div className='border-t-2 border-gray-400 mt-2'></div>

            <div className="mt-4">
                <div className="text-center my-2 p-1 bg-gray-200 font-bold rounded-md text-sm">
                    BULLETIN DE PAIE CNRCT : Période de {periodDisplay}
                </div>

                {/* Employee Info */}
                <section className="flex">
                    <div className="w-1/3 space-y-1">
                        <p className="text-[9px]"><span className="font-bold">N° CNPS EMPLOYEUR</span>: {employeeInfo.cnpsEmployeur}</p>
                        <p className="text-[9px]"><span className="font-bold">N° CNPS EMPLOYE</span>: {employeeInfo.cnpsEmploye}</p>
                        <div className="mt-2 bg-white p-1 w-fit">
                            <QRCode value={qrCodeValue} size={32} />
                        </div>
                    </div>
                    <div className="w-2/3 pl-4">
                        <div className="border border-gray-400 rounded-lg p-2 text-[9px] grid grid-cols-1 gap-y-1">
                            <p><span className="font-bold inline-block w-[140px]">NOM & PRENOMS</span>: {fullName}</p>
                            <p><span className="font-bold inline-block w-[140px]">MATRICULE</span>: {employeeInfo.matricule}</p>
                            <p><span className="font-bold inline-block w-[140px]">SITUATION MATRIMONIALE</span>: {employeeInfo.situationMatrimoniale}</p>
                            <p><span className="font-bold inline-block w-[140px]">BANQUE</span>: {employeeInfo.banque}</p>
                            <p><span className="font-bold inline-block w-[140px]">NUMERO DE COMPTE</span>: {employeeInfo.numeroCompteComplet || employeeInfo.numeroCompte}</p>
                            <p><span className="font-bold inline-block w-[140px]">SERVICE</span>: {employeeInfo.department}</p>
                            <p><span className="font-bold inline-block w-[140px]">DATE DE CONGE</span>: __/__/____</p>
                            <p><span className="font-bold inline-block w-[140px]">ANCIENNETE</span>: {employeeInfo.anciennete}</p>
                            <p><span className="font-bold inline-block w-[140px]">ENFANT(S)</span>: {employeeInfo.enfants}</p>
                            <p><span className="font-bold inline-block w-[140px]">CATEGORIE</span>: {employeeInfo.categorie}</p>
                        </div>
                    </div>
                </section>
                
                {/* Job Info Table */}
                <table className="w-full border-collapse border border-gray-400 rounded-lg mt-2 text-[9px]">
                    <thead className="bg-gray-200 font-bold text-center">
                        <tr>
                            <td className="p-1 border-r border-gray-400">EMPLOI</td>
                            <td className="p-1 border-r border-gray-400">MATRICULE</td>
                            <td className="p-1 border-r border-gray-400">NBRE DE PARTS</td>
                            <td className="p-1">DATE D'EMBAUCHE</td>
                        </tr>
                    </thead>
                    <tbody className="text-center">
                        <tr>
                            <td className="p-1 border-r border-gray-400">{employeeInfo.poste}</td>
                            <td className="p-1 border-r border-gray-400">{employeeInfo.matricule}</td>
                            <td className="p-1 border-r border-gray-400">{employeeInfo.parts}</td>
                            <td className="p-1">{employeeInfo.dateEmbauche}</td>
                        </tr>
                    </tbody>
                </table>


                {/* Earnings & Deductions */}
                <div className="border border-gray-400 rounded-lg mt-2 text-[9px]">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-200 font-bold">
                                <tr>
                                    <th className="p-1 text-left w-[50%]">ELEMENTS</th>
                                    <th className="p-1 text-center w-[25%] border-l border-gray-400">GAINS</th>
                                    <th className="p-1 text-center w-[25%] border-l border-gray-400">RETENUES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {earnings.map(item => (
                                    <tr key={item.label}>
                                        <td className="pl-1 h-[21px]">{item.label}</td>
                                        <td className="pr-1 text-right font-mono border-l border-gray-400">{item.amount > 0 ? formatCurrency(item.amount) : ''}</td>
                                        <td className="pr-1 text-right font-mono border-l border-gray-400"></td>
                                    </tr>
                                ))}
                                <tr className="font-bold bg-gray-200">
                                    <td className="pl-1 h-[21px]">BRUT IMPOSABLE</td>
                                    <td className="pr-1 text-right font-mono border-l border-gray-400">{formatCurrency(totals.brutImposable)}</td>
                                    <td className="border-l border-gray-400"></td>
                                </tr>
                                <tr>
                                    <td className="pl-1 h-[21px]">{totals.transportNonImposable.label}</td>
                                    <td className="pr-1 text-right font-mono border-l border-gray-400">{formatCurrency(totals.transportNonImposable.amount)}</td>
                                    <td className="border-l border-gray-400"></td>
                                </tr>
                                
                                 {deductions.map(item => (
                                    <tr key={item.label}>
                                        <td className="pl-1 h-[21px]">{item.label}</td>
                                        <td className="border-l border-gray-400"></td>
                                        <td className="pr-1 text-right font-mono border-l border-gray-400">{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))}
                                <tr>
                                     <td className="pl-1 h-[21px]"><span className="font-bold">NBR JRS IMPOSABLES :</span></td>
                                     <td className="border-l border-gray-400"></td>
                                     <td className="border-l border-gray-400"></td>
                                </tr>

                            </tbody>
                        </table>
                         <div className="flex justify-between items-center font-bold bg-gray-200 border-t border-gray-400">
                            <div className="w-[50%] p-1 italic font-normal text-[8px] text-center">
                                {totals.netAPayerInWords}
                            </div>
                            <div className="w-[25%] p-1 text-left border-l border-gray-400">NET A PAYER</div>
                            <div className="w-[25%] p-1 text-right font-mono pr-1 border-l border-gray-400 text-sm">{formatCurrency(totals.netAPayer)}</div>
                        </div>
                     </div>
                
                {/* Employer Contributions */}
                <div className="grid grid-cols-12 mt-2">
                    <div className="col-span-8">
                        <p className="font-bold text-center underline mb-1 text-sm">Impôts à la charge de l'employeur</p>
                        <div className="border border-gray-400 rounded-lg p-1 text-[9px]">
                                <table className="w-full">
                                <tbody>
                                    {employerContributions.map(item => (
                                            <tr key={item.label}>
                                            <td className="w-[45%] pr-2">{item.label}</td>
                                            <td className="w-[25%] text-right font-mono pr-2">{formatCurrency(item.base)}</td>
                                            <td className="w-[10%] text-center font-mono">{item.rate}</td>
                                            <td className="w-[20%] text-right font-mono">{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                        <div className="col-span-4 flex flex-col justify-center items-center p-1">
                            <div className="text-center pb-1">
                                <p className="font-bold">Payé à Yamoussoukro le</p>
                                <p className="capitalize text-xs">{paymentDateDisplay}</p>
                                <div className="h-20"></div>
                                <p className="border-t border-gray-400 pt-1 opacity-50">Signature</p>
                            </div>
                        </div>
                    </div>

                {/* Footer */}
                <footer className="text-center pt-2 mt-2 text-xs">
                     <div className='border-t-2 border-gray-400 mb-1'></div>
                    <div className="flex justify-between items-end">
                        <div></div>
                        <div className="leading-tight">
                            <p className="font-bold">Chambre Nationale de Rois et Chefs Traditionnels (CNRCT)</p>
                            <p>Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63</p>
                        </div>
                        <div><p className="page-number"></p></div>
                     </div>
                </footer>
            </div>
        </div>
    );
}
