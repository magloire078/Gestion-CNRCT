
"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle, Eye, MoreHorizontal } from "lucide-react";
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
import type { PayrollEntry } from "@/lib/payroll-data";
import { subscribeToPayroll, addPayroll, updatePayroll } from "@/services/payroll-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AddPayrollSheet } from "@/components/payroll/add-payroll-sheet";
import { EditPayrollSheet } from "@/components/payroll/edit-payroll-sheet";
import Link from "next/link";

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<PayrollEntry[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPayroll(
      (fetchedPayroll) => {
        setPayroll(fetchedPayroll);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError("Impossible de charger les données de paie. Veuillez vérifier votre connexion et les permissions Firestore.");
        console.error(err);
        setLoading(false);
      }
    );
     return () => unsubscribe();
  }, []);
  
  const openEditSheet = (entry: PayrollEntry) => {
    setSelectedEntry(entry);
    setIsEditSheetOpen(true);
  };

  const handleAddPayroll = async (newPayrollData: Omit<PayrollEntry, "id">) => {
    try {
      await addPayroll(newPayrollData);
      // State will update via subscription
      setIsAddSheetOpen(false);
      toast({
        title: "Entrée de paie ajoutée",
        description: `Les informations de paie pour ${newPayrollData.employeeName} ont été ajoutées.`,
      });
    } catch (err) {
        console.error("Failed to add payroll entry:", err);
        throw err; // Re-throw to be caught in the sheet
    }
  };
  
  const handleUpdatePayroll = async (entryId: string, updatedPayrollData: Omit<PayrollEntry, "id">) => {
    try {
      await updatePayroll(entryId, updatedPayrollData);
      // State will update via subscription
      setIsEditSheetOpen(false);
      toast({
        title: "Informations de paie mises à jour",
        description: `Les informations de paie pour ${updatedPayrollData.employeeName} ont été modifiées.`,
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
        <Button onClick={() => setIsAddSheetOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une entrée
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Informations sur la Paie</CardTitle>
          <CardDescription>
            Gérez le salaire, la fréquence et les dates de paie de tous les
            employés.
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
                ) : payroll.length > 0 ? (
                    payroll.map((entry) => (
                    <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.employeeName}</TableCell>
                        <TableCell>{entry.role}</TableCell>
                        <TableCell className="text-right font-mono">
                        {entry.baseSalary.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "XOF",
                        })}
                        </TableCell>
                        <TableCell>
                        <Badge variant="outline">{entry.payFrequency}</Badge>
                        </TableCell>
                        <TableCell>{entry.nextPayDate}</TableCell>
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
                                    <DropdownMenuItem onClick={() => openEditSheet(entry)}>Modifier</DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                       <Link href={`/payroll/${entry.employeeId}`}>
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
             ) : payroll.length > 0 ? (
                payroll.map((entry) => (
                    <Card key={entry.id}>
                        <CardContent className="p-4">
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">{entry.employeeName}</p>
                                    <p className="text-sm text-muted-foreground">{entry.role}</p>
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
                                        <DropdownMenuItem onClick={() => openEditSheet(entry)}>Modifier</DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/payroll/${entry.employeeId}`}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Afficher le bulletin
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="mt-2 space-y-1">
                                <p className="text-sm"><span className="font-medium">Salaire:</span> {entry.baseSalary.toLocaleString("fr-FR", { style: "currency", currency: "XOF",})}</p>
                                <p className="text-sm"><span className="font-medium">Prochaine paie:</span> {entry.nextPayDate}</p>
                                <Badge variant="outline">{entry.payFrequency}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))
             ) : null}
           </div>
           {!loading && payroll.length === 0 && !error && (
            <div className="text-center py-10 text-muted-foreground">
                Aucune donnée de paie trouvée.
            </div>
          )}
        </CardContent>
      </Card>
      <AddPayrollSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onAddPayroll={handleAddPayroll}
      />
       {selectedEntry && (
        <EditPayrollSheet
            isOpen={isEditSheetOpen}
            onClose={() => setIsEditSheetOpen(false)}
            onUpdatePayroll={handleUpdatePayroll}
            payrollEntry={selectedEntry}
        />
       )}
    </div>
  );
}
