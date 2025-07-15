
"use client";

import { useState } from "react";
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
import { payrollData, PayrollEntry } from "@/lib/payroll-data";
import { Badge } from "@/components/ui/badge";

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<PayrollEntry[]>(payrollData);
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestion de la Paie</h1>
        <Button disabled>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter des détails de paie
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Informations sur la Paie des Employés</CardTitle>
          <CardDescription>
            Gérez le salaire, la fréquence et les dates de paie de tous les
            employés.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {payroll.map((entry) => (
                <TableRow key={entry.employeeId}>
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
              ))}
            </TableBody>
          </Table>
           {payroll.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucune donnée de paie trouvée.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
