
"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import type { PayrollEntry } from "@/lib/payroll-data";
import { getPayroll, addPayroll } from "@/services/payroll-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AddPayrollSheet } from "@/components/payroll/add-payroll-sheet";

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<PayrollEntry[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPayroll() {
      try {
        setLoading(true);
        const fetchedPayroll = await getPayroll();
        setPayroll(fetchedPayroll);
        setError(null);
      } catch (err) {
        setError("Impossible de charger les données de paie.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayroll();
  }, []);

  const handleAddPayroll = async (newPayrollData: Omit<PayrollEntry, "id">) => {
    try {
      const newEntry = await addPayroll(newPayrollData);
      setPayroll(prev => [...prev, newEntry]);
      setIsSheetOpen(false);
      toast({
        title: "Entrée de paie ajoutée",
        description: `Les informations de paie pour ${newEntry.employeeName} ont été ajoutées.`,
      });
    } catch (err) {
        console.error("Failed to add payroll entry:", err);
        throw err; // Re-throw to be caught in the sheet
    }
  };
  
  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gestion de la Paie</h1>
        <Button onClick={() => setIsSheetOpen(true)} className="w-full sm:w-auto">
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
                    </TableRow>
                    ))
                ) : (
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
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
           </div>
           <div className="grid grid-cols-1 gap-4 md:hidden">
             {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
                ))
             ) : (
                payroll.map((entry) => (
                    <Card key={entry.id}>
                        <CardContent className="p-4 space-y-2">
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">{entry.employeeName}</p>
                                    <p className="text-sm text-muted-foreground">{entry.role}</p>
                                </div>
                                <Badge variant="outline">{entry.payFrequency}</Badge>
                            </div>
                            <p className="text-sm"><span className="font-medium">Salaire:</span> {entry.baseSalary.toLocaleString("fr-FR", { style: "currency", currency: "XOF",})}</p>
                            <p className="text-sm"><span className="font-medium">Prochaine paie:</span> {entry.nextPayDate}</p>
                        </CardContent>
                    </Card>
                ))
             )}
           </div>
           {!loading && payroll.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucune donnée de paie trouvée.
            </div>
          )}
        </CardContent>
      </Card>
      <AddPayrollSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddPayroll={handleAddPayroll}
      />
    </>
  );
}
